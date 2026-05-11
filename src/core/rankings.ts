/**
 * Rankings: group tournaments by (site, modality, tier) and rank by an
 * adjusted score that combines ROI with risk and sample size.
 */

import type { PokerSite, Modality, BuyInTier } from "@/lib/types";
import { tierForBuyIn, modalityLabel, modalityKey, SITE_LABEL } from "@/lib/types";
import { aggregateROI, tournamentROI, type TournamentForRoi } from "./roi";
import { itmRate, type TournamentForItm } from "./itm";
import { riskAdjustedROI, shrinkageAdjusted } from "./risk-adjusted-roi";
import { sampleSizeConfidence } from "./sample-size";

export type RankableTournament = TournamentForRoi &
  TournamentForItm & {
    site: PokerSite;
    isTurbo: boolean;
    isBounty: boolean;
  };

export type GroupKey = {
  site: PokerSite;
  modality: Modality;
  tier: BuyInTier;
};

export type RankingRow = {
  key: GroupKey;
  label: string; // human-readable composite (e.g. "GG · MTT Turbo PKO · small")
  n: number;
  aggregateROI: number;
  meanROI: number;
  stddev: number;
  ratio: number;
  itmRate: number;
  totalProfit: number;
  score: number; // shrinkage-adjusted ratio — the sort key
  confidence: "low" | "moderate" | "good" | "high";
};

const groupBy = <T, K extends string>(arr: readonly T[], keyOf: (t: T) => K): Map<K, T[]> => {
  const out = new Map<K, T[]>();
  for (const t of arr) {
    const k = keyOf(t);
    const bucket = out.get(k);
    if (bucket) bucket.push(t);
    else out.set(k, [t]);
  }
  return out;
};

const compositeLabel = (k: GroupKey): string =>
  `${SITE_LABEL[k.site]} · ${modalityLabel(k.modality)} · ${k.tier}`;

export const rankCombinations = (tournaments: readonly RankableTournament[]): RankingRow[] => {
  const groups = groupBy(tournaments, (t) => {
    const tier = tierForBuyIn(t.buyIn);
    return `${t.site}|${t.isTurbo ? "T" : "N"}|${t.isBounty ? "B" : "R"}|${tier}` as const;
  });

  const rows: RankingRow[] = [];
  for (const [k, list] of groups) {
    const first = list[0];
    if (!first) continue;
    const parts = k.split("|");
    const site = parts[0] as PokerSite;
    const modality: Modality = {
      base: "MTT",
      isTurbo: parts[1] === "T",
      isBounty: parts[2] === "B",
    };
    const tier = parts[3] as BuyInTier;
    const aggr = aggregateROI(list);
    const perTournament = list.map((t) => tournamentROI(t));
    const rar = riskAdjustedROI(perTournament);
    const score = shrinkageAdjusted(rar.ratio, list.length);
    const totalProfit = list.reduce((s, t) => s + t.profit, 0);
    rows.push({
      key: { site, modality, tier },
      label: compositeLabel({ site, modality, tier }),
      n: list.length,
      aggregateROI: aggr,
      meanROI: rar.mean,
      stddev: rar.stddev,
      ratio: rar.ratio,
      itmRate: itmRate(list),
      totalProfit,
      score,
      confidence: sampleSizeConfidence(list.length),
    });
  }

  rows.sort((a, b) => b.score - a.score);
  return rows;
};

/** Convenience: top N positive-score combinations. */
export const topPositiveRankings = (
  tournaments: readonly RankableTournament[],
  limit = 5,
): RankingRow[] => {
  const all = rankCombinations(tournaments);
  return all.filter((r) => r.score > 0).slice(0, limit);
};

/** Bottom N (worst combinations to avoid). */
export const bottomNegativeRankings = (
  tournaments: readonly RankableTournament[],
  limit = 5,
): RankingRow[] => {
  const all = rankCombinations(tournaments);
  return all.filter((r) => r.score < 0).slice(-limit).reverse();
};

// Re-export helpers used by ranking displays
export { modalityKey };
