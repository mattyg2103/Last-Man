"use client";
import { useState, useTransition } from "react";
import { updateGameRules } from "@/lib/actions/admin";

type Rules = {
  selectionsPerRound: number;
  teamMustWin: boolean;
  drawEliminates: boolean;
  lossEliminates: boolean;
  freezeUsedTeams: boolean;
  winningTeamReturns: boolean;
  winningTeamReturnsAfterRounds: number | null;
  allowReBuy: boolean;
  reBuyRounds: string;
  reBuyCount: number;
  reBuyCostPence: number;
  reBuyInstructions: string;
  deadlineDay: string;
  deadlineTime: string;
  allowChangeBeforeDeadline: boolean;
  missedDeadlineAction: string;
  defaultTeamStrategy: string;
  defaultLeagueAlternate: boolean;
  postponedHandling: string;
  selectionsVisibility: string;
  showEliminatedOnLeaderboard: boolean;
  paymentInstructions: string;
  freeTextRules: string;
};

const days = [
  ["MON", "Monday"], ["TUE", "Tuesday"], ["WED", "Wednesday"], ["THU", "Thursday"],
  ["FRI", "Friday"], ["SAT", "Saturday"], ["SUN", "Sunday"],
];

export default function GameRulesForm({ gameId, rules }: { gameId: string; rules: Rules }) {
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const [winningReturns, setWinningReturns] = useState(rules.winningTeamReturns);
  const [allowReBuy, setAllowReBuy] = useState(rules.allowReBuy);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.set("gameId", gameId);
    startTransition(async () => {
      const result = await updateGameRules(formData);
      setMsg(result.ok ? result.message ?? "Saved." : result.error);
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {msg && <p className="text-sm text-pitch-700">{msg}</p>}

      <fieldset className="card space-y-3">
        <legend className="section-title !mb-1">Selections</legend>
        <div>
          <label className="label" htmlFor="selectionsPerRound">Team selections required per round</label>
          <input className="input w-24" id="selectionsPerRound" name="selectionsPerRound" type="number" min={1} defaultValue={rules.selectionsPerRound} />
        </div>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="teamMustWin" defaultChecked={rules.teamMustWin} /> Selected team must win to continue</label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="drawEliminates" defaultChecked={rules.drawEliminates} /> A draw eliminates the participant</label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="lossEliminates" defaultChecked={rules.lossEliminates} /> A loss eliminates the participant</label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="allowChangeBeforeDeadline" defaultChecked={rules.allowChangeBeforeDeadline} /> Participants can change their selection before the deadline</label>
      </fieldset>

      <fieldset className="card space-y-3">
        <legend className="section-title !mb-1">Team re-use</legend>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="freezeUsedTeams" defaultChecked={rules.freezeUsedTeams} /> Previously selected teams are frozen (cannot be picked again)</label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="winningTeamReturns" defaultChecked={rules.winningTeamReturns} onChange={(e) => setWinningReturns(e.target.checked)} />
          A winning team becomes available again after a number of rounds
        </label>
        {winningReturns && (
          <div>
            <label className="label" htmlFor="winningTeamReturnsAfterRounds">Rounds before a used team returns</label>
            <input className="input w-24" id="winningTeamReturnsAfterRounds" name="winningTeamReturnsAfterRounds" type="number" min={1} defaultValue={rules.winningTeamReturnsAfterRounds ?? 4} />
          </div>
        )}
      </fieldset>

      <fieldset className="card space-y-3">
        <legend className="section-title !mb-1">Re-buys</legend>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="allowReBuy" defaultChecked={rules.allowReBuy} onChange={(e) => setAllowReBuy(e.target.checked)} /> Allow re-buys
        </label>
        {allowReBuy && (
          <div className="grid sm:grid-cols-3 gap-3">
            <div>
              <label className="label" htmlFor="reBuyRounds">Rounds that permit a re-buy (comma separated round order numbers)</label>
              <input className="input" id="reBuyRounds" name="reBuyRounds" defaultValue={rules.reBuyRounds} />
            </div>
            <div>
              <label className="label" htmlFor="reBuyCount">Re-buys allowed per participant</label>
              <input className="input" id="reBuyCount" name="reBuyCount" type="number" min={1} defaultValue={rules.reBuyCount} />
            </div>
            <div>
              <label className="label" htmlFor="reBuyCostPounds">Re-buy cost (£)</label>
              <input className="input" id="reBuyCostPounds" name="reBuyCostPounds" type="number" step="0.01" min={0} defaultValue={(rules.reBuyCostPence / 100).toFixed(2)} />
            </div>
          </div>
        )}
        <div>
          <label className="label" htmlFor="reBuyInstructions">Re-buy instructions shown to participants</label>
          <textarea className="input" id="reBuyInstructions" name="reBuyInstructions" rows={2} defaultValue={rules.reBuyInstructions} />
        </div>
      </fieldset>

      <fieldset className="card space-y-3">
        <legend className="section-title !mb-1">Deadlines & missed selections</legend>
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="label" htmlFor="deadlineDay">Weekly deadline day</label>
            <select className="input" id="deadlineDay" name="deadlineDay" defaultValue={rules.deadlineDay}>
              {days.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="deadlineTime">Deadline time (UK)</label>
            <input className="input" id="deadlineTime" name="deadlineTime" type="time" defaultValue={rules.deadlineTime} />
          </div>
        </div>
        <div>
          <label className="label" htmlFor="missedDeadlineAction">If a participant misses the deadline</label>
          <select className="input" id="missedDeadlineAction" name="missedDeadlineAction" defaultValue={rules.missedDeadlineAction}>
            <option value="AUTO_ASSIGN">Automatically assign a default team</option>
            <option value="ELIMINATE">Eliminate the participant</option>
            <option value="NONE">Take no automatic action</option>
          </select>
        </div>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="defaultLeagueAlternate" defaultChecked={rules.defaultLeagueAlternate} /> Alternate the default team's league each round</label>
        <div>
          <label className="label" htmlFor="postponedHandling">How postponed / abandoned / cancelled fixtures are handled</label>
          <textarea className="input" id="postponedHandling" name="postponedHandling" rows={2} defaultValue={rules.postponedHandling} />
        </div>
      </fieldset>

      <fieldset className="card space-y-3">
        <legend className="section-title !mb-1">Leaderboard visibility</legend>
        <div>
          <label className="label" htmlFor="selectionsVisibility">When are current-round selections visible to other participants?</label>
          <select className="input" id="selectionsVisibility" name="selectionsVisibility" defaultValue={rules.selectionsVisibility}>
            <option value="IMMEDIATE">Visible immediately</option>
            <option value="HIDDEN_UNTIL_DEADLINE">Hidden until the deadline</option>
            <option value="HIDDEN_UNTIL_KICKOFF">Hidden until fixtures have started</option>
          </select>
        </div>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="showEliminatedOnLeaderboard" defaultChecked={rules.showEliminatedOnLeaderboard} /> Keep eliminated participants visible on the leaderboard</label>
      </fieldset>

      <fieldset className="card space-y-3">
        <legend className="section-title !mb-1">Payments & free text rules</legend>
        <div>
          <label className="label" htmlFor="paymentInstructions">Payment instructions shown to participants</label>
          <textarea className="input" id="paymentInstructions" name="paymentInstructions" rows={2} defaultValue={rules.paymentInstructions} />
        </div>
        <div>
          <label className="label" htmlFor="freeTextRules">Additional free-text rules for this game</label>
          <textarea className="input" id="freeTextRules" name="freeTextRules" rows={4} defaultValue={rules.freeTextRules} />
        </div>
      </fieldset>

      <button className="btn-primary" type="submit" disabled={pending}>{pending ? "Saving…" : "Save all rules"}</button>
    </form>
  );
}
