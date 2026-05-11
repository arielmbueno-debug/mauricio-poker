import { describe, it, expect } from "vitest";
import { totalCost, tournamentROI, aggregateROI, totalInvested, totalProfit } from "./roi";

describe("totalCost", () => {
  it("returns buy-in when no re-entries or add-ons", () => {
    expect(totalCost({ buyIn: 22, reEntries: 0, addOns: 0, profit: 0 })).toBe(22);
  });

  it("multiplies by entries when re-entries present", () => {
    expect(totalCost({ buyIn: 22, reEntries: 2, addOns: 0, profit: 0 })).toBe(66);
  });

  it("includes add-ons in cost", () => {
    expect(totalCost({ buyIn: 11, reEntries: 0, addOns: 1, profit: 0 })).toBe(22);
  });

  it("handles freeroll (buy-in 0)", () => {
    expect(totalCost({ buyIn: 0, reEntries: 0, addOns: 0, profit: 50 })).toBe(0);
  });
});

describe("tournamentROI", () => {
  it("computes ROI on profitable tournament", () => {
    expect(tournamentROI({ buyIn: 100, reEntries: 0, addOns: 0, profit: 25 })).toBeCloseTo(0.25);
  });

  it("returns negative ROI on loss", () => {
    expect(tournamentROI({ buyIn: 100, reEntries: 0, addOns: 0, profit: -100 })).toBe(-1);
  });

  it("accounts for re-entries", () => {
    // Spent $200 (2 entries), profit $50 → ROI 25%
    expect(tournamentROI({ buyIn: 100, reEntries: 1, addOns: 0, profit: 50 })).toBeCloseTo(0.25);
  });

  it("freeroll returns 0", () => {
    expect(tournamentROI({ buyIn: 0, reEntries: 0, addOns: 0, profit: 100 })).toBe(0);
  });
});

describe("aggregateROI", () => {
  it("returns 0 on empty list", () => {
    expect(aggregateROI([])).toBe(0);
  });

  it("weights by buy-in correctly (small profitable + large losing ≠ avg)", () => {
    const small = { buyIn: 5, reEntries: 0, addOns: 0, profit: 5 }; // +100%
    const large = { buyIn: 500, reEntries: 0, addOns: 0, profit: -100 }; // -20%
    // Total spent: 505. Total profit: -95. Aggregate ROI: ~-18.8%
    expect(aggregateROI([small, large])).toBeCloseTo(-95 / 505);
  });

  it("100 tournaments at exactly +10% each gives +10% aggregate", () => {
    const ts = Array.from({ length: 100 }, () => ({
      buyIn: 22,
      reEntries: 0,
      addOns: 0,
      profit: 2.2,
    }));
    expect(aggregateROI(ts)).toBeCloseTo(0.1);
  });
});

describe("totalInvested", () => {
  it("sums total cost across tournaments", () => {
    expect(
      totalInvested([
        { buyIn: 10, reEntries: 0, addOns: 0, profit: 0 },
        { buyIn: 22, reEntries: 1, addOns: 0, profit: 0 },
      ]),
    ).toBe(54);
  });
});

describe("totalProfit", () => {
  it("sums profits across tournaments", () => {
    expect(
      totalProfit([
        { buyIn: 10, reEntries: 0, addOns: 0, profit: 15 },
        { buyIn: 22, reEntries: 0, addOns: 0, profit: -22 },
      ]),
    ).toBe(-7);
  });
});
