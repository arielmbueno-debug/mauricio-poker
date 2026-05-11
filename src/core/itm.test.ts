import { describe, it, expect } from "vitest";
import { itmRate, finalTableRate } from "./itm";

describe("itmRate", () => {
  it("returns 0 on empty input", () => {
    expect(itmRate([])).toBe(0);
  });

  it("returns 0.5 with half ITM", () => {
    expect(
      itmRate([
        { itm: true, finalTablePosition: null },
        { itm: false, finalTablePosition: null },
      ]),
    ).toBe(0.5);
  });

  it("returns 1 when all ITM", () => {
    expect(itmRate([{ itm: true, finalTablePosition: null }])).toBe(1);
  });
});

describe("finalTableRate", () => {
  it("returns 0 with no FTs", () => {
    expect(
      finalTableRate([
        { itm: true, finalTablePosition: null },
        { itm: false, finalTablePosition: null },
      ]),
    ).toBe(0);
  });

  it("counts non-null positions as FT reached", () => {
    expect(
      finalTableRate([
        { itm: true, finalTablePosition: 3 },
        { itm: true, finalTablePosition: null },
        { itm: false, finalTablePosition: null },
      ]),
    ).toBeCloseTo(1 / 3);
  });
});
