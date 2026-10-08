import { NextRequest, NextResponse, after } from "next/server";
import { getLatestSnapshot, getSnapshotsByTimeframe } from "@/lib/db";
import { syncCKPoolStats, SYNC_INTERVAL_SECONDS } from "@/lib/sync";
import { generateTimelineHistory } from "@/lib/timeline";
import { DashboardApiResponse, RawCKPoolUserStats, TimeframeOption } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const timeframe = (searchParams.get("timeframe") as TimeframeOption) || "24h";

    let latest = getLatestSnapshot();
    const now = Math.floor(Date.now() / 1000);

    // If cold start (no records exist), perform initial sync to populate first record
    if (!latest) {
      const syncResult = await syncCKPoolStats(true);
      if (syncResult.data) {
        latest = syncResult.data;
      }
    } else if (now - latest.timestamp >= SYNC_INTERVAL_SECONDS) {
      // Data is older than 1 minute: DO NOT block user request.
      // Dispatch background sync job via Next.js 15 after()
      after(async () => {
        try {
          await syncCKPoolStats(true);
        } catch (bgErr) {
          console.warn("Background CKPool sync job error:", bgErr);
        }
      });
    }

    const historyRecords = getSnapshotsByTimeframe(timeframe);
    const chartHistory = generateTimelineHistory(timeframe, historyRecords, latest);

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
      snapshots: historyRecords,
      timeframe,
      lastUpdated,
      nextSyncInSeconds,
    };

    return NextResponse.json(responseData);
  } catch (error: any) {
    console.error("API /api/stats error:", error);

    // Disaster recovery: try direct fetch from CKPool if DB operations threw
    try {
      const syncResult = await syncCKPoolStats(true);
      if (syncResult.data) {
        let parsedWorkers = undefined;
        try {
          const rawObj = JSON.parse(syncResult.data.raw_json);
          parsedWorkers = rawObj.worker;
        } catch {
          // ignore
        }
        const fallbackHistory = generateTimelineHistory("24h", [], syncResult.data);
        return NextResponse.json({
          latest: { ...syncResult.data, parsedWorkers },
          history: fallbackHistory,
          snapshots: [syncResult.data],
          timeframe: "24h",
          lastUpdated: syncResult.data.timestamp,
          nextSyncInSeconds: SYNC_INTERVAL_SECONDS,
          isCachedFallback: true,
        });
      }
    } catch {
      // ignore
    }

    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
