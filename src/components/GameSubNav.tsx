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
