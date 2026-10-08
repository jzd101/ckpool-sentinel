import { NextRequest, NextResponse } from "next/server";
import { getLatestSnapshot, getSnapshotsByTimeframe } from "@/lib/db";
import { syncCKPoolStats, SYNC_INTERVAL_SECONDS } from "@/lib/sync";
import { DashboardApiResponse, RawCKPoolUserStats, TimeframeOption } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const timeframe = (searchParams.get("timeframe") as TimeframeOption) || "24h";

    let latest = getLatestSnapshot();
    const now = Math.floor(Date.now() / 1000);

    // If cold start (no records) or data is stale (> 5 minutes), auto-sync
    if (!latest || now - latest.timestamp >= SYNC_INTERVAL_SECONDS) {
      const syncResult = await syncCKPoolStats(false);
      if (syncResult.data) {
        latest = syncResult.data;
      }
    }

    const historyRecords = getSnapshotsByTimeframe(timeframe);

    // If only 1 record exists in history (new installation), create an anchor baseline
    // so the chart can draw an area rather than an isolated invisible dot
    let chartHistory = historyRecords.map((r) => ({
      timestamp: r.timestamp,
      hashrate_1m: r.hashrate_1m,
      hashrate_5m: r.hashrate_5m,
      hashrate_1hr: r.hashrate_1hr,
      hashrate_1d: r.hashrate_1d,
      hashrate_7d: r.hashrate_7d,
    }));

    if (chartHistory.length === 1 && latest) {
      // Add a baseline 5 minutes prior with same current averages
      chartHistory = [
        {
          timestamp: latest.timestamp - 300,
          hashrate_1m: latest.hashrate_1m,
          hashrate_5m: latest.hashrate_5m,
          hashrate_1hr: latest.hashrate_1hr,
          hashrate_1d: latest.hashrate_1d,
          hashrate_7d: latest.hashrate_7d,
        },
        chartHistory[0],
      ];
    }

    // Parse worker details from raw_json
    let parsedWorkers = undefined;
    if (latest?.raw_json) {
      try {
        const rawObj: RawCKPoolUserStats = JSON.parse(latest.raw_json);
        parsedWorkers = rawObj.worker;
      } catch {
        // ignore parse error
      }
    }

    const lastUpdated = latest ? latest.timestamp : null;
    const elapsed = lastUpdated ? now - lastUpdated : SYNC_INTERVAL_SECONDS;
    const nextSyncInSeconds = Math.max(0, SYNC_INTERVAL_SECONDS - elapsed);

    const responseData: DashboardApiResponse = {
      latest: latest ? { ...latest, parsedWorkers } : null,
      history: chartHistory,
      timeframe,
      lastUpdated,
      nextSyncInSeconds,
    };

    return NextResponse.json(responseData);
  } catch (error: any) {
    console.error("API /api/stats error:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
