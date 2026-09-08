"use client";

import React from "react";
import {
  ShieldCheck,
  AlertTriangle,
  FileClock,
  ClipboardList,
  Flame,
  CheckCircle,
} from "lucide-react";

interface ComplianceKPIGridProps {
  complianceRate?: number; // e.g. 94.2%
  pendingAuditsCount?: number;
  overdueReturnsCount?: number;
  criticalHazardsCount?: number;
}

export function ComplianceKPIGrid({
  complianceRate = 92.4,
  pendingAuditsCount = 3,
  overdueReturnsCount = 1,
  criticalHazardsCount = 1,
}: ComplianceKPIGridProps) {
  const kpis = [
    {
      title: "Statutory Compliance",
      value: `${complianceRate}%`,
      subtitle: "DGMS / CMR 2017 Audit Benchmark",
      icon: ShieldCheck,
      color: "text-emerald-400",
      border: "border-emerald-500/30",
      bg: "bg-emerald-500/10",
    },
    {
      title: "Pending Inspections",
      value: pendingAuditsCount,
      subtitle: "Queued for Statutory Officer Review",
      icon: ClipboardList,
      color: "text-blue-400",
      border: "border-blue-500/30",
      bg: "bg-blue-500/10",
    },
    {
      title: "Overdue DGMS Returns",
      value: overdueReturnsCount,
      subtitle: "Form-IV & Quarterly Gas Records",
      icon: FileClock,
      color: "text-amber-400",
      border: "border-amber-500/30",
      bg: "bg-amber-500/10",
    },
    {
      title: "Active Hazards / CAPA",
      value: criticalHazardsCount,
      subtitle: "Open High-Risk Rectifications",
      icon: Flame,
      color: "text-rose-400",
      border: "border-rose-500/30",
      bg: "bg-rose-500/10",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {kpis.map((kpi, idx) => {
        const Icon = kpi.icon;
        return (
          <div
            key={idx}
            className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase font-bold tracking-wider text-slate-400">
                {kpi.title}
              </span>
              <div
                className={`w-8 h-8 rounded-xl ${kpi.bg} border ${kpi.border} flex items-center justify-center ${kpi.color}`}
              >
                <Icon className="w-4 h-4" />
              </div>
            </div>

            <div className="mt-4">
              <div className={`text-3xl font-black font-mono tracking-tight ${kpi.color}`}>
                {kpi.value}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">{kpi.subtitle}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
