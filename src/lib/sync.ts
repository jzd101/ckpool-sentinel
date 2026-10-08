import { insertSnapshot, getLatestSnapshot } from "./db";
import { parseHashrateToTh } from "./hashrate";
import { NewSnapshotInput, RawCKPoolUserStats, SnapshotRecord } from "./types";

export const CKPOOL_USER_URL = "https://raw.stats.ckpool.org/users/bc1qw7mwuw3nuvf4r9enm39ujzn26gs04gj6t9tx4h";
export const SYNC_INTERVAL_SECONDS = 300; // 5 minutes

export interface SyncResult {
  success: boolean;
  data: SnapshotRecord | null;
  error?: string;
  cached?: boolean;
}

export async function syncCKPoolStats(force: boolean = false, dbPath?: string): Promise<SyncResult> {
  const latest = getLatestSnapshot(dbPath);
  const now = Math.floor(Date.now() / 1000);

  // If not forced and synced recently (< 5 minutes), return latest cached
  if (!force && latest && now - latest.timestamp < SYNC_INTERVAL_SECONDS) {
    return {
      success: true,
      data: latest,
      cached: true,
    };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const res = await fetch(CKPOOL_USER_URL, {
      headers: {
        "User-Agent": "CKPool-Sentinel-Dashboard/1.0",
        Accept: "application/json",
      },
      cache: "no-store",
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`Upstream returned HTTP ${res.status}: ${res.statusText}`);
    }

    const json: RawCKPoolUserStats = await res.json();

    const newSnapshot: NewSnapshotInput = {
      timestamp: now,
      hashrate_1m: parseHashrateToTh(json.hashrate1m),
      hashrate_5m: parseHashrateToTh(json.hashrate5m),
      hashrate_1hr: parseHashrateToTh(json.hashrate1hr),
      hashrate_1d: parseHashrateToTh(json.hashrate1d),
      hashrate_7d: parseHashrateToTh(json.hashrate7d),
      raw_hashrate_1m: String(json.hashrate1m || "0"),
      raw_hashrate_5m: String(json.hashrate5m || "0"),
      raw_hashrate_1hr: String(json.hashrate1hr || "0"),
      raw_hashrate_1d: String(json.hashrate1d || "0"),
      raw_hashrate_7d: String(json.hashrate7d || "0"),
      workers_count: Number(json.workers || 0),
      shares: Number(json.shares || 0),
      bestshare: Number(json.bestshare || 0),
      bestever: Number(json.bestever || 0),
      lastshare: Number(json.lastshare || 0),
      raw_json: JSON.stringify(json),
    };

    let record: SnapshotRecord;
    try {
      record = insertSnapshot(newSnapshot, dbPath);
    } catch (insertErr) {
      console.warn("Could not insert snapshot to DB, using raw snapshot:", insertErr);
      record = { ...newSnapshot, id: 1 };
    }

    return {
      success: true,
      data: record,
      cached: false,
    };
  } catch (error: any) {
    console.error("Failed to sync from CKPool:", error?.message || error);
    return {
      success: false,
      data: latest,
      cached: true,
      error: error?.message || "Failed to reach CKPool server",
    };
  }
}
