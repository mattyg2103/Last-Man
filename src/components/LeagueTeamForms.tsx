"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createLeague, createTeam, updateTeamRank } from "@/lib/actions/admin";

type League = { id: string; name: string; code: string; teams: { id: string; name: string; rank: number }[] };

export function CreateLeagueForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await createLeague(formData);
      setMsg(result.ok ? result.message ?? "Created." : result.error);
      if (result.ok) {
        e.currentTarget.reset();
        router.refresh();
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="card flex flex-wrap items-end gap-3">
      <div>
        <label className="label" htmlFor="name">League name</label>
        <input className="input" id="name" name="name" required placeholder="e.g. League One" />
      </div>
      <div>
        <label className="label" htmlFor="code">Code</label>
        <input className="input" id="code" name="code" required placeholder="e.g. L1" maxLength={10} />
      </div>
      <button className="btn-primary" type="submit" disabled={pending}>Add league</button>
      {msg && <span className="text-sm text-gray-600">{msg}</span>}
    </form>
  );
}

export function AddTeamForm({ leagueId }: { leagueId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.set("leagueId", leagueId);
    startTransition(async () => {
      await createTeam(formData);
      e.currentTarget.reset();
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-wrap items-end gap-2 text-sm">
      <input className="input !py-1" name="name" placeholder="Team name" required />
      <input className="input !py-1 w-20" name="rank" type="number" placeholder="Rank" defaultValue={99} />
      <button className="btn-secondary !py-1" type="submit" disabled={pending}>Add team</button>
    </form>
  );
}

export function TeamRankInput({ teamId, rank }: { teamId: string; rank: number }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function onBlur(e: React.FocusEvent<HTMLInputElement>) {
    const formData = new FormData();
    formData.set("teamId", teamId);
    formData.set("rank", e.target.value);
    startTransition(async () => {
      await updateTeamRank(formData);
      router.refresh();
    });
  }

  return <input className="input !py-1 w-16" type="number" defaultValue={rank} onBlur={onBlur} disabled={pending} aria-label="Team rank" />;
}
