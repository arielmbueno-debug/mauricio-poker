import { describe, it, expect } from "vitest";
import { sampleSizeConfidence, assessSampleSize } from "./sample-size";

describe("sampleSizeConfidence", () => {
  it("under 30 is low", () => {
    expect(sampleSizeConfidence(0)).toBe("low");
    expect(sampleSizeConfidence(29)).toBe("low");
  });
  it("30-99 is moderate", () => {
    expect(sampleSizeConfidence(30)).toBe("moderate");
    expect(sampleSizeConfidence(99)).toBe("moderate");
  });
  it("100-499 is good", () => {
    expect(sampleSizeConfidence(100)).toBe("good");
    expect(sampleSizeConfidence(499)).toBe("good");
  });
  it("500+ is high", () => {
    expect(sampleSizeConfidence(500)).toBe("high");
    expect(sampleSizeConfidence(10_000)).toBe("high");
  });
});

describe("assessSampleSize", () => {
  it("returns assessment with n, confidence, and message", () => {
    const a = assessSampleSize(45);
    expect(a.n).toBe(45);
    expect(a.confidence).toBe("moderate");
    expect(a.message.length).toBeGreaterThan(0);
  });
});
