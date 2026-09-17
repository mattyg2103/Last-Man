import { requireAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { formatMoney, formatDateTime } from "@/lib/format";
import AdminGameSubNav from "@/components/AdminGameSubNav";
import PaymentStatusSelect from "@/components/PaymentStatusSelect";

export default async function PaymentsPage({ params }: { params: Promise<{ gameId: string }> }) {
  const { gameId } = await params;
  await requireAdmin();
  const game = await prisma.game.findUniqueOrThrow({ where: { id: gameId }, include: { rules: true } });
  const entries = await prisma.entry.findMany({ where: { gameId: gameId }, include: { user: true }, orderBy: { joinedAt: "asc" } });

  return (
    <div>
      <AdminGameSubNav gameId={gameId} />
      <h1 className="page-title mb-1">Payment status tracking</h1>
      <p className="text-gray-600 mb-4">
        Entry fee: <strong>{formatMoney(game.entryFeePence)}</strong>. Payments are collected outside this website —
        this page only records what you have confirmed. {game.rules?.paymentInstructions}
      </p>
      <div className="overflow-x-auto card p-0">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="px-4 py-2">Participant</th>
              <th className="px-4 py-2">Notified paid</th>
              <th className="px-4 py-2">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {entries.map((e) => (
              <tr key={e.id}>
                <td className="px-4 py-2">
                  <p className="font-medium">{e.user.name}</p>
                  <p className="text-xs text-gray-500">{e.user.email}</p>
                </td>
                <td className="px-4 py-2 text-gray-500">{e.paymentNotifiedAt ? formatDateTime(e.paymentNotifiedAt) : "—"}</td>
                <td className="px-4 py-2"><PaymentStatusSelect entryId={e.id} currentStatus={e.paymentStatus} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
