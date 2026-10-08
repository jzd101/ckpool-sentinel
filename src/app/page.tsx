"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Header from "@/components/Header";
import StatCards from "@/components/StatCards";
import HashrateChart from "@/components/HashrateChart";
import TimeframeComparison from "@/components/TimeframeComparison";
import WorkerList from "@/components/WorkerList";
import { DashboardApiResponse, TimeframeOption } from "@/lib/types";
import { AlertCircle, RefreshCw, Radio } from "lucide-react";

const DEFAULT_BTC_ADDRESS = "bc1qw7mwuw3nuvf4r9enm39ujzn26gs04gj6t9tx4h";

export default function DashboardPage() {
  const [data, setData] = useState<DashboardApiResponse | null>(null);
  const [timeframe, setTimeframe] = useState<TimeframeOption>("24h");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number>(60);

  const lastFetchRef = useRef<number>(Date.now());

  // Fetch statistics from API route
  const fetchStats = useCallback(
    async (selectedTf: TimeframeOption = timeframe, showLoading: boolean = false) => {
      if (showLoading) setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/stats?timeframe=${selectedTf}`, {
          cache: "no-store",
        });

        if (!res.ok) {
          throw new Error(`Failed to load data (HTTP ${res.status})`);
        }

        const json: DashboardApiResponse = await res.json();
        setData(json);
        setCountdown(json.nextSyncInSeconds);
        lastFetchRef.current = Date.now();
        try {
          localStorage.setItem("ckpool_dashboard_cache", JSON.stringify(json));
        } catch {
          // ignore
        }
      } catch (err: any) {
        console.error("Fetch stats error:", err);
        setError(err?.message || "Failed to connect to dashboard API");
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [timeframe]
  );

  // Trigger manual force refresh
  const handleForceRefresh = async () => {
    setIsRefreshing(true);
    setError(null);
    try {
      const res = await fetch("/api/sync", {
        method: "POST",
        cache: "no-store",
      });
      if (!res.ok) {
        throw new Error("Force refresh request failed");
      }
      // Re-fetch current timeframe stats
      await fetchStats(timeframe, false);
    } catch (err: any) {
      console.error("Force refresh error:", err);
      setError(err?.message || "Failed to synchronize with CKPool");
      setIsRefreshing(false);
    }
  };

  // Change active timeframe
  const handleTimeframeChange = (newTf: TimeframeOption) => {
    setTimeframe(newTf);
    fetchStats(newTf, false);
  };

  // Initial load: restore local cache if available, then fetch fresh
  useEffect(() => {
    try {
      const cached = localStorage.getItem("ckpool_dashboard_cache");
      if (cached) {
        const parsed: DashboardApiResponse = JSON.parse(cached);
        if (parsed?.latest) {
          setData(parsed);
          setIsLoading(false);
        }
      }
    } catch {
      // ignore
    }
    fetchStats("24h", true);
  }, []);

  // Countdown timer ticker & auto-sync logic
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          // Time expired: auto-sync in background
          fetchStats(timeframe, false);
          return 60;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [fetchStats, timeframe]);

  // Handle visibility change (reconnect when tab becomes visible again)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        const elapsedSinceLastFetch = (Date.now() - lastFetchRef.current) / 1000;
        if (elapsedSinceLastFetch >= 60) {
          fetchStats(timeframe, false);
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [fetchStats, timeframe]);

  return (
    <div className="min-h-screen p-3 sm:p-6 lg:p-8 max-w-7xl mx-auto flex flex-col justify-between">
      <div>
        {/* Error / Offline Alert Banner */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}. Displaying latest recorded local cache.</span>
            </div>
            <button
              onClick={() => fetchStats(timeframe, true)}
              className="px-2.5 py-1 rounded bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 transition-colors font-medium flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" /> Retry
            </button>
          </div>
        )}

        {/* 1. Header */}
        <Header
          btcAddress={DEFAULT_BTC_ADDRESS}
          nextSyncSeconds={countdown}
          isRefreshing={isRefreshing}
          lastUpdated={data?.lastUpdated || null}
          onForceRefresh={handleForceRefresh}
        />

        {/* 2. Key Metric Stat Cards */}
        <StatCards latest={data?.latest || null} />

        {/* 3. Main Hashrate Chart */}
        <HashrateChart
          history={data?.history || []}
          timeframe={timeframe}
          onTimeframeChange={handleTimeframeChange}
          isLoading={isLoading}
        />

        {/* 4. Bottom Grid: Timeframe Comparison & Worker Nodes */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TimeframeComparison latest={data?.latest || null} />
          <WorkerList workers={data?.latest?.parsedWorkers} />
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-8 pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <Radio className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
          <span>
            CKPool Sentinel Dashboard &bull; Auto-syncing every 1 minute from{" "}
            <a
              href="https://raw.stats.ckpool.org/users/bc1qw7mwuw3nuvf4r9enm39ujzn26gs04gj6t9tx4h"
              target="_blank"
              rel="noreferrer"
              className="text-amber-400 hover:underline"
            >
              raw.stats.ckpool.org
            </a>
          </span>
        </div>
        <div className="font-mono text-[11px] text-slate-600">
          Last Synced:{" "}
          {data?.lastUpdated ? new Date(data.lastUpdated * 1000).toLocaleTimeString() : "Never"}
        </div>
      </footer>
    </div>
  );
}
