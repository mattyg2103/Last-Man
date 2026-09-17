import { requireAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { formatDateTime } from "@/lib/format";
import AdminGameSubNav from "@/components/AdminGameSubNav";
import AnnouncementForm from "@/components/AnnouncementForm";
import FormAction from "@/components/FormAction";
import { sendDeadlineReminder } from "@/lib/actions/admin";

export default async function AnnouncementsPage({ params }: { params: Promise<{ gameId: string }> }) {
  const { gameId } = await params;
  await requireAdmin();
  const [announcements, openRounds] = await Promise.all([
    prisma.announcement.findMany({ where: { gameId: gameId }, orderBy: { createdAt: "desc" }, take: 20 }),
    prisma.round.findMany({ where: { gameId: gameId, status: "OPEN" }, orderBy: { order: "asc" } }),
  ]);

  return (
    <div className="space-y-6">
      <AdminGameSubNav gameId={gameId} />
      <h1 className="page-title">Notification management</h1>

      <AnnouncementForm gameId={gameId} />

      {openRounds.length > 0 && (
        <div className="card">
          <h2 className="section-title !mb-2">Deadline reminders</h2>
          <p className="text-sm text-gray-600 mb-3">Send a reminder now to everyone who hasn&apos;t yet submitted a selection for an open round.</p>
          <div className="flex flex-wrap gap-2">
            {openRounds.map((r) => (
              <div key={r.id} className="flex gap-2 items-center">
                <span className="text-sm text-gray-500">{r.name}:</span>
                <FormAction action={sendDeadlineReminder} hidden={{ roundId: r.id, final: "false" }} label="Send reminder" className="btn-secondary" />
                <FormAction action={sendDeadlineReminder} hidden={{ roundId: r.id, final: "true" }} label="Send final reminder" className="btn-secondary" />
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h2 className="section-title">Published announcements</h2>
        {announcements.length === 0 ? (
          <p className="text-gray-500">No announcements published yet.</p>
        ) : (
          <div className="space-y-2">
            {announcements.map((a) => (
              <div key={a.id} className="card">
                <p className="font-semibold">{a.title}</p>
                <p className="text-sm text-gray-600">{a.body}</p>
                <p className="text-xs text-gray-400 mt-1">{formatDateTime(a.createdAt)}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
