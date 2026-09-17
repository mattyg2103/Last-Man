import { requireCustomer } from "@/lib/session";
import { requireEntry } from "@/lib/gameAccess";
import { prisma } from "@/lib/prisma";
import { getRoundFixturesForEntry } from "@/lib/engine";
import { formatDateTime } from "@/lib/format";
import GameSubNav from "@/components/GameSubNav";
import SelectionForm from "@/components/SelectionForm";

export default async function SelectRoundPage({ params }: { params: Promise<{ gameId: string }> }) {
  const { gameId } = await params;
  const user = await requireCustomer();
  const entry = await requireEntry(gameId, user.id);
  const rules = entry.game.rules!;

  const round = await prisma.round.findFirst({
    where: { gameId: gameId, status: "OPEN" },
    orderBy: { order: "asc" },
  });

  return (
    <div>
      <GameSubNav gameId={gameId} />
      <h1 className="page-title mb-1">Current round selection</h1>

      {entry.status === "ELIMINATED" && (
        <div className="badge-eliminated block w-fit mb-4">You have been eliminated from this game and cannot make further selections.</div>
      )}
      {entry.status === "WINNER" && (
        <div className="badge-winner block w-fit mb-4">Congratulations, you won this game!</div>
      )}

      {!round ? (
        <p className="text-gray-500">There is no round currently open for selections.</p>
      ) : entry.status !== "ACTIVE" ? null : (
        <>
          <p className="text-gray-600 mb-4">
            {round.name} — deadline <span className="font-semibold">{formatDateTime(round.deadlineAt)}</span>. Pick one eligible team to win its fixture.
          </p>
          <SelectRoundContent entryId={entry.id} roundId={round.id} deadline={round.deadlineAt.toISOString()} canChange={rules.allowChangeBeforeDeadline} />
        </>
      )}
    </div>
  );
}

async function SelectRoundContent({
  entryId, roundId, deadline, canChange,
}: { entryId: string; roundId: string; deadline: string; canChange: boolean }) {
  const [fixtures, mySelection] = await Promise.all([
    getRoundFixturesForEntry(entryId, roundId),
    prisma.selection.findFirst({ where: { entryId, roundId } }),
  ]);

  return (
    <SelectionForm
      entryId={entryId}
      roundId={roundId}
      fixtures={fixtures.map((f) => ({ ...f, kickoff: f.kickoff.toISOString() }))}
      deadline={deadline}
      currentTeamId={mySelection?.teamId ?? null}
      canChange={canChange}
    />
  );
}
