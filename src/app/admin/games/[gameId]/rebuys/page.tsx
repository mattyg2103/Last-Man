import { requireAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { formatMoney, formatDateTime } from "@/lib/format";
import AdminGameSubNav from "@/components/AdminGameSubNav";
import FormAction from "@/components/FormAction";
import { decideReBuyRequest, manualReBuy } from "@/lib/actions/admin";

export default async function ReBuysPage({ params }: { params: Promise<{ gameId: string }> }) {
  const { gameId } = await params;
  await requireAdmin();
  const rules = await prisma.gameRule.findUniqueOrThrow({ where: { gameId: gameId } });
  const pendingRequests = await prisma.reBuyRequest.findMany({
    where: { status: "REQUESTED", entry: { gameId: gameId } },
    include: { entry: { include: { user: true } }, round: true },
    orderBy: { requestedAt: "asc" },
  });
  const eligibleWithoutRequest = await prisma.entry.findMany({
    where: {
      gameId: gameId,
      status: "REBUY_ELIGIBLE",
      reBuyRequests: { none: { status: "REQUESTED" } },
    },
    include: { user: true },
  });
  const currentRound = await prisma.round.findFirst({ where: { gameId: gameId, status: "OPEN" }, orderBy: { order: "asc" } });

  return (
    <div>
      <AdminGameSubNav gameId={gameId} />
      <h1 className="page-title mb-1">Re-buy management</h1>
      <p className="text-gray-600 mb-4">
        {rules.allowReBuy
          ? `Re-buys allowed in round(s) ${rules.reBuyRounds}, up to ${rules.reBuyCount} per participant, at ${formatMoney(rules.reBuyCostPence)} each.`
          : "Re-buys are disabled for this game."}
      </p>

      <h2 className="section-title">Pending requests</h2>
      {pendingRequests.length === 0 ? (
        <p className="text-gray-500 mb-6">No pending re-buy requests.</p>
      ) : (
        <div className="space-y-2 mb-6">
          {pendingRequests.map((r) => (
            <div key={r.id} className="card flex items-center justify-between">
              <div>
                <p className="font-medium">{r.entry.user.name}</p>
                <p className="text-sm text-gray-500">{r.round.name} · Requested {formatDateTime(r.requestedAt)} · {formatMoney(r.costPence)}</p>
              </div>
              <div className="flex gap-2">
                <FormAction action={decideReBuyRequest} hidden={{ requestId: r.id, approve: "true" }} label="Approve" />
                <FormAction action={decideReBuyRequest} hidden={{ requestId: r.id, approve: "false" }} label="Reject" className="btn-danger" />
              </div>
            </div>
          ))}
        </div>
      )}

      <h2 className="section-title">Re-buy eligible (no request yet)</h2>
      {eligibleWithoutRequest.length === 0 ? (
        <p className="text-gray-500">None.</p>
      ) : (
        <div className="space-y-2">
          {eligibleWithoutRequest.map((e) => (
            <div key={e.id} className="card flex items-center justify-between">
              <p className="font-medium">{e.user.name}</p>
              <FormAction
                action={manualReBuy}
                hidden={{ entryId: e.id, roundId: currentRound?.id ?? "" }}
                label="Confirm re-buy (payment received)"
                className="btn-secondary"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
