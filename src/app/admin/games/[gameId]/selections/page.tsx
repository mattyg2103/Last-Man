import { requireAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import AdminGameSubNav from "@/components/AdminGameSubNav";
import AdminSelectionCorrector from "@/components/AdminSelectionCorrector";

export default async function SelectionMonitoringPage({ params }: { params: Promise<{ gameId: string }> }) {
  const { gameId } = await params;
  await requireAdmin();
  const round = await prisma.round.findFirst({ where: { gameId: gameId, status: { in: ["OPEN", "CLOSED"] } }, orderBy: { order: "desc" } });

  const entries = round
    ? await prisma.entry.findMany({
        where: { gameId: gameId },
        include: { user: true, selections: { where: { roundId: round.id }, include: { team: true } } },
        orderBy: { joinedAt: "asc" },
      })
    : [];

  const fixtures = round ? await prisma.fixture.findMany({ where: { roundId: round.id }, include: { homeTeam: true, awayTeam: true } }) : [];
  const teams = fixtures.flatMap((f) => [f.homeTeam, f.awayTeam]);

  return (
    <div>
      <AdminGameSubNav gameId={gameId} />
      <h1 className="page-title mb-4">Selection monitoring</h1>
      {!round ? (
        <p className="text-gray-500">There is no open or recently closed round.</p>
      ) : (
        <>
          <p className="text-gray-600 mb-4">Showing selections for <strong>{round.name}</strong>.</p>
          <div className="overflow-x-auto card p-0">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-gray-500">
                <tr><th className="px-4 py-2">Participant</th><th className="px-4 py-2">Status</th><th className="px-4 py-2">Selection</th><th className="px-4 py-2">Correct</th></tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {entries.map((e) => {
                  const sel = e.selections[0];
                  return (
                    <tr key={e.id}>
                      <td className="px-4 py-2 font-medium">{e.user.name}</td>
                      <td className="px-4 py-2">{sel ? <span className="badge-active">Submitted</span> : <span className="badge-warning">Not submitted</span>}</td>
                      <td className="px-4 py-2">{sel ? `${sel.team.name}${sel.isAutomatic ? " (auto)" : ""}` : "—"}</td>
                      <td className="px-4 py-2"><AdminSelectionCorrector entryId={e.id} roundId={round.id} teams={teams} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
