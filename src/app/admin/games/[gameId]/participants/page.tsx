import { requireAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import AdminGameSubNav from "@/components/AdminGameSubNav";
import { EntryStatusBadge, PaymentStatusBadge } from "@/components/StatusBadge";
import FormAction from "@/components/FormAction";
import AddParticipantForm from "@/components/AddParticipantForm";
import EntryStatusSelect from "@/components/EntryStatusSelect";
import { removeParticipant } from "@/lib/actions/admin";

export default async function ParticipantsPage({ params }: { params: Promise<{ gameId: string }> }) {
  const { gameId } = await params;
  await requireAdmin();
  const currentRound = await prisma.round.findFirst({ where: { gameId: gameId, status: "OPEN" }, orderBy: { order: "asc" } });
  const entries = await prisma.entry.findMany({
    where: { gameId: gameId },
    include: { user: true, selections: currentRound ? { where: { roundId: currentRound.id } } : false },
    orderBy: { joinedAt: "asc" },
  });

  return (
    <div>
      <AdminGameSubNav gameId={gameId} />
      <h1 className="page-title mb-4">Participant management</h1>

      <AddParticipantForm gameId={gameId} />

      <div className="overflow-x-auto card p-0 mt-4">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="px-4 py-2">Participant</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Payment</th>
              {currentRound && <th className="px-4 py-2">{currentRound.name}</th>}
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {entries.map((e) => (
              <tr key={e.id}>
                <td className="px-4 py-2">
                  <p className="font-medium">{e.user.name}</p>
                  <p className="text-xs text-gray-500">{e.user.email}</p>
                </td>
                <td className="px-4 py-2">
                  <EntryStatusSelect entryId={e.id} currentStatus={e.status} />
                </td>
                <td className="px-4 py-2"><PaymentStatusBadge status={e.paymentStatus} /></td>
                {currentRound && (
                  <td className="px-4 py-2">
                    {Array.isArray(e.selections) && e.selections.length > 0 ? (
                      <span className="badge-active">Submitted</span>
                    ) : (
                      <span className="badge-warning">Not yet submitted</span>
                    )}
                  </td>
                )}
                <td className="px-4 py-2">
                  <FormAction
                    action={removeParticipant}
                    hidden={{ entryId: e.id }}
                    label="Remove"
                    className="btn-danger text-xs"
                    confirmText={`Remove ${e.user.name} from this game? This deletes their entry and selection history for this game.`}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
