import Link from "next/link";
import { requireCustomer } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { formatDateTime, formatMoney } from "@/lib/format";
import { EntryStatusBadge, GameStatusBadge } from "@/components/StatusBadge";

export default async function DashboardPage() {
  const user = await requireCustomer();

  const entries = await prisma.entry.findMany({
    where: { userId: user.id },
    include: { game: { include: { rounds: { where: { status: "OPEN" }, orderBy: { order: "asc" }, take: 1 } } } },
    orderBy: { joinedAt: "desc" },
  });

  const unreadCount = await prisma.notification.count({ where: { userId: user.id, readAt: null } });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Welcome back, {user.name.split(" ")[0]}</h1>
        <p className="text-gray-600">Here&apos;s what&apos;s happening across your games.</p>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <div className="card">
          <p className="text-sm text-gray-500">Games joined</p>
          <p className="text-3xl font-bold">{entries.length}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Still active</p>
          <p className="text-3xl font-bold">{entries.filter((e) => e.status === "ACTIVE").length}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Unread notifications</p>
          <p className="text-3xl font-bold">{unreadCount}</p>
          <Link href="/notifications" className="text-sm text-pitch-700 underline">View notifications</Link>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="section-title !mb-0">Your games</h2>
          <Link href="/games" className="btn-secondary">Browse & join games</Link>
        </div>
        {entries.length === 0 ? (
          <div className="card text-center text-gray-500">
            You haven&apos;t joined any games yet. <Link href="/games" className="text-pitch-700 underline">Browse available games</Link>.
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {entries.map((entry) => {
              const openRound = entry.game.rounds[0];
              return (
                <Link key={entry.id} href={`/games/${entry.gameId}`} className="card hover:shadow-md transition-shadow block">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-gray-900">{entry.game.name}</p>
                      <p className="text-sm text-gray-500">{formatMoney(entry.game.entryFeePence)} entry</p>
                    </div>
                    <EntryStatusBadge status={entry.status} />
                  </div>
                  <div className="mt-3 flex items-center justify-between text-sm">
                    <GameStatusBadge status={entry.game.status} />
                    {openRound ? (
                      <span className="text-accent-600 font-medium">Deadline {formatDateTime(openRound.deadlineAt)}</span>
                    ) : (
                      <span className="text-gray-400">No open round</span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
