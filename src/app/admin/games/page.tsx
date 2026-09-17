import Link from "next/link";
import { requireAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { formatMoney, formatDate } from "@/lib/format";
import { GameStatusBadge } from "@/components/StatusBadge";

export default async function AdminGamesPage() {
  await requireAdmin();
  const games = await prisma.game.findMany({ orderBy: { createdAt: "desc" }, include: { entries: true } });

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="page-title">Create and manage games</h1>
        <Link href="/admin/games/new" className="btn-primary">+ Create game</Link>
      </div>
      <div className="overflow-x-auto card p-0">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Entry fee</th>
              <th className="px-4 py-2">Starts</th>
              <th className="px-4 py-2">Participants</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {games.map((g) => (
              <tr key={g.id}>
                <td className="px-4 py-2 font-medium">{g.name}</td>
                <td className="px-4 py-2"><GameStatusBadge status={g.status} /></td>
                <td className="px-4 py-2">{formatMoney(g.entryFeePence)}</td>
                <td className="px-4 py-2">{formatDate(g.startDate)}</td>
                <td className="px-4 py-2">{g.entries.length}</td>
                <td className="px-4 py-2"><Link href={`/admin/games/${g.id}`} className="text-pitch-700 underline">Manage</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
