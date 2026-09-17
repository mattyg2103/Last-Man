"use client";
import { useState, useTransition } from "react";
import { updateAccountName, changePassword } from "@/lib/actions/customer";

export default function AccountForms({ name, email }: { name: string; email: string }) {
  const [pending, startTransition] = useTransition();
  const [nameMsg, setNameMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pwMsg, setPwMsg] = useState<{ ok: boolean; text: string } | null>(null);

  function onNameSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await updateAccountName(formData);
      setNameMsg({ ok: result.ok, text: result.ok ? result.message ?? "Saved." : result.error });
    });
  }

  function onPwSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await changePassword(formData);
      setPwMsg({ ok: result.ok, text: result.ok ? result.message ?? "Password changed." : result.error });
      if (result.ok) e.currentTarget.reset();
    });
  }

  return (
    <div className="space-y-6">
      <form onSubmit={onNameSubmit} className="card space-y-3">
        <h2 className="section-title !mb-0">Your details</h2>
        <div>
          <label className="label" htmlFor="email">Email address</label>
          <input className="input bg-gray-50" id="email" value={email} disabled />
        </div>
        <div>
          <label className="label" htmlFor="name">Full name</label>
          <input className="input" id="name" name="name" defaultValue={name} required />
        </div>
        {nameMsg && <p className={nameMsg.ok ? "text-pitch-700 text-sm" : "text-red-600 text-sm"}>{nameMsg.text}</p>}
        <button className="btn-primary" type="submit" disabled={pending}>Save details</button>
      </form>

      <form onSubmit={onPwSubmit} className="card space-y-3">
        <h2 className="section-title !mb-0">Change password</h2>
        <div>
          <label className="label" htmlFor="currentPassword">Current password</label>
          <input className="input" id="currentPassword" name="currentPassword" type="password" required autoComplete="current-password" />
        </div>
        <div>
          <label className="label" htmlFor="newPassword">New password</label>
          <input className="input" id="newPassword" name="newPassword" type="password" required minLength={8} autoComplete="new-password" />
        </div>
        {pwMsg && <p className={pwMsg.ok ? "text-pitch-700 text-sm" : "text-red-600 text-sm"}>{pwMsg.text}</p>}
        <button className="btn-primary" type="submit" disabled={pending}>Change password</button>
      </form>
    </div>
  );
}
