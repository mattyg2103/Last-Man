import { requireAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { formatDateTime } from "@/lib/format";
import AdminGameSubNav from "@/components/AdminGameSubNav";
import FormAction from "@/components/FormAction";
import { runProcessMissedDeadlines, sendDeadlineReminder } from "@/lib/actions/admin";

export default async function MissedSelectionsPage({ params }: { params: Promise<{ gameId: string }> }) {
  const { gameId } = await params;
  await requireAdmin();
  const rounds = await prisma.round.findMany({ where: { gameId: gameId, status: { in: ["OPEN", "CLOSED"] } }, orderBy: { order: "asc" } });

  const rows = await Promise.all(
    rounds.map(async (round) => {
      const entries = await prisma.entry.findMany({
        where: { gameId: gameId, status: { in: ["ACTIVE", "REBUY_ELIGIBLE"] } },
        include: { user: true, selections: { where: { roundId: round.id } } },
      });
      const missing = entries.filter((e) => e.selections.length === 0);
      return { round, missing };
    })
  );

  return (
    <div>
      <AdminGameSubNav gameId={gameId} />
      <h1 className="page-title mb-4">Missed selections</h1>
      <div className="space-y-6">
        {rows.map(({ round, missing }) => (
          <div key={round.id} className="card">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-semibold">{round.name}</h2>
              <span className="text-sm text-gray-500">Deadline {formatDateTime(round.deadlineAt)}</span>
            </div>
            {missing.length === 0 ? (
              <p className="text-sm text-pitch-700">Everyone has submitted a selection.</p>
            ) : (
              <>
                <ul className="text-sm text-gray-700 mb-3 list-disc list-inside">
                  {missing.map((e) => <li key={e.id}>{e.user.name}</li>)}
                </ul>
                <div className="flex flex-wrap gap-2">
                  <FormAction action={sendDeadlineReminder} hidden={{ roundId: round.id, final: "false" }} label="Send reminder" className="btn-secondary" />
                  <FormAction action={sendDeadlineReminder} hidden={{ roundId: round.id, final: "true" }} label="Send final reminder" className="btn-secondary" />
                  <FormAction
                    action={runProcessMissedDeadlines}
                    hidden={{ roundId: round.id }}
                    label="Assign default teams / apply missed-deadline rule"
                    confirmText="This will assign default teams (or eliminate, per the game's rules) to everyone who hasn't submitted a selection for this round."
                  />
                </div>
              </>
            )}
          </div>
        ))}
        {rows.length === 0 && <p className="text-gray-500">There are no open or recently closed rounds.</p>}
      </div>
    </div>
  );
}
