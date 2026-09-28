import { requireAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { formatDateTime } from "@/lib/format";
import AdminGameSubNav from "@/components/AdminGameSubNav";
import FormAction from "@/components/FormAction";
import AdminSelectionCorrector from "@/components/AdminSelectionCorrector";
import { runProcessMissedDeadlines, sendDeadlineReminder } from "@/lib/actions/admin";

export default async function MissedSelectionsPage({ params }: { params: Promise<{ gameId: string }> }) {
  const { gameId } = await params;
  await requireAdmin();
  const rules = await prisma.gameRule.findUniqueOrThrow({ where: { gameId } });
  const rounds = await prisma.round.findMany({ where: { gameId: gameId, status: { in: ["OPEN", "CLOSED"] } }, orderBy: { order: "asc" } });

  const rows = await Promise.all(
    rounds.map(async (round) => {
      const entries = await prisma.entry.findMany({
        where: { gameId: gameId, status: { in: ["ACTIVE", "REBUY_ELIGIBLE"] } },
        include: { user: true, selections: { where: { roundId: round.id } } },
      });
      const missing = entries.filter((e) => e.selections.length === 0);
      const fixtures = missing.length
        ? await prisma.fixture.findMany({ where: { roundId: round.id }, include: { homeTeam: true, awayTeam: true } })
        : [];
      const teams = fixtures.flatMap((f) => [f.homeTeam, f.awayTeam]);
      return { round, missing, teams };
    })
  );

  return (
    <div>
      <AdminGameSubNav gameId={gameId} />
      <h1 className="page-title mb-1">Missed selections</h1>
      <p className="text-slate-300 mb-4">
        {rules.missedDeadlineAction === "NONE"
          ? "This game is set to require you to choose a team manually for anyone who misses the deadline — pick their team below."
          : rules.missedDeadlineAction === "AUTO_ASSIGN"
          ? "This game auto-assigns a default team to anyone who misses the deadline. You can still choose a specific team manually below before running that."
          : "This game eliminates anyone who misses the deadline. You can still choose a specific team manually below to keep them in instead."}
      </p>
      <div className="space-y-6">
        {rows.map(({ round, missing, teams }) => (
          <div key={round.id} className="card">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-semibold">{round.name}</h2>
              <span className="text-sm text-slate-400">Deadline {formatDateTime(round.deadlineAt)}</span>
            </div>
            {missing.length === 0 ? (
              <p className="text-sm text-lime-300">Everyone has submitted a selection.</p>
            ) : (
              <>
                <div className="divide-y divide-white/5 mb-3">
                  {missing.map((e) => (
                    <div key={e.id} className="py-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <span className="text-sm font-medium">{e.user.name}</span>
                      <AdminSelectionCorrector entryId={e.id} roundId={round.id} teams={teams} />
                    </div>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2">
                  <FormAction action={sendDeadlineReminder} hidden={{ roundId: round.id, final: "false" }} label="Send reminder" className="btn-secondary" />
                  <FormAction action={sendDeadlineReminder} hidden={{ roundId: round.id, final: "true" }} label="Send final reminder" className="btn-secondary" />
                  {rules.missedDeadlineAction !== "NONE" && (
                    <FormAction
                      action={runProcessMissedDeadlines}
                      hidden={{ roundId: round.id }}
                      label={rules.missedDeadlineAction === "AUTO_ASSIGN" ? "Auto-assign remaining participants" : "Eliminate remaining participants"}
                      confirmText="This will apply the missed-deadline rule to everyone in this round who still hasn't got a selection."
                    />
                  )}
                </div>
              </>
            )}
          </div>
        ))}
        {rows.length === 0 && <p className="text-slate-400">There are no open or recently closed rounds.</p>}
      </div>
    </div>
  );
}
