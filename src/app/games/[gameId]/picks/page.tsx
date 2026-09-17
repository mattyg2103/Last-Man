import { requireCustomer } from "@/lib/session";
import { requireEntry } from "@/lib/gameAccess";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/format";
import GameSubNav from "@/components/GameSubNav";

const outcomeLabel: Record<string, string> = {
  PENDING: "Awaiting result",
  WIN: "Won — survived",
  LOSS: "Lost — eliminated",
  DRAW: "Drew — eliminated",
  VOID: "Voided — safe",
};

export default async function MyPicksPage({ params }: { params: Promise<{ gameId: string }> }) {
  const { gameId } = await params;
  const user = await requireCustomer();
  const entry = await requireEntry(gameId, user.id);

  const selections = await prisma.selection.findMany({
    where: { entryId: entry.id },
    include: { team: { include: { league: true } }, fixture: true, round: true },
    orderBy: { round: { order: "asc" } },
  });

  return (
    <div>
      <GameSubNav gameId={gameId} />
      <h1 className="page-title mb-4">My previous picks</h1>
      {selections.length === 0 ? (
        <p className="text-gray-500">You haven&apos;t made any selections yet.</p>
      ) : (
        <div className="overflow-x-auto card p-0">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-gray-500">
              <tr>
                <th className="px-4 py-2">Round</th>
                <th className="px-4 py-2">Team</th>
                <th className="px-4 py-2">League</th>
                <th className="px-4 py-2">Submitted</th>
                <th className="px-4 py-2">Outcome</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {selections.map((s) => (
                <tr key={s.id}>
                  <td className="px-4 py-2 font-medium">{s.round.name}</td>
                  <td className="px-4 py-2">
                    {s.team.name}
                    {s.isAutomatic && <span className="badge-neutral ml-2 text-xs">Auto-assigned</span>}
                    {s.isReplacement && <span className="badge-neutral ml-2 text-xs">Replacement</span>}
                  </td>
                  <td className="px-4 py-2">{s.team.league.name}</td>
                  <td className="px-4 py-2">{formatDate(s.submittedAt)}</td>
                  <td className="px-4 py-2">{outcomeLabel[s.outcome]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
