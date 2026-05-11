import type { ROI, USD } from "@/lib/types";
import { roi, usd } from "@/lib/types";

export type TournamentForRoi = {
  buyIn: number;
  reEntries: number;
  addOns: number;
  profit: number;
};

/**
 * Total cost of a single tournament: initial buy-in plus any re-entries and add-ons
 * (each priced at the initial buy-in). Returns 0 for free-rolls (buy-in 0).
 */
export const totalCost = (t: TournamentForRoi): USD => {
  const entries = 1 + t.reEntries + t.addOns;
  return usd(t.buyIn * entries);
};

/** Per-tournament ROI: profit divided by cost. Free-rolls (cost 0) return 0. */
export const tournamentROI = (t: TournamentForRoi): ROI => {
  const cost = totalCost(t);
  if (cost === 0) return roi(0);
  return roi(t.profit / cost);
};

/**
 * Aggregate ROI over a list of tournaments (preferred over averaging per-tournament ROIs,
 * because it is invariant to buy-in size).
 */
export const aggregateROI = (tournaments: readonly TournamentForRoi[]): ROI => {
  if (tournaments.length === 0) return roi(0);
  let totalProfit = 0;
  let totalSpent = 0;
  for (const t of tournaments) {
    totalProfit += t.profit;
    totalSpent += totalCost(t);
  }
  if (totalSpent === 0) return roi(0);
  return roi(totalProfit / totalSpent);
};

/** Total amount invested across a list of tournaments. */
export const totalInvested = (tournaments: readonly TournamentForRoi[]): USD => {
  let sum = 0;
  for (const t of tournaments) sum += totalCost(t);
  return usd(sum);
};

/** Total net profit. */
export const totalProfit = (tournaments: readonly TournamentForRoi[]): USD => {
  let sum = 0;
  for (const t of tournaments) sum += t.profit;
  return usd(sum);
};
