"use client";
import { useState, useTransition } from "react";
import { contactAdmin } from "@/lib/actions/customer";

export default function ContactForm({ games }: { games: { id: string; name: string }[] }) {
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await contactAdmin(formData);
      setMsg({ ok: result.ok, text: result.ok ? result.message ?? "Sent." : result.error });
      if (result.ok) e.currentTarget.reset();
    });
  }

  return (
    <form onSubmit={onSubmit} className="card space-y-3">
      <h2 className="section-title !mb-0">Contact the administrator</h2>
      {games.length > 0 && (
        <div>
          <label className="label" htmlFor="gameId">Which game is this about?</label>
          <select className="input" id="gameId" name="gameId">
            <option value="">General enquiry</option>
            {games.map((g) => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
        </div>
      )}
      <div>
        <label className="label" htmlFor="message">Message</label>
        <textarea className="input" id="message" name="message" rows={4} required />
      </div>
      {msg && <p className={msg.ok ? "text-pitch-700 text-sm" : "text-red-600 text-sm"}>{msg.text}</p>}
      <button className="btn-primary" type="submit" disabled={pending}>Send message</button>
    </form>
  );
}
