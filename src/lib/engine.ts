import { prisma } from "@/lib/prisma";
import { notify, notifyMany } from "@/lib/notifications";
import { logAudit } from "@/lib/audit";
import { formatDateTime } from "@/lib/format";

/**
 * Core Last Man Standing game engine: eligibility, deadline handling,
 * automatic default-team assignment, and result/elimination processing.
 * Every behaviour here is driven by the per-game GameRule row so that
 * each competition can configure its own variant of the rules.
 */

export type EligibleFixture = {
  fixtureId: string;
  leagueId: string;
  leagueName: string;
  homeTeamId: string;
  homeTeamName: string;
  awayTeamId: string;
  awayTeamName: string;
  kickoff: Date;
  homeEligible: boolean;
  awayEligible: boolean;
};

async function getFrozenTeamIds(entryId: string, gameId: string, currentRoundOrder: number) {
  const rules = await prisma.gameRule.findUnique({ where: { gameId } });
  if (!rules || !rules.freezeUsedTeams) return new Set<string>();

  const priorSelections = await prisma.selection.findMany({
    where: { entryId, round: { order: { lt: currentRoundOrder } } },
    include: { round: true },
  });

  const frozen = new Set<string>();
  for (const sel of priorSelections) {
    if (rules.winningTeamReturns && rules.winningTeamReturnsAfterRounds != null) {
      const gap = currentRoundOrder - sel.round.order;
      if (gap > rules.winningTeamReturnsAfterRounds) continue; // team is available again
    }
    frozen.add(sel.teamId);
  }
  return frozen;
}

export async function getRoundFixturesForEntry(entryId: string, roundId: string): Promise<EligibleFixture[]> {
  const entry = await prisma.entry.findUniqueOrThrow({ where: { id: entryId } });
  const round = await prisma.round.findUniqueOrThrow({ where: { id: roundId } });
  const fixtures = await prisma.fixture.findMany({
    where: { roundId, status: { in: ["SCHEDULED", "IN_PROGRESS", "COMPLETED"] } },
    include: { league: true, homeTeam: true, awayTeam: true },
    orderBy: { kickoff: "asc" },
  });
  const frozen = await getFrozenTeamIds(entry.id, entry.gameId, round.order);

  return fixtures.map((f) => ({
    fixtureId: f.id,
    leagueId: f.leagueId,
    leagueName: f.league.name,
    homeTeamId: f.homeTeamId,
    homeTeamName: f.homeTeam.name,
    awayTeamId: f.awayTeamId,
    awayTeamName: f.awayTeam.name,
    kickoff: f.kickoff,
    homeEligible: !frozen.has(f.homeTeamId),
    awayEligible: !frozen.has(f.awayTeamId),
  }));
}

export async function submitSelection(opts: {
  entryId: string;
  roundId: string;
  teamId: string;
  slot?: number;
  isReplacement?: boolean;
}) {
  const { entryId, roundId, teamId, slot = 0, isReplacement = false } = opts;

  const entry = await prisma.entry.findUniqueOrThrow({ where: { id: entryId }, include: { game: { include: { rules: true } } } });
  const round = await prisma.round.findUniqueOrThrow({ where: { id: roundId } });
  const rules = entry.game.rules;
  if (!rules) throw new Error("Game has no configured rules.");

  if (entry.status !== "ACTIVE" && entry.status !== "REBUY_ELIGIBLE") {
    throw new Error("This entry is not eligible to make a selection.");
  }
  if (round.status !== "OPEN") throw new Error("This round is not open for selections.");
  if (new Date() > round.deadlineAt) throw new Error("The selection deadline for this round has passed.");

  const fixture = await prisma.fixture.findFirst({
    where: { roundId, OR: [{ homeTeamId: teamId }, { awayTeamId: teamId }] },
  });
  if (!fixture) throw new Error("That team does not have an included fixture in this round.");
  if (fixture.status === "POSTPONED" || fixture.status === "CANCELLED") {
    throw new Error("That fixture has been postponed or cancelled. Please choose a different team.");
  }

  const frozen = await getFrozenTeamIds(entryId, entry.gameId, round.order);
  if (frozen.has(teamId)) throw new Error("You have already used that team and it is not available again.");

  const existing = await prisma.selection.findUnique({ where: { entryId_roundId_slot: { entryId, roundId, slot } } });
  if (existing && !rules.allowChangeBeforeDeadline) {
    throw new Error("This game's rules do not allow changing a selection once submitted.");
  }

  const selection = existing
    ? await prisma.selection.update({
        where: { id: existing.id },
        data: { teamId, fixtureId: fixture.id, isAutomatic: false, isReplacement, submittedAt: new Date() },
      })
    : await prisma.selection.create({
        data: { entryId, roundId, teamId, fixtureId: fixture.id, slot, isReplacement },
      });

  await notify(
    entry.userId,
    "SELECTION_CONFIRMATION",
    `Your selection for ${round.name} has been confirmed. Deadline was ${formatDateTime(round.deadlineAt)}.`,
    entry.gameId
  );

  return selection;
}

/** Picks the lowest-ranked eligible team for a participant who missed the deadline. */
async function pickDefaultTeam(entryId: string, gameId: string, round: { id: string; order: number }) {
  const rules = await prisma.gameRule.findUniqueOrThrow({ where: { gameId } });
  const permittedLeagues = await prisma.gameLeague.findMany({ where: { gameId }, include: { league: true }, orderBy: { league: { name: "asc" } } });
  if (permittedLeagues.length === 0) return null;

  let orderedLeagueIds = permittedLeagues.map((pl) => pl.leagueId);
  if (rules.defaultLeagueAlternate && permittedLeagues.length > 1) {
    const startIndex = round.order % permittedLeagues.length;
    orderedLeagueIds = [...orderedLeagueIds.slice(startIndex), ...orderedLeagueIds.slice(0, startIndex)];
  }

  const frozen = await getFrozenTeamIds(entryId, gameId, round.order);
  const fixtures = await prisma.fixture.findMany({
    where: { roundId: round.id, status: { in: ["SCHEDULED", "IN_PROGRESS", "COMPLETED"] } },
    include: { homeTeam: true, awayTeam: true },
  });

  for (const leagueId of orderedLeagueIds) {
    const candidates: { teamId: string; fixtureId: string; rank: number }[] = [];
    for (const f of fixtures) {
      if (f.leagueId !== leagueId) continue;
      if (!frozen.has(f.homeTeamId)) candidates.push({ teamId: f.homeTeamId, fixtureId: f.id, rank: f.homeTeam.rank });
      if (!frozen.has(f.awayTeamId)) candidates.push({ teamId: f.awayTeamId, fixtureId: f.id, rank: f.awayTeam.rank });
    }
    if (candidates.length > 0) {
      candidates.sort((a, b) => b.rank - a.rank); // lowest-placed team = highest rank number
      return candidates[0];
    }
  }
  return null;
}

/** Assigns default teams to every active entry that missed the round deadline. */
export async function processMissedDeadlines(roundId: string, actorId: string) {
  const round = await prisma.round.findUniqueOrThrow({ where: { id: roundId }, include: { game: { include: { rules: true } } } });
  const rules = round.game.rules;
  if (!rules) return { assigned: 0, skipped: 0 };
  if (rules.missedDeadlineAction === "NONE") return { assigned: 0, skipped: 0 };

  const entries = await prisma.entry.findMany({
    where: { gameId: round.gameId, status: { in: ["ACTIVE", "REBUY_ELIGIBLE"] } },
    include: { selections: { where: { roundId } } },
  });

  let assigned = 0;
  let skipped = 0;

  for (const entry of entries) {
    if (entry.selections.length > 0) continue; // already submitted

    if (rules.missedDeadlineAction === "ELIMINATE") {
      await prisma.entry.update({ where: { id: entry.id }, data: { status: "ELIMINATED", eliminatedRoundId: roundId } });
      await notify(entry.userId, "ELIMINATED", `You missed the deadline for ${round.name} and have been eliminated.`, round.gameId);
      skipped++;
      continue;
    }

    const pick = await pickDefaultTeam(entry.id, round.gameId, round);
    if (!pick) {
      skipped++;
      continue;
    }
    await prisma.selection.create({
      data: { entryId: entry.id, roundId, teamId: pick.teamId, fixtureId: pick.fixtureId, isAutomatic: true },
    });
    await notify(
      entry.userId,
      "AUTO_ASSIGNMENT",
      `You missed the deadline for ${round.name}, so a default team was automatically selected for you.`,
      round.gameId
    );
    assigned++;
  }

  await logAudit(actorId, "PROCESS_MISSED_DEADLINES", { gameId: round.gameId, details: `Round ${round.name}: ${assigned} auto-assigned, ${skipped} skipped/eliminated.` });
  return { assigned, skipped };
}

/** Processes results for a round: sets selection outcomes and applies elimination rules. */
export async function processRoundResults(roundId: string, actorId: string) {
  const round = await prisma.round.findUniqueOrThrow({ where: { id: roundId }, include: { game: { include: { rules: true } } } });
  const rules = round.game.rules;
  if (!rules) throw new Error("Game has no configured rules.");

  const selections = await prisma.selection.findMany({
    where: { roundId },
    include: { fixture: true, entry: true },
  });

  let eliminated = 0;
  let survived = 0;

  for (const sel of selections) {
    if (sel.entry.status === "ELIMINATED" || sel.entry.status === "WINNER") continue;
    const fixture = sel.fixture;

    if (fixture.status === "POSTPONED" || fixture.status === "CANCELLED" || fixture.status === "ABANDONED") {
      await prisma.selection.update({ where: { id: sel.id }, data: { outcome: "VOID" } });
      continue;
    }
    if (fixture.status !== "COMPLETED" || !fixture.result) continue;

    const isHome = sel.teamId === fixture.homeTeamId;
    const outcome =
      fixture.result === "DRAW"
        ? "DRAW"
        : (isHome && fixture.result === "HOME") || (!isHome && fixture.result === "AWAY")
        ? "WIN"
        : "LOSS";

    await prisma.selection.update({ where: { id: sel.id }, data: { outcome } });

    let eliminate = false;
    if (outcome === "LOSS") eliminate = rules.lossEliminates;
    if (outcome === "DRAW") eliminate = rules.drawEliminates;

    if (eliminate) {
      const canReBuy =
        rules.allowReBuy &&
        entryReBuyRoundAllowed(rules.reBuyRounds, round.order) &&
        sel.entry.reBuysUsed < rules.reBuyCount;

      if (canReBuy) {
        await prisma.entry.update({ where: { id: sel.entry.id }, data: { status: "REBUY_ELIGIBLE", eliminatedRoundId: roundId } });
        await notify(
          sel.entry.userId,
          "ELIMINATED",
          `Your team lost in ${round.name}. You are eligible for a re-buy to continue playing.`,
          round.gameId
        );
      } else {
        await prisma.entry.update({ where: { id: sel.entry.id }, data: { status: "ELIMINATED", eliminatedRoundId: roundId } });
        await notify(sel.entry.userId, "ELIMINATED", `Your team did not win in ${round.name}. You have been eliminated.`, round.gameId);
      }
      eliminated++;
    } else {
      await notify(sel.entry.userId, "PROGRESSED", `Your team won in ${round.name}. You progress to the next round.`, round.gameId);
      survived++;
    }
  }

  await prisma.round.update({ where: { id: roundId }, data: { status: "COMPLETED" } });

  // Check for an outright winner.
  const remaining = await prisma.entry.findMany({ where: { gameId: round.gameId, status: { in: ["ACTIVE", "REBUY_ELIGIBLE"] } } });
  if (remaining.length === 1) {
    const winner = remaining[0];
    await prisma.entry.update({ where: { id: winner.id }, data: { status: "WINNER" } });
    await prisma.game.update({ where: { id: round.gameId }, data: { status: "COMPLETED" } });
    await notify(winner.userId, "GAME_WINNER", `Congratulations — you are the last one standing and have won the game!`, round.gameId);
  } else if (remaining.length === 0) {
    await prisma.game.update({ where: { id: round.gameId }, data: { status: "COMPLETED" } });
  }

  await logAudit(actorId, "PROCESS_ROUND_RESULTS", { gameId: round.gameId, details: `Round ${round.name}: ${eliminated} eliminated, ${survived} progressed.` });
  return { eliminated, survived };
}

function entryReBuyRoundAllowed(reBuyRounds: string, roundOrder: number): boolean {
  const allowed = reBuyRounds.split(",").map((s) => parseInt(s.trim(), 10)).filter((n) => !Number.isNaN(n));
  return allowed.includes(roundOrder);
}

export async function useReBuy(entryId: string, roundId: string, actorId: string) {
  const entry = await prisma.entry.findUniqueOrThrow({ where: { id: entryId }, include: { game: { include: { rules: true } } } });
  const rules = entry.game.rules;
  if (!rules?.allowReBuy) throw new Error("Re-buys are not permitted in this game.");
  if (entry.status !== "REBUY_ELIGIBLE") throw new Error("This entry is not currently eligible for a re-buy.");
  if (entry.reBuysUsed >= rules.reBuyCount) throw new Error("The maximum number of re-buys has already been used.");

  await prisma.reBuyRequest.create({ data: { entryId, roundId, costPence: rules.reBuyCostPence, status: "APPROVED", decidedAt: new Date() } });
  await prisma.entry.update({ where: { id: entryId }, data: { status: "ACTIVE", reBuysUsed: { increment: 1 } } });
  await logAudit(actorId, "REBUY_APPROVED", { gameId: entry.gameId, details: `Entry ${entryId} re-bought into the game.` });
  await notify(entry.userId, "REBUY_AVAILABLE", "Your re-buy has been confirmed. You are back in the game.", entry.gameId);
}
