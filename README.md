# Football Eliminator: Last Man Standing

A responsive website for running multiple Last Man Standing football competitions, accessed
through a URL (no app store download required). Administrators create and configure games;
participants join, submit weekly team selections, and follow results and the leaderboard.

Entry fees and payments are tracked for reference only — this website never collects card or
bank details and never connects to a payment gateway. Payment is arranged directly between
participants and the administrator.

## Tech stack

- **Next.js 16** (App Router, Server Actions, Turbopack) + TypeScript
- **Prisma** with SQLite (swap the `DATABASE_URL` in `.env` for Postgres/MySQL in production)
- **NextAuth** (credentials login, JWT sessions, role-based middleware)
- **Tailwind CSS** for a responsive, mobile-first, football-themed UI

## Getting started

```bash
npm install
cp .env.example .env        # edit NEXTAUTH_SECRET for anything beyond local dev
npm run db:push             # create the SQLite database from the Prisma schema
npm run db:seed             # demo admin, customers, leagues, teams, a sample game and Round 1
npm run dev                 # http://localhost:3000
```

Demo accounts created by the seed script:

| Role | Email | Password |
| --- | --- | --- |
| Administrator | `admin@footballeliminator.com` | `Admin123!` |
| Customer | `alice@example.com` (also `bob`/`carol`/`david@example.com`) | `Passw0rd1!` |

`npm run db:reset` wipes and re-seeds the database if you want to start over.

## Project structure

- `prisma/schema.prisma` — data model (users, games, rules, leagues/teams, rounds, fixtures,
  entries, selections, re-buys, notifications, announcements, audit log).
- `src/lib/engine.ts` — the Last Man Standing rules engine: eligibility, freezing used teams,
  automatic default-team assignment for missed deadlines, and result/elimination processing.
- `src/lib/actions/customer.ts`, `src/lib/actions/admin.ts` — server actions used by the pages.
- `src/app/(customer pages)` — home/login, register, dashboard, my games, game overview, round
  selection, previous picks, fixtures & results, leaderboard, rules, notifications, account,
  help.
- `src/app/admin/**` — administrator dashboard, game creation/management, participants,
  payment tracking, league & team management, round/fixture management, selection monitoring,
  missed selections, results & elimination, re-buy management, leaderboard controls,
  notification management, configurable game rules, CSV export, audit history.

## Notes on scope

- Game rules (deadline day/time, re-use of teams, re-buys, missed-deadline handling, default
  team strategy, postponed-fixture handling, leaderboard visibility, free-text rules, etc.) are
  fully configurable per game from **Admin → a game → Rules**, starting from the default
  template described in the brief (Friday 3pm deadline, one £20 re-buy in round 1, frozen used
  teams).
- Fixtures and results are entered manually by the administrator. The data model (a `Fixture`
  with its own league, teams and kick-off) is deliberately shaped so a licensed football data
  API could populate it automatically in future without changing the rest of the app.
- Reminders and announcements are sent on demand from the admin UI (there is no background
  scheduler in this build); the data model supports adding scheduled jobs later.
- All dates/times are displayed in UK format and the `Europe/London` time zone throughout.
