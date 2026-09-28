import Link from "next/link";
import { requireUser } from "@/lib/session";

const steps = [
  "Join a game from My games and pay the entry fee directly to your administrator.",
  "Each round, pick one team you think will win — before the Friday 3pm deadline.",
  "Check the details and confirm. Once you've used a team, you can't pick it again.",
  "If your team wins, you're through to the next round. Lose or draw and you're out.",
  "Follow the results and see everyone's picks on the leaderboard.",
];

export default async function WelcomePage() {
  const user = await requireUser();
  const firstName = user.name.split(" ")[0];

  return (
    <div className="mx-auto max-w-4xl">
      <span className="inline-flex items-center gap-2 rounded-full border border-lime-300/30 bg-lime-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-lime-300">
        You&apos;re in
      </span>
      <h1 className="mt-4 font-display text-4xl font-bold tracking-tight text-white">
        Welcome, <span className="gradient-text">{firstName}</span>
      </h1>
      <p className="mt-2 text-lg text-slate-300">Here&apos;s how to play — it takes about a minute.</p>

      <div className="relative mt-6">
        <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-violet-500/30 via-fuchsia-500/10 to-lime-400/25 blur-2xl" aria-hidden />
        <video
          className="relative w-full rounded-2xl border border-white/10 bg-ink-800 shadow-2xl"
          controls
          autoPlay
          muted
          playsInline
          preload="auto"
          poster="/tutorial/poster.jpg"
          aria-describedby="tutorial-steps"
        >
          <source src="/tutorial/how-to-play.mp4" type="video/mp4" />
          <source src="/tutorial/how-to-play.webm" type="video/webm" />
          Your browser can&apos;t play this video — the steps are written out below.
        </video>
      </div>

      <div className="card mt-8">
        <h2 className="section-title">In this video</h2>
        <ol id="tutorial-steps" className="space-y-3">
          {steps.map((s, i) => (
            <li key={s} className="flex gap-3 text-slate-200">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-lime-400 text-sm font-bold text-slate-950" aria-hidden>
                {i + 1}
              </span>
              <span className="pt-0.5">{s}</span>
            </li>
          ))}
        </ol>
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/games" className="btn-primary !px-6 !py-3 text-base">Find a game to join →</Link>
        <Link href="/dashboard" className="btn-secondary !px-6 !py-3 text-base">Go to my dashboard</Link>
      </div>
      <p className="mt-4 text-sm text-slate-400">
        You can watch this again any time from the <Link href="/help" className="text-lime-300 hover:text-lime-200">Help</Link> page.
      </p>
    </div>
  );
}
