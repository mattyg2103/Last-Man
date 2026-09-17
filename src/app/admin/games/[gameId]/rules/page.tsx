import { requireAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import AdminGameSubNav from "@/components/AdminGameSubNav";
import GameRulesForm from "@/components/GameRulesForm";

export default async function AdminGameRulesPage({ params }: { params: Promise<{ gameId: string }> }) {
  const { gameId } = await params;
  await requireAdmin();
  const rules = await prisma.gameRule.findUniqueOrThrow({ where: { gameId: gameId } });

  return (
    <div>
      <AdminGameSubNav gameId={gameId} />
      <h1 className="page-title mb-4">Customisable game rules</h1>
      <GameRulesForm gameId={gameId} rules={rules} />
    </div>
  );
}
