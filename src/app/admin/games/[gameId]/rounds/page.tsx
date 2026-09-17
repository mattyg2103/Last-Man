import Link from "next/link";
import { requireAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { formatDateTime } from "@/lib/format";
import AdminGameSubNav from "@/components/AdminGameSubNav";
import { RoundStatusBadge } from "@/components/StatusBadge";
import CreateRoundForm from "@/components/CreateRoundForm";

export default async function RoundsPage({ params }: { params: Promise<{ gameId: string }> }) {
  const { gameId } = await params;
  await requireAdmin();
  const rounds = await prisma.round.findMany({ where: { gameId: gameId }, orderBy: { order: "asc" }, include: { fixtures: true } });
  const nextOrder = rounds.length > 0 ? Math.max(...rounds.map((r) => r.order)) + 1 : 1;

  return (
    <div>
      <AdminGameSubNav gameId={gameId} />
      <h1 className="page-title mb-4">Fixture and round management</h1>
      <CreateRoundForm gameId={gameId} nextOrder={nextOrder} />

      <div className="grid md:grid-cols-2 gap-4 mt-4">
        {rounds.map((r) => (
          <Link key={r.id} href={`/admin/games/${gameId}/rounds/${r.id}`} className="card hover:shadow-md block">
            <div className="flex items-center justify-between">
              <p className="font-semibold">{r.name} <span className="text-xs text-gray-400">GW{r.gameWeek}</span></p>
              <RoundStatusBadge status={r.status} />
            </div>
            <p className="text-sm text-gray-500 mt-1">Deadline {formatDateTime(r.deadlineAt)} · {r.fixtures.length} fixture(s)</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
