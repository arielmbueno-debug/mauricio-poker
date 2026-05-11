import type { Probability } from "@/lib/types";
import { probability } from "@/lib/types";

export type TournamentForItm = {
  itm: boolean;
  finalTablePosition: number | null | undefined;
};

/** Proportion of tournaments in the money. */
export const itmRate = (tournaments: readonly TournamentForItm[]): Probability => {
  if (tournaments.length === 0) return probability(0);
  const itms = tournaments.filter((t) => t.itm).length;
  return probability(itms / tournaments.length);
};

/** Proportion of tournaments reaching the final table (positon != null). */
export const finalTableRate = (tournaments: readonly TournamentForItm[]): Probability => {
  if (tournaments.length === 0) return probability(0);
  const fts = tournaments.filter((t) => t.finalTablePosition != null).length;
  return probability(fts / tournaments.length);
};
