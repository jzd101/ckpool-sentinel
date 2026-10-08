"use client";

import React, { useState } from "react";
import { Cpu, Copy, Check, RotateCw, Activity, Clock } from "lucide-react";

interface HeaderProps {
  btcAddress: string;
  nextSyncSeconds: number;
  isRefreshing: boolean;
  lastUpdated: number | null;
  onForceRefresh: () => Promise<void>;
}

export default function Header({
  btcAddress,
  nextSyncSeconds,
  isRefreshing,
  lastUpdated,
  onForceRefresh,
}: HeaderProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(btcAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  // Format MM:SS for countdown
  const minutes = Math.floor(Math.max(0, nextSyncSeconds) / 60);
  const seconds = Math.max(0, nextSyncSeconds) % 60;
  const timeFormatted = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  const progressPercent = Math.min(100, Math.max(0, (nextSyncSeconds / 300) * 100));

  return (
    <header className="w-full glass-panel rounded-2xl p-4 md:p-6 mb-6 flex flex-col lg:flex-row items-center justify-between gap-4 border border-white/10 shadow-2xl relative overflow-hidden">
      {/* Decorative top border gradient */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-amber-500 via-cyan-400 to-emerald-500 opacity-80" />

      {/* Brand & Status Section */}
      <div className="flex items-center gap-4 w-full lg:w-auto justify-between lg:justify-start">
        <div className="flex items-center gap-3">
          <div className="relative p-2.5 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/30 text-amber-400 shadow-lg shadow-amber-500/10">
            <Cpu className="w-7 h-7 animate-pulse text-amber-400" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl md:text-2xl font-black tracking-tight text-white flex items-center gap-2">
                CKPool <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-200">Sentinel</span>
              </h1>
              <span className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live
              </span>
            </div>
            <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
              <Activity className="w-3.5 h-3.5 text-cyan-400" />
              Bitcoin Solo Mining Realtime Monitor
            </p>
          </div>
        </div>

        {/* Mobile quick indicator */}
        <div className="flex lg:hidden items-center gap-2">
          <button
            onClick={onForceRefresh}
            disabled={isRefreshing}
            className="p-2 rounded-xl glass-button text-slate-300 hover:text-white"
            title="Force Refresh"
          >
            <RotateCw className={`w-4 h-4 text-cyan-400 ${isRefreshing ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Address Badge */}
      <div className="flex items-center gap-2 bg-slate-950/70 border border-slate-800/80 rounded-xl px-3 py-2 text-xs font-mono text-slate-300 max-w-full overflow-hidden shadow-inner">
        <span className="text-amber-400 font-semibold text-[11px] uppercase tracking-wider px-1.5 py-0.5 bg-amber-400/10 rounded border border-amber-400/20">
          Miner
        </span>
        <span className="truncate max-w-[200px] sm:max-w-[320px] md:max-w-[400px] text-slate-200" title={btcAddress}>
          {btcAddress}
        </span>
        <button
          onClick={handleCopy}
          className="ml-auto p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-amber-400 transition-colors"
          title="Copy Bitcoin Address"
        >
          {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
        </button>
      </div>

      {/* Sync Status & Force Refresh Section */}
      <div className="flex items-center gap-3 w-full lg:w-auto justify-end">
        {/* Countdown Timer Widget */}
        <div className="flex items-center gap-2 bg-slate-900/80 border border-slate-800 rounded-xl px-3 py-2 text-xs">
          <div className="relative w-5 h-5 flex items-center justify-center">
            {/* Circular mini progress */}
            <svg className="w-5 h-5 transform -rotate-90">
              <circle
                cx="10"
                cy="10"
                r="8"
                stroke="currentColor"
                strokeWidth="2"
                className="text-slate-800"
                fill="transparent"
              />
              <circle
                cx="10"
                cy="10"
                r="8"
                stroke="currentColor"
                strokeWidth="2"
                strokeDasharray={50.26}
                strokeDashoffset={50.26 - (50.26 * progressPercent) / 100}
                className="text-cyan-400 transition-all duration-1000"
                fill="transparent"
              />
            </svg>
            <Clock className="w-2.5 h-2.5 text-slate-400 absolute" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider">Next Sync</span>
            <span className="font-mono font-semibold text-cyan-300 tracking-wide text-xs">{timeFormatted}</span>
          </div>
        </div>

        {/* Force Refresh Button */}
        <button
          onClick={onForceRefresh}
          disabled={isRefreshing}
          className="glass-button px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-200 hover:text-white flex items-center gap-2 group cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border border-white/10 hover:border-amber-400/40"
        >
          <RotateCw
            className={`w-4 h-4 text-amber-400 transition-transform ${
              isRefreshing ? "animate-spin text-cyan-400" : "group-hover:rotate-180"
            }`}
          />
          <span>{isRefreshing ? "Syncing..." : "Refresh"}</span>
        </button>
      </div>
    </header>
  );
}
