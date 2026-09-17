"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createRound } from "@/lib/actions/admin";

export default function CreateRoundForm({ gameId, nextOrder }: { gameId: string; nextOrder: number }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.set("gameId", gameId);
    startTransition(async () => {
      const result = await createRound(formData);
      setMsg(result.ok ? result.message ?? "Created." : result.error);
      if (result.ok) {
        e.currentTarget.reset();
        router.refresh();
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="card grid sm:grid-cols-2 md:grid-cols-5 gap-3 items-end">
      <div>
        <label className="label" htmlFor="name">Round name</label>
        <input className="input" id="name" name="name" required defaultValue={`Round ${nextOrder}`} />
      </div>
      <div>
        <label className="label" htmlFor="gameWeek">Game week</label>
        <input className="input" id="gameWeek" name="gameWeek" type="number" defaultValue={nextOrder} required />
      </div>
      <div>
        <label className="label" htmlFor="order">Order</label>
        <input className="input" id="order" name="order" type="number" defaultValue={nextOrder} required />
      </div>
      <div>
        <label className="label" htmlFor="opensAt">Opens</label>
        <input className="input" id="opensAt" name="opensAt" type="datetime-local" />
      </div>
      <div>
        <label className="label" htmlFor="deadlineAt">Deadline</label>
        <input className="input" id="deadlineAt" name="deadlineAt" type="datetime-local" required />
      </div>
      <button className="btn-primary col-span-full sm:col-span-1" type="submit" disabled={pending}>Create round</button>
      {msg && <span className="text-sm text-gray-600 col-span-full">{msg}</span>}
    </form>
  );
}
