import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "fs";
import path from "path";
import {
  initDatabase,
  insertSnapshot,
  getLatestSnapshot,
  getSnapshotsByTimeframe,
  closeDb,
  getDefaultDbPath,
  resetMemoryFallback,
} from "@/lib/db";
import { NewSnapshotInput } from "@/lib/types";

const TEST_DB_PATH = path.join(__dirname, "temp_test_stats.db");

describe("SQLite Database Layer", () => {
  beforeEach(() => {
    closeDb(TEST_DB_PATH);
    if (fs.existsSync(TEST_DB_PATH)) {
      fs.unlinkSync(TEST_DB_PATH);
    }
    const jsonPath = TEST_DB_PATH.replace(/\.db$/, ".json");
    if (fs.existsSync(jsonPath)) {
      fs.unlinkSync(jsonPath);
    }
    resetMemoryFallback();
    initDatabase(TEST_DB_PATH);
  });

  afterEach(() => {
    closeDb(TEST_DB_PATH);
    if (fs.existsSync(TEST_DB_PATH)) {
      fs.unlinkSync(TEST_DB_PATH);
    }
    const jsonPath = TEST_DB_PATH.replace(/\.db$/, ".json");
    if (fs.existsSync(jsonPath)) {
      fs.unlinkSync(jsonPath);
    }
    resetMemoryFallback();
  });

  const sampleInput: NewSnapshotInput = {
    timestamp: Math.floor(Date.now() / 1000),
    hashrate_1m: 1.8,
    hashrate_5m: 1.84,
    hashrate_1hr: 1.75,
    hashrate_1d: 1.24,
    hashrate_7d: 1.11,
    raw_hashrate_1m: "1.8T",
    raw_hashrate_5m: "1.84T",
    raw_hashrate_1hr: "1.75T",
    raw_hashrate_1d: "1.24T",
    raw_hashrate_7d: "1.11T",
    workers_count: 2,
    shares: 1819992546,
    bestshare: 694365556.35,
    bestever: 694365556,
    lastshare: 1791422670,
    raw_json: JSON.stringify({ test: true }),
  };

  it("should insert a snapshot and retrieve latest", () => {
    const inserted = insertSnapshot(sampleInput, TEST_DB_PATH);
    expect(inserted.id).toBeDefined();
    expect(inserted.hashrate_1m).toBe(1.8);

    const latest = getLatestSnapshot(TEST_DB_PATH);
    expect(latest).not.toBeNull();
    expect(latest?.id).toBe(inserted.id);
    expect(latest?.raw_hashrate_5m).toBe("1.84T");
  });

  it("should filter snapshots by timeframe", () => {
    const now = Math.floor(Date.now() / 1000);

    // Insert 3 snapshots at different times
    insertSnapshot({ ...sampleInput, timestamp: now - 300 }, TEST_DB_PATH); // 5m ago
    insertSnapshot({ ...sampleInput, timestamp: now - 7200 }, TEST_DB_PATH); // 2 hours ago
    insertSnapshot({ ...sampleInput, timestamp: now - 86400 * 2 }, TEST_DB_PATH); // 2 days ago

    const last1h = getSnapshotsByTimeframe("1h", TEST_DB_PATH);
    expect(last1h.length).toBe(1);

    const last24h = getSnapshotsByTimeframe("24h", TEST_DB_PATH);
    expect(last24h.length).toBe(2);

    const last7d = getSnapshotsByTimeframe("7d", TEST_DB_PATH);
    expect(last7d.length).toBe(3);
  });

  it("should resolve default DB path to /tmp/stats.db in Vercel environment", () => {
    const originalVercel = process.env.VERCEL;
    try {
      process.env.VERCEL = "1";
      expect(getDefaultDbPath()).toBe("/tmp/stats.db");
    } finally {
      if (originalVercel !== undefined) {
        process.env.VERCEL = originalVercel;
      } else {
        delete process.env.VERCEL;
      }
    }
  });

  it("should seamlessly store and retrieve snapshots via in-memory fallback", () => {
    resetMemoryFallback();

    // Use an uncreatable directory to force fallback
    const impossiblePath = "/uncreatable-non-existent-directory/stats.db";
    const inserted = insertSnapshot(sampleInput, impossiblePath);
    expect(inserted.id).toBeDefined();

    const latest = getLatestSnapshot(impossiblePath);
    expect(latest).not.toBeNull();
    expect(latest?.shares).toBe(sampleInput.shares);

    const history = getSnapshotsByTimeframe("24h", impossiblePath);
    expect(history.length).toBeGreaterThanOrEqual(1);

    resetMemoryFallback();
  });

  it("should isolate snapshots by address and filter accordingly", () => {
    const now = Math.floor(Date.now() / 1000);
    const addr1 = "bc1qcustomaddress111111111111111111111111";
    const addr2 = "bc1qcustomaddress222222222222222222222222";

    insertSnapshot({ ...sampleInput, timestamp: now - 100, address: addr1, shares: 100 }, TEST_DB_PATH);
    insertSnapshot({ ...sampleInput, timestamp: now - 50, address: addr2, shares: 200 }, TEST_DB_PATH);

    const latestAddr1 = getLatestSnapshot(TEST_DB_PATH, addr1);
    expect(latestAddr1).not.toBeNull();
    expect(latestAddr1?.address).toBe(addr1);
    expect(latestAddr1?.shares).toBe(100);

    const latestAddr2 = getLatestSnapshot(TEST_DB_PATH, addr2);
    expect(latestAddr2).not.toBeNull();
    expect(latestAddr2?.address).toBe(addr2);
    expect(latestAddr2?.shares).toBe(200);

    const historyAddr1 = getSnapshotsByTimeframe("24h", TEST_DB_PATH, addr1);
    expect(historyAddr1.length).toBe(1);
    expect(historyAddr1[0].address).toBe(addr1);

    const historyAddr2 = getSnapshotsByTimeframe("24h", TEST_DB_PATH, addr2);
    expect(historyAddr2.length).toBe(1);
    expect(historyAddr2[0].address).toBe(addr2);
  });
});
