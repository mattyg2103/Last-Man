"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useState } from "react";

const customerLinks = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/games", label: "My games" },
  { href: "/notifications", label: "Notifications" },
  { href: "/account", label: "Account" },
  { href: "/help", label: "Help" },
];

const adminLinks = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/games", label: "Games" },
  { href: "/admin/leagues", label: "Leagues & teams" },
  { href: "/admin/audit", label: "Audit history" },
];

export default function Nav() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const isAdmin = (session?.user as any)?.role === "ADMIN";
  const links = isAdmin ? adminLinks : customerLinks;

  if (!session) return null;

  return (
    <nav className="bg-pitch-800 text-white sticky top-0 z-40 shadow-md">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          <Link href={isAdmin ? "/admin" : "/dashboard"} className="font-bold text-lg flex items-center gap-2">
            <span aria-hidden>⚽</span> Football Eliminator
          </Link>
          <button
            className="md:hidden p-2 rounded hover:bg-pitch-700"
            aria-label="Toggle menu"
            onClick={() => setOpen(!open)}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
            </svg>
          </button>
          <div className="hidden md:flex items-center gap-1">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`px-3 py-2 rounded-md text-sm font-medium hover:bg-pitch-700 ${
                  pathname === l.href ? "bg-pitch-700" : ""
                }`}
              >
                {l.label}
              </Link>
            ))}
            <span className="text-sm text-pitch-200 px-2">{session.user?.name}</span>
            <button onClick={() => signOut({ callbackUrl: "/login" })} className="btn-secondary !bg-pitch-800 !text-white !border-pitch-500 hover:!bg-pitch-700">
              Log out
            </button>
          </div>
        </div>
        {open && (
          <div className="md:hidden pb-3 flex flex-col gap-1">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className={`px-3 py-2 rounded-md text-sm font-medium hover:bg-pitch-700 ${
                  pathname === l.href ? "bg-pitch-700" : ""
                }`}
              >
                {l.label}
              </Link>
            ))}
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="text-left px-3 py-2 rounded-md text-sm font-medium hover:bg-pitch-700"
            >
              Log out ({session.user?.name})
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
