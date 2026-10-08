import { describe, it, expect } from "vitest";
import {
  parseHashrateToTh,
  formatHashrateTh,
  formatNumberWithCommas,
  formatTimestampRelative,
} from "@/lib/hashrate";

describe("Hashrate Parser & Normalizer", () => {
  it("should parse Terahash string correctly", () => {
    expect(parseHashrateToTh("1.8T")).toBe(1.8);
    expect(parseHashrateToTh("1.84T")).toBe(1.84);
  });

  it("should parse Gigahash string to Terahash correctly", () => {
    expect(parseHashrateToTh("500G")).toBe(0.5);
    expect(parseHashrateToTh("1000G")).toBe(1.0);
  });

  it("should parse Megahash string to Terahash correctly", () => {
    expect(parseHashrateToTh("100M")).toBeCloseTo(0.0001, 5);
  });

  it("should parse Petahash string to Terahash correctly", () => {
    expect(parseHashrateToTh("1.5P")).toBe(1500);
  });

  it("should handle zero and empty inputs gracefully", () => {
    expect(parseHashrateToTh("0")).toBe(0);
    expect(parseHashrateToTh(0)).toBe(0);
    expect(parseHashrateToTh("")).toBe(0);
    expect(parseHashrateToTh(null)).toBe(0);
    expect(parseHashrateToTh(undefined)).toBe(0);
  });

  it("should handle numeric inputs already in TH/s", () => {
    expect(parseHashrateToTh(2.5)).toBe(2.5);
  });

  it("should format TH values cleanly", () => {
    expect(formatHashrateTh(1.84)).toBe("1.84 TH/s");
    expect(formatHashrateTh(0.5)).toBe("500.00 GH/s");
    expect(formatHashrateTh(1500)).toBe("1.50 PH/s");
    expect(formatHashrateTh(0)).toBe("0.00 TH/s");
  });

  it("should format large numbers with commas", () => {
    expect(formatNumberWithCommas(1819992546)).toBe("1,819,992,546");
    expect(formatNumberWithCommas(694365556.35)).toBe("694,365,556.35");
  });

  it("should format relative timestamps", () => {
    const now = Math.floor(Date.now() / 1000);
    expect(formatTimestampRelative(now - 10)).toBe("just now");
    expect(formatTimestampRelative(now - 120)).toBe("2m ago");
    expect(formatTimestampRelative(now - 3700)).toBe("1h ago");
    expect(formatTimestampRelative(0)).toBe("N/A");
  });
});
