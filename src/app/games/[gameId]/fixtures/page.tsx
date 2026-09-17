import { requireCustomer } from "@/lib/session";
import { requireEntry } from "@/lib/gameAccess";
import { prisma } from "@/lib/prisma";
import { formatDateTime } from "@/lib/format";
import GameSubNav from "@/components/GameSubNav";
import { FixtureStatusBadge, RoundStatusBadge } from "@/components/StatusBadge";

export default async function FixturesPage({ params }: { params: Promise<{ gameId: string }> }) {
  const { gameId } = await params;
  const user = await requireCustomer();
  await requireEntry(gameId, user.id);

  const rounds = await prisma.round.findMany({
    where: { gameId: gameId },
    orderBy: { order: "asc" },
    include: { fixtures: { include: { league: true, homeTeam: true, awayTeam: true }, orderBy: { kickoff: "asc" } } },
  });

  return (
    <div>
      <GameSubNav gameId={gameId} />
      <h1 className="page-title mb-4">Fixtures & results</h1>
      <div className="space-y-6">
        {rounds.map((round) => (
          <div key={round.id} className="card">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold">{round.name}</h2>
              <RoundStatusBadge status={round.status} />
            </div>
            {round.fixtures.length === 0 ? (
              <p className="text-sm text-gray-500">Fixtures have not been published for this round yet.</p>
            ) : (
              <ul className="divide-y divide-gray-100">
                {round.fixtures.map((f) => (
                  <li key={f.id} className="py-2 flex items-center justify-between gap-3 text-sm">
                    <div>
                      <p className="text-xs text-gray-500">{f.league.name} · {formatDateTime(f.kickoff)}</p>
                      <p className="font-medium">
                        {f.homeTeam.name} {f.homeScore ?? ""} {f.status === "COMPLETED" ? "-" : "v"} {f.awayScore ?? ""} {f.awayTeam.name}
                      </p>
                    </div>
                    <FixtureStatusBadge status={f.status} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
