import { describe, it, expect } from "vitest";
import { riskAdjustedROI, shrinkageAdjusted } from "./risk-adjusted-roi";

describe("riskAdjustedROI", () => {
  it("empty returns zeros", () => {
    expect(riskAdjustedROI([])).toEqual({ mean: 0, stddev: 0, ratio: 0, n: 0 });
  });

  it("single value: ratio is 0 (no stddev)", () => {
    const r = riskAdjustedROI([0.2]);
    expect(r.mean).toBe(0.2);
    expect(r.stddev).toBe(0);
    expect(r.ratio).toBe(0);
  });

  it("constant series: stddev 0, ratio 0", () => {
    const r = riskAdjustedROI([0.1, 0.1, 0.1, 0.1]);
    expect(r.stddev).toBe(0);
    expect(r.ratio).toBe(0);
  });

  it("low-variance series outranks high-variance series of same mean", () => {
    const low = riskAdjustedROI([0.09, 0.11, 0.10, 0.10, 0.10, 0.10]);
    const high = riskAdjustedROI([0.5, -0.3, 0.4, -0.2, 0.3, -0.1]);
    expect(low.mean).toBeCloseTo(high.mean, 1);
    expect(low.ratio).toBeGreaterThan(high.ratio);
  });

  it("negative mean produces negative ratio", () => {
    const r = riskAdjustedROI([-0.2, -0.1, -0.3, -0.1, -0.2]);
    expect(r.ratio).toBeLessThan(0);
  });
});

describe("shrinkageAdjusted", () => {
  it("at n=k, shrinks to half the observed ratio", () => {
    expect(shrinkageAdjusted(1.0, 30, 30)).toBeCloseTo(0.5);
  });

  it("at very large n, approaches observed ratio", () => {
    expect(shrinkageAdjusted(1.0, 10000, 30)).toBeCloseTo(1.0, 1);
  });

  it("at n=0, returns 0", () => {
    expect(shrinkageAdjusted(1.0, 0, 30)).toBe(0);
  });
});
