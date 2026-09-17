"use server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function registerUser(formData: FormData): Promise<ActionResult> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").toLowerCase().trim();
  const password = String(formData.get("password") ?? "");

  if (!name || !email || !password) return { ok: false, error: "Please fill in every field." };
  if (password.length < 8) return { ok: false, error: "Password must be at least 8 characters long." };

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return { ok: false, error: "An account with that email address already exists." };

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.create({ data: { name, email, passwordHash, role: "CUSTOMER" } });
  return { ok: true };
}
