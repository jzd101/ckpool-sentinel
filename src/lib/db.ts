import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import { NewSnapshotInput, SnapshotRecord, TimeframeOption } from "./types";

const DEFAULT_DB_PATH = path.join(process.cwd(), "data", "stats.db");

// Cache database connections by path
const dbConnections = new Map<string, Database.Database>();

export function getDb(dbPath: string = DEFAULT_DB_PATH): Database.Database {
  if (dbConnections.has(dbPath)) {
    return dbConnections.get(dbPath)!;
  }

  // Ensure parent directory exists
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  initDatabase(dbPath, db);
  dbConnections.set(dbPath, db);
  return db;
}

export function closeDb(dbPath: string = DEFAULT_DB_PATH): void {
  if (dbConnections.has(dbPath)) {
    const db = dbConnections.get(dbPath)!;
    try {
      db.close();
    } catch {
      // ignore
    }
    dbConnections.delete(dbPath);
  }
}

export function initDatabase(dbPath: string = DEFAULT_DB_PATH, existingDb?: Database.Database): void {
  const db = existingDb || (dbConnections.has(dbPath) ? dbConnections.get(dbPath)! : new Database(dbPath));

  db.exec(`
    CREATE TABLE IF NOT EXISTS snapshots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp INTEGER NOT NULL,
      hashrate_1m REAL NOT NULL,
      hashrate_5m REAL NOT NULL,
      hashrate_1hr REAL NOT NULL,
      hashrate_1d REAL NOT NULL,
      hashrate_7d REAL NOT NULL,
      raw_hashrate_1m TEXT NOT NULL,
      raw_hashrate_5m TEXT NOT NULL,
      raw_hashrate_1hr TEXT NOT NULL,
      raw_hashrate_1d TEXT NOT NULL,
      raw_hashrate_7d TEXT NOT NULL,
      workers_count INTEGER NOT NULL,
      shares INTEGER NOT NULL,
      bestshare REAL NOT NULL,
      bestever REAL NOT NULL,
      lastshare INTEGER NOT NULL,
      raw_json TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_snapshots_timestamp ON snapshots(timestamp DESC);
  `);
}

export function insertSnapshot(snapshot: NewSnapshotInput, dbPath: string = DEFAULT_DB_PATH): SnapshotRecord {
  const db = getDb(dbPath);
  const stmt = db.prepare(`
    INSERT INTO snapshots (
      timestamp,
      hashrate_1m,
      hashrate_5m,
      hashrate_1hr,
      hashrate_1d,
      hashrate_7d,
      raw_hashrate_1m,
      raw_hashrate_5m,
      raw_hashrate_1hr,
      raw_hashrate_1d,
      raw_hashrate_7d,
      workers_count,
      shares,
      bestshare,
      bestever,
      lastshare,
      raw_json
    ) VALUES (
      @timestamp,
      @hashrate_1m,
      @hashrate_5m,
      @hashrate_1hr,
      @hashrate_1d,
      @hashrate_7d,
      @raw_hashrate_1m,
      @raw_hashrate_5m,
      @raw_hashrate_1hr,
      @raw_hashrate_1d,
      @raw_hashrate_7d,
      @workers_count,
      @shares,
      @bestshare,
      @bestever,
      @lastshare,
      @raw_json
    )
  `);

  const info = stmt.run(snapshot);
  return {
    ...snapshot,
    id: Number(info.lastInsertRowid),
  };
}

export function getLatestSnapshot(dbPath: string = DEFAULT_DB_PATH): SnapshotRecord | null {
  const db = getDb(dbPath);
  const stmt = db.prepare("SELECT * FROM snapshots ORDER BY timestamp DESC, id DESC LIMIT 1");
  const row = stmt.get() as SnapshotRecord | undefined;
  return row || null;
}

export function getSnapshotsByTimeframe(
  timeframe: TimeframeOption,
  dbPath: string = DEFAULT_DB_PATH
): SnapshotRecord[] {
  const db = getDb(dbPath);
  const now = Math.floor(Date.now() / 1000);

  let seconds = 86400; // default 24h
  switch (timeframe) {
    case "1h":
      seconds = 3600;
      break;
    case "24h":
      seconds = 86400;
      break;
    case "7d":
      seconds = 86400 * 7;
      break;
    case "30d":
      seconds = 86400 * 30;
      break;
    case "all":
      seconds = Number.MAX_SAFE_INTEGER;
      break;
  }

  const cutoff = now - seconds;
  const stmt = db.prepare(`
    SELECT * FROM snapshots 
    WHERE timestamp >= ? 
    ORDER BY timestamp ASC
  `);
  return stmt.all(cutoff) as SnapshotRecord[];
}
