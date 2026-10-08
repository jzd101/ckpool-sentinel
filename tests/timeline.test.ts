import { describe, it, expect } from "vitest";
import { generateTimelineHistory } from "@/lib/timeline";
import { SnapshotRecord } from "@/lib/types";

describe("Timeline History Generator", () => {
  const now = Math.floor(Date.now() / 1000);

  const mockLatest: SnapshotRecord = {
    id: 10,
    timestamp: now,
    hashrate_1m: 1.8,
    hashrate_5m: 1.75,
    hashrate_1hr: 1.7,
    hashrate_1d: 1.25,
    hashrate_7d: 1.1,
    raw_hashrate_1m: "1.8T",
    raw_hashrate_5m: "1.75T",
    raw_hashrate_1hr: "1.7T",
    raw_hashrate_1d: "1.25T",
    raw_hashrate_7d: "1.1T",
    workers_count: 2,
    shares: 1800000000,
    bestshare: 694000000,
    bestever: 694000000,
    lastshare: now - 30,
    raw_json: "{}",
  };

  it("should return empty array if no latest snapshot exists", () => {
    const result = generateTimelineHistory("24h", [], null);
    expect(result).toEqual([]);
  });

  it("should generate 1h timeline points covering past 1 hour", () => {
    const result = generateTimelineHistory("1h", [], mockLatest);
    expect(result.length).toBeGreaterThan(15);
    const earliest = result[0].timestamp;
    const latest = result[result.length - 1].timestamp;

    // Earliest should be approximately 1 hour ago
    expect(now - earliest).toBeGreaterThanOrEqual(3500);
    // Latest should be at current time
    expect(latest).toBe(now);
    // Every point should have hashrate properties
    expect(result[0].hashrate_1m).toBeGreaterThan(0);
    expect(result[0].hashrate_5m).toBeGreaterThan(0);
    expect(result[0].hashrate_1hr).toBeGreaterThan(0);
  });

  it("should generate 24h timeline points covering past 24 hours", () => {
    const result = generateTimelineHistory("24h", [], mockLatest);
    expect(result.length).toBeGreaterThan(20);
    const earliest = result[0].timestamp;
    expect(now - earliest).toBeGreaterThanOrEqual(86000);
  });

  it("should generate 7d timeline points covering past 7 days", () => {
    const result = generateTimelineHistory("7d", [], mockLatest);
    expect(result.length).toBeGreaterThan(20);
    const earliest = result[0].timestamp;
    expect(now - earliest).toBeGreaterThanOrEqual(86400 * 6.5);
  });

  it("should preserve real recorded snapshots in the generated timeline", () => {
    const realSnapshot1: SnapshotRecord = {
      ...mockLatest,
      id: 8,
      timestamp: now - 300,
      hashrate_1m: 2.5, // unique marker
    };
    const realSnapshot2: SnapshotRecord = {
      ...mockLatest,
      id: 9,
      timestamp: now - 60,
      hashrate_1m: 2.8, // unique marker
    };

    const result = generateTimelineHistory("1h", [realSnapshot1, realSnapshot2], mockLatest);

    // Both real snapshots must be present
    const found1 = result.find((p) => p.timestamp === realSnapshot1.timestamp);
    const found2 = result.find((p) => p.timestamp === realSnapshot2.timestamp);

    expect(found1).toBeDefined();
    expect(found1?.hashrate_1m).toBe(2.5);
    expect(found2).toBeDefined();
    expect(found2?.hashrate_1m).toBe(2.8);

    // Result should be chronologically sorted
    for (let i = 1; i < result.length; i++) {
      expect(result[i].timestamp).toBeGreaterThanOrEqual(result[i - 1].timestamp);
    }
  });
});
