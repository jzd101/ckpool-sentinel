/**
 * Types for CKPool user statistics, database records, and API responses.
 */

export interface RawWorkerStats {
  workername: string;
  hashrate1m: string;
  hashrate5m: string;
  hashrate1hr: string;
  hashrate1d: string;
  hashrate7d: string;
  lastshare: number;
  shares: number;
  bestshare: number;
  bestever: number;
  workers: number;
}

export interface RawCKPoolUserStats {
  hashrate1m: string;
  hashrate5m: string;
  hashrate1hr: string;
  hashrate1d: string;
  hashrate7d: string;
  lastshare: number;
  workers: number;
  shares: number;
  bestshare: number;
  bestever: number;
  authorised: number;
  worker?: RawWorkerStats[];
}

export interface SnapshotRecord {
  id: number;
  timestamp: number;
  address?: string;
  hashrate_1m: number;
  hashrate_5m: number;
  hashrate_1hr: number;
  hashrate_1d: number;
  hashrate_7d: number;
  raw_hashrate_1m: string;
  raw_hashrate_5m: string;
  raw_hashrate_1hr: string;
  raw_hashrate_1d: string;
  raw_hashrate_7d: string;
  workers_count: number;
  shares: number;
  bestshare: number;
  bestever: number;
  lastshare: number;
  raw_json: string;
}

export type NewSnapshotInput = Omit<SnapshotRecord, "id">;

export type TimeframeOption = "1h" | "24h" | "7d" | "30d" | "all";

export interface HistoryPoint {
  id?: number;
  timestamp: number;
  hashrate_1m: number;
  hashrate_5m: number;
  hashrate_1hr: number;
  hashrate_1d: number;
  hashrate_7d: number;
  raw_hashrate_1m?: string;
  shares?: number;
  bestshare?: number;
  workers_count?: number;
  source?: "background" | "manual" | "synthesized";
}

export interface DashboardApiResponse {
  latest: (SnapshotRecord & { parsedWorkers?: RawWorkerStats[] }) | null;
  history: HistoryPoint[];
  snapshots?: SnapshotRecord[];
  timeframe: TimeframeOption;
  lastUpdated: number | null;
  nextSyncInSeconds: number;
  isCachedFallback?: boolean;
  address?: string;
}
