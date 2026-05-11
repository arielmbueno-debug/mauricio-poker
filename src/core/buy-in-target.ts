/**
 * Compute the safe buy-in range for a given bankroll, risk profile and modality.
 * Multipliers reflect industry-standard MTT bankroll guidelines.
 */

import type { Modality, RiskProfile, USD } from "@/lib/types";
import { modalityKey, usd } from "@/lib/types";

/** Bankroll-per-buy-in (BIs needed) for each (profile, modalityKey). */
const BI_MULTIPLIERS: Record<RiskProfile, Record<string, number>> = {
  conservative: {
    "MTT|N|R": 200, // regular MTT non-turbo
    "MTT|T|R": 150, // turbo MTT non-bounty
    "MTT|N|B": 175, // PKO regular
    "MTT|T|B": 130, // PKO turbo
  },
  moderate: {
    "MTT|N|R": 150,
    "MTT|T|R": 120,
    "MTT|N|B": 130,
    "MTT|T|B": 100,
  },
  aggressive: {
    "MTT|N|R": 100,
    "MTT|T|R": 80,
    "MTT|N|B": 90,
    "MTT|T|B": 70,
  },
};

export type BuyInTarget = {
  /** Maximum safe buy-in (BR / multiplier). */
  max: USD;
  /** Sweet-spot range: 0.5x to 1x of max. Below 0.5x is over-cautious; above is over-rolling. */
  sweetSpotMin: USD;
  sweetSpotMax: USD;
  multiplier: number;
};

export const buyInTarget = (
  bankrollUsd: number,
  profile: RiskProfile,
  modality: Modality,
): BuyInTarget => {
  const key = modalityKey(modality);
  const multiplier = BI_MULTIPLIERS[profile][key] ?? 150;
  const max = bankrollUsd / multiplier;
  return {
    max: usd(max),
    sweetSpotMin: usd(max * 0.5),
    sweetSpotMax: usd(max),
    multiplier,
  };
};

/** Aggregated daily buy-in suggestion across the player's typical mix. */
export const dailyBuyInRange = (
  bankrollUsd: number,
  profile: RiskProfile,
  modalitiesPlayed: readonly Modality[],
): { min: USD; max: USD } => {
  if (modalitiesPlayed.length === 0) {
    const fallback = buyInTarget(bankrollUsd, profile, {
      base: "MTT",
      isTurbo: false,
      isBounty: false,
    });
    return { min: fallback.sweetSpotMin, max: fallback.sweetSpotMax };
  }
  const targets = modalitiesPlayed.map((m) => buyInTarget(bankrollUsd, profile, m));
  const min = Math.min(...targets.map((t) => t.sweetSpotMin));
  const max = Math.max(...targets.map((t) => t.sweetSpotMax));
  return { min: usd(min), max: usd(max) };
};
