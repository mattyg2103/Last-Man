"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { bulkCreateFixtures } from "@/lib/actions/admin";

export default function BulkFixtureForm({ roundId, leagues }: { roundId: string; leagues: { id: string; name: string }[] }) {
  const router = useRouter();
  const [leagueId, setLeagueId] = useState(leagues[0]?.id ?? "");
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.set("roundId", roundId);
    startTransition(async () => {
      const result = await bulkCreateFixtures(formData);
      setMsg({ ok: result.ok, text: result.ok ? result.message ?? "Added." : result.error });
      if (result.ok) {
        e.currentTarget.reset();
        router.refresh();
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="card space-y-3">
      <p className="text-sm text-gray-600">
        Paste the whole round&apos;s fixture list from wherever you have it (fixture list website, spreadsheet, etc.) — one match
        per line, in the form <code className="text-xs bg-gray-100 px-1 rounded">Home Team v Away Team, DD/MM/YYYY HH:MM</code>.
        This is much quicker than adding fixtures one at a time; team names must match the names set up under League and team management.
      </p>
      <div>
        <label className="label" htmlFor="bulk-leagueId">League for this paste</label>
        <select className="input" id="bulk-leagueId" name="leagueId" value={leagueId} onChange={(e) => setLeagueId(e.target.value)}>
          {leagues.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
        </select>
      </div>
      <div>
        <label className="label" htmlFor="bulk-text">Fixtures (one per line)</label>
        <textarea
          className="input font-mono text-xs"
          id="bulk-text"
          name="text"
          rows={6}
          placeholder={"Arsenal v Chelsea, 20/09/2026 15:00\nLiverpool v Everton, 20/09/2026 15:00"}
        />
      </div>
      {msg && <p className={`text-sm ${msg.ok ? "text-pitch-700" : "text-red-600"}`}>{msg.text}</p>}
      <button className="btn-primary" type="submit" disabled={pending}>{pending ? "Adding…" : "Add these fixtures"}</button>
    </form>
  );
}
