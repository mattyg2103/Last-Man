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
    <div className="flex gap-1 overflow-x-auto border-b border-gray-200 mb-5 -mx-1 px-1">
      {tabs.map((t) => (
        <Link
          key={t.href}
          href={t.href}
          className={`px-3 py-2 text-sm font-medium whitespace-nowrap border-b-2 ${
            pathname === t.href ? "border-pitch-600 text-pitch-700" : "border-transparent text-gray-500 hover:text-gray-800"
          }`}
        >
          {t.label}
        </Link>
      ))}
    </div>
  );
}
