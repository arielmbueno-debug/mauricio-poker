import type { Probability } from "@/lib/types";
import { probability } from "@/lib/types";

/**
 * Wilson score interval for a binomial proportion.
 *
 * For k successes in n trials at confidence level z (default 1.96 for 95%),
 * returns the asymmetric interval [lo, hi] that is more accurate than the
 * naive normal approximation, especially for small n or p near 0/1.
 *
 * Source: Wilson (1927).
 */
export type ConfidenceInterval = {
  lo: Probability;
  hi: Probability;
  /** Width of the interval, useful for "is this sample big enough?" checks. */
  width: number;
};

export const wilsonScoreInterval = (
  successes: number,
  trials: number,
  z = 1.96,
): ConfidenceInterval => {
  if (trials === 0) {
    return { lo: probability(0), hi: probability(1), width: 1 };
  }
  if (successes < 0 || successes > trials) {
    throw new Error(`Invalid: successes=${successes}, trials=${trials}`);
  }
  const phat = successes / trials;
  const z2 = z * z;
  const denominator = 1 + z2 / trials;
  const center = (phat + z2 / (2 * trials)) / denominator;
  const margin =
    (z * Math.sqrt((phat * (1 - phat)) / trials + z2 / (4 * trials * trials))) / denominator;
  const lo = Math.max(0, center - margin);
  const hi = Math.min(1, center + margin);
  return {
    lo: probability(lo),
    hi: probability(hi),
    width: hi - lo,
  };
};

/**
 * Mean ROI confidence interval via normal approximation. ROI is unbounded
 * (can be very negative), so Wilson does not apply — use mean ± z * SE.
 */
export type RoiConfidenceInterval = {
  mean: number;
  lo: number;
  hi: number;
  stderr: number;
  /** Half-width of the interval. */
  margin: number;
};

export const roiConfidenceInterval = (
  perTournamentROIs: readonly number[],
  z = 1.96,
): RoiConfidenceInterval => {
  const n = perTournamentROIs.length;
  if (n === 0) {
    return { mean: 0, lo: 0, hi: 0, stderr: 0, margin: 0 };
  }
  let sum = 0;
  for (const r of perTournamentROIs) sum += r;
  const mean = sum / n;
  if (n < 2) {
    return { mean, lo: mean, hi: mean, stderr: 0, margin: 0 };
  }
  let sqSum = 0;
  for (const r of perTournamentROIs) sqSum += (r - mean) ** 2;
  const variance = sqSum / (n - 1);
  const stderr = Math.sqrt(variance / n);
  const margin = z * stderr;
  return { mean, lo: mean - margin, hi: mean + margin, stderr, margin };
};
