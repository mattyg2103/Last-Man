import { requireCustomer } from "@/lib/session";
import { requireEntry } from "@/lib/gameAccess";
import { prisma } from "@/lib/prisma";
import GameSubNav from "@/components/GameSubNav";
import { EntryStatusBadge } from "@/components/StatusBadge";

export default async function LeaderboardPage({ params }: { params: Promise<{ gameId: string }> }) {
  const { gameId } = await params;
  const user = await requireCustomer();
  const entry = await requireEntry(gameId, user.id);
  const rules = entry.game.rules!;

  const currentRound = await prisma.round.findFirst({ where: { gameId: gameId, status: "OPEN" }, orderBy: { order: "asc" } });
  let currentRoundVisible = true;
  if (currentRound) {
    if (rules.selectionsVisibility === "HIDDEN_UNTIL_DEADLINE") {
      currentRoundVisible = new Date() > currentRound.deadlineAt;
    } else if (rules.selectionsVisibility === "HIDDEN_UNTIL_KICKOFF") {
      const firstFixture = await prisma.fixture.findFirst({ where: { roundId: currentRound.id }, orderBy: { kickoff: "asc" } });
      currentRoundVisible = firstFixture ? new Date() > firstFixture.kickoff : false;
    }
  }

  const entries = await prisma.entry.findMany({
    where: { gameId: gameId, ...(rules.showEliminatedOnLeaderboard ? {} : { status: { not: "ELIMINATED" } }) },
    include: {
      user: true,
      selections: { include: { team: true, round: true }, orderBy: { round: { order: "asc" } } },
    },
  });

  const rows = entries.map((e) => {
    const roundsSurvived = e.selections.filter((s) => s.outcome === "WIN").length;
    const currentSel = currentRound ? e.selections.find((s) => s.roundId === currentRound.id) : undefined;
    const previous = e.selections.filter((s) => s.roundId !== currentRound?.id);
    return { entry: e, roundsSurvived, currentSel, previous };
  });
  rows.sort((a, b) => b.roundsSurvived - a.roundsSurvived);

  return (
    <div>
      <GameSubNav gameId={gameId} />
      <h1 className="page-title mb-4">Leaderboard</h1>
      <div className="overflow-x-auto card p-0">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="px-4 py-2">Participant</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">{currentRound ? currentRound.name : "Current round"}</th>
              <th className="px-4 py-2">Rounds survived</th>
              <th className="px-4 py-2">Re-buys</th>
              <th className="px-4 py-2">Previous picks</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map(({ entry: e, roundsSurvived, currentSel, previous }) => (
              <tr key={e.id} className={e.userId === user.id ? "bg-pitch-50" : ""}>
                <td className="px-4 py-2 font-medium">{e.user.name}{e.userId === user.id && " (you)"}</td>
                <td className="px-4 py-2"><EntryStatusBadge status={e.status} /></td>
                <td className="px-4 py-2">
                  {!currentRound
                    ? "—"
                    : !currentRoundVisible
                    ? <span className="text-gray-400">Hidden until deadline</span>
                    : currentSel
                    ? <>{currentSel.team.name}{currentSel.isAutomatic && <span className="badge-neutral ml-1 text-xs">Auto</span>}</>
                    : <span className="text-gray-400">Not yet selected</span>}
                </td>
                <td className="px-4 py-2">{roundsSurvived}</td>
                <td className="px-4 py-2">{e.reBuysUsed}</td>
                <td className="px-4 py-2 text-gray-500">
                  {previous.length === 0 ? "—" : previous.map((s) => s.team.name).join(", ")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
