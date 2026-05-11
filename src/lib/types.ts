/**
 * Branded types (Matt Pocock-style) — at the type level, USD, BuyIns, ROI etc are
 * indistinguishable from number. Branded types add a phantom tag so the compiler
 * refuses to mix them. No runtime cost.
 */

declare const __brand: unique symbol;
type Brand<T, B> = T & { readonly [__brand]: B };

export type USD = Brand<number, "USD">;
export type BuyIns = Brand<number, "BuyIns">;
/** ROI as a ratio, e.g. 0.15 means +15%. Can be negative. */
export type ROI = Brand<number, "ROI">;
/** Probability in [0, 1]. */
export type Probability = Brand<number, "Probability">;
/** Non-negative integer count. */
export type Count = Brand<number, "Count">;

export const usd = (n: number): USD => n as USD;
export const buyIns = (n: number): BuyIns => n as BuyIns;
export const roi = (n: number): ROI => n as ROI;
export const probability = (n: number): Probability => {
  if (n < 0 || n > 1) throw new Error(`Probability out of range: ${n}`);
  return n as Probability;
};
export const count = (n: number): Count => {
  if (!Number.isInteger(n) || n < 0) throw new Error(`Count must be non-negative integer: ${n}`);
  return n as Count;
};

export const POKER_SITES = ["POKERSTARS", "GGPOKER", "PARTYPOKER", "POKER888", "WPT_GLOBAL"] as const;
export type PokerSite = (typeof POKER_SITES)[number];

export const RISK_PROFILES = ["conservative", "moderate", "aggressive"] as const;
export type RiskProfile = (typeof RISK_PROFILES)[number];

export const BUY_IN_TIERS = ["micro", "small", "medium", "high", "super-high"] as const;
export type BuyInTier = (typeof BUY_IN_TIERS)[number];

/**
 * Modality is decomposed into orthogonal flags + base type (always MTT in v1).
 * Display label is derived: e.g. "MTT Turbo PKO" / "MTT Regular".
 */
export type Modality = {
  base: "MTT";
  isTurbo: boolean;
  isBounty: boolean;
};

export const modalityLabel = (m: Modality): string => {
  const parts: string[] = ["MTT"];
  if (m.isTurbo) parts.push("Turbo");
  if (m.isBounty) parts.push("PKO");
  else parts.push("Regular");
  return parts.join(" ");
};

export const modalityKey = (m: Modality): string =>
  `${m.base}|${m.isTurbo ? "T" : "N"}|${m.isBounty ? "B" : "R"}`;

/** Tiering matches Lobbyze convention extended for our use. */
export const tierForBuyIn = (buyInUsd: number): BuyInTier => {
  if (buyInUsd <= 6) return "micro";
  if (buyInUsd <= 22) return "small";
  if (buyInUsd <= 109) return "medium";
  if (buyInUsd <= 530) return "high";
  return "super-high";
};

export const SITE_LABEL: Record<PokerSite, string> = {
  POKERSTARS: "PokerStars",
  GGPOKER: "GGPoker",
  PARTYPOKER: "partypoker",
  POKER888: "888poker",
  WPT_GLOBAL: "WPT Global",
};
