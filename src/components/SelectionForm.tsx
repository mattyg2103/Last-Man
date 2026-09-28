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
        <div className="card border-amber-400/40 bg-amber-400/10" role="dialog" aria-label="Confirm selection">
          <p className="font-semibold text-white">Confirm your selection</p>
          <dl className="text-sm mt-2 space-y-1 text-slate-200">
            <div><dt className="inline font-medium">Selected team: </dt><dd className="inline">{pendingPick.teamName}</dd></div>
            <div><dt className="inline font-medium">Opponent: </dt><dd className="inline">{pendingPick.opponent}</dd></div>
            <div><dt className="inline font-medium">Kick-off: </dt><dd className="inline">{pendingPick.fixture.kickoff}</dd></div>
            <div><dt className="inline font-medium">Deadline: </dt><dd className="inline">{deadline}</dd></div>
          </dl>
          <p className="text-xs text-amber-300 mt-2">Once used, this team may not be available to you again for the rest of this game.</p>
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
              <p className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                <LeagueTag name={f.leagueName} />
                {f.kickoff}
              </p>
              <p className="mt-1.5 font-display text-lg font-semibold text-white">
                {f.homeTeamName} <span className="mx-1 text-sm font-medium text-slate-500">vs</span> {f.awayTeamName}
              </p>
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

function LeagueTag({ name }: { name: string }) {
  const style = name.toLowerCase().includes("premier")
    ? "bg-violet-500/20 text-violet-200 ring-violet-400/40"
    : name.toLowerCase().includes("championship")
    ? "bg-cyan-400/15 text-cyan-200 ring-cyan-400/40"
    : "bg-white/10 text-slate-200 ring-white/20";
  return <span className={`rounded-md px-2 py-0.5 text-[0.7rem] font-semibold uppercase tracking-wide ring-1 ring-inset ${style}`}>{name}</span>;
}

function TeamButton({
  label, selected, eligible, disabled, onClick,
}: { label: string; selected: boolean; eligible: boolean; disabled: boolean; onClick: () => void }) {
  if (!eligible) {
    return (
      <button disabled className="btn-ghost !text-slate-500 !bg-white/5 border border-white/10 cursor-not-allowed" title="Already used — not eligible again" aria-label={`${label}, not eligible, already used`}>
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
