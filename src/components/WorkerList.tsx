"use client";

import React, { useState } from "react";
import { HardDrive, Clock, Layers, Award, Check, Copy, Wifi } from "lucide-react";
import { RawWorkerStats } from "@/lib/types";
import { formatNumberWithCommas, formatTimestampRelative } from "@/lib/hashrate";

interface WorkerListProps {
  workers: RawWorkerStats[] | undefined;
}

export default function WorkerList({ workers }: WorkerListProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  if (!workers || workers.length === 0) {
    return null;
  }

  const handleCopy = (name: string, index: number) => {
    try {
      navigator.clipboard.writeText(name);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <div className="glass-panel rounded-2xl p-5 md:p-6 mb-6 border border-white/10 shadow-2xl relative overflow-hidden flex flex-col justify-between">
      <div>
        {/* Panel Header */}
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
          <span className="px-2.5 py-1 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold shrink-0">
            {workers.length} Rig{workers.length > 1 ? "s" : ""} Online
          </span>
        </div>

        {/* Worker Cards List */}
        <div className="space-y-3">
          {workers.map((w, index) => {
            const shortName =
              w.workername && w.workername.length > 20
                ? `${w.workername.slice(0, 12)}...${w.workername.slice(-8)}`
                : w.workername || `Worker #${index + 1}`;

            return (
              <div
                key={w.workername || index}
                className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3.5 sm:p-4 hover:border-slate-700/80 transition-all flex flex-col gap-3 min-w-0 overflow-hidden"
              >
                {/* 1. Rig Identity Row */}
                <div className="flex items-center justify-between gap-2 min-w-0">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                    <button
                      onClick={() => handleCopy(w.workername, index)}
                      className="font-mono text-xs sm:text-sm font-bold text-white hover:text-amber-400 transition-colors flex items-center gap-1.5 min-w-0 group text-left cursor-pointer"
                      title={`Click to copy: ${w.workername}`}
                    >
                      <span className="truncate">{shortName}</span>
                      {copiedIndex === index ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      ) : (
                        <Copy className="w-3 h-3 text-slate-500 group-hover:text-amber-400 shrink-0 opacity-60 group-hover:opacity-100 transition-opacity" />
                      )}
                    </button>
                    <span className="text-[10px] px-2 py-0.5 bg-slate-800/90 text-slate-300 rounded font-mono shrink-0">
                      Node #{index + 1}
                    </span>
                  </div>

                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium flex items-center gap-1 shrink-0">
                    <Wifi className="w-2.5 h-2.5" />
                    Active
                  </span>
                </div>

                {/* 2. Telemetry Details: Last Share, Shares, Best */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-400 pt-1 border-t border-white/5">
                  <span className="flex items-center gap-1 font-mono text-[11px] sm:text-xs">
                    <Clock className="w-3 h-3 text-slate-500 shrink-0" />
                    Last Share:{" "}
                    <strong className="text-emerald-400 font-semibold">
                      {formatTimestampRelative(w.lastshare)}
                    </strong>
                  </span>
                  <span className="flex items-center gap-1 font-mono text-[11px] sm:text-xs">
                    <Layers className="w-3 h-3 text-slate-500 shrink-0" />
                    Shares:{" "}
                    <strong className="text-cyan-300 font-semibold">
                      {formatNumberWithCommas(w.shares)}
                    </strong>
                  </span>
                  <span className="flex items-center gap-1 font-mono text-[11px] sm:text-xs">
                    <Award className="w-3 h-3 text-slate-500 shrink-0" />
                    Best:{" "}
                    <strong className="text-amber-400 font-semibold">
                      {w.bestshare.toFixed(0)}
                    </strong>
                  </span>
                </div>

                {/* 3. Hashrate Breakdown: 4 Balanced Columns strictly inside the card */}
                <div className="grid grid-cols-4 gap-1.5 sm:gap-2 bg-slate-900/90 p-2 sm:p-2.5 rounded-xl border border-slate-800/90 text-center font-mono">
                  <div className="px-1 py-0.5">
                    <span className="block text-[10px] text-slate-500 uppercase tracking-wider">1m</span>
                    <span className="font-bold text-xs sm:text-sm text-cyan-300 truncate block">
                      {w.hashrate1m}
                    </span>
                  </div>
                  <div className="px-1 py-0.5 border-l border-slate-800">
                    <span className="block text-[10px] text-slate-500 uppercase tracking-wider">5m</span>
                    <span className="font-bold text-xs sm:text-sm text-amber-300 truncate block">
                      {w.hashrate5m}
                    </span>
                  </div>
                  <div className="px-1 py-0.5 border-l border-slate-800">
                    <span className="block text-[10px] text-slate-500 uppercase tracking-wider">1h</span>
                    <span className="font-bold text-xs sm:text-sm text-emerald-300 truncate block">
                      {w.hashrate1hr}
                    </span>
                  </div>
                  <div className="px-1 py-0.5 border-l border-slate-800">
                    <span className="block text-[10px] text-slate-500 uppercase tracking-wider">1d</span>
                    <span className="font-bold text-xs sm:text-sm text-slate-300 truncate block">
                      {w.hashrate1d}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
