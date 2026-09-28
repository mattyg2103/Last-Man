"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AdminGameSubNav({ gameId }: { gameId: string }) {
  const pathname = usePathname();
  const base = `/admin/games/${gameId}`;
  const tabs = [
    { href: base, label: "Overview" },
    { href: `${base}/participants`, label: "Participants" },
    { href: `${base}/payments`, label: "Payments" },
    { href: `${base}/rounds`, label: "Rounds & fixtures" },
    { href: `${base}/selections`, label: "Selections" },
    { href: `${base}/missed`, label: "Missed selections" },
    { href: `${base}/results`, label: "Results & elimination" },
    { href: `${base}/rebuys`, label: "Re-buys" },
    { href: `${base}/leaderboard-settings`, label: "Leaderboard controls" },
    { href: `${base}/announcements`, label: "Notifications" },
    { href: `${base}/rules`, label: "Rules" },
    { href: `${base}/export`, label: "Export" },
  ];
  return (
    <div className="mb-6 flex gap-1 overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.04] p-1 backdrop-blur-xl">
      {tabs.map((t) => (
        <Link
          key={t.href}
          href={t.href}
          aria-current={pathname === t.href ? "page" : undefined}
          className={`whitespace-nowrap rounded-xl px-3.5 py-2 text-sm font-semibold transition ${
            pathname === t.href
              ? "bg-lime-400 text-slate-950 shadow-[0_0_20px_-6px_rgba(163,230,53,0.8)]"
              : "text-slate-300 hover:bg-white/10 hover:text-white"
          }`}
        >
          {t.label}
        </Link>
      ))}
    </div>
  );
}
