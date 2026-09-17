import { prisma } from "@/lib/prisma";

export async function logAudit(actorId: string, action: string, opts?: { gameId?: string; details?: string }) {
  await prisma.auditLog.create({
    data: {
      actorId,
      action,
      gameId: opts?.gameId,
      details: opts?.details ?? "",
    },
  });
}
