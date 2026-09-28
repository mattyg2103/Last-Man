"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function GameSubNav({ gameId }: { gameId: string }) {
  const pathname = usePathname();
  const tabs = [
    { href: `/games/${gameId}`, label: "Overview" },
    { href: `/games/${gameId}/select`, label: "This round" },
    { href: `/games/${gameId}/picks`, label: "My picks" },
    { href: `/games/${gameId}/fixtures`, label: "Fixtures & results" },
    { href: `/games/${gameId}/leaderboard`, label: "Leaderboard" },
    { href: `/games/${gameId}/rules`, label: "Rules" },
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
