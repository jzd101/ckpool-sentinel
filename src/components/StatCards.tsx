"use client";

import React from "react";
import { Zap, Layers, Trophy, Server, ArrowUpRight, ShieldCheck, Flame } from "lucide-react";
import { SnapshotRecord } from "@/lib/types";
import { formatHashrateTh, formatNumberWithCommas, formatTimestampRelative } from "@/lib/hashrate";

interface StatCardsProps {
  latest: SnapshotRecord | null;
}

export default function StatCards({ latest }: StatCardsProps) {
  if (!latest) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="glass-panel rounded-2xl p-5 border border-white/5 animate-pulse h-36" />
        ))}
      </div>
    );
  }

  // Calculate hashrate delta between 1m and 1hr
  const delta1mTo1h =
    latest.hashrate_1hr > 0
      ? (((latest.hashrate_1m - latest.hashrate_1hr) / latest.hashrate_1hr) * 100).toFixed(1)
      : "0";
  const isDeltaPositive = parseFloat(delta1mTo1h) >= 0;

  // Best share formatted in millions/billions
  const formatDifficulty = (val: number) => {
    if (val >= 1_000_000_000) return `${(val / 1_000_000_000).toFixed(2)}B`;
    if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(2)}M`;
    if (val >= 1_000) return `${(val / 1_000).toFixed(2)}K`;
    return val.toFixed(0);
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* 1. Hashrate Card */}
      <div className="glass-panel rounded-2xl p-5 border border-amber-500/20 bg-gradient-to-b from-amber-500/[0.07] to-transparent relative overflow-hidden group hover:border-amber-500/40 transition-all duration-300">
        <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl group-hover:bg-amber-500/20 transition-all" />
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-amber-400/90 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            Current Hashrate
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-400/10 text-amber-300 border border-amber-400/20 font-medium">
            5m Avg
          </span>
        </div>
        <div className="flex items-baseline gap-2 mb-2">
          <span className="text-3xl font-black tracking-tight text-white font-mono">
            {formatHashrateTh(latest.hashrate_5m)}
          </span>
        </div>
        <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-white/5">
          <div className="flex items-center gap-1">
            <Flame className="w-3.5 h-3.5 text-orange-400" />
            <span>1m: <strong className="text-slate-200 font-mono">{latest.raw_hashrate_1m}</strong></span>
          </div>
          <div className="flex items-center gap-1">
            <span>1h: <strong className="text-slate-200 font-mono">{latest.raw_hashrate_1hr}</strong></span>
            <span className={`text-[10px] font-semibold ${isDeltaPositive ? "text-emerald-400" : "text-rose-400"}`}>
              {isDeltaPositive ? "+" : ""}{delta1mTo1h}%
            </span>
          </div>
        </div>
      </div>

      {/* 2. Mining Shares Card */}
      <div className="glass-panel rounded-2xl p-5 border border-cyan-500/20 bg-gradient-to-b from-cyan-500/[0.07] to-transparent relative overflow-hidden group hover:border-cyan-500/40 transition-all duration-300">
        <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-cyan-500/10 rounded-full blur-2xl group-hover:bg-cyan-500/20 transition-all" />
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-cyan-400/90 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            Accepted Shares
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-400/10 text-cyan-300 border border-cyan-400/20 font-medium">
            Cumulative
          </span>
        </div>
        <div className="flex items-baseline gap-2 mb-2">
          <span className="text-3xl font-black tracking-tight text-white font-mono">
            {formatNumberWithCommas(latest.shares)}
          </span>
        </div>
        <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-white/5">
          <span>Current Best:</span>
          <span className="font-mono font-semibold text-cyan-300 flex items-center gap-1">
            {formatDifficulty(latest.bestshare)}
            <span className="text-[10px] text-slate-500 font-normal">({latest.bestshare.toFixed(0)})</span>
          </span>
        </div>
      </div>

      {/* 3. All-Time Best Share Card */}
      <div className="glass-panel rounded-2xl p-5 border border-emerald-500/20 bg-gradient-to-b from-emerald-500/[0.07] to-transparent relative overflow-hidden group hover:border-emerald-500/40 transition-all duration-300">
        <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all" />
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400/90 flex items-center gap-1.5">
            <Trophy className="w-3.5 h-3.5 text-emerald-400" />
            Best Share Ever
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-400/10 text-emerald-300 border border-emerald-400/20 font-medium">
            Record
          </span>
        </div>
        <div className="flex items-baseline gap-2 mb-2">
          <span className="text-3xl font-black tracking-tight text-white font-mono">
            {formatDifficulty(latest.bestever)}
          </span>
          <span className="text-xs text-emerald-400 font-mono font-semibold">Diff Score</span>
        </div>
        <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-white/5">
          <span>Raw Diff:</span>
          <span className="font-mono text-slate-300">{formatNumberWithCommas(latest.bestever)}</span>
        </div>
      </div>

      {/* 4. Active Workers Card */}
      <div className="glass-panel rounded-2xl p-5 border border-indigo-500/20 bg-gradient-to-b from-indigo-500/[0.07] to-transparent relative overflow-hidden group hover:border-indigo-500/40 transition-all duration-300">
        <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl group-hover:bg-indigo-500/20 transition-all" />
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400/90 flex items-center gap-1.5">
            <Server className="w-3.5 h-3.5 text-indigo-400" />
            Worker Units
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-400/10 text-indigo-300 border border-indigo-400/20 font-medium flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Active
          </span>
        </div>
        <div className="flex items-baseline gap-2 mb-2">
          <span className="text-3xl font-black tracking-tight text-white font-mono">
            {latest.workers_count}
          </span>
          <span className="text-sm text-slate-400 font-medium">Online Node{latest.workers_count > 1 ? "s" : ""}</span>
        </div>
        <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-white/5">
          <span>Last Share Submitted:</span>
          <span className="font-mono font-semibold text-emerald-400">
            {formatTimestampRelative(latest.lastshare)}
          </span>
        </div>
      </div>
    </div>
  );
}
