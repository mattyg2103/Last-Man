import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { formatDateTime } from "@/lib/format";
import FormAction from "@/components/FormAction";
import { markNotificationRead, markAllNotificationsRead } from "@/lib/actions/customer";

export default async function NotificationsPage() {
  const user = await requireUser();
  const notifications = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="page-title">Notifications</h1>
        <FormAction action={markAllNotificationsRead} hidden={{}} label="Mark all as read" className="btn-secondary" />
      </div>
      {notifications.length === 0 ? (
        <p className="text-gray-500">You have no notifications yet.</p>
      ) : (
        <ul className="space-y-2">
          {notifications.map((n) => (
            <li key={n.id} className={`card flex items-start justify-between gap-3 ${!n.readAt ? "border-pitch-400" : ""}`}>
              <div>
                <p className="text-xs text-gray-500">{n.type.replaceAll("_", " ")} · {formatDateTime(n.createdAt)}</p>
                <p className="text-sm mt-1">{n.message}</p>
              </div>
              {!n.readAt && (
                <FormAction action={markNotificationRead} hidden={{ id: n.id }} label="Mark read" className="btn-ghost text-xs" />
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
