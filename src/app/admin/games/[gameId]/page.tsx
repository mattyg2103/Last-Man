import { requireAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import AdminGameSubNav from "@/components/AdminGameSubNav";
import EditGameForm from "@/components/EditGameForm";
import { formatMoney } from "@/lib/format";

export default async function AdminGameDetailPage({ params }: { params: Promise<{ gameId: string }> }) {
  const { gameId } = await params;
  await requireAdmin();
  const game = await prisma.game.findUniqueOrThrow({ where: { id: gameId }, include: { entries: true, gameLeagues: true } });
  const leagues = await prisma.league.findMany({ orderBy: { name: "asc" } });

  return (
    <div>
      <AdminGameSubNav gameId={game.id} />
      <div className="flex items-center justify-between mb-4">
        <h1 className="page-title">{game.name}</h1>
        <p className="text-gray-500 text-sm">{game.entries.length} participant(s) · {formatMoney(game.entryFeePence)}</p>
      </div>
      <EditGameForm
        game={{ ...game, startDate: game.startDate.toISOString() }}
        leagues={leagues}
        selectedLeagueIds={game.gameLeagues.map((gl) => gl.leagueId)}
      />
    </div>
  );
}
