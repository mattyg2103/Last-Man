import { prisma } from "@/lib/prisma";
import type { NotificationType } from "@/lib/enums";

export async function notify(
  userId: string,
  type: NotificationType,
  message: string,
  gameId?: string
) {
  await prisma.notification.create({
    data: { userId, type, message, gameId },
  });
}

export async function notifyMany(
  userIds: string[],
  type: NotificationType,
  message: string,
  gameId?: string
) {
  if (userIds.length === 0) return;
  await prisma.notification.createMany({
    data: userIds.map((userId) => ({ userId, type, message, gameId })),
  });
}
