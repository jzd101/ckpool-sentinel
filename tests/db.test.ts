import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "fs";
import path from "path";
import { initDatabase, insertSnapshot, getLatestSnapshot, getSnapshotsByTimeframe, closeDb } from "@/lib/db";
import { NewSnapshotInput } from "@/lib/types";

const TEST_DB_PATH = path.join(__dirname, "temp_test_stats.db");

describe("SQLite Database Layer", () => {
  beforeEach(() => {
    closeDb(TEST_DB_PATH);
    if (fs.existsSync(TEST_DB_PATH)) {
      fs.unlinkSync(TEST_DB_PATH);
    }
    initDatabase(TEST_DB_PATH);
  });

  afterEach(() => {
    closeDb(TEST_DB_PATH);
    if (fs.existsSync(TEST_DB_PATH)) {
      fs.unlinkSync(TEST_DB_PATH);
    }
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
});
