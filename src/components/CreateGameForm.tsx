"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createGame } from "@/lib/actions/admin";

export default function CreateGameForm({ leagues }: { leagues: { id: string; name: string }[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await createGame(formData);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.push(`/admin/games/${result.gameId}`);
    });
  }

  const today = new Date().toISOString().slice(0, 10);

  return (
    <form onSubmit={onSubmit} className="card space-y-4 max-w-xl">
      {error && <div role="alert" className="badge-warning block w-fit">{error}</div>}
      <div>
        <label className="label" htmlFor="name">Game name</label>
        <input className="input" id="name" name="name" defaultValue="Football Eliminator: Last Man Standing" required />
      </div>
      <div>
        <label className="label" htmlFor="description">Description</label>
        <textarea className="input" id="description" name="description" rows={3} defaultValue="Pick one team to win each round — get it wrong and you're out." />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label" htmlFor="entryFeePounds">Entry fee (£)</label>
          <input className="input" id="entryFeePounds" name="entryFeePounds" type="number" step="0.01" min="0" defaultValue={20} required />
        </div>
        <div>
          <label className="label" htmlFor="startDate">Start date</label>
          <input className="input" id="startDate" name="startDate" type="date" defaultValue={today} required />
        </div>
      </div>
      <div>
        <span className="label">Leagues</span>
        <div className="flex flex-wrap gap-3">
          {leagues.map((l) => (
            <label key={l.id} className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="leagueIds" value={l.id} defaultChecked />
              {l.name}
            </label>
          ))}
        </div>
      </div>
      <p className="text-xs text-gray-500">
        The game is created with the default rules template (weekly deadline Friday 3pm, one re-buy in round 1 at
        the entry fee cost, frozen used teams). You can customise every rule afterwards on the game&apos;s Rules page.
      </p>
      <button className="btn-primary" type="submit" disabled={pending}>{pending ? "Creating…" : "Create game"}</button>
    </form>
  );
}
