import { HistoryPoint, SnapshotRecord, TimeframeOption } from "./types";

interface TimeframeConfig {
  windowSeconds: number;
  stepSeconds: number;
}

const TIMEFRAME_CONFIGS: Record<TimeframeOption, TimeframeConfig> = {
  "1h": { windowSeconds: 3600, stepSeconds: 120 }, // 30 points
  "24h": { windowSeconds: 86400, stepSeconds: 1800 }, // 48 points
  "7d": { windowSeconds: 86400 * 7, stepSeconds: 14400 }, // 42 points
  "30d": { windowSeconds: 86400 * 30, stepSeconds: 43200 }, // 60 points
  all: { windowSeconds: 86400 * 30, stepSeconds: 43200 }, // 60 points
};

/**
 * Generates a complete chronological history timeline for any timeframe.
 * Prioritizes actual background job snapshots and fills any unobserved time
 * prior to the earliest recorded snapshot with realistic points anchored to
 * CKPool's moving average metrics.
 */
export function generateTimelineHistory(
  timeframe: TimeframeOption,
  realSnapshots: SnapshotRecord[],
  latest: SnapshotRecord | null
): HistoryPoint[] {
  if (!latest) return [];

  const config = TIMEFRAME_CONFIGS[timeframe] || TIMEFRAME_CONFIGS["24h"];
  const now = latest.timestamp;
  const windowStart = now - config.windowSeconds;

  // Filter real snapshots within the requested timeframe window
  const validReal = realSnapshots
    .filter((s) => s.timestamp >= windowStart && s.timestamp <= now)
    .sort((a, b) => a.timestamp - b.timestamp);

  // If latest snapshot is not yet in validReal, include it
  const hasLatest = validReal.some((s) => Math.abs(s.timestamp - now) < 30);
  if (!hasLatest) {
    validReal.push(latest);
    validReal.sort((a, b) => a.timestamp - b.timestamp);
  }

  const earliestRealTs = validReal.length > 0 ? validReal[0].timestamp : now;

  // Map real snapshots to HistoryPoint format
  const realPoints: HistoryPoint[] = validReal.map((s) => ({
    id: s.id,
    timestamp: s.timestamp,
    hashrate_1m: s.hashrate_1m,
    hashrate_5m: s.hashrate_5m,
    hashrate_1hr: s.hashrate_1hr,
    hashrate_1d: s.hashrate_1d,
    hashrate_7d: s.hashrate_7d,
    raw_hashrate_1m: s.raw_hashrate_1m,
    shares: s.shares,
    bestshare: s.bestshare,
    workers_count: s.workers_count,
    source: "background",
  }));

  // If real snapshots already span the entire window, return them directly
  if (earliestRealTs <= windowStart + config.stepSeconds) {
    return realPoints;
  }

  // Generate historical baseline points from windowStart to earliestRealTs
  const syntheticPoints: HistoryPoint[] = [];

  for (let t = windowStart; t < earliestRealTs - config.stepSeconds / 2; t += config.stepSeconds) {
    // Progress ratio: 0 at windowStart, 1 at now
    const progress = Math.max(0, Math.min(1, (t - windowStart) / config.windowSeconds));

    let base1m: number;
    let base5m: number;
    let base1hr: number;

    switch (timeframe) {
      case "1h": {
        base1hr = latest.hashrate_1hr;
        base5m = latest.hashrate_1hr + (latest.hashrate_5m - latest.hashrate_1hr) * progress;
        base1m = latest.hashrate_1hr + (latest.hashrate_1m - latest.hashrate_1hr) * Math.pow(progress, 1.5);
        break;
      }
      case "24h": {
        base1hr = latest.hashrate_1d + (latest.hashrate_1hr - latest.hashrate_1d) * progress;
        base5m = base1hr * (latest.hashrate_5m / (latest.hashrate_1hr || 1));
        base1m = base1hr * (latest.hashrate_1m / (latest.hashrate_1hr || 1));
        break;
      }
      case "7d": {
        base1hr = latest.hashrate_7d + (latest.hashrate_1d - latest.hashrate_7d) * progress;
        base5m = base1hr;
        base1m = base1hr;
        break;
      }
      case "30d":
      case "all":
      default: {
        base1hr = latest.hashrate_7d;
        base5m = latest.hashrate_7d;
        base1m = latest.hashrate_7d;
        break;
      }
    }

    // Natural mining variance (ASIC hash jitter)
    const wave = Math.sin(t / (config.stepSeconds * 2.5)) * 0.04 + Math.cos(t / (config.stepSeconds * 5.1)) * 0.02;
    const waveFast = Math.sin(t / (config.stepSeconds * 1.1)) * 0.06;

    const h1m = Math.max(0.1, Number((base1m * (1 + waveFast)).toFixed(2)));
    const h5m = Math.max(0.1, Number((base5m * (1 + wave * 0.6)).toFixed(2)));
    const h1hr = Math.max(0.1, Number((base1hr * (1 + wave * 0.3)).toFixed(2)));

    const timeDelta = now - t;
    const sharesPerSec = 20;
    const estimatedShares = Math.max(0, Math.floor(latest.shares - timeDelta * sharesPerSec));

    syntheticPoints.push({
      timestamp: t,
      hashrate_1m: h1m,
      hashrate_5m: h5m,
      hashrate_1hr: h1hr,
      hashrate_1d: latest.hashrate_1d,
      hashrate_7d: latest.hashrate_7d,
      raw_hashrate_1m: `${h1m}T`,
      shares: estimatedShares,
      bestshare: latest.bestshare,
      workers_count: latest.workers_count,
      source: "synthesized",
    });
  }

  // Combine synthetic points and real points, sorted chronologically
  return [...syntheticPoints, ...realPoints].sort((a, b) => a.timestamp - b.timestamp);
}
