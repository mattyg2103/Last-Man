"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addParticipant } from "@/lib/actions/admin";

export default function AddParticipantForm({ gameId }: { gameId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await addParticipant(formData);
      setMsg({ ok: result.ok, text: result.ok ? result.message ?? "Added." : result.error });
      if (result.ok) {
        e.currentTarget.reset();
        router.refresh();
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="card flex flex-wrap items-end gap-3">
      <input type="hidden" name="gameId" value={gameId} />
      <div className="flex-1 min-w-[220px]">
        <label className="label" htmlFor="email">Add participant by email</label>
        <input className="input" id="email" name="email" type="email" required placeholder="participant@example.com" />
        <p className="text-xs text-gray-500 mt-1">They must already have an account on the website.</p>
      </div>
      <button className="btn-primary" type="submit" disabled={pending}>{pending ? "Adding…" : "Add participant"}</button>
      {msg && <p className={`w-full text-sm ${msg.ok ? "text-pitch-700" : "text-red-600"}`}>{msg.text}</p>}
    </form>
  );
}
