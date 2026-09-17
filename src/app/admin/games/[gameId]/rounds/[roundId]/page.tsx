import { requireAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { formatDateTime } from "@/lib/format";
import AdminGameSubNav from "@/components/AdminGameSubNav";
import { RoundStatusBadge } from "@/components/StatusBadge";
import RoundStatusControl from "@/components/RoundStatusControl";
import FixtureForm from "@/components/FixtureForm";
import FixtureAdminRow from "@/components/FixtureAdminRow";
import FormAction from "@/components/FormAction";
import { runProcessResults } from "@/lib/actions/admin";

export default async function RoundDetailPage({ params }: { params: Promise<{ gameId: string; roundId: string }> }) {
  const { gameId, roundId } = await params;
  await requireAdmin();
  const round = await prisma.round.findUniqueOrThrow({
    where: { id: roundId },
    include: { fixtures: { include: { homeTeam: true, awayTeam: true, league: true }, orderBy: { kickoff: "asc" } } },
  });
  const gameLeagues = await prisma.gameLeague.findMany({
    where: { gameId: gameId },
    include: { league: { include: { teams: { orderBy: { name: "asc" } } } } },
  });

  return (
    <div>
      <AdminGameSubNav gameId={gameId} />
      <div className="flex items-center justify-between mb-1">
        <h1 className="page-title">{round.name}</h1>
        <RoundStatusBadge status={round.status} />
      </div>
      <p className="text-gray-500 mb-4">Deadline {formatDateTime(round.deadlineAt)}</p>

      <div className="card mb-4">
        <p className="label">Round status</p>
        <RoundStatusControl roundId={round.id} status={round.status} />
      </div>

      <h2 className="section-title">Add a fixture</h2>
      <FixtureForm roundId={round.id} leagues={gameLeagues.map((gl) => ({ id: gl.league.id, name: gl.league.name, teams: gl.league.teams }))} />

      <h2 className="section-title mt-6">Fixtures</h2>
      <div className="space-y-2">
        {round.fixtures.length === 0 && <p className="text-gray-500">No fixtures added yet.</p>}
        {round.fixtures.map((f) => (
          <FixtureAdminRow
            key={f.id}
            fixture={{
              id: f.id,
              homeTeamName: f.homeTeam.name,
              awayTeamName: f.awayTeam.name,
              kickoff: f.kickoff.toISOString(),
              status: f.status,
              homeScore: f.homeScore,
              awayScore: f.awayScore,
            }}
          />
        ))}
      </div>

      <div className="card mt-6">
        <h2 className="section-title !mb-2">Process results</h2>
        <p className="text-sm text-gray-600 mb-3">
          Once every fixture's result has been recorded, process this round to apply the elimination rules and update the leaderboard.
        </p>
        <FormAction action={runProcessResults} hidden={{ roundId: round.id }} label="Process round results" confirmText="Process results now? This will eliminate participants whose team lost or drew, based on the game's rules." />
      </div>
    </div>
  );
}
