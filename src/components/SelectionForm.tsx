"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { submitSelectionAction } from "@/lib/actions/customer";

type Fixture = {
  fixtureId: string;
  leagueName: string;
  homeTeamId: string;
  homeTeamName: string;
  awayTeamId: string;
  awayTeamName: string;
  kickoff: string;
  homeEligible: boolean;
  awayEligible: boolean;
};

export default function SelectionForm({
  entryId,
  roundId,
  fixtures,
  deadline,
  currentTeamId,
  canChange,
}: {
  entryId: string;
  roundId: string;
  fixtures: Fixture[];
  deadline: string;
  currentTeamId: string | null;
  canChange: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [pendingPick, setPendingPick] = useState<
    { fixture: Fixture; teamId: string; teamName: string; opponent: string } | null
  >(null);

  const locked = currentTeamId !== null && !canChange;

  function choose(fixture: Fixture, side: "home" | "away") {
    if (locked) return;
    const teamId = side === "home" ? fixture.homeTeamId : fixture.awayTeamId;
    const teamName = side === "home" ? fixture.homeTeamName : fixture.awayTeamName;
    const opponent = side === "home" ? fixture.awayTeamName : fixture.homeTeamName;
    setPendingPick({ fixture, teamId, teamName, opponent });
  }

  function confirm() {
    if (!pendingPick) return;
    setError(null);
    const formData = new FormData();
    formData.set("entryId", entryId);
    formData.set("roundId", roundId);
    formData.set("teamId", pendingPick.teamId);
    startTransition(async () => {
      const result = await submitSelectionAction(formData);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setPendingPick(null);
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      {locked && (
        <div className="badge-neutral block w-fit">Selections are locked for this round — the deadline has passed or changes are not permitted.</div>
      )}
      {error && <div role="alert" className="badge-warning block w-fit">{error}</div>}

      {pendingPick && (
        <div className="card border-accent-400 bg-accent-50" role="dialog" aria-label="Confirm selection">
          <p className="font-semibold text-gray-900">Confirm your selection</p>
          <dl className="text-sm mt-2 space-y-1 text-gray-700">
            <div><dt className="inline font-medium">Selected team: </dt><dd className="inline">{pendingPick.teamName}</dd></div>
            <div><dt className="inline font-medium">Opponent: </dt><dd className="inline">{pendingPick.opponent}</dd></div>
            <div><dt className="inline font-medium">Kick-off: </dt><dd className="inline">{new Date(pendingPick.fixture.kickoff).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/London" })}</dd></div>
            <div><dt className="inline font-medium">Deadline: </dt><dd className="inline">{new Date(deadline).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/London" })}</dd></div>
          </dl>
          <p className="text-xs text-amber-700 mt-2">Once used, this team may not be available to you again for the rest of this game.</p>
          <div className="flex gap-2 mt-3">
            <button className="btn-primary" onClick={confirm} disabled={pending}>{pending ? "Submitting…" : "Confirm selection"}</button>
            <button className="btn-ghost" onClick={() => setPendingPick(null)} disabled={pending}>Cancel</button>
          </div>
        </div>
      )}

      <div className="grid gap-3">
        {fixtures.map((f) => (
          <div key={f.fixtureId} className="card flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <p className="text-xs text-gray-500">{f.leagueName} · {new Date(f.kickoff).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/London" })}</p>
              <p className="font-medium">{f.homeTeamName} v {f.awayTeamName}</p>
            </div>
            <div className="flex gap-2">
              <TeamButton
                label={f.homeTeamName}
                selected={currentTeamId === f.homeTeamId}
                eligible={f.homeEligible}
                disabled={locked}
                onClick={() => choose(f, "home")}
              />
              <TeamButton
                label={f.awayTeamName}
                selected={currentTeamId === f.awayTeamId}
                eligible={f.awayEligible}
                disabled={locked}
                onClick={() => choose(f, "away")}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TeamButton({
  label, selected, eligible, disabled, onClick,
}: { label: string; selected: boolean; eligible: boolean; disabled: boolean; onClick: () => void }) {
  if (!eligible) {
    return (
      <button disabled className="btn-ghost !text-gray-400 !bg-gray-50 border border-gray-200 cursor-not-allowed" title="Already used — not eligible again" aria-label={`${label}, not eligible, already used`}>
        {label} <span aria-hidden>🔒</span>
      </button>
    );
  }
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-pressed={selected}
      className={selected ? "btn-primary" : "btn-secondary"}
    >
      {selected ? "✔ " : ""}{label}
    </button>
  );
}
