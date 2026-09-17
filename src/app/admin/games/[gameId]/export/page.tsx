import { requireAdmin } from "@/lib/session";
import AdminGameSubNav from "@/components/AdminGameSubNav";

export default async function ExportPage({ params }: { params: Promise<{ gameId: string }> }) {
  const { gameId } = await params;
  await requireAdmin();

  return (
    <div>
      <AdminGameSubNav gameId={gameId} />
      <h1 className="page-title mb-4">Reporting and export</h1>
      <div className="grid sm:grid-cols-2 gap-4">
        <a href={`/api/admin/games/${gameId}/export/participants`} className="card hover:shadow-md block">
          <p className="font-semibold">Participants & payment status (CSV)</p>
          <p className="text-sm text-gray-500 mt-1">Name, email, status, payment status, re-buys used.</p>
        </a>
        <a href={`/api/admin/games/${gameId}/export/selections`} className="card hover:shadow-md block">
          <p className="font-semibold">Selections (CSV)</p>
          <p className="text-sm text-gray-500 mt-1">Every round selection, team, outcome and whether it was automatic.</p>
        </a>
      </div>
    </div>
  );
}
