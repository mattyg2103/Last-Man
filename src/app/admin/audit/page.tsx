import { requireAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { formatDateTime } from "@/lib/format";

export default async function AuditHistoryPage() {
  await requireAdmin();
  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 300,
    include: { actor: true, game: true },
  });

  return (
    <div>
      <h1 className="page-title mb-4">Administrator audit history</h1>
      <div className="overflow-x-auto card p-0">
        <table className="w-full text-sm">
          <thead className="bg-white/5 text-left text-slate-400">
            <tr>
              <th className="px-4 py-2">When</th>
              <th className="px-4 py-2">Administrator</th>
              <th className="px-4 py-2">Game</th>
              <th className="px-4 py-2">Action</th>
              <th className="px-4 py-2">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {logs.map((l) => (
              <tr key={l.id}>
                <td className="px-4 py-2 whitespace-nowrap text-slate-400">{formatDateTime(l.createdAt)}</td>
                <td className="px-4 py-2">{l.actor.name}</td>
                <td className="px-4 py-2">{l.game?.name ?? "—"}</td>
                <td className="px-4 py-2">{l.action.replaceAll("_", " ")}</td>
                <td className="px-4 py-2 text-slate-400">{l.details}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
