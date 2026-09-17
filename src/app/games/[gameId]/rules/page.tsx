import { requireCustomer } from "@/lib/session";
import { requireEntry } from "@/lib/gameAccess";
import { prisma } from "@/lib/prisma";
import { formatMoney } from "@/lib/format";
import GameSubNav from "@/components/GameSubNav";

export default async function GameRulesPage({ params }: { params: Promise<{ gameId: string }> }) {
  const { gameId } = await params;
  const user = await requireCustomer();
  const entry = await requireEntry(gameId, user.id);
  const rules = entry.game.rules!;
  const leagues = await prisma.gameLeague.findMany({ where: { gameId: gameId }, include: { league: true } });

  const items: [string, string][] = [
    ["Permitted leagues", leagues.map((l) => l.league.name).join(", ")],
    ["Team selections required per round", String(rules.selectionsPerRound)],
    ["Team must win to continue", rules.teamMustWin ? "Yes" : "No"],
    ["A draw eliminates you", rules.drawEliminates ? "Yes" : "No"],
    ["A loss eliminates you", rules.lossEliminates ? "Yes" : "No"],
    ["Previously used teams are frozen", rules.freezeUsedTeams ? "Yes" : "No"],
    ["A winning team can be used again later", rules.winningTeamReturns ? `Yes, after ${rules.winningTeamReturnsAfterRounds ?? "—"} round(s)` : "No"],
    ["Re-buys allowed", rules.allowReBuy ? `Yes — ${rules.reBuyCount} allowed, in round(s) ${rules.reBuyRounds}, at ${formatMoney(rules.reBuyCostPence)} each` : "No"],
    ["Weekly submission deadline", `${rules.deadlineDay} ${rules.deadlineTime}`],
    ["Can change selection before deadline", rules.allowChangeBeforeDeadline ? "Yes" : "No"],
    ["If you miss the deadline", rules.missedDeadlineAction === "AUTO_ASSIGN" ? "A default team is automatically assigned" : rules.missedDeadlineAction === "ELIMINATE" ? "You are eliminated" : "No automatic action is taken"],
    ["Default team alternates leagues each round", rules.defaultLeagueAlternate ? "Yes" : "No"],
    ["Postponed / cancelled fixtures", rules.postponedHandling],
    ["Selection visibility to others", rules.selectionsVisibility === "IMMEDIATE" ? "Visible immediately" : rules.selectionsVisibility === "HIDDEN_UNTIL_DEADLINE" ? "Hidden until the deadline" : "Hidden until kick-off"],
    ["Eliminated participants shown on leaderboard", rules.showEliminatedOnLeaderboard ? "Yes" : "No"],
  ];

  return (
    <div>
      <GameSubNav gameId={gameId} />
      <h1 className="page-title mb-4">Game rules</h1>
      <div className="card mb-6">
        <dl className="divide-y divide-gray-100">
          {items.map(([k, v]) => (
            <div key={k} className="py-2 grid grid-cols-1 sm:grid-cols-2 gap-1 text-sm">
              <dt className="text-gray-500">{k}</dt>
              <dd className="font-medium">{v}</dd>
            </div>
          ))}
        </dl>
      </div>
      {rules.freeTextRules && (
        <div className="card">
          <h2 className="section-title">Additional rules from the administrator</h2>
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{rules.freeTextRules}</p>
        </div>
      )}
    </div>
  );
}
