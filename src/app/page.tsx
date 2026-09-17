import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import LoginForm from "@/components/LoginForm";

export default async function HomePage() {
  const session = await getSession();
  if (session?.user) {
    redirect(session.user.role === "ADMIN" ? "/admin" : "/dashboard");
  }

  return (
    <div className="grid md:grid-cols-2 gap-10 items-center py-8">
      <div>
        <p className="text-accent-600 font-semibold mb-2">⚽ Last Man Standing</p>
        <h1 className="text-4xl font-extrabold text-gray-900 mb-4">Football Eliminator</h1>
        <p className="text-gray-600 mb-6">
          Pick a winning team every round. Get it wrong and you&apos;re out. Play across the
          Premier League and Championship in games run by your own administrator — accessible
          from any phone, tablet or computer, no app download required.
        </p>
        <ul className="space-y-2 text-sm text-gray-700 mb-6">
          <li>✔ Join multiple games at once</li>
          <li>✔ Submit your weekly selection before the deadline</li>
          <li>✔ Track results, eliminations and the leaderboard live</li>
          <li>✔ Entry fees and payments are handled directly with your administrator</li>
        </ul>
        <p className="text-sm text-gray-500">
          New here? <Link href="/register" className="text-pitch-700 font-semibold underline">Create an account</Link>
        </p>
      </div>
      <div className="card max-w-sm w-full mx-auto">
        <h2 className="section-title">Log in</h2>
        <LoginForm />
      </div>
    </div>
  );
}
