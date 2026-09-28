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

function Logo() {
  return (
    <span className="flex items-center gap-2.5">
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-lime-300 via-emerald-400 to-cyan-400 text-lg shadow-[0_0_20px_-4px_rgba(163,230,53,0.8)]" aria-hidden>
        ⚽
      </span>
      <span className="font-display text-lg font-bold leading-none tracking-tight text-white">
        Football <span className="gradient-text">Eliminator</span>
      </span>
    </span>
  );
}

export default function Nav() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const isAdmin = (session?.user as any)?.role === "ADMIN";
  const links = isAdmin ? adminLinks : customerLinks;

  if (!session) {
    return (
      <nav className="sticky top-0 z-40 border-b border-white/10 bg-ink-900/70 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center px-4">
          <Link href="/"><Logo /></Link>
        </div>
      </nav>
    );
  }

  const linkClass = (href: string) =>
    `rounded-lg px-3 py-2 text-sm font-medium transition ${
      pathname === href ? "bg-white/10 text-white shadow-[inset_0_-2px_0_0_rgba(163,230,53,0.9)]" : "text-slate-300 hover:bg-white/5 hover:text-white"
    }`;

  return (
    <nav className="sticky top-0 z-40 border-b border-white/10 bg-ink-900/70 backdrop-blur-xl">
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex h-16 items-center justify-between">
          <Link href={isAdmin ? "/admin" : "/dashboard"}><Logo /></Link>
          <button
            className="rounded-lg p-2 text-slate-200 hover:bg-white/10 md:hidden"
            aria-label="Toggle menu"
            aria-expanded={open}
            onClick={() => setOpen(!open)}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
            </svg>
          </button>
          <div className="hidden items-center gap-1 md:flex">
            {links.map((l) => (
              <Link key={l.href} href={l.href} className={linkClass(l.href)}>
                {l.label}
              </Link>
            ))}
            <span className="ml-2 flex items-center gap-2 border-l border-white/10 pl-3 text-sm text-slate-400">
              <span className="grid h-7 w-7 place-items-center rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 text-xs font-bold text-white" aria-hidden>
                {session.user?.name?.charAt(0).toUpperCase()}
              </span>
              {session.user?.name}
            </span>
            <button onClick={() => signOut({ callbackUrl: "/login" })} className="btn-secondary ml-2 !py-1.5">
              Log out
            </button>
          </div>
        </div>
        {open && (
          <div className="flex flex-col gap-1 pb-4 md:hidden">
            {links.map((l) => (
              <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className={linkClass(l.href)}>
                {l.label}
              </Link>
            ))}
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-300 hover:bg-white/5 hover:text-white"
            >
              Log out ({session.user?.name})
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
