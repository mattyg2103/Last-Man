import { requireAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { CreateLeagueForm, AddTeamForm, TeamRankInput } from "@/components/LeagueTeamForms";

export default async function LeaguesPage() {
  await requireAdmin();
  const leagues = await prisma.league.findMany({ include: { teams: { orderBy: { rank: "asc" } } }, orderBy: { name: "asc" } });

  return (
    <div className="space-y-6">
      <h1 className="page-title">League and team management</h1>
      <CreateLeagueForm />

      {leagues.map((league) => (
        <div key={league.id} className="card">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">{league.name} <span className="text-gray-400 text-sm">({league.code})</span></h2>
            <AddTeamForm leagueId={league.id} />
          </div>
          <p className="text-xs text-gray-500 mb-2">Rank sets the table position used for automatic default-team assignment (a higher number = lower in the table).</p>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-2 text-sm">
            {league.teams.map((t) => (
              <div key={t.id} className="flex items-center justify-between border border-gray-100 rounded-md px-2 py-1">
                <span>{t.name}</span>
                <TeamRankInput teamId={t.id} rank={t.rank} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
