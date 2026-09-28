import Link from "next/link";
import { requireAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { formatMoney, formatDateTime } from "@/lib/format";
import { GameStatusBadge } from "@/components/StatusBadge";

export default async function AdminDashboardPage() {
  await requireAdmin();

  const [games, totalParticipants, unpaid, openRounds, recentAudit] = await Promise.all([
    prisma.game.findMany({ orderBy: { createdAt: "desc" }, include: { entries: true, rounds: { where: { status: "OPEN" } } } }),
    prisma.entry.count(),
    prisma.entry.count({ where: { paymentStatus: "NOT_CONFIRMED" } }),
    prisma.round.findMany({ where: { status: "OPEN" }, include: { game: true } }),
    prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 5, include: { actor: true } }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="page-title">Administrator dashboard</h1>
        <Link href="/admin/games/new" className="btn-primary">+ Create game</Link>
      </div>

      <div className="grid sm:grid-cols-4 gap-4">
        <div className="card"><p className="text-sm text-slate-400">Games</p><p className="stat-number">{games.length}</p></div>
        <div className="card"><p className="text-sm text-slate-400">Total participants</p><p className="stat-number">{totalParticipants}</p></div>
        <div className="card"><p className="text-sm text-slate-400">Payments not confirmed</p><p className="stat-number stat-number-warn">{unpaid}</p></div>
        <div className="card"><p className="text-sm text-slate-400">Rounds open now</p><p className="stat-number">{openRounds.length}</p></div>
      </div>

      <div>
        <h2 className="section-title">Games</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {games.map((g) => (
            <Link key={g.id} href={`/admin/games/${g.id}`} className="card hover:shadow-md block">
              <div className="flex items-center justify-between">
                <p className="font-semibold">{g.name}</p>
                <GameStatusBadge status={g.status} />
              </div>
              <p className="text-sm text-slate-400 mt-1">{g.entries.length} participant(s) · {formatMoney(g.entryFeePence)} entry</p>
            </Link>
          ))}
        </div>
      </div>

      <div>
        <h2 className="section-title">Recent administrator activity</h2>
        <div className="card p-0 divide-y divide-white/5">
          {recentAudit.map((a) => (
            <div key={a.id} className="px-4 py-2 text-sm flex justify-between">
              <span>{a.actor.name} — {a.action.replaceAll("_", " ").toLowerCase()}</span>
              <span className="text-slate-500">{formatDateTime(a.createdAt)}</span>
            </div>
          ))}
          <Link href="/admin/audit" className="block px-4 py-2 text-sm text-lime-300 underline">View full audit history</Link>
        </div>
      </div>
    </div>
  );
}
