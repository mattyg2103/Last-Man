import { requireAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import AdminGameSubNav from "@/components/AdminGameSubNav";
import LeaderboardSettingsForm from "@/components/LeaderboardSettingsForm";

export default async function LeaderboardSettingsPage({ params }: { params: Promise<{ gameId: string }> }) {
  const { gameId } = await params;
  await requireAdmin();
  const rules = await prisma.gameRule.findUniqueOrThrow({ where: { gameId: gameId } });

  return (
    <div>
      <AdminGameSubNav gameId={gameId} />
      <h1 className="page-title mb-4">Leaderboard controls</h1>
      <LeaderboardSettingsForm
        gameId={gameId}
        selectionsVisibility={rules.selectionsVisibility}
        showEliminatedOnLeaderboard={rules.showEliminatedOnLeaderboard}
      />
    </div>
  );
}
