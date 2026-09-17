"use server";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { submitSelection as engineSubmitSelection } from "@/lib/engine";
import { notify, notifyMany } from "@/lib/notifications";

export type ActionResult = { ok: true; message?: string } | { ok: false; error: string };

async function requireSessionUser() {
  const session = await getSession();
  if (!session?.user) throw new Error("You must be logged in.");
  return session.user;
}

export async function joinGame(formData: FormData): Promise<ActionResult> {
  const user = await requireSessionUser();
  const gameId = String(formData.get("gameId"));
  const game = await prisma.game.findUnique({ where: { id: gameId } });
  if (!game) return { ok: false, error: "Game not found." };
  if (game.status !== "OPEN" && game.status !== "ACTIVE") {
    return { ok: false, error: "This game is not currently accepting new entries." };
  }
  const existing = await prisma.entry.findUnique({ where: { gameId_userId: { gameId, userId: user.id } } });
  if (existing) return { ok: false, error: "You have already joined this game." };

  await prisma.entry.create({ data: { gameId, userId: user.id } });
  revalidatePath("/games");
  return { ok: true, message: `You have joined ${game.name}.` };
}

export async function submitSelectionAction(formData: FormData): Promise<ActionResult> {
  const user = await requireSessionUser();
  const entryId = String(formData.get("entryId"));
  const roundId = String(formData.get("roundId"));
  const teamId = String(formData.get("teamId"));

  const entry = await prisma.entry.findUnique({ where: { id: entryId } });
  if (!entry || entry.userId !== user.id) return { ok: false, error: "Entry not found." };

  try {
    await engineSubmitSelection({ entryId, roundId, teamId });
    revalidatePath(`/games/${entry.gameId}`);
    return { ok: true, message: "Your selection has been confirmed." };
  } catch (e: any) {
    return { ok: false, error: e.message ?? "Could not submit selection." };
  }
}

export async function notifyPaymentSent(formData: FormData): Promise<ActionResult> {
  const user = await requireSessionUser();
  const entryId = String(formData.get("entryId"));
  const entry = await prisma.entry.findUnique({ where: { id: entryId }, include: { game: true, user: true } });
  if (!entry || entry.userId !== user.id) return { ok: false, error: "Entry not found." };

  await prisma.entry.update({ where: { id: entryId }, data: { paymentNotifiedAt: new Date() } });

  const admins = await prisma.user.findMany({ where: { role: "ADMIN" } });
  await notifyMany(
    admins.map((a) => a.id),
    "ANNOUNCEMENT",
    `${entry.user.name} has notified you that payment has been sent for "${entry.game.name}".`,
    entry.gameId
  );
  revalidatePath(`/games/${entry.gameId}`);
  return { ok: true, message: "Thanks — the administrator has been notified that you have sent payment." };
}

export async function requestReBuy(formData: FormData): Promise<ActionResult> {
  const user = await requireSessionUser();
  const entryId = String(formData.get("entryId"));
  const roundId = String(formData.get("roundId"));

  const entry = await prisma.entry.findUnique({ where: { id: entryId }, include: { game: { include: { rules: true } }, user: true } });
  if (!entry || entry.userId !== user.id) return { ok: false, error: "Entry not found." };
  if (entry.status !== "REBUY_ELIGIBLE") return { ok: false, error: "You are not currently eligible for a re-buy." };
  if (!entry.game.rules?.allowReBuy) return { ok: false, error: "Re-buys are not permitted in this game." };

  const existing = await prisma.reBuyRequest.findFirst({ where: { entryId, roundId, status: "REQUESTED" } });
  if (existing) return { ok: false, error: "You have already requested a re-buy for this round." };

  await prisma.reBuyRequest.create({
    data: { entryId, roundId, costPence: entry.game.rules.reBuyCostPence, status: "REQUESTED" },
  });
  const admins = await prisma.user.findMany({ where: { role: "ADMIN" } });
  await notifyMany(admins.map((a) => a.id), "REBUY_AVAILABLE", `${entry.user.name} has requested a re-buy in "${entry.game.name}".`, entry.gameId);
  revalidatePath(`/games/${entry.gameId}`);
  return { ok: true, message: "Your re-buy request has been sent to the administrator." };
}

export async function markNotificationRead(formData: FormData): Promise<ActionResult> {
  const user = await requireSessionUser();
  const id = String(formData.get("id"));
  await prisma.notification.updateMany({ where: { id, userId: user.id }, data: { readAt: new Date() } });
  revalidatePath("/notifications");
  return { ok: true };
}

export async function markAllNotificationsRead(): Promise<ActionResult> {
  const user = await requireSessionUser();
  await prisma.notification.updateMany({ where: { userId: user.id, readAt: null }, data: { readAt: new Date() } });
  revalidatePath("/notifications");
  return { ok: true };
}

export async function updateAccountName(formData: FormData): Promise<ActionResult> {
  const user = await requireSessionUser();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { ok: false, error: "Name cannot be empty." };
  await prisma.user.update({ where: { id: user.id }, data: { name } });
  revalidatePath("/account");
  return { ok: true, message: "Your details have been updated." };
}

export async function changePassword(formData: FormData): Promise<ActionResult> {
  const user = await requireSessionUser();
  const currentPassword = String(formData.get("currentPassword") ?? "");
  const newPassword = String(formData.get("newPassword") ?? "");
  if (newPassword.length < 8) return { ok: false, error: "New password must be at least 8 characters." };

  const dbUser = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
  const valid = await bcrypt.compare(currentPassword, dbUser.passwordHash);
  if (!valid) return { ok: false, error: "Current password is incorrect." };

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });
  return { ok: true, message: "Your password has been changed." };
}

export async function contactAdmin(formData: FormData): Promise<ActionResult> {
  const user = await requireSessionUser();
  const message = String(formData.get("message") ?? "").trim();
  const gameId = formData.get("gameId") ? String(formData.get("gameId")) : undefined;
  if (!message) return { ok: false, error: "Please enter a message." };

  const admins = await prisma.user.findMany({ where: { role: "ADMIN" } });
  await notifyMany(admins.map((a) => a.id), "ANNOUNCEMENT", `Message from ${user.name}: ${message}`, gameId);
  return { ok: true, message: "Your message has been sent to the administrator." };
}
