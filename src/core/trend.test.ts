import { describe, it, expect } from "vitest";
import { computeTrend, filterByDateRange } from "./trend";

const day = (offsetDays: number, ref = new Date("2026-05-10")) =>
  new Date(ref.getTime() - offsetDays * 24 * 60 * 60 * 1000);

describe("filterByDateRange", () => {
  it("keeps only tournaments within the range", () => {
    const tournaments = [
      { playedAt: day(5), buyIn: 10, reEntries: 0, addOns: 0, profit: 0 },
      { playedAt: day(45), buyIn: 10, reEntries: 0, addOns: 0, profit: 0 },
    ];
    const result = filterByDateRange(tournaments, day(30), new Date("2026-05-10"));
    expect(result).toHaveLength(1);
  });
});

describe("computeTrend", () => {
  const ref = new Date("2026-05-10");

  it("returns stable when recent ROI matches lifetime", () => {
    const tournaments = Array.from({ length: 50 }, (_, i) => ({
      playedAt: day(i * 2, ref),
      buyIn: 22,
      reEntries: 0,
      addOns: 0,
      profit: 2.2,
    }));
    const trend = computeTrend(tournaments, 30, 0.05, ref);
    expect(trend.direction).toBe("stable");
  });

  it("marks improving when recent beats lifetime", () => {
    const old = Array.from({ length: 40 }, () => ({
      playedAt: day(60, ref),
      buyIn: 22,
      reEntries: 0,
      addOns: 0,
      profit: 0, // 0% ROI lifetime tilt
    }));
    const recent = Array.from({ length: 40 }, () => ({
      playedAt: day(10, ref),
      buyIn: 22,
      reEntries: 0,
      addOns: 0,
      profit: 11, // +50% ROI recently
    }));
    const trend = computeTrend([...old, ...recent], 30, 0.05, ref);
    expect(trend.direction).toBe("improving");
    expect(trend.delta).toBeGreaterThan(0);
  });

  it("marks worsening when recent loses vs lifetime", () => {
    const old = Array.from({ length: 40 }, () => ({
      playedAt: day(60, ref),
      buyIn: 22,
      reEntries: 0,
      addOns: 0,
      profit: 11, // +50% old
    }));
    const recent = Array.from({ length: 40 }, () => ({
      playedAt: day(10, ref),
      buyIn: 22,
      reEntries: 0,
      addOns: 0,
      profit: -22, // -100% recent
    }));
    const trend = computeTrend([...old, ...recent], 30, 0.05, ref);
    expect(trend.direction).toBe("worsening");
    expect(trend.delta).toBeLessThan(0);
  });
});
