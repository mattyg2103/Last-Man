import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export async function requireEntry(gameId: string, userId: string) {
  const entry = await prisma.entry.findUnique({
    where: { gameId_userId: { gameId, userId } },
    include: { game: { include: { rules: true } } },
  });
  if (!entry) redirect("/games");
  return entry;
}
