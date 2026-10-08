import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import { NewSnapshotInput, SnapshotRecord, TimeframeOption } from "./types";

const inMemorySnapshots: SnapshotRecord[] = [];
let memoryIdCounter = 1;
let useMemoryFallback = false;

// Cache database connections by path
const dbConnections = new Map<string, Database.Database>();

export function getDefaultDbPath(): string {
  if (process.env.DB_PATH) {
    return process.env.DB_PATH;
  }
  // On Vercel / AWS Lambda, the root deployment directory is read-only (/var/task).
  // Only /tmp is writable for serverless functions.
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    return path.join("/tmp", "stats.db");
  }
  return path.join(process.cwd(), "data", "stats.db");
}

export function resetMemoryFallback(): void {
  useMemoryFallback = false;
  inMemorySnapshots.length = 0;
  memoryIdCounter = 1;
}

export function getDb(dbPath?: string): Database.Database | null {
  if (useMemoryFallback) {
    return null;
  }

  const resolvedPath = dbPath || getDefaultDbPath();

  if (dbConnections.has(resolvedPath)) {
    return dbConnections.get(resolvedPath)!;
  }

  try {
    // Ensure parent directory exists
    const dir = path.dirname(resolvedPath);
    if (dir !== "/tmp" && !fs.existsSync(dir)) {
      try {
        fs.mkdirSync(dir, { recursive: true });
      } catch (mkdirErr) {
        console.warn(`Could not create directory ${dir}, falling back to /tmp/stats.db`, mkdirErr);
        return getDb(path.join("/tmp", "stats.db"));
      }
    }

    const db = new Database(resolvedPath);
    try {
      db.pragma("journal_mode = WAL");
    } catch {
      // WAL pragma might not be supported on all filesystems; ignore
    }

    initDatabase(resolvedPath, db);
    dbConnections.set(resolvedPath, db);
    return db;
  } catch (error) {
    console.warn("Failed to initialize SQLite database, switching to in-memory fallback:", error);
    useMemoryFallback = true;
    return null;
  }
}

export function closeDb(dbPath?: string): void {
  const resolvedPath = dbPath || getDefaultDbPath();
  if (dbConnections.has(resolvedPath)) {
    const db = dbConnections.get(resolvedPath)!;
    try {
      db.close();
    } catch {
      // ignore
    }
    dbConnections.delete(resolvedPath);
  }
}

export function initDatabase(dbPath?: string, existingDb?: Database.Database): void {
  const resolvedPath = dbPath || getDefaultDbPath();
  const db = existingDb || (dbConnections.has(resolvedPath) ? dbConnections.get(resolvedPath)! : getDb(resolvedPath));
  if (!db) return;

  try {
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
  } catch (err) {
    console.warn("Failed to execute initDatabase schema:", err);
  }
}

export function insertSnapshot(snapshot: NewSnapshotInput, dbPath?: string): SnapshotRecord {
  const resolvedPath = dbPath || getDefaultDbPath();
  const db = getDb(resolvedPath);

  if (db) {
    try {
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
      const record: SnapshotRecord = {
        ...snapshot,
        id: Number(info.lastInsertRowid),
      };
      inMemorySnapshots.push(record);
      return record;
    } catch (err) {
      console.warn("SQLite insert failed, falling back to memory:", err);
    }
  }

  // Fallback to in-memory store
  const record: SnapshotRecord = {
    ...snapshot,
    id: memoryIdCounter++,
  };
  inMemorySnapshots.push(record);
  return record;
}

export function getLatestSnapshot(dbPath?: string): SnapshotRecord | null {
  const resolvedPath = dbPath || getDefaultDbPath();
  const db = getDb(resolvedPath);

  if (db) {
    try {
      const stmt = db.prepare("SELECT * FROM snapshots ORDER BY timestamp DESC, id DESC LIMIT 1");
      const row = stmt.get() as SnapshotRecord | undefined;
      if (row) return row;
    } catch (err) {
      console.warn("SQLite getLatestSnapshot failed, falling back to memory:", err);
    }
  }

  if (inMemorySnapshots.length > 0) {
    return inMemorySnapshots[inMemorySnapshots.length - 1];
  }
  return null;
}

export function getSnapshotsByTimeframe(
  timeframe: TimeframeOption,
  dbPath?: string
): SnapshotRecord[] {
  const resolvedPath = dbPath || getDefaultDbPath();
  const db = getDb(resolvedPath);
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

  if (db) {
    try {
      const stmt = db.prepare(`
        SELECT * FROM snapshots 
        WHERE timestamp >= ? 
        ORDER BY timestamp ASC
      `);
      return stmt.all(cutoff) as SnapshotRecord[];
    } catch (err) {
      console.warn("SQLite getSnapshotsByTimeframe failed, falling back to memory:", err);
    }
  }

  return inMemorySnapshots
    .filter((s) => s.timestamp >= cutoff)
    .sort((a, b) => a.timestamp - b.timestamp);
}
