"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateFixtureStatus, enterFixtureResult, deleteFixture } from "@/lib/actions/admin";
import { FixtureStatusBadge } from "@/components/StatusBadge";

type Fixture = {
  id: string;
  homeTeamName: string;
  awayTeamName: string;
  kickoff: string;
  status: string;
  homeScore: number | null;
  awayScore: number | null;
};

const statusOptions = ["SCHEDULED", "IN_PROGRESS", "COMPLETED", "POSTPONED", "CANCELLED", "ABANDONED"];

export default function FixtureAdminRow({ fixture }: { fixture: Fixture }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [homeScore, setHomeScore] = useState(fixture.homeScore ?? 0);
  const [awayScore, setAwayScore] = useState(fixture.awayScore ?? 0);

  function changeStatus(status: string) {
    const formData = new FormData();
    formData.set("fixtureId", fixture.id);
    formData.set("status", status);
    startTransition(async () => {
      await updateFixtureStatus(formData);
      router.refresh();
    });
  }

  function submitResult(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData();
    formData.set("fixtureId", fixture.id);
    formData.set("homeScore", String(homeScore));
    formData.set("awayScore", String(awayScore));
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
    <div className="border border-gray-100 rounded-lg p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div>
        <p className="text-xs text-gray-500">{new Date(fixture.kickoff).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/London" })}</p>
        <p className="font-medium">{fixture.homeTeamName} v {fixture.awayTeamName}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <form onSubmit={submitResult} className="flex items-center gap-1">
          <input type="number" min={0} className="input !py-1 w-14" value={homeScore} onChange={(e) => setHomeScore(Number(e.target.value))} aria-label="Home score" />
          <span>-</span>
          <input type="number" min={0} className="input !py-1 w-14" value={awayScore} onChange={(e) => setAwayScore(Number(e.target.value))} aria-label="Away score" />
          <button className="btn-secondary !py-1" type="submit" disabled={pending}>Save result</button>
        </form>
        <select className="input !py-1 w-auto" value={fixture.status} onChange={(e) => changeStatus(e.target.value)} disabled={pending} aria-label="Fixture status">
          {statusOptions.map((s) => <option key={s} value={s}>{s.replaceAll("_", " ")}</option>)}
        </select>
        <FixtureStatusBadge status={fixture.status} />
        <button className="btn-ghost !py-1 text-red-600" onClick={remove} disabled={pending}>Remove</button>
      </div>
    </div>
  );
}
