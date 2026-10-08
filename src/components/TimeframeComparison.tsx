"use client";

import React from "react";
import { Sliders, Gauge, CheckCircle2, AlertCircle } from "lucide-react";
import { SnapshotRecord } from "@/lib/types";

interface TimeframeComparisonProps {
  latest: SnapshotRecord | null;
}

export default function TimeframeComparison({ latest }: TimeframeComparisonProps) {
  if (!latest) return null;

  const tiers = [
    { label: "1 Minute", key: "1m", value: latest.hashrate_1m, raw: latest.raw_hashrate_1m, color: "from-cyan-500 to-cyan-400" },
    { label: "5 Minutes", key: "5m", value: latest.hashrate_5m, raw: latest.raw_hashrate_5m, color: "from-amber-500 to-amber-400" },
    { label: "1 Hour", key: "1hr", value: latest.hashrate_1hr, raw: latest.raw_hashrate_1hr, color: "from-emerald-500 to-emerald-400" },
    { label: "1 Day", key: "1d", value: latest.hashrate_1d, raw: latest.raw_hashrate_1d, color: "from-indigo-500 to-indigo-400" },
    { label: "7 Days", key: "7d", value: latest.hashrate_7d, raw: latest.raw_hashrate_7d, color: "from-purple-500 to-purple-400" },
  ];

  const maxVal = Math.max(...tiers.map((t) => t.value), 0.1);

  // Stability ratio: 1m vs 7d
  const ratio = latest.hashrate_7d > 0 ? (latest.hashrate_1m / latest.hashrate_7d) * 100 : 100;
  const isStable = ratio >= 80 && ratio <= 125;

  return (
    <div className="glass-panel rounded-2xl p-5 md:p-6 mb-6 border border-white/10 shadow-2xl relative overflow-hidden">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Sliders className="w-4 h-4 text-cyan-400" />
            Pool Source Timeframe Comparison
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Cross-examination of short-term (1m) vs long-term (7d) mining stability
          </p>
        </div>

        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-950/80 border border-slate-800 text-xs">
          <Gauge className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-slate-400">Stability:</span>
          <span className={`font-mono font-semibold ${isStable ? "text-emerald-400" : "text-amber-400"}`}>
            {ratio.toFixed(0)}%
          </span>
        </div>
      </div>

      <div className="space-y-3.5">
        {tiers.map((tier) => {
          const percent = Math.min(100, Math.max(8, (tier.value / maxVal) * 100));
          return (
            <div key={tier.key} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-300 font-medium">{tier.label}</span>
                <span className="text-white font-bold">{tier.raw}</span>
              </div>
              <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-white/5">
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${tier.color} transition-all duration-700 shadow-sm`}
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
