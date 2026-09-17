import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { toCsv } from "@/lib/csv";

export async function GET(_req: Request, { params }: { params: Promise<{ gameId: string }> }) {
  const { gameId } = await params;
  const session = await getSession();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const selections = await prisma.selection.findMany({
    where: { entry: { gameId: gameId } },
    include: { entry: { include: { user: true } }, round: true, team: true },
    orderBy: [{ round: { order: "asc" } }, { entry: { user: { name: "asc" } } }],
  });

  const rows = selections.map((s) => ({
    Round: s.round.name,
    Participant: s.entry.user.name,
    Email: s.entry.user.email,
    Team: s.team.name,
    "Automatic": s.isAutomatic ? "Yes" : "No",
    "Replacement": s.isReplacement ? "Yes" : "No",
    Outcome: s.outcome,
    "Submitted at": s.submittedAt.toISOString(),
  }));

  return new NextResponse(toCsv(rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="selections-${gameId}.csv"`,
    },
  });
}
