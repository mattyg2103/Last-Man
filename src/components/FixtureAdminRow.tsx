"use client";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateFixtureStatus, enterFixtureResult, deleteFixture } from "@/lib/actions/admin";
import { FixtureStatusBadge } from "@/components/StatusBadge";

type Fixture = {
  id: string;
  homeTeamName: string;
  awayTeamName: string;
  kickoff: string;
  status: string;
  result: string | null;
};

const statusOptions = ["SCHEDULED", "IN_PROGRESS", "COMPLETED", "POSTPONED", "CANCELLED", "ABANDONED"];

export default function FixtureAdminRow({ fixture }: { fixture: Fixture }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function changeStatus(status: string) {
    const formData = new FormData();
    formData.set("fixtureId", fixture.id);
    formData.set("status", status);
    startTransition(async () => {
      await updateFixtureStatus(formData);
      router.refresh();
    });
  }

  function setResult(result: "HOME" | "DRAW" | "AWAY") {
    const formData = new FormData();
    formData.set("fixtureId", fixture.id);
    formData.set("result", result);
    startTransition(async () => {
      await enterFixtureResult(formData);
      router.refresh();
    });
  }

  function remove() {
    if (!window.confirm("Remove this fixture from the round?")) return;
    const formData = new FormData();
    formData.set("fixtureId", fixture.id);
    startTransition(async () => {
      await deleteFixture(formData);
      router.refresh();
    });
  }

  return (
    <div className="border border-white/10 rounded-lg p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div>
        <p className="text-xs text-slate-400">{fixture.kickoff}</p>
        <p className="font-medium">{fixture.homeTeamName} v {fixture.awayTeamName}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1" role="group" aria-label="Result">
          <button
            type="button"
            onClick={() => setResult("HOME")}
            disabled={pending}
            className={fixture.result === "HOME" ? "btn-primary !py-1 text-xs" : "btn-secondary !py-1 text-xs"}
          >
            {fixture.homeTeamName} win
          </button>
          <button
            type="button"
            onClick={() => setResult("DRAW")}
            disabled={pending}
            className={fixture.result === "DRAW" ? "btn-primary !py-1 text-xs" : "btn-secondary !py-1 text-xs"}
          >
            Draw
          </button>
          <button
            type="button"
            onClick={() => setResult("AWAY")}
            disabled={pending}
            className={fixture.result === "AWAY" ? "btn-primary !py-1 text-xs" : "btn-secondary !py-1 text-xs"}
          >
            {fixture.awayTeamName} win
          </button>
        </div>
        <select className="input !py-1 w-auto" value={fixture.status} onChange={(e) => changeStatus(e.target.value)} disabled={pending} aria-label="Fixture status">
          {statusOptions.map((s) => <option key={s} value={s}>{s.replaceAll("_", " ")}</option>)}
        </select>
        <FixtureStatusBadge status={fixture.status} />
        <button className="btn-ghost !py-1 text-rose-400" onClick={remove} disabled={pending}>Remove</button>
      </div>
    </div>
  );
}
