"use client";

import React, { useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { TrendingUp, BarChart3, Filter } from "lucide-react";
import { TimeframeOption } from "@/lib/types";
import { formatHashrateTh } from "@/lib/hashrate";

interface HistoryPoint {
  timestamp: number;
  hashrate_1m: number;
  hashrate_5m: number;
  hashrate_1hr: number;
  hashrate_1d: number;
  hashrate_7d: number;
}

interface HashrateChartProps {
  history: HistoryPoint[];
  timeframe: TimeframeOption;
  onTimeframeChange: (tf: TimeframeOption) => void;
  isLoading: boolean;
}

const TIMEFRAME_OPTIONS: { id: TimeframeOption; label: string }[] = [
  { id: "1h", label: "1H" },
  { id: "24h", label: "24H" },
  { id: "7d", label: "7D" },
  { id: "30d", label: "30D" },
  { id: "all", label: "ALL" },
];

export default function HashrateChart({
  history,
  timeframe,
  onTimeframeChange,
  isLoading,
}: HashrateChartProps) {
  const [visibleSeries, setVisibleSeries] = useState({
    "1m": true,
    "5m": true,
    "1hr": true,
  });

  const toggleSeries = (key: "1m" | "5m" | "1hr") => {
    setVisibleSeries((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Format timestamp for X-Axis based on timeframe
  const formatXAxis = (ts: number) => {
    const d = new Date(ts * 1000);
    if (timeframe === "1h") {
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }
    if (timeframe === "24h") {
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }
    return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:00`;
  };

  // Custom Tooltip component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const d = new Date(label * 1000);
      return (
        <div className="glass-panel p-3.5 rounded-xl border border-white/20 shadow-2xl bg-slate-950/90 text-xs">
          <p className="text-slate-400 font-mono mb-2 border-b border-white/10 pb-1.5">
            {d.toLocaleString([], {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            })}
          </p>
          <div className="space-y-1.5 font-mono">
            {payload.map((entry: any, index: number) => (
              <div key={index} className="flex items-center justify-between gap-4">
                <span className="flex items-center gap-1.5" style={{ color: entry.color }}>
                  <span
                    className="w-2 h-2 rounded-full inline-block"
                    style={{ backgroundColor: entry.color }}
                  />
                  {entry.name}:
                </span>
                <span className="font-bold text-white">
                  {formatHashrateTh(Number(entry.value))}
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="glass-panel rounded-2xl p-5 md:p-6 mb-6 border border-white/10 shadow-2xl relative overflow-hidden">
      {/* Header with Title & Timeframe Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-amber-400" />
            Hashrate Performance Timeline
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time hashrate fluctuations recorded at 5-minute intervals
          </p>
        </div>

        {/* Timeframe Buttons & Series Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Series Toggle Pills */}
          <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => toggleSeries("1m")}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                visibleSeries["1m"]
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-sm shadow-cyan-500/20"
                  : "text-slate-500 hover:text-slate-300"
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              1m
            </button>
            <button
              onClick={() => toggleSeries("5m")}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                visibleSeries["5m"]
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow-sm shadow-amber-500/20"
                  : "text-slate-500 hover:text-slate-300"
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              5m
            </button>
            <button
              onClick={() => toggleSeries("1hr")}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                visibleSeries["1hr"]
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-sm shadow-emerald-500/20"
                  : "text-slate-500 hover:text-slate-300"
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              1h
            </button>
          </div>

          {/* Timeframe Selector Pills */}
          <div className="flex items-center bg-slate-950/80 p-1 rounded-xl border border-slate-800 text-xs">
            {TIMEFRAME_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                onClick={() => onTimeframeChange(opt.id)}
                disabled={isLoading}
                className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                  timeframe === opt.id
                    ? "bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-md shadow-amber-500/20"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Chart Area */}
      <div className="w-full h-72 md:h-80">
        {history.length === 0 ? (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-500">
            <BarChart3 className="w-8 h-8 mb-2 opacity-50 animate-bounce" />
            <span className="text-sm">Recording initial hashrate metrics...</span>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={history} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                {/* 1m Cyan Gradient */}
                <linearGradient id="gradient1m" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00F2FE" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#00F2FE" stopOpacity={0.0} />
                </linearGradient>

                {/* 5m Amber Gradient */}
                <linearGradient id="gradient5m" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F7931A" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#F7931A" stopOpacity={0.0} />
                </linearGradient>

                {/* 1hr Emerald Gradient */}
                <linearGradient id="gradient1hr" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />

              <XAxis
                dataKey="timestamp"
                tickFormatter={formatXAxis}
                stroke="#64748B"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: "#334155" }}
              />

              <YAxis
                stroke="#64748B"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: "#334155" }}
                tickFormatter={(val) => `${val} T`}
                domain={["auto", "auto"]}
              />

              <Tooltip content={<CustomTooltip />} />

              {visibleSeries["1m"] && (
                <Area
                  type="monotone"
                  dataKey="hashrate_1m"
                  name="1m Hashrate"
                  stroke="#00F2FE"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#gradient1m)"
                />
              )}

              {visibleSeries["5m"] && (
                <Area
                  type="monotone"
                  dataKey="hashrate_5m"
                  name="5m Hashrate"
                  stroke="#F7931A"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#gradient5m)"
                />
              )}

              {visibleSeries["1hr"] && (
                <Area
                  type="monotone"
                  dataKey="hashrate_1hr"
                  name="1h Average"
                  stroke="#10B981"
                  strokeWidth={1.5}
                  fillOpacity={1}
                  fill="url(#gradient1hr)"
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
