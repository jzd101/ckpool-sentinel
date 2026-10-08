"use client";

import React from "react";
import { HardDrive, CheckCircle2, Clock, Layers, Award } from "lucide-react";
import { RawWorkerStats } from "@/lib/types";
import { formatNumberWithCommas, formatTimestampRelative } from "@/lib/hashrate";

interface WorkerListProps {
  workers: RawWorkerStats[] | undefined;
}

export default function WorkerList({ workers }: WorkerListProps) {
  if (!workers || workers.length === 0) {
    return null;
  }

  return (
    <div className="glass-panel rounded-2xl p-5 md:p-6 mb-6 border border-white/10 shadow-2xl relative overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-emerald-400" />
            Active Worker Rigs & Nodes
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Realtime telemetry from individual mining rigs connected to CKPool
          </p>
        </div>
        <span className="px-2.5 py-1 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold">
          {workers.length} Rig{workers.length > 1 ? "s" : ""} Online
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {workers.map((w, index) => (
          <div
            key={w.workername || index}
            className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 hover:border-slate-700/80 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
          >
            {/* Rig Identification */}
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-mono text-sm font-bold text-white truncate max-w-[260px] sm:max-w-[400px]">
                  {w.workername}
                </span>
                <span className="text-[10px] px-2 py-0.5 bg-slate-800 text-slate-300 rounded font-mono">
                  Node #{index + 1}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                <span className="flex items-center gap-1 font-mono">
                  <Clock className="w-3 h-3 text-slate-500" />
                  Last Share: <strong className="text-emerald-400 font-semibold">{formatTimestampRelative(w.lastshare)}</strong>
                </span>
                <span className="flex items-center gap-1 font-mono">
                  <Layers className="w-3 h-3 text-slate-500" />
                  Shares: <strong className="text-cyan-300 font-semibold">{formatNumberWithCommas(w.shares)}</strong>
                </span>
                <span className="flex items-center gap-1 font-mono">
                  <Award className="w-3 h-3 text-slate-500" />
                  Best: <strong className="text-amber-400 font-semibold">{w.bestshare.toFixed(0)}</strong>
                </span>
              </div>
            </div>

            {/* Hashrate Metrics Breakdown */}
            <div className="flex items-center gap-3 self-end md:self-auto bg-slate-900/80 px-3 py-2 rounded-lg border border-slate-800 font-mono text-xs">
              <div className="text-center">
                <span className="block text-[10px] text-slate-500 uppercase">1m</span>
                <span className="font-bold text-cyan-300">{w.hashrate1m}</span>
              </div>
              <div className="w-[1px] h-6 bg-slate-800" />
              <div className="text-center">
                <span className="block text-[10px] text-slate-500 uppercase">5m</span>
                <span className="font-bold text-amber-300">{w.hashrate5m}</span>
              </div>
              <div className="w-[1px] h-6 bg-slate-800" />
              <div className="text-center">
                <span className="block text-[10px] text-slate-500 uppercase">1h</span>
                <span className="font-bold text-emerald-300">{w.hashrate1hr}</span>
              </div>
              <div className="w-[1px] h-6 bg-slate-800" />
              <div className="text-center">
                <span className="block text-[10px] text-slate-500 uppercase">1d</span>
                <span className="font-bold text-slate-300">{w.hashrate1d}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
