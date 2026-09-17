import { requireAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import CreateGameForm from "@/components/CreateGameForm";

export default async function NewGamePage() {
  await requireAdmin();
  const leagues = await prisma.league.findMany({ orderBy: { name: "asc" } });

  return (
    <div>
      <h1 className="page-title mb-4">Create a new game</h1>
      <CreateGameForm leagues={leagues} />
    </div>
  );
}
