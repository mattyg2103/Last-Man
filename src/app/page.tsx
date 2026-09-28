import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import LoginForm from "@/components/LoginForm";

const features = [
  { icon: "🏟️", title: "Multiple games", text: "Join as many competitions as you like." },
  { icon: "⏱️", title: "Friday 3pm deadline", text: "Lock in your pick before the weekend kicks off." },
  { icon: "📊", title: "Live picks table", text: "See who picked what and who's still standing." },
  { icon: "🔒", title: "No card details", text: "Entry fees are sorted directly with your admin." },
];

export default async function HomePage() {
  const session = await getSession();
  if (session?.user) {
    redirect(session.user.role === "ADMIN" ? "/admin" : "/dashboard");
  }

  return (
    <div className="grid items-center gap-12 py-6 md:grid-cols-[1.15fr_1fr] md:py-12">
      <div>
        <span className="inline-flex items-center gap-2 rounded-full border border-lime-300/30 bg-lime-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-lime-300">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-lime-300" aria-hidden />
          Last Man Standing
        </span>
        <h1 className="mt-5 font-display text-5xl font-bold leading-[1.05] tracking-tight text-white md:text-6xl">
          One pick.<br />
          <span className="gradient-text">No second chances.</span>
        </h1>
        <p className="mt-5 max-w-xl text-lg text-slate-300">
          Pick a team to win every round across the Premier League and Championship. Get it wrong and you&apos;re out —
          last one standing takes the pot. Works on any phone, tablet or computer, no app needed.
        </p>

        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          {features.map((f) => (
            <div key={f.title} className="flex gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <span className="text-2xl" aria-hidden>{f.icon}</span>
              <div>
                <p className="font-semibold text-white">{f.title}</p>
                <p className="text-sm text-slate-400">{f.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="relative mx-auto w-full max-w-sm">
        <div className="absolute -inset-6 rounded-[2rem] bg-gradient-to-br from-violet-500/40 via-fuchsia-500/20 to-lime-400/30 blur-2xl" aria-hidden />
        <div className="card relative !p-7">
          <h2 className="font-display text-2xl font-bold text-white">Welcome back</h2>
          <p className="mb-5 mt-1 text-sm text-slate-400">Log in to make this week&apos;s pick.</p>
          <LoginForm />
          <p className="mt-5 text-center text-sm text-slate-400">
            New here?{" "}
            <Link href="/register" className="font-semibold text-lime-300 hover:text-lime-200">
              Create an account →
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
