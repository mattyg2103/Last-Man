"use client";
import { useState, useTransition } from "react";
import { updateGameDetails, updateGameStatus } from "@/lib/actions/admin";

type Game = {
  id: string;
  name: string;
  description: string;
  entryFeePence: number;
  startDate: string;
  status: string;
};

export default function EditGameForm({ game, leagues, selectedLeagueIds }: { game: Game; leagues: { id: string; name: string }[]; selectedLeagueIds: string[] }) {
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [statusPending, startStatusTransition] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.set("gameId", game.id);
    startTransition(async () => {
      const result = await updateGameDetails(formData);
      setMsg({ ok: result.ok, text: result.ok ? result.message ?? "Saved." : result.error });
    });
  }

  function changeStatus(status: string) {
    const formData = new FormData();
    formData.set("gameId", game.id);
    formData.set("status", status);
    startStatusTransition(async () => {
      await updateGameStatus(formData);
    });
  }

  return (
    <div className="space-y-4">
      <div className="card">
        <p className="label">Game status</p>
        <div className="flex flex-wrap gap-2">
          {["OPEN", "ACTIVE", "PAUSED", "COMPLETED", "ARCHIVED"].map((s) => (
            <button
              key={s}
              onClick={() => changeStatus(s)}
              disabled={statusPending}
              className={game.status === s ? "btn-primary" : "btn-secondary"}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={onSubmit} className="card space-y-4">
        {msg && <p className={msg.ok ? "text-pitch-700 text-sm" : "text-red-600 text-sm"}>{msg.text}</p>}
        <div>
          <label className="label" htmlFor="name">Game name</label>
          <input className="input" id="name" name="name" defaultValue={game.name} required />
        </div>
        <div>
          <label className="label" htmlFor="description">Description</label>
          <textarea className="input" id="description" name="description" rows={3} defaultValue={game.description} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label" htmlFor="entryFeePounds">Entry fee (£)</label>
            <input className="input" id="entryFeePounds" name="entryFeePounds" type="number" step="0.01" min="0" defaultValue={(game.entryFeePence / 100).toFixed(2)} required />
          </div>
          <div>
            <label className="label" htmlFor="startDate">Start date</label>
            <input className="input" id="startDate" name="startDate" type="date" defaultValue={game.startDate.slice(0, 10)} required />
          </div>
        </div>
        <div>
          <span className="label">Leagues</span>
          <div className="flex flex-wrap gap-3">
            {leagues.map((l) => (
              <label key={l.id} className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="leagueIds" value={l.id} defaultChecked={selectedLeagueIds.includes(l.id)} />
                {l.name}
              </label>
            ))}
          </div>
        </div>
        <button className="btn-primary" type="submit" disabled={pending}>{pending ? "Saving…" : "Save changes"}</button>
      </form>
    </div>
  );
}
