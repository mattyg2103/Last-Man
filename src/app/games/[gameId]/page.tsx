import Link from "next/link";
import { requireCustomer } from "@/lib/session";
import { requireEntry } from "@/lib/gameAccess";
import { prisma } from "@/lib/prisma";
import { formatMoney, formatDate, formatDateTime } from "@/lib/format";
import { EntryStatusBadge, GameStatusBadge, PaymentStatusBadge } from "@/components/StatusBadge";
import GameSubNav from "@/components/GameSubNav";
import FormAction from "@/components/FormAction";
import { notifyPaymentSent, requestReBuy } from "@/lib/actions/customer";

export default async function GameOverviewPage({ params }: { params: Promise<{ gameId: string }> }) {
  const { gameId } = await params;
  const user = await requireCustomer();
  const entry = await requireEntry(gameId, user.id);
  const game = entry.game;
  const rules = game.rules!;

  const currentRound = await prisma.round.findFirst({
    where: { gameId: game.id, status: { in: ["OPEN", "SCHEDULED"] } },
    orderBy: { order: "asc" },
  });
  const mySelection = currentRound
    ? await prisma.selection.findFirst({ where: { entryId: entry.id, roundId: currentRound.id }, include: { team: true } })
    : null;

  return (
    <div>
      <GameSubNav gameId={game.id} />
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div>
          <h1 className="page-title">{game.name}</h1>
          <p className="text-gray-600 max-w-2xl">{game.description}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <GameStatusBadge status={game.status} />
          <EntryStatusBadge status={entry.status} />
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <div className="card">
          <p className="text-sm text-gray-500">Entry fee</p>
          <p className="text-xl font-bold">{formatMoney(game.entryFeePence)}</p>
          <div className="mt-2"><PaymentStatusBadge status={entry.paymentStatus} /></div>
          <p className="text-xs text-gray-500 mt-2">{rules.paymentInstructions}</p>
          <p className="text-xs text-gray-500 mt-1">Please use your full name as the payment reference.</p>
          {entry.paymentStatus !== "PAID" && (
            <div className="mt-3">
              <FormAction
                action={notifyPaymentSent}
                hidden={{ entryId: entry.id }}
                label={entry.paymentNotifiedAt ? "Payment notified again" : "I've sent payment"}
                className="btn-secondary"
              />
            </div>
          )}
        </div>

        <div className="card">
          <p className="text-sm text-gray-500">Started</p>
          <p className="text-xl font-bold">{formatDate(game.startDate)}</p>
          <p className="text-sm text-gray-500 mt-3">Re-buys used</p>
          <p className="text-lg font-semibold">{entry.reBuysUsed} / {rules.allowReBuy ? rules.reBuyCount : 0}</p>
        </div>

        <div className="card">
          <p className="text-sm text-gray-500">Current round</p>
          {currentRound ? (
            <>
              <p className="text-xl font-bold">{currentRound.name}</p>
              <p className="text-sm text-gray-500">Deadline {formatDateTime(currentRound.deadlineAt)}</p>
              <p className="text-sm mt-2">
                {mySelection ? (
                  <span className="text-pitch-700 font-medium">You picked {mySelection.team.name}{mySelection.isAutomatic ? " (auto-assigned)" : ""}</span>
                ) : (
                  <span className="text-accent-600 font-medium">No selection submitted yet</span>
                )}
              </p>
              {entry.status === "ACTIVE" && (
                <Link href={`/games/${game.id}/select`} className="btn-primary mt-3 inline-block">
                  Make selection
                </Link>
              )}
            </>
          ) : (
            <p className="text-gray-500">No round currently open</p>
          )}
        </div>
      </div>

      {entry.status === "REBUY_ELIGIBLE" && (
        <div className="card border-accent-400 bg-accent-50 mb-6">
          <p className="font-semibold text-accent-600">You're eligible for a re-buy</p>
          <p className="text-sm text-gray-700 mt-1">{rules.reBuyInstructions}</p>
          <div className="mt-3">
            <FormAction
              action={requestReBuy}
              hidden={{ entryId: entry.id, roundId: currentRound?.id ?? "" }}
              label={`Request re-buy (${formatMoney(rules.reBuyCostPence)})`}
              className="btn-primary"
            />
          </div>
        </div>
      )}

      <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-3">
        <Link href={`/games/${game.id}/select`} className="card text-center hover:shadow-md">This round</Link>
        <Link href={`/games/${game.id}/picks`} className="card text-center hover:shadow-md">My previous picks</Link>
        <Link href={`/games/${game.id}/leaderboard`} className="card text-center hover:shadow-md">Leaderboard</Link>
        <Link href={`/games/${game.id}/rules`} className="card text-center hover:shadow-md">Game rules</Link>
      </div>
    </div>
  );
}
