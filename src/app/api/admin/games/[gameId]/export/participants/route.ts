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

  const entries = await prisma.entry.findMany({
    where: { gameId: gameId },
    include: { user: true },
    orderBy: { joinedAt: "asc" },
  });

  const rows = entries.map((e) => ({
    Name: e.user.name,
    Email: e.user.email,
    Status: e.status,
    "Payment status": e.paymentStatus,
    "Payment notified at": e.paymentNotifiedAt?.toISOString() ?? "",
    "Re-buys used": e.reBuysUsed,
    "Joined at": e.joinedAt.toISOString(),
  }));

  return new NextResponse(toCsv(rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="participants-${gameId}.csv"`,
    },
  });
}
