import Link from "next/link";
import { requireAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { formatDateTime } from "@/lib/format";
import AdminGameSubNav from "@/components/AdminGameSubNav";
import { RoundStatusBadge } from "@/components/StatusBadge";

export default async function ResultsPage({ params }: { params: Promise<{ gameId: string }> }) {
  const { gameId } = await params;
  await requireAdmin();
  const rounds = await prisma.round.findMany({
    where: { gameId: gameId },
    orderBy: { order: "asc" },
    include: { selections: true, fixtures: true },
  });
  const eliminatedEntries = await prisma.entry.findMany({
    where: { gameId: gameId, status: "ELIMINATED" },
    include: { user: true, eliminatedRound: true },
  });

  return (
    <div>
      <AdminGameSubNav gameId={gameId} />
      <h1 className="page-title mb-4">Results and elimination management</h1>

      <div className="grid md:grid-cols-2 gap-4 mb-6">
        {rounds.map((r) => {
          const results = r.fixtures.filter((f) => f.status === "COMPLETED").length;
          return (
            <Link key={r.id} href={`/admin/games/${gameId}/rounds/${r.id}`} className="card hover:shadow-md block">
              <div className="flex items-center justify-between">
                <p className="font-semibold">{r.name}</p>
                <RoundStatusBadge status={r.status} />
              </div>
              <p className="text-sm text-gray-500 mt-1">{results}/{r.fixtures.length} results recorded · {r.selections.length} selection(s)</p>
              <p className="text-sm text-pitch-700 mt-1 underline">Enter results & process round</p>
            </Link>
          );
        })}
      </div>

      <h2 className="section-title">Eliminated participants</h2>
      <div className="overflow-x-auto card p-0">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr><th className="px-4 py-2">Participant</th><th className="px-4 py-2">Eliminated in</th></tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {eliminatedEntries.length === 0 && <tr><td className="px-4 py-2 text-gray-500" colSpan={2}>No eliminations yet.</td></tr>}
            {eliminatedEntries.map((e) => (
              <tr key={e.id}>
                <td className="px-4 py-2">{e.user.name}</td>
                <td className="px-4 py-2">{e.eliminatedRound?.name ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
