/**
 * Bankroll is auto-computed: sum(deposits) - sum(withdrawals) + sum(tournament.profit).
 * Pure function for testability — DB integration lives in routers.
 */

import type { USD } from "@/lib/types";
import { usd } from "@/lib/types";

export type BankrollTransaction = {
  kind: "deposit" | "withdrawal";
  amount: number; // positive
  occurredAt: Date;
};

export type BankrollSlice = {
  profit: number;
  playedAt: Date;
};

export const currentBankroll = (
  transactions: readonly BankrollTransaction[],
  tournamentProfits: readonly BankrollSlice[],
): USD => {
  let total = 0;
  for (const t of transactions) {
    total += t.kind === "deposit" ? t.amount : -t.amount;
  }
  for (const t of tournamentProfits) {
    total += t.profit;
  }
  return usd(total);
};

/** Bankroll over time — useful for charting. Returned in chronological order. */
export type BankrollPoint = { at: Date; balance: number };

export const bankrollOverTime = (
  transactions: readonly BankrollTransaction[],
  tournamentProfits: readonly BankrollSlice[],
): BankrollPoint[] => {
  type Event = { at: Date; delta: number };
  const events: Event[] = [];
  for (const t of transactions) {
    events.push({ at: t.occurredAt, delta: t.kind === "deposit" ? t.amount : -t.amount });
  }
  for (const t of tournamentProfits) {
    events.push({ at: t.playedAt, delta: t.profit });
  }
  events.sort((a, b) => a.at.getTime() - b.at.getTime());

  const out: BankrollPoint[] = [];
  let running = 0;
  for (const e of events) {
    running += e.delta;
    out.push({ at: e.at, balance: running });
  }
  return out;
};
