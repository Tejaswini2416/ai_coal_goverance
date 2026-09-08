"use client";

import React from "react";
import { AlertTriangle, ShieldCheck, ShieldAlert } from "lucide-react";

interface DynamicRiskMeterProps {
  score: number; // 0 to 100
  predictedHazardsCount?: number;
}

export function DynamicRiskMeter({
  score = 24,
  predictedHazardsCount = 2,
}: DynamicRiskMeterProps) {
  // SVG circular gauge geometry
  const radius = 68;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  let colorClass = "stroke-emerald-400";
  let textClass = "text-emerald-400";
  let bgGlow = "shadow-[0_0_30px_rgba(16,185,129,0.2)]";
  let riskLabel = "Low Risk (Compliant)";

  if (score > 65) {
    colorClass = "stroke-rose-500";
    textClass = "text-rose-500";
    bgGlow = "shadow-[0_0_30px_rgba(244,63,94,0.3)]";
    riskLabel = "High Hazard Warning!";
  } else if (score > 30) {
    colorClass = "stroke-amber-400";
    textClass = "text-amber-400";
    bgGlow = "shadow-[0_0_30px_rgba(251,191,36,0.2)]";
    riskLabel = "Moderate Concern";
  }

  return (
    <div className={`p-6 rounded-2xl bg-slate-900 border border-slate-800 ${bgGlow} flex flex-col items-center justify-center relative overflow-hidden`}>
      {/* Header */}
      <div className="w-full flex items-center justify-between mb-4">
        <span className="text-[11px] uppercase tracking-wider font-extrabold text-slate-400">
          AI Predicted Mine Safety Risk Index
        </span>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
          Celery AI Worker
        </span>
      </div>

      {/* Radial Gauge */}
      <div className="relative w-44 h-44 flex items-center justify-center">
        <svg className="w-full h-full transform -rotate-90">
          {/* Track Circle */}
          <circle
            cx="88"
            cy="88"
            r={radius}
            className="stroke-slate-800"
            strokeWidth="12"
            fill="transparent"
          />
          {/* Active Score Arc */}
          <circle
            cx="88"
            cy="88"
            r={radius}
            className={`${colorClass} transition-all duration-1000 ease-out`}
            strokeWidth="12"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
          />
        </svg>

        {/* Center Score Display */}
        <div className="absolute flex flex-col items-center justify-center text-center">
          <span className={`text-4xl font-black font-mono tracking-tight ${textClass}`}>
            {score}
          </span>
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">
            Out of 100
          </span>
        </div>
      </div>

      {/* Label and Hazards */}
      <div className="mt-4 text-center space-y-1">
        <div className={`text-sm font-bold flex items-center justify-center gap-1.5 ${textClass}`}>
          {score > 65 ? (
            <ShieldAlert className="w-4 h-4" />
          ) : (
            <ShieldCheck className="w-4 h-4" />
          )}
          {riskLabel}
        </div>
        <p className="text-[11px] text-slate-400">
          Model predicts <strong className="text-slate-200">{predictedHazardsCount}</strong> potential statutory non-compliances for this leasehold pit.
        </p>
      </div>
    </div>
  );
}
