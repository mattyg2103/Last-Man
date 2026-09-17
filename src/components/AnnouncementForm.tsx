"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { publishAnnouncement } from "@/lib/actions/admin";

export default function AnnouncementForm({ gameId }: { gameId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.set("gameId", gameId);
    startTransition(async () => {
      const result = await publishAnnouncement(formData);
      setMsg(result.ok ? result.message ?? "Published." : result.error);
      if (result.ok) {
        e.currentTarget.reset();
        router.refresh();
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="card space-y-3">
      <h2 className="section-title !mb-0">Publish an announcement</h2>
      <div>
        <label className="label" htmlFor="title">Title</label>
        <input className="input" id="title" name="title" required />
      </div>
      <div>
        <label className="label" htmlFor="body">Message</label>
        <textarea className="input" id="body" name="body" rows={3} required />
      </div>
      {msg && <p className="text-sm text-pitch-700">{msg}</p>}
      <button className="btn-primary" type="submit" disabled={pending}>Publish to all participants</button>
    </form>
  );
}
