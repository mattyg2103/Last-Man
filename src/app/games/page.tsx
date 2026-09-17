import Link from "next/link";
import { requireCustomer } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { formatMoney, formatDate } from "@/lib/format";
import { EntryStatusBadge, GameStatusBadge } from "@/components/StatusBadge";
import FormAction from "@/components/FormAction";
import { joinGame } from "@/lib/actions/customer";

export default async function MyGamesPage() {
  const user = await requireCustomer();

  const [entries, joinable] = await Promise.all([
    prisma.entry.findMany({ where: { userId: user.id }, include: { game: true }, orderBy: { joinedAt: "desc" } }),
    prisma.game.findMany({ where: { status: { in: ["OPEN", "ACTIVE"] } }, include: { entries: { where: { userId: user.id } } } }),
  ]);

  const joinedGameIds = new Set(entries.map((e) => e.gameId));
  const availableToJoin = joinable.filter((g) => !joinedGameIds.has(g.id) && g.status === "OPEN");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="page-title mb-4">My games</h1>
        {entries.length === 0 ? (
          <p className="text-gray-500">You haven&apos;t joined any games yet.</p>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {entries.map((entry) => (
              <Link key={entry.id} href={`/games/${entry.gameId}`} className="card hover:shadow-md block">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold">{entry.game.name}</p>
                    <p className="text-sm text-gray-500">{formatMoney(entry.game.entryFeePence)} · Started {formatDate(entry.game.startDate)}</p>
                  </div>
                  <EntryStatusBadge status={entry.status} />
                </div>
                <div className="mt-2"><GameStatusBadge status={entry.game.status} /></div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="section-title">Available games to join</h2>
        {availableToJoin.length === 0 ? (
          <p className="text-gray-500">There are no games currently open for new entries.</p>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {availableToJoin.map((game) => (
              <div key={game.id} className="card">
                <p className="font-semibold">{game.name}</p>
                <p className="text-sm text-gray-600 mt-1">{game.description}</p>
                <p className="text-sm text-gray-500 mt-2">Entry fee: {formatMoney(game.entryFeePence)} · Starts {formatDate(game.startDate)}</p>
                <div className="mt-3">
                  <FormAction action={joinGame} hidden={{ gameId: game.id }} label="Join this game" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
