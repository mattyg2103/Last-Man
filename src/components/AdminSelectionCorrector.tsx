"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { adminCorrectSelection } from "@/lib/actions/admin";

export default function AdminSelectionCorrector({
  entryId, roundId, teams,
}: { entryId: string; roundId: string; teams: { id: string; name: string }[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.set("entryId", entryId);
    formData.set("roundId", roundId);
    startTransition(async () => {
      const result = await adminCorrectSelection(formData);
      setMsg(result.ok ? "Corrected" : result.error);
      if (result.ok) router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="flex items-center gap-2">
      <select name="teamId" className="input !py-1 !text-xs w-auto" required defaultValue="">
        <option value="" disabled>Correct to…</option>
        {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
      </select>
      <button className="btn-ghost !py-1 text-xs" type="submit" disabled={pending}>Apply</button>
      {msg && <span className="text-xs text-gray-500">{msg}</span>}
    </form>
  );
}
