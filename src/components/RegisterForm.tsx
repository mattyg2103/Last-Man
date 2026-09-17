"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { registerUser } from "@/lib/actions/auth";

export default function RegisterForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const form = new FormData(e.currentTarget);
    const result = await registerUser(form);
    if (!result.ok) {
      setLoading(false);
      setError(result.error);
      return;
    }
    const res = await signIn("credentials", {
      email: form.get("email"),
      password: form.get("password"),
      redirect: false,
    });
    setLoading(false);
    if (res?.error) {
      setError("Account created, but automatic log in failed. Please log in manually.");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" aria-label="Create account">
      {error && (
        <div role="alert" className="badge-warning w-full block text-left">
          {error}
        </div>
      )}
      <div>
        <label className="label" htmlFor="name">Full name</label>
        <input className="input" id="name" name="name" type="text" required autoComplete="name" />
        <p className="text-xs text-gray-500 mt-1">Use your full name — administrators use this to match payment references.</p>
      </div>
      <div>
        <label className="label" htmlFor="email">Email address</label>
        <input className="input" id="email" name="email" type="email" required autoComplete="email" />
      </div>
      <div>
        <label className="label" htmlFor="password">Password</label>
        <input className="input" id="password" name="password" type="password" required minLength={8} autoComplete="new-password" />
        <p className="text-xs text-gray-500 mt-1">At least 8 characters.</p>
      </div>
      <button className="btn-primary w-full" type="submit" disabled={loading}>
        {loading ? "Creating account…" : "Create account"}
      </button>
    </form>
  );
}
