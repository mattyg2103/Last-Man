import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const PREMIER_LEAGUE_TEAMS = [
  "Arsenal", "Aston Villa", "Bournemouth", "Brentford", "Brighton & Hove Albion",
  "Burnley", "Chelsea", "Crystal Palace", "Everton", "Fulham",
  "Leeds United", "Liverpool", "Manchester City", "Manchester United", "Newcastle United",
  "Nottingham Forest", "Sunderland", "Tottenham Hotspur", "West Ham United", "Wolverhampton Wanderers",
];

const CHAMPIONSHIP_TEAMS = [
  "Birmingham City", "Blackburn Rovers", "Bristol City", "Charlton Athletic", "Coventry City",
  "Derby County", "Hull City", "Ipswich Town", "Leicester City", "Middlesbrough",
  "Millwall", "Norwich City", "Oxford United", "Portsmouth", "Preston North End",
  "Queens Park Rangers", "Sheffield United", "Sheffield Wednesday", "Southampton", "Stoke City",
  "Swansea City", "Watford", "West Bromwich Albion", "Wrexham",
];

function shortName(name: string) {
  return name.split(" ").slice(0, 2).join(" ").slice(0, 12);
}

function nextFriday3pm(fromWeeksAhead = 0): Date {
  const d = new Date();
  const day = d.getDay();
  const diff = (5 - day + 7) % 7 || 7; // next Friday (day 5)
  d.setDate(d.getDate() + diff + fromWeeksAhead * 7);
  d.setHours(15, 0, 0, 0);
  return d;
}

function kickoffOn(date: Date, hour: number, minute = 0): Date {
  const d = new Date(date);
  d.setHours(hour, minute, 0, 0);
  return d;
}

async function main() {
  console.log("Seeding database…");

  // --- Users ---
  const adminPassword = await bcrypt.hash("Admin123!", 10);
  const admin = await prisma.user.upsert({
    where: { email: "admin@footballeliminator.com" },
    update: {},
    create: {
      name: "Competition Administrator",
      email: "admin@footballeliminator.com",
      passwordHash: adminPassword,
      role: "ADMIN",
    },
  });

  const customerPassword = await bcrypt.hash("Passw0rd1!", 10);
  const demoCustomers = await Promise.all(
    [
      ["Alice Johnson", "alice@example.com"],
      ["Bob Williams", "bob@example.com"],
      ["Carol Davies", "carol@example.com"],
      ["David Smith", "david@example.com"],
    ].map(([name, email]) =>
      prisma.user.upsert({
        where: { email },
        update: {},
        create: { name, email, passwordHash: customerPassword, role: "CUSTOMER" },
      })
    )
  );

  // --- Leagues & teams ---
  const premierLeague = await prisma.league.upsert({
    where: { code: "PL" },
    update: {},
    create: { name: "Premier League", code: "PL" },
  });
  const championship = await prisma.league.upsert({
    where: { code: "CHAMP" },
    update: {},
    create: { name: "Championship", code: "CHAMP" },
  });

  for (const [i, name] of PREMIER_LEAGUE_TEAMS.entries()) {
    await prisma.team.upsert({
      where: { leagueId_name: { leagueId: premierLeague.id, name } },
      update: {},
      create: { name, shortName: shortName(name), rank: i + 1, leagueId: premierLeague.id },
    });
  }
  for (const [i, name] of CHAMPIONSHIP_TEAMS.entries()) {
    await prisma.team.upsert({
      where: { leagueId_name: { leagueId: championship.id, name } },
      update: {},
      create: { name, shortName: shortName(name), rank: i + 1, leagueId: championship.id },
    });
  }

  const plTeams = await prisma.team.findMany({ where: { leagueId: premierLeague.id }, orderBy: { rank: "asc" } });
  const champTeams = await prisma.team.findMany({ where: { leagueId: championship.id }, orderBy: { rank: "asc" } });

  // --- Demo game with the default rules template ---
  const existingGame = await prisma.game.findFirst({ where: { name: "Football Eliminator: Last Man Standing" } });
  const game =
    existingGame ??
    (await prisma.game.create({
      data: {
        name: "Football Eliminator: Last Man Standing",
        description:
          "The classic Last Man Standing competition. Pick one team to win each round — get it wrong and you're out. Last person standing wins the pot.",
        entryFeePence: 2000,
        startDate: new Date(),
        status: "ACTIVE",
        createdById: admin.id,
        rules: {
          create: {
            selectionsPerRound: 1,
            teamMustWin: true,
            drawEliminates: true,
            lossEliminates: true,
            freezeUsedTeams: true,
            winningTeamReturns: false,
            allowReBuy: true,
            reBuyRounds: "1",
            reBuyCount: 1,
            reBuyCostPence: 2000,
            reBuyInstructions: "One re-buy is available during round 1, subject to administrator approval. Pay £20 by bank transfer using your full name as the reference.",
            deadlineDay: "FRI",
            deadlineTime: "15:00",
            allowChangeBeforeDeadline: true,
            missedDeadlineAction: "AUTO_ASSIGN",
            defaultTeamStrategy: "LOWEST_ELIGIBLE",
            defaultLeagueAlternate: true,
            postponedHandling:
              "If a fixture is postponed before the first included fixture in the round has kicked off, the affected participant must select a replacement team.",
            selectionsVisibility: "HIDDEN_UNTIL_DEADLINE",
            showEliminatedOnLeaderboard: true,
            paymentInstructions:
              "Please pay your £20 entry fee by bank transfer to the administrator using your full name as the payment reference.",
            freeTextRules:
              "The administrator has final control over fixture eligibility, postponed matches, replacement selections and participant status.",
          },
        },
        gameLeagues: {
          create: [{ leagueId: premierLeague.id }, { leagueId: championship.id }],
        },
      },
    }));

  // --- Entries ---
  const paymentStatuses = ["PAID", "PAID", "NOT_CONFIRMED", "PAID"] as const;
  const entries = [];
  for (const [i, user] of demoCustomers.entries()) {
    const entry = await prisma.entry.upsert({
      where: { gameId_userId: { gameId: game.id, userId: user.id } },
      update: {},
      create: { gameId: game.id, userId: user.id, paymentStatus: paymentStatuses[i] },
    });
    entries.push(entry);
  }

  // --- Round 1: open, with fixtures, deadline next Friday 3pm ---
  const round1Deadline = nextFriday3pm(0);
  const round1 =
    (await prisma.round.findFirst({ where: { gameId: game.id, order: 1 } })) ??
    (await prisma.round.create({
      data: {
        gameId: game.id,
        name: "Round 1",
        gameWeek: 1,
        order: 1,
        opensAt: new Date(),
        deadlineAt: round1Deadline,
        status: "OPEN",
      },
    }));

  const existingFixtures = await prisma.fixture.count({ where: { roundId: round1.id } });
  if (existingFixtures === 0) {
    const plPairs: [number, number][] = [[0, 1], [2, 3], [4, 5], [6, 7], [8, 9]];
    const champPairs: [number, number][] = [[0, 1], [2, 3], [4, 5], [6, 7]];

    for (const [h, a] of plPairs) {
      await prisma.fixture.create({
        data: {
          roundId: round1.id,
          leagueId: premierLeague.id,
          homeTeamId: plTeams[h].id,
          awayTeamId: plTeams[a].id,
          kickoff: kickoffOn(round1Deadline, 15, 0),
          status: "SCHEDULED",
        },
      });
    }
    for (const [h, a] of champPairs) {
      await prisma.fixture.create({
        data: {
          roundId: round1.id,
          leagueId: championship.id,
          homeTeamId: champTeams[h].id,
          awayTeamId: champTeams[a].id,
          kickoff: kickoffOn(round1Deadline, 12, 30),
          status: "SCHEDULED",
        },
      });
    }
  }

  // --- Round 2: scheduled, prepared in advance, no fixtures yet ---
  await prisma.round.upsert({
    where: { gameId_order: { gameId: game.id, order: 2 } },
    update: {},
    create: {
      gameId: game.id,
      name: "Round 2",
      gameWeek: 2,
      order: 2,
      opensAt: new Date(round1Deadline.getTime() + 1000),
      deadlineAt: nextFriday3pm(1),
      status: "SCHEDULED",
    },
  });

  console.log("Seed complete.");
  console.log("Admin login: admin@footballeliminator.com / Admin123!");
  console.log("Customer login: alice@example.com / Passw0rd1! (also bob/carol/david@example.com)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
