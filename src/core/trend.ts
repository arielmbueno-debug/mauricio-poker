/**
 * Trend comparison: short-term vs lifetime ROI. Returns direction and magnitude.
 *
 * "Stable" if absolute difference < threshold (default 5pp).
 */

import { aggregateROI, type TournamentForRoi } from "./roi";

export type TrendDirection = "improving" | "stable" | "worsening";

export type Trend = {
  recent: number;
  lifetime: number;
  delta: number;
  direction: TrendDirection;
};

export type TournamentWithDate = TournamentForRoi & { playedAt: Date };

export const filterByDateRange = (
  tournaments: readonly TournamentWithDate[],
  from: Date,
  to: Date = new Date(),
): TournamentWithDate[] =>
  tournaments.filter((t) => t.playedAt >= from && t.playedAt <= to);

export const computeTrend = (
  tournaments: readonly TournamentWithDate[],
  windowDays = 30,
  stableThreshold = 0.05,
  reference: Date = new Date(),
): Trend => {
  const lifetime = aggregateROI(tournaments);
  const cutoff = new Date(reference.getTime() - windowDays * 24 * 60 * 60 * 1000);
  const recentList = filterByDateRange(tournaments, cutoff, reference);
  const recent = aggregateROI(recentList);
  const delta = recent - lifetime;
  let direction: TrendDirection;
  if (Math.abs(delta) < stableThreshold) direction = "stable";
  else direction = delta > 0 ? "improving" : "worsening";
  return { recent, lifetime, delta, direction };
};
