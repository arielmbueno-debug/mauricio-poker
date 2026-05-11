import { describe, it, expect } from "vitest";
import { wilsonScoreInterval, roiConfidenceInterval } from "./wilson";

describe("wilsonScoreInterval", () => {
  it("returns full [0,1] for zero trials", () => {
    const ci = wilsonScoreInterval(0, 0);
    expect(ci.lo).toBe(0);
    expect(ci.hi).toBe(1);
    expect(ci.width).toBe(1);
  });

  it("matches known textbook value: 10/20 trials at 95% gives ~[0.299, 0.701]", () => {
    const ci = wilsonScoreInterval(10, 20);
    expect(ci.lo).toBeCloseTo(0.299, 2);
    expect(ci.hi).toBeCloseTo(0.701, 2);
  });

  it("low sample is much wider than high sample for same proportion", () => {
    const small = wilsonScoreInterval(5, 10);
    const big = wilsonScoreInterval(500, 1000);
    expect(small.width).toBeGreaterThan(big.width);
    expect(big.width).toBeLessThan(0.1);
  });

  it("at extremes (0/n or n/n), lo or hi reach the boundary", () => {
    const allFail = wilsonScoreInterval(0, 100);
    expect(allFail.lo).toBe(0);
    const allWin = wilsonScoreInterval(100, 100);
    expect(allWin.hi).toBeCloseTo(1, 10);
  });

  it("throws on invalid inputs", () => {
    expect(() => wilsonScoreInterval(-1, 10)).toThrow();
    expect(() => wilsonScoreInterval(11, 10)).toThrow();
  });
});

describe("roiConfidenceInterval", () => {
  it("empty input returns zeros", () => {
    const ci = roiConfidenceInterval([]);
    expect(ci.mean).toBe(0);
    expect(ci.lo).toBe(0);
    expect(ci.hi).toBe(0);
  });

  it("single value: no variance, ci collapses to value", () => {
    const ci = roiConfidenceInterval([0.5]);
    expect(ci.mean).toBe(0.5);
    expect(ci.lo).toBe(0.5);
    expect(ci.hi).toBe(0.5);
  });

  it("low-variance sample produces tight interval around the mean", () => {
    const ci = roiConfidenceInterval([0.1, 0.11, 0.09, 0.10, 0.105, 0.095, 0.10, 0.10, 0.10, 0.10]);
    expect(ci.mean).toBeCloseTo(0.1, 2);
    expect(ci.margin).toBeLessThan(0.02);
  });

  it("high-variance sample produces wide interval", () => {
    const ci = roiConfidenceInterval([2, -1, 3, -1, -1, -1, -1, -1, -1, -1]);
    expect(ci.margin).toBeGreaterThan(0.3);
  });
});
