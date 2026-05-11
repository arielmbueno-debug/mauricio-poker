import { describe, it, expect } from "vitest";
import { buyInTarget, dailyBuyInRange } from "./buy-in-target";

const mttRegular = { base: "MTT" as const, isTurbo: false, isBounty: false };
const pkoTurbo = { base: "MTT" as const, isTurbo: true, isBounty: true };

describe("buyInTarget", () => {
  it("moderate MTT regular: $4500 bankroll → $30 max BI (150 BIs)", () => {
    const t = buyInTarget(4500, "moderate", mttRegular);
    expect(t.max).toBe(30);
    expect(t.multiplier).toBe(150);
  });

  it("aggressive PKO turbo uses smaller multiplier (70)", () => {
    const t = buyInTarget(700, "aggressive", pkoTurbo);
    expect(t.multiplier).toBe(70);
    expect(t.max).toBeCloseTo(10);
  });

  it("conservative is the largest multiplier, aggressive smallest", () => {
    const cons = buyInTarget(3000, "conservative", mttRegular);
    const mod = buyInTarget(3000, "moderate", mttRegular);
    const aggr = buyInTarget(3000, "aggressive", mttRegular);
    expect(cons.max).toBeLessThan(mod.max);
    expect(mod.max).toBeLessThan(aggr.max);
  });

  it("sweet spot range is [0.5x, 1x] of max", () => {
    const t = buyInTarget(4500, "moderate", mttRegular);
    expect(t.sweetSpotMin).toBe(t.max * 0.5);
    expect(t.sweetSpotMax).toBe(t.max);
  });
});

describe("dailyBuyInRange", () => {
  it("with no modalities, falls back to MTT regular", () => {
    const r = dailyBuyInRange(4500, "moderate", []);
    expect(r.max).toBe(30);
  });

  it("across multiple modalities, takes min/max envelope", () => {
    const r = dailyBuyInRange(4500, "moderate", [mttRegular, pkoTurbo]);
    // PKO turbo (multiplier 100) → max 45. Regular MTT max 30.
    expect(r.max).toBe(45);
  });
});
