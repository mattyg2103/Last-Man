"use client";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createFixture } from "@/lib/actions/admin";

type Team = { id: string; name: string };
type League = { id: string; name: string; teams: Team[] };

export default function FixtureForm({ roundId, leagues }: { roundId: string; leagues: League[] }) {
  const router = useRouter();
  const [leagueId, setLeagueId] = useState(leagues[0]?.id ?? "");
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const teams = useMemo(() => leagues.find((l) => l.id === leagueId)?.teams ?? [], [leagueId, leagues]);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.set("roundId", roundId);
    startTransition(async () => {
      const result = await createFixture(formData);
      setMsg(result.ok ? result.message ?? "Added." : result.error);
      if (result.ok) {
        e.currentTarget.reset();
        router.refresh();
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="card grid sm:grid-cols-2 md:grid-cols-5 gap-3 items-end">
      <div>
        <label className="label" htmlFor="leagueId">League</label>
        <select className="input" id="leagueId" name="leagueId" value={leagueId} onChange={(e) => setLeagueId(e.target.value)}>
          {leagues.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
        </select>
      </div>
      <div>
        <label className="label" htmlFor="homeTeamId">Home team</label>
        <select className="input" id="homeTeamId" name="homeTeamId" required>
          {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      </div>
      <div>
        <label className="label" htmlFor="awayTeamId">Away team</label>
        <select className="input" id="awayTeamId" name="awayTeamId" required>
          {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      </div>
      <div>
        <label className="label" htmlFor="kickoff">Kick-off</label>
        <input className="input" id="kickoff" name="kickoff" type="datetime-local" required />
      </div>
      <button className="btn-primary" type="submit" disabled={pending || teams.length < 2}>Add fixture</button>
      {msg && <span className="text-sm text-gray-600 col-span-full">{msg}</span>}
    </form>
  );
}
