"use server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { logAudit } from "@/lib/audit";
import { notify, notifyMany } from "@/lib/notifications";
import { processMissedDeadlines, processRoundResults, useReBuy } from "@/lib/engine";

export type ActionResult = { ok: true; message?: string; gameId?: string } | { ok: false; error: string };

function num(formData: FormData, key: string, fallback = 0): number {
  const v = formData.get(key);
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}
function bool(formData: FormData, key: string): boolean {
  return formData.get(key) === "on" || formData.get(key) === "true";
}
function str(formData: FormData, key: string, fallback = ""): string {
  return String(formData.get(key) ?? fallback);
}

// ---------- Games ----------

export async function createGame(formData: FormData): Promise<ActionResult> {
  const admin = await requireAdmin();
  const name = str(formData, "name").trim();
  const description = str(formData, "description").trim();
  const entryFeePence = Math.round(num(formData, "entryFeePounds") * 100);
  const startDate = new Date(str(formData, "startDate"));
  const leagueIds = formData.getAll("leagueIds").map(String);

  if (!name) return { ok: false, error: "Please enter a game name." };
  if (leagueIds.length === 0) return { ok: false, error: "Select at least one league." };

  const game = await prisma.game.create({
    data: {
      name,
      description,
      entryFeePence,
      startDate: isNaN(startDate.getTime()) ? new Date() : startDate,
      status: "OPEN",
      createdById: admin.id,
      rules: {
        create: {
          reBuyCostPence: entryFeePence,
          reBuyInstructions: `One re-buy is available, subject to administrator approval. Pay ${(entryFeePence / 100).toFixed(2)} using your full name as the reference.`,
          paymentInstructions: `Please pay your entry fee by bank transfer to the administrator using your full name as the payment reference.`,
        },
      },
      gameLeagues: { create: leagueIds.map((leagueId) => ({ leagueId })) },
    },
  });

  await logAudit(admin.id, "CREATE_GAME", { gameId: game.id, details: `Created game "${name}".` });
  revalidatePath("/admin/games");
  return { ok: true, message: `${name} has been created.`, gameId: game.id };
}

export async function updateGameDetails(formData: FormData): Promise<ActionResult> {
  const admin = await requireAdmin();
  const gameId = str(formData, "gameId");
  const name = str(formData, "name").trim();
  const description = str(formData, "description").trim();
  const entryFeePence = Math.round(num(formData, "entryFeePounds") * 100);
  const startDate = new Date(str(formData, "startDate"));
  const leagueIds = formData.getAll("leagueIds").map(String);

  await prisma.$transaction([
    prisma.game.update({
      where: { id: gameId },
      data: { name, description, entryFeePence, startDate: isNaN(startDate.getTime()) ? undefined : startDate },
    }),
    prisma.gameLeague.deleteMany({ where: { gameId } }),
    prisma.gameLeague.createMany({ data: leagueIds.map((leagueId) => ({ gameId, leagueId })) }),
  ]);

  await logAudit(admin.id, "UPDATE_GAME_DETAILS", { gameId, details: `Updated details for "${name}".` });
  revalidatePath(`/admin/games/${gameId}`);
  return { ok: true, message: "Game details updated." };
}

export async function updateGameStatus(formData: FormData): Promise<ActionResult> {
  const admin = await requireAdmin();
  const gameId = str(formData, "gameId");
  const status = str(formData, "status") as any;
  const game = await prisma.game.update({ where: { id: gameId }, data: { status } });
  await logAudit(admin.id, "UPDATE_GAME_STATUS", { gameId, details: `Set status to ${status}.` });
  revalidatePath(`/admin/games/${gameId}`);
  revalidatePath("/admin/games");
  return { ok: true, message: `${game.name} is now ${status.toLowerCase()}.` };
}

export async function updateGameRules(formData: FormData): Promise<ActionResult> {
  const admin = await requireAdmin();
  const gameId = str(formData, "gameId");

  await prisma.gameRule.update({
    where: { gameId },
    data: {
      selectionsPerRound: num(formData, "selectionsPerRound", 1),
      teamMustWin: bool(formData, "teamMustWin"),
      drawEliminates: bool(formData, "drawEliminates"),
      lossEliminates: bool(formData, "lossEliminates"),
      freezeUsedTeams: bool(formData, "freezeUsedTeams"),
      winningTeamReturns: bool(formData, "winningTeamReturns"),
      winningTeamReturnsAfterRounds: bool(formData, "winningTeamReturns") ? num(formData, "winningTeamReturnsAfterRounds", 4) : null,
      allowReBuy: bool(formData, "allowReBuy"),
      reBuyRounds: str(formData, "reBuyRounds", "1"),
      reBuyCount: num(formData, "reBuyCount", 1),
      reBuyCostPence: Math.round(num(formData, "reBuyCostPounds", 20) * 100),
      reBuyInstructions: str(formData, "reBuyInstructions"),
      deadlineDay: str(formData, "deadlineDay", "FRI"),
      deadlineTime: str(formData, "deadlineTime", "15:00"),
      allowChangeBeforeDeadline: bool(formData, "allowChangeBeforeDeadline"),
      missedDeadlineAction: str(formData, "missedDeadlineAction", "AUTO_ASSIGN") as any,
      defaultTeamStrategy: str(formData, "defaultTeamStrategy", "LOWEST_ELIGIBLE"),
      defaultLeagueAlternate: bool(formData, "defaultLeagueAlternate"),
      postponedHandling: str(formData, "postponedHandling"),
      selectionsVisibility: str(formData, "selectionsVisibility", "HIDDEN_UNTIL_DEADLINE") as any,
      showEliminatedOnLeaderboard: bool(formData, "showEliminatedOnLeaderboard"),
      paymentInstructions: str(formData, "paymentInstructions"),
      freeTextRules: str(formData, "freeTextRules"),
    },
  });

  await logAudit(admin.id, "UPDATE_GAME_RULES", { gameId, details: "Updated game rules." });
  revalidatePath(`/admin/games/${gameId}/rules`);
  return { ok: true, message: "Game rules have been updated." };
}

export async function updateLeaderboardSettings(formData: FormData): Promise<ActionResult> {
  const admin = await requireAdmin();
  const gameId = str(formData, "gameId");
  await prisma.gameRule.update({
    where: { gameId },
    data: {
      selectionsVisibility: str(formData, "selectionsVisibility", "HIDDEN_UNTIL_DEADLINE") as any,
      showEliminatedOnLeaderboard: bool(formData, "showEliminatedOnLeaderboard"),
    },
  });
  await logAudit(admin.id, "UPDATE_LEADERBOARD_SETTINGS", { gameId, details: "Updated leaderboard visibility settings." });
  revalidatePath(`/admin/games/${gameId}/leaderboard-settings`);
  return { ok: true, message: "Leaderboard settings updated." };
}

// ---------- Participants ----------

export async function addParticipant(formData: FormData): Promise<ActionResult> {
  const admin = await requireAdmin();
  const gameId = str(formData, "gameId");
  const email = str(formData, "email").toLowerCase().trim();

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return { ok: false, error: "No account found with that email address. Ask them to register first." };
  if (user.role === "ADMIN") return { ok: false, error: "Administrators cannot be added as participants." };

  const existing = await prisma.entry.findUnique({ where: { gameId_userId: { gameId, userId: user.id } } });
  if (existing) return { ok: false, error: `${user.name} has already joined this game.` };

  await prisma.entry.create({ data: { gameId, userId: user.id } });
  const game = await prisma.game.findUniqueOrThrow({ where: { id: gameId } });
  await notify(user.id, "GAME_INVITATION", `You have been added to "${game.name}" by the administrator.`, gameId);
  await logAudit(admin.id, "ADD_PARTICIPANT", { gameId, details: `Added ${user.name} (${user.email}).` });
  revalidatePath(`/admin/games/${gameId}/participants`);
  return { ok: true, message: `${user.name} has been added to the game.` };
}

export async function removeParticipant(formData: FormData): Promise<ActionResult> {
  const admin = await requireAdmin();
  const entryId = str(formData, "entryId");
  const entry = await prisma.entry.findUnique({ where: { id: entryId }, include: { user: true, game: true } });
  if (!entry) return { ok: false, error: "Entry not found." };

  await prisma.entry.delete({ where: { id: entryId } });
  await logAudit(admin.id, "REMOVE_PARTICIPANT", { gameId: entry.gameId, details: `Removed ${entry.user.name} from "${entry.game.name}".` });
  revalidatePath(`/admin/games/${entry.gameId}/participants`);
  return { ok: true, message: `${entry.user.name} has been removed.` };
}

export async function updateParticipantStatus(formData: FormData): Promise<ActionResult> {
  const admin = await requireAdmin();
  const entryId = str(formData, "entryId");
  const status = str(formData, "status") as any;
  const entry = await prisma.entry.update({ where: { id: entryId }, data: { status }, include: { user: true } });
  await logAudit(admin.id, "UPDATE_PARTICIPANT_STATUS", { gameId: entry.gameId, details: `Set ${entry.user.name}'s status to ${status} (administrative correction).` });
  await notify(entry.userId, "ANNOUNCEMENT", `The administrator has updated your status to ${status.replace("_", " ").toLowerCase()}.`, entry.gameId);
  revalidatePath(`/admin/games/${entry.gameId}/participants`);
  return { ok: true, message: "Participant status updated." };
}

export async function updatePaymentStatus(formData: FormData): Promise<ActionResult> {
  const admin = await requireAdmin();
  const entryId = str(formData, "entryId");
  const paymentStatus = str(formData, "paymentStatus") as any;
  const entry = await prisma.entry.update({ where: { id: entryId }, data: { paymentStatus }, include: { user: true } });
  await logAudit(admin.id, "UPDATE_PAYMENT_STATUS", { gameId: entry.gameId, details: `Set ${entry.user.name}'s payment status to ${paymentStatus}.` });
  revalidatePath(`/admin/games/${entry.gameId}/payments`);
  return { ok: true, message: "Payment status updated." };
}

export async function adminCorrectSelection(formData: FormData): Promise<ActionResult> {
  const admin = await requireAdmin();
  const entryId = str(formData, "entryId");
  const roundId = str(formData, "roundId");
  const teamId = str(formData, "teamId");

  const fixture = await prisma.fixture.findFirst({ where: { roundId, OR: [{ homeTeamId: teamId }, { awayTeamId: teamId }] } });
  if (!fixture) return { ok: false, error: "That team does not have a fixture in this round." };

  const entry = await prisma.entry.findUniqueOrThrow({ where: { id: entryId }, include: { user: true } });
  const existing = await prisma.selection.findUnique({ where: { entryId_roundId_slot: { entryId, roundId, slot: 0 } } });

  if (existing) {
    await prisma.selection.update({ where: { id: existing.id }, data: { teamId, fixtureId: fixture.id, isAutomatic: false } });
  } else {
    await prisma.selection.create({ data: { entryId, roundId, teamId, fixtureId: fixture.id } });
  }

  await logAudit(admin.id, "ADMIN_CORRECT_SELECTION", { gameId: entry.gameId, details: `Corrected ${entry.user.name}'s selection.` });
  await notify(entry.userId, "SELECTION_CONFIRMATION", "The administrator has corrected your selection for this round.", entry.gameId);
  revalidatePath(`/admin/games/${entry.gameId}/selections`);
  return { ok: true, message: "Selection corrected." };
}

// ---------- Leagues & teams ----------

export async function createLeague(formData: FormData): Promise<ActionResult> {
  const admin = await requireAdmin();
  const name = str(formData, "name").trim();
  const code = str(formData, "code").trim().toUpperCase();
  if (!name || !code) return { ok: false, error: "Please provide a league name and code." };

  await prisma.league.create({ data: { name, code } });
  await logAudit(admin.id, "CREATE_LEAGUE", { details: `Created league ${name}.` });
  revalidatePath("/admin/leagues");
  return { ok: true, message: `${name} created.` };
}

export async function createTeam(formData: FormData): Promise<ActionResult> {
  const admin = await requireAdmin();
  const leagueId = str(formData, "leagueId");
  const name = str(formData, "name").trim();
  const shortName = str(formData, "shortName", name).trim() || name.slice(0, 12);
  const rank = num(formData, "rank", 999);
  if (!name) return { ok: false, error: "Please enter a team name." };

  await prisma.team.create({ data: { leagueId, name, shortName, rank } });
  await logAudit(admin.id, "CREATE_TEAM", { details: `Added team ${name}.` });
  revalidatePath("/admin/leagues");
  return { ok: true, message: `${name} added.` };
}

export async function updateTeamRank(formData: FormData): Promise<ActionResult> {
  await requireAdmin();
  const teamId = str(formData, "teamId");
  const rank = num(formData, "rank", 999);
  await prisma.team.update({ where: { id: teamId }, data: { rank } });
  revalidatePath("/admin/leagues");
  return { ok: true };
}

// ---------- Rounds & fixtures ----------

export async function createRound(formData: FormData): Promise<ActionResult> {
  const admin = await requireAdmin();
  const gameId = str(formData, "gameId");
  const name = str(formData, "name").trim();
  const gameWeek = num(formData, "gameWeek", 1);
  const order = num(formData, "order", 1);
  const opensAt = new Date(str(formData, "opensAt"));
  const deadlineAt = new Date(str(formData, "deadlineAt"));

  if (!name || isNaN(deadlineAt.getTime())) return { ok: false, error: "Please provide a round name and deadline." };

  const existing = await prisma.round.findUnique({ where: { gameId_order: { gameId, order } } });
  if (existing) return { ok: false, error: `Round order ${order} already exists for this game.` };

  await prisma.round.create({
    data: { gameId, name, gameWeek, order, opensAt: isNaN(opensAt.getTime()) ? new Date() : opensAt, deadlineAt },
  });
  await logAudit(admin.id, "CREATE_ROUND", { gameId, details: `Created ${name}.` });
  revalidatePath(`/admin/games/${gameId}/rounds`);
  return { ok: true, message: `${name} created.` };
}

export async function updateRoundStatus(formData: FormData): Promise<ActionResult> {
  const admin = await requireAdmin();
  const roundId = str(formData, "roundId");
  const status = str(formData, "status") as any;
  const round = await prisma.round.update({ where: { id: roundId }, data: { status } });

  if (status === "OPEN") {
    const entries = await prisma.entry.findMany({ where: { gameId: round.gameId, status: { in: ["ACTIVE", "REBUY_ELIGIBLE"] } } });
    await notifyMany(entries.map((e) => e.userId), "ROUND_AVAILABLE", `${round.name} is now open for selections. Deadline: see game overview.`, round.gameId);
  }

  await logAudit(admin.id, "UPDATE_ROUND_STATUS", { gameId: round.gameId, details: `Set ${round.name} to ${status}.` });
  revalidatePath(`/admin/games/${round.gameId}/rounds`);
  return { ok: true, message: `${round.name} is now ${status.toLowerCase()}.` };
}

export async function createFixture(formData: FormData): Promise<ActionResult> {
  const admin = await requireAdmin();
  const roundId = str(formData, "roundId");
  const leagueId = str(formData, "leagueId");
  const homeTeamId = str(formData, "homeTeamId");
  const awayTeamId = str(formData, "awayTeamId");
  const kickoff = new Date(str(formData, "kickoff"));

  if (homeTeamId === awayTeamId) return { ok: false, error: "Home and away teams must be different." };
  if (isNaN(kickoff.getTime())) return { ok: false, error: "Please provide a valid kick-off date and time." };

  const round = await prisma.round.findUniqueOrThrow({ where: { id: roundId } });
  await prisma.fixture.create({ data: { roundId, leagueId, homeTeamId, awayTeamId, kickoff } });
  await logAudit(admin.id, "CREATE_FIXTURE", { gameId: round.gameId, details: `Added a fixture to ${round.name}.` });
  revalidatePath(`/admin/games/${round.gameId}/rounds/${roundId}`);
  return { ok: true, message: "Fixture added." };
}

export async function deleteFixture(formData: FormData): Promise<ActionResult> {
  const admin = await requireAdmin();
  const fixtureId = str(formData, "fixtureId");
  const fixture = await prisma.fixture.findUniqueOrThrow({ where: { id: fixtureId }, include: { round: true } });
  await prisma.fixture.delete({ where: { id: fixtureId } });
  await logAudit(admin.id, "DELETE_FIXTURE", { gameId: fixture.round.gameId, details: `Removed a fixture from ${fixture.round.name}.` });
  revalidatePath(`/admin/games/${fixture.round.gameId}/rounds/${fixture.roundId}`);
  return { ok: true, message: "Fixture removed." };
}

export async function updateFixtureStatus(formData: FormData): Promise<ActionResult> {
  const admin = await requireAdmin();
  const fixtureId = str(formData, "fixtureId");
  const status = str(formData, "status") as any;

  const fixture = await prisma.fixture.update({ where: { id: fixtureId }, data: { status, ...(status !== "COMPLETED" ? { result: null, homeScore: null, awayScore: null } : {}) }, include: { round: true } });

  if (status === "POSTPONED" || status === "CANCELLED" || status === "ABANDONED") {
    const affected = await prisma.selection.findMany({ where: { fixtureId }, include: { entry: { include: { user: true } } } });
    for (const sel of affected) {
      if (fixture.round.status === "OPEN") {
        await prisma.selection.delete({ where: { id: sel.id } });
        await notify(sel.entry.userId, "REPLACEMENT_REQUIRED", `${fixture.round.name}'s fixture was ${status.toLowerCase()}. Please choose a replacement team before the deadline.`, fixture.round.gameId);
      } else {
        await notify(sel.entry.userId, "FIXTURE_POSTPONED", `A fixture you selected in ${fixture.round.name} was ${status.toLowerCase()}. This will be treated as void by the administrator.`, fixture.round.gameId);
      }
    }
  }

  await logAudit(admin.id, "UPDATE_FIXTURE_STATUS", { gameId: fixture.round.gameId, details: `Set fixture status to ${status}.` });
  revalidatePath(`/admin/games/${fixture.round.gameId}/rounds/${fixture.roundId}`);
  return { ok: true, message: "Fixture status updated." };
}

export async function enterFixtureResult(formData: FormData): Promise<ActionResult> {
  const admin = await requireAdmin();
  const fixtureId = str(formData, "fixtureId");
  const homeScore = num(formData, "homeScore", 0);
  const awayScore = num(formData, "awayScore", 0);
  const result = homeScore === awayScore ? "DRAW" : homeScore > awayScore ? "HOME" : "AWAY";

  const fixture = await prisma.fixture.update({
    where: { id: fixtureId },
    data: { homeScore, awayScore, result, status: "COMPLETED" },
    include: { round: true },
  });

  await logAudit(admin.id, "ENTER_FIXTURE_RESULT", { gameId: fixture.round.gameId, details: `Recorded result ${homeScore}-${awayScore}.` });
  revalidatePath(`/admin/games/${fixture.round.gameId}/rounds/${fixture.roundId}`);
  return { ok: true, message: "Result recorded." };
}

// ---------- Results, elimination, missed selections ----------

export async function runProcessMissedDeadlines(formData: FormData): Promise<ActionResult> {
  const admin = await requireAdmin();
  const roundId = str(formData, "roundId");
  const round = await prisma.round.findUniqueOrThrow({ where: { id: roundId } });
  const { assigned, skipped } = await processMissedDeadlines(roundId, admin.id);
  revalidatePath(`/admin/games/${round.gameId}/missed`);
  return { ok: true, message: `${assigned} default selections assigned, ${skipped} skipped or eliminated.` };
}

export async function runProcessResults(formData: FormData): Promise<ActionResult> {
  const admin = await requireAdmin();
  const roundId = str(formData, "roundId");
  const round = await prisma.round.findUniqueOrThrow({ where: { id: roundId } });
  const { eliminated, survived } = await processRoundResults(roundId, admin.id);
  revalidatePath(`/admin/games/${round.gameId}/rounds/${roundId}`);
  revalidatePath(`/admin/games/${round.gameId}`);
  return { ok: true, message: `${survived} progressed, ${eliminated} eliminated.` };
}

// ---------- Re-buys ----------

export async function decideReBuyRequest(formData: FormData): Promise<ActionResult> {
  const admin = await requireAdmin();
  const requestId = str(formData, "requestId");
  const approve = bool(formData, "approve");

  const request = await prisma.reBuyRequest.findUniqueOrThrow({ where: { id: requestId }, include: { entry: { include: { user: true, game: true } } } });
  if (request.status !== "REQUESTED") return { ok: false, error: "This request has already been decided." };

  if (approve) {
    await prisma.$transaction([
      prisma.reBuyRequest.update({ where: { id: requestId }, data: { status: "APPROVED", decidedAt: new Date() } }),
      prisma.entry.update({ where: { id: request.entryId }, data: { status: "ACTIVE", reBuysUsed: { increment: 1 } } }),
    ]);
    await notify(request.entry.userId, "REBUY_AVAILABLE", "Your re-buy has been approved. You are back in the game.", request.entry.gameId);
  } else {
    await prisma.$transaction([
      prisma.reBuyRequest.update({ where: { id: requestId }, data: { status: "REJECTED", decidedAt: new Date() } }),
      prisma.entry.update({ where: { id: request.entryId }, data: { status: "ELIMINATED" } }),
    ]);
    await notify(request.entry.userId, "ELIMINATED", "Your re-buy request was not approved. You have been eliminated.", request.entry.gameId);
  }

  await logAudit(admin.id, "DECIDE_REBUY", { gameId: request.entry.gameId, details: `${approve ? "Approved" : "Rejected"} re-buy for ${request.entry.user.name}.` });
  revalidatePath(`/admin/games/${request.entry.gameId}/rebuys`);
  return { ok: true, message: `Re-buy ${approve ? "approved" : "rejected"}.` };
}

export async function manualReBuy(formData: FormData): Promise<ActionResult> {
  const admin = await requireAdmin();
  const entryId = str(formData, "entryId");
  const roundId = str(formData, "roundId");
  try {
    await useReBuy(entryId, roundId, admin.id);
    const entry = await prisma.entry.findUniqueOrThrow({ where: { id: entryId } });
    revalidatePath(`/admin/games/${entry.gameId}/rebuys`);
    return { ok: true, message: "Participant re-bought into the game." };
  } catch (e: any) {
    return { ok: false, error: e.message ?? "Could not process re-buy." };
  }
}

// ---------- Announcements & reminders ----------

export async function publishAnnouncement(formData: FormData): Promise<ActionResult> {
  const admin = await requireAdmin();
  const gameId = str(formData, "gameId");
  const title = str(formData, "title").trim();
  const body = str(formData, "body").trim();
  if (!title || !body) return { ok: false, error: "Please provide a title and message." };

  await prisma.announcement.create({ data: { gameId, authorId: admin.id, title, body } });
  const entries = await prisma.entry.findMany({ where: { gameId } });
  await notifyMany(entries.map((e) => e.userId), "ANNOUNCEMENT", `${title}: ${body}`, gameId);
  await logAudit(admin.id, "PUBLISH_ANNOUNCEMENT", { gameId, details: `Published announcement "${title}".` });
  revalidatePath(`/admin/games/${gameId}/announcements`);
  return { ok: true, message: "Announcement published to all participants." };
}

export async function sendDeadlineReminder(formData: FormData): Promise<ActionResult> {
  const admin = await requireAdmin();
  const roundId = str(formData, "roundId");
  const final = bool(formData, "final");
  const round = await prisma.round.findUniqueOrThrow({ where: { id: roundId }, include: { game: true } });

  const entries = await prisma.entry.findMany({
    where: { gameId: round.gameId, status: { in: ["ACTIVE", "REBUY_ELIGIBLE"] } },
    include: { selections: { where: { roundId } } },
  });
  const pending = entries.filter((e) => e.selections.length === 0);
  if (pending.length === 0) return { ok: true, message: "Everyone has already submitted a selection." };

  await notifyMany(
    pending.map((e) => e.userId),
    final ? "FINAL_DEADLINE_REMINDER" : "DEADLINE_REMINDER",
    `Reminder: you haven't yet submitted your selection for ${round.name} in "${round.game.name}".`,
    round.gameId
  );
  await logAudit(admin.id, "SEND_DEADLINE_REMINDER", { gameId: round.gameId, details: `Sent reminder to ${pending.length} participant(s) for ${round.name}.` });
  return { ok: true, message: `Reminder sent to ${pending.length} participant(s).` };
}
