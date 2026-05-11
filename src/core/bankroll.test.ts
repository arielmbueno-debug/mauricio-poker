import { describe, it, expect } from "vitest";
import { currentBankroll, bankrollOverTime } from "./bankroll";

describe("currentBankroll", () => {
  it("sums deposits minus withdrawals plus profits", () => {
    const transactions = [
      { kind: "deposit" as const, amount: 1000, occurredAt: new Date("2025-01-01") },
      { kind: "withdrawal" as const, amount: 200, occurredAt: new Date("2025-06-01") },
    ];
    const profits = [
      { profit: 150, playedAt: new Date("2025-02-01") },
      { profit: -50, playedAt: new Date("2025-03-01") },
    ];
    expect(currentBankroll(transactions, profits)).toBe(900);
  });

  it("returns 0 with no transactions or profits", () => {
    expect(currentBankroll([], [])).toBe(0);
  });
});

describe("bankrollOverTime", () => {
  it("produces chronologically-sorted running balance", () => {
    const transactions = [
      { kind: "deposit" as const, amount: 500, occurredAt: new Date("2025-01-01") },
    ];
    const profits = [
      { profit: 50, playedAt: new Date("2025-02-01") },
      { profit: -10, playedAt: new Date("2025-01-15") },
    ];
    const points = bankrollOverTime(transactions, profits);
    expect(points).toHaveLength(3);
    expect(points[0]?.balance).toBe(500);
    expect(points[1]?.balance).toBe(490);
    expect(points[2]?.balance).toBe(540);
  });
});
