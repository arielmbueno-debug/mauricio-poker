/**
 * Risk-adjusted ROI — a Sharpe-like metric: mean ROI divided by standard deviation.
 *
 * Higher is better. A modality with mean ROI of +15% but very high variance may
 * score lower than another with +10% but low variance. This matters for bankroll
 * decisions: low-variance modalities let you play with thinner BR ratios.
 */

export type RiskAdjustedROI = {
  mean: number;
  stddev: number;
  /** mean / stddev. Returns 0 if stddev is 0. */
  ratio: number;
  n: number;
};

export const riskAdjustedROI = (perTournamentROIs: readonly number[]): RiskAdjustedROI => {
  const n = perTournamentROIs.length;
  if (n === 0) return { mean: 0, stddev: 0, ratio: 0, n: 0 };
  let sum = 0;
  for (const r of perTournamentROIs) sum += r;
  const mean = sum / n;
  if (n < 2) return { mean, stddev: 0, ratio: 0, n };
  let sqSum = 0;
  for (const r of perTournamentROIs) sqSum += (r - mean) ** 2;
  const stddev = Math.sqrt(sqSum / (n - 1));
  if (stddev === 0) return { mean, stddev: 0, ratio: 0, n };
  return { mean, stddev, ratio: mean / stddev, n };
};

/**
 * Sample-size adjusted score: penalizes small samples by mixing the observed
 * ratio toward 0 according to how confident we are. Helps when ranking: a tiny
 * sample with a high ratio shouldn't out-rank a large sample with a slightly
 * lower one.
 *
 * formula: ratio * shrinkage(n) where shrinkage(n) = n / (n + k) and k controls
 * how aggressively we shrink. k=30 means at n=30 we use half of the observed ratio.
 */
export const shrinkageAdjusted = (ratio: number, n: number, k = 30): number =>
  ratio * (n / (n + k));
