import { describe, it, expect } from "vitest";
import { generateAlerts, monthsSpan } from "./alerts";

const day = (offsetDays: number) =>
  new Date(Date.now() - offsetDays * 24 * 60 * 60 * 1000);

const baseModality = { base: "MTT" as const, isTurbo: false, isBounty: false };

describe("generateAlerts", () => {
  it("returns BR exposure alert when recent BIs exceed safe max", () => {
    const alerts = generateAlerts({
      bankrollUsd: 1000,
      riskProfile: "moderate",
      modalitiesPlayed: [baseModality],
      tournaments: [
        // safe max ≈ $6.67 (1000/150). $215 is way over.
        { playedAt: day(5), buyIn: 215, reEntries: 0, addOns: 0, profit: -215 },
      ],
    });
    expect(alerts.find((a) => a.id === "br-exposure")).toBeDefined();
  });

  it("does not fire BR exposure when nothing over", () => {
    const alerts = generateAlerts({
      bankrollUsd: 10_000,
      riskProfile: "moderate",
      modalitiesPlayed: [baseModality],
      tournaments: [
        { playedAt: day(5), buyIn: 11, reEntries: 0, addOns: 0, profit: 0 },
      ],
    });
    expect(alerts.find((a) => a.id === "br-exposure")).toBeUndefined();
  });
});

describe("monthsSpan", () => {
  it("returns 1 for empty input", () => {
    expect(monthsSpan([])).toBe(1);
  });
  it("computes months between min and max date", () => {
    const span = monthsSpan([
      { playedAt: day(0), buyIn: 0, reEntries: 0, addOns: 0, profit: 0 },
      { playedAt: day(60), buyIn: 0, reEntries: 0, addOns: 0, profit: 0 },
    ]);
    expect(span).toBeGreaterThan(1.9);
    expect(span).toBeLessThan(2.1);
  });
});
