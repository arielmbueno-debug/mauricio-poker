import { describe, it, expect } from "vitest";
import { rankCombinations, topPositiveRankings, bottomNegativeRankings } from "./rankings";

const makeT = (overrides: Partial<Parameters<typeof rankCombinations>[0][number]> = {}) => ({
  buyIn: 22,
  reEntries: 0,
  addOns: 0,
  profit: 2,
  itm: false,
  finalTablePosition: null as number | null,
  site: "GGPOKER" as const,
  isTurbo: false,
  isBounty: false,
  ...overrides,
});

describe("rankCombinations", () => {
  it("groups by site + turbo flag + bounty flag + tier", () => {
    const tournaments = [
      makeT({ site: "GGPOKER" }),
      makeT({ site: "GGPOKER" }),
      makeT({ site: "POKERSTARS" }),
    ];
    const rows = rankCombinations(tournaments);
    expect(rows).toHaveLength(2);
  });

  it("higher-ratio group ranks above lower-ratio group", () => {
    const good = Array.from({ length: 50 }, () =>
      makeT({ site: "GGPOKER", profit: 5, isTurbo: false, isBounty: true }),
    );
    const bad = Array.from({ length: 50 }, () =>
      makeT({ site: "POKERSTARS", profit: -5, isTurbo: true, isBounty: false }),
    );
    const rows = rankCombinations([...good, ...bad]);
    expect(rows[0]?.score).toBeGreaterThan(rows[1]?.score ?? -Infinity);
    expect(rows[0]?.key.site).toBe("GGPOKER");
  });

  it("low sample size is penalized vs equivalent large sample", () => {
    const smallGood = Array.from({ length: 5 }, () =>
      makeT({ site: "GGPOKER", profit: 11 }),
    );
    const bigGood = Array.from({ length: 200 }, () =>
      makeT({ site: "POKERSTARS", profit: 11 }),
    );
    // We add some variance to give a finite ratio
    smallGood[0] = makeT({ site: "GGPOKER", profit: 0 });
    bigGood[0] = makeT({ site: "POKERSTARS", profit: 0 });
    const rows = rankCombinations([...smallGood, ...bigGood]);
    const gg = rows.find((r) => r.key.site === "GGPOKER");
    const ps = rows.find((r) => r.key.site === "POKERSTARS");
    expect(ps?.score).toBeGreaterThan(gg?.score ?? -Infinity);
  });
});

describe("topPositiveRankings / bottomNegativeRankings", () => {
  it("top returns only positive-score rows up to limit", () => {
    const good = Array.from({ length: 50 }, () => makeT({ site: "GGPOKER", profit: 5 }));
    const bad = Array.from({ length: 50 }, () => makeT({ site: "POKERSTARS", profit: -5 }));
    const top = topPositiveRankings([...good, ...bad], 3);
    expect(top.every((r) => r.score > 0)).toBe(true);
    expect(top.length).toBeLessThanOrEqual(3);
  });

  it("bottom returns only negative-score rows", () => {
    const good = Array.from({ length: 50 }, () => makeT({ site: "GGPOKER", profit: 5 }));
    const bad = Array.from({ length: 50 }, () => makeT({ site: "POKERSTARS", profit: -5 }));
    const bottom = bottomNegativeRankings([...good, ...bad], 3);
    expect(bottom.every((r) => r.score < 0)).toBe(true);
  });
});
