import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import fs from "fs";
import path from "path";
import { syncCKPoolStats, SYNC_INTERVAL_SECONDS } from "@/lib/sync";
import { closeDb, initDatabase, getLatestSnapshot, resetMemoryFallback } from "@/lib/db";

const TEST_DB_PATH = path.join(__dirname, "temp_sync_test.db");

describe("CKPool Sync Service", () => {
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
    vi.restoreAllMocks();
  });

  const mockPayload = {
    hashrate1m: "1.8T",
    hashrate5m: "1.84T",
    hashrate1hr: "1.75T",
    hashrate1d: "1.24T",
    hashrate7d: "1.11T",
    lastshare: 1791422670,
    workers: 2,
    shares: 1819992546,
    bestshare: 694365556.35,
    bestever: 694365556,
    authorised: 1785732216,
    worker: [
      {
        workername: "bc1qw7mwuw3nuvf4r9enm39ujzn26gs04gj6t9tx4h",
        hashrate1m: "1.8T",
        hashrate5m: "1.84T",
        hashrate1hr: "1.75T",
        hashrate1d: "1.24T",
        hashrate7d: "1.11T",
        lastshare: 1791422670,
        shares: 1819990968,
        bestshare: 694365556.35,
        bestever: 694365556,
        workers: 0,
      },
    ],
  };

  it("should successfully fetch from upstream, normalize, and store in database", async () => {
    // Mock global fetch
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockPayload,
    } as Response);

    const result = await syncCKPoolStats(true, TEST_DB_PATH);
    expect(result.success).toBe(true);
    expect(result.data).not.toBeNull();
    expect(result.data?.hashrate_1m).toBe(1.8);
    expect(result.data?.hashrate_5m).toBe(1.84);
    expect(result.data?.shares).toBe(1819992546);

    const latest = getLatestSnapshot(TEST_DB_PATH);
    expect(latest?.id).toBe(result.data?.id);
  });

  it("should gracefully handle upstream failure and fall back to cached record", async () => {
    // First, populate one record
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => mockPayload,
    } as Response);
    await syncCKPoolStats(true, TEST_DB_PATH);

    // Now mock fetch failure
    global.fetch = vi.fn().mockRejectedValueOnce(new Error("Network connection error"));

    const fallbackResult = await syncCKPoolStats(true, TEST_DB_PATH);
    expect(fallbackResult.success).toBe(false);
    expect(fallbackResult.cached).toBe(true);
    expect(fallbackResult.data).not.toBeNull();
    expect(fallbackResult.data?.raw_hashrate_1m).toBe("1.8T");
  });

  it("should have SYNC_INTERVAL_SECONDS configured to 60 seconds (1 minute)", () => {
    expect(SYNC_INTERVAL_SECONDS).toBe(60);
  });

  it("should return cached record if less than 1 minute has elapsed without force", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockPayload,
    } as Response);
    global.fetch = fetchMock;

    // First call: initial fetch
    const firstResult = await syncCKPoolStats(true, TEST_DB_PATH);
    expect(firstResult.cached).toBe(false);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    // Second call without force: should use cache (< 60 seconds)
    const secondResult = await syncCKPoolStats(false, TEST_DB_PATH);
    expect(secondResult.cached).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
