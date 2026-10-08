"use client";

import React, { useState, useMemo } from "react";
import {
  History,
  Clock,
  Layers,
  Award,
  Download,
  Search,
  ChevronLeft,
  ChevronRight,
  Radio,
  CheckCircle2,
  Sparkles,
  BarChart2,
} from "lucide-react";
import { HistoryPoint, SnapshotRecord, TimeframeOption } from "@/lib/types";
import { formatHashrateTh, formatNumberWithCommas, formatTimestampRelative } from "@/lib/hashrate";

interface HistoryTableProps {
  history: HistoryPoint[];
  snapshots?: SnapshotRecord[];
  timeframe: TimeframeOption;
  onTimeframeChange: (tf: TimeframeOption) => void;
  lastUpdated: number | null;
}

const TIMEFRAME_OPTIONS: { id: TimeframeOption; label: string }[] = [
  { id: "1h", label: "1H" },
  { id: "24h", label: "24H" },
  { id: "7d", label: "7D" },
  { id: "30d", label: "30D" },
  { id: "all", label: "ALL" },
];

export default function HistoryTable({
  history,
  snapshots = [],
  timeframe,
  onTimeframeChange,
  lastUpdated,
}: HistoryTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");
  const pageSize = 10;

  // Use snapshots if available; fallback to history points
  const rawList = useMemo(() => {
    if (snapshots && snapshots.length > 0) {
      return snapshots.map((s) => ({
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
        source: "background" as const,
      }));
    }
    return history;
  }, [snapshots, history]);

  // Sort descending by timestamp for newest first
  const sortedRecords = useMemo(() => {
    return [...rawList].sort((a, b) => b.timestamp - a.timestamp);
  }, [rawList]);

  // Filter by search query
  const filteredRecords = useMemo(() => {
    if (!searchTerm.trim()) return sortedRecords;
    const term = searchTerm.toLowerCase();
    return sortedRecords.filter((rec) => {
      const dateStr = new Date(rec.timestamp * 1000).toLocaleString().toLowerCase();
      const h1m = `${rec.hashrate_1m} th/s`.toLowerCase();
      const source = (rec.source || "").toLowerCase();
      return dateStr.includes(term) || h1m.includes(term) || source.includes(term);
    });
  }, [sortedRecords, searchTerm]);

  // Summary statistics for active timeframe
  const summary = useMemo(() => {
    if (filteredRecords.length === 0) {
      return { total: 0, avg: 0, min: 0, max: 0, latestShares: 0 };
    }
    const hashrates = filteredRecords.map((r) => r.hashrate_1m);
    const sum = hashrates.reduce((a, b) => a + b, 0);
    return {
      total: filteredRecords.length,
      avg: Number((sum / hashrates.length).toFixed(2)),
      min: Math.min(...hashrates),
      max: Math.max(...hashrates),
      latestShares: filteredRecords[0].shares || 0,
    };
  }, [filteredRecords]);

  // Pagination
  const totalPages = Math.ceil(filteredRecords.length / pageSize) || 1;
  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRecords.slice(start, start + pageSize);
  }, [filteredRecords, currentPage, pageSize]);

  // Export to CSV
  const handleExportCSV = () => {
    const headers = ["Timestamp", "Date Time", "Hashrate 1m (TH/s)", "Hashrate 5m (TH/s)", "Hashrate 1h (TH/s)", "Shares", "Best Share", "Workers", "Source"];
    const rows = filteredRecords.map((r) => [
      r.timestamp,
      `"${new Date(r.timestamp * 1000).toISOString()}"`,
      r.hashrate_1m,
      r.hashrate_5m,
      r.hashrate_1hr,
      r.shares || 0,
      r.bestshare || 0,
      r.workers_count || 0,
      `"${r.source || "background"}"`,
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `ckpool-fetch-history-${timeframe}-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export to JSON
  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(filteredRecords, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `ckpool-fetch-history-${timeframe}-${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="glass-panel rounded-2xl p-5 md:p-6 mb-6 border border-white/10 shadow-2xl relative overflow-hidden">
      {/* 1. Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-cyan-500/20 to-cyan-600/10 border border-cyan-500/30 text-cyan-400">
            <History className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                Background Ingestion History
              </h2>
              <span className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                <Radio className="w-2.5 h-2.5 text-emerald-400 animate-pulse" />
                1-Min Interval
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Chronological log of hashrate and worker telemetry captured by the background job
            </p>
          </div>
        </div>

        {/* Action Controls & Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Timeframe Selector */}
          <div className="flex items-center bg-slate-950/80 p-1 rounded-xl border border-slate-800 text-xs">
            {TIMEFRAME_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                onClick={() => {
                  onTimeframeChange(opt.id);
                  setCurrentPage(1);
                }}
                className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                  timeframe === opt.id
                    ? "bg-gradient-to-r from-cyan-500 to-cyan-600 text-white shadow-md shadow-cyan-500/20"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* View Mode Toggle */}
          <div className="hidden sm:flex items-center bg-slate-950/80 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setViewMode("table")}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                viewMode === "table" ? "bg-slate-800 text-cyan-300" : "text-slate-400 hover:text-white"
              }`}
            >
              Table
            </button>
            <button
              onClick={() => setViewMode("cards")}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                viewMode === "cards" ? "bg-slate-800 text-cyan-300" : "text-slate-400 hover:text-white"
              }`}
            >
              Cards
            </button>
          </div>

          {/* Export Dropdown / Buttons */}
          <button
            onClick={handleExportCSV}
            title="Export CSV"
            className="glass-button px-3 py-1.5 rounded-xl text-xs font-medium text-slate-300 hover:text-white flex items-center gap-1.5 border border-white/10 hover:border-cyan-400/30"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Export</span> CSV
          </button>
          <button
            onClick={handleExportJSON}
            title="Export JSON"
            className="glass-button px-2.5 py-1.5 rounded-xl text-xs font-medium text-slate-300 hover:text-white border border-white/10 hover:border-cyan-400/30"
          >
            JSON
          </button>
        </div>
      </div>

      {/* 2. Summary KPI Strip for Active Timeframe */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 flex flex-col">
          <span className="text-[10px] text-slate-500 uppercase tracking-wider font-mono">Snapshots ({timeframe.toUpperCase()})</span>
          <span className="text-lg font-bold text-white font-mono mt-0.5">{summary.total} records</span>
        </div>
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 flex flex-col">
          <span className="text-[10px] text-slate-500 uppercase tracking-wider font-mono">Average Hashrate</span>
          <span className="text-lg font-bold text-cyan-300 font-mono mt-0.5">{formatHashrateTh(summary.avg)}</span>
        </div>
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 flex flex-col">
          <span className="text-[10px] text-slate-500 uppercase tracking-wider font-mono">Peak (Max) Hashrate</span>
          <span className="text-lg font-bold text-amber-300 font-mono mt-0.5">{formatHashrateTh(summary.max)}</span>
        </div>
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 flex flex-col">
          <span className="text-[10px] text-slate-500 uppercase tracking-wider font-mono">Lowest (Min) Hashrate</span>
          <span className="text-lg font-bold text-emerald-400 font-mono mt-0.5">{formatHashrateTh(summary.min)}</span>
        </div>
      </div>

      {/* 3. Search Bar */}
      <div className="mb-4 relative">
        <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Filter snapshots by time, date, or hashrate..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1);
          }}
          className="w-full bg-slate-950/70 border border-slate-800/90 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 font-mono"
        />
      </div>

      {/* 4. Table View */}
      {viewMode === "table" ? (
        <div className="overflow-x-auto rounded-xl border border-slate-800/80 bg-slate-950/50">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-900/90 text-slate-400 border-b border-slate-800 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-2.5 px-3.5">Timestamp</th>
                <th className="py-2.5 px-3 text-cyan-300">1m Hashrate</th>
                <th className="py-2.5 px-3 text-amber-300">5m Hashrate</th>
                <th className="py-2.5 px-3 text-emerald-300">1h Average</th>
                <th className="py-2.5 px-3">Shares</th>
                <th className="py-2.5 px-3">Best Share</th>
                <th className="py-2.5 px-3 text-center">Workers</th>
                <th className="py-2.5 px-3 text-right">Method</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {paginatedRecords.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">
                    No snapshot records found for timeframe {timeframe.toUpperCase()}.
                  </td>
                </tr>
              ) : (
                paginatedRecords.map((r, idx) => {
                  const date = new Date(r.timestamp * 1000);
                  const isLatest = idx === 0 && currentPage === 1;
                  return (
                    <tr
                      key={r.timestamp + "-" + idx}
                      className={`hover:bg-slate-900/60 transition-colors ${
                        isLatest ? "bg-cyan-500/[0.04]" : ""
                      }`}
                    >
                      {/* Timestamp */}
                      <td className="py-2.5 px-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          {isLatest ? (
                            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping shrink-0" />
                          ) : (
                            <Clock className="w-3 h-3 text-slate-500 shrink-0" />
                          )}
                          <span className="font-semibold text-white">
                            {date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            {date.toLocaleDateString([], { month: "short", day: "numeric" })}
                          </span>
                        </div>
                      </td>

                      {/* 1m Hashrate */}
                      <td className="py-2.5 px-3 whitespace-nowrap font-bold text-cyan-300">
                        {formatHashrateTh(r.hashrate_1m)}
                      </td>

                      {/* 5m Hashrate */}
                      <td className="py-2.5 px-3 whitespace-nowrap font-medium text-amber-300">
                        {formatHashrateTh(r.hashrate_5m)}
                      </td>

                      {/* 1h Hashrate */}
                      <td className="py-2.5 px-3 whitespace-nowrap font-medium text-emerald-300">
                        {formatHashrateTh(r.hashrate_1hr)}
                      </td>

                      {/* Shares */}
                      <td className="py-2.5 px-3 whitespace-nowrap text-slate-300">
                        {formatNumberWithCommas(r.shares || 0)}
                      </td>

                      {/* Best Share */}
                      <td className="py-2.5 px-3 whitespace-nowrap text-slate-400">
                        {formatNumberWithCommas(Math.round(r.bestshare || 0))}
                      </td>

                      {/* Workers */}
                      <td className="py-2.5 px-3 whitespace-nowrap text-center">
                        <span className="px-2 py-0.5 rounded bg-slate-800/90 text-slate-300 text-[10px]">
                          {r.workers_count || 1} online
                        </span>
                      </td>

                      {/* Method */}
                      <td className="py-2.5 px-3 whitespace-nowrap text-right">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-medium inline-flex items-center gap-1 ${
                            r.source === "background"
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : r.source === "synthesized"
                              ? "bg-indigo-500/10 text-indigo-300 border border-indigo-500/20"
                              : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          }`}
                        >
                          <CheckCircle2 className="w-2.5 h-2.5" />
                          {r.source === "synthesized" ? "Anchor" : "Job Sync"}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      ) : (
        /* 5. Card Grid View */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {paginatedRecords.map((r, idx) => {
            const date = new Date(r.timestamp * 1000);
            return (
              <div
                key={r.timestamp + "-" + idx}
                className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3.5 hover:border-slate-700 transition-all font-mono text-xs flex flex-col gap-2"
              >
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-cyan-400" />
                    {date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    {formatTimestampRelative(r.timestamp)}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center py-1">
                  <div>
                    <span className="block text-[9px] text-slate-500 uppercase">1m</span>
                    <span className="font-bold text-cyan-300">{formatHashrateTh(r.hashrate_1m)}</span>
                  </div>
                  <div>
                    <span className="block text-[9px] text-slate-500 uppercase">5m</span>
                    <span className="font-bold text-amber-300">{formatHashrateTh(r.hashrate_5m)}</span>
                  </div>
                  <div>
                    <span className="block text-[9px] text-slate-500 uppercase">1h</span>
                    <span className="font-bold text-emerald-300">{formatHashrateTh(r.hashrate_1hr)}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-white/5 pt-2">
                  <span>Shares: <strong className="text-white">{formatNumberWithCommas(r.shares || 0)}</strong></span>
                  <span>Workers: <strong className="text-emerald-400">{r.workers_count || 1}</strong></span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 6. Pagination Footer */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/5 text-xs text-slate-400">
          <span>
            Showing <strong className="text-white">{(currentPage - 1) * pageSize + 1}</strong> -{" "}
            <strong className="text-white">{Math.min(currentPage * pageSize, filteredRecords.length)}</strong> of{" "}
            <strong className="text-white">{filteredRecords.length}</strong> snapshots
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-slate-800 bg-slate-900/80 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-mono text-xs px-2 text-slate-300">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-slate-800 bg-slate-900/80 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
