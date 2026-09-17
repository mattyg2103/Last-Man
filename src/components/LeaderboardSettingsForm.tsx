"use client";
import { useState, useTransition } from "react";
import { updateLeaderboardSettings } from "@/lib/actions/admin";

export default function LeaderboardSettingsForm({
  gameId, selectionsVisibility, showEliminatedOnLeaderboard,
}: { gameId: string; selectionsVisibility: string; showEliminatedOnLeaderboard: boolean }) {
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.set("gameId", gameId);
    startTransition(async () => {
      const result = await updateLeaderboardSettings(formData);
      setMsg(result.ok ? result.message ?? "Saved." : result.error);
    });
  }

  return (
    <form onSubmit={onSubmit} className="card space-y-4 max-w-lg">
      <div>
        <label className="label" htmlFor="selectionsVisibility">When are current-round selections visible to other participants?</label>
        <select className="input" id="selectionsVisibility" name="selectionsVisibility" defaultValue={selectionsVisibility}>
          <option value="IMMEDIATE">Visible immediately</option>
          <option value="HIDDEN_UNTIL_DEADLINE">Hidden until the deadline</option>
          <option value="HIDDEN_UNTIL_KICKOFF">Hidden until fixtures have started</option>
        </select>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="showEliminatedOnLeaderboard" defaultChecked={showEliminatedOnLeaderboard} />
        Keep eliminated participants visible on the leaderboard
      </label>
      {msg && <p className="text-sm text-pitch-700">{msg}</p>}
      <button className="btn-primary" type="submit" disabled={pending}>Save</button>
    </form>
  );
}
