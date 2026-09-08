"use client";

import React from "react";
import Link from "next/link";
import {
  Building2,
  AlertTriangle,
  TrendingUp,
  FileCheck2,
  Layers,
  MapPin,
  Clock,
  ArrowRight,
  ShieldCheck,
  Activity,
  DollarSign,
  TrendingDown,
} from "lucide-react";

import { useQuery } from "@tanstack/react-query";
import { fetchNotifications } from "@/lib/api/notifications";

interface GovtOfficialDashboardProps {
  data: Record<string, any>;
  mineSiteName?: string;
}

export function GovtOfficialDashboard({ data }: GovtOfficialDashboardProps) {
  const { data: notifications = [] } = useQuery({
    queryKey: ["gov-official-notifications"],
    queryFn: () => fetchNotifications(),
    refetchInterval: 5000,
  });

  const tamperAlert = notifications.find(
    (n) =>
      n.category === "STATUTORY_RECORD_TAMPER_ATTEMPT" ||
      n.title?.includes("STATUTORY TAMPER ALERT") ||
      (n.severity === "CRITICAL" && n.title?.toLowerCase().includes("tamper"))
  );

  const macroKpis = data.macro_kpis || {
    national_compliance_rate: 92.4,
    total_mines_monitored: 348,
    active_subsidiaries_count: 8,
    critical_hazard_sites_count: 4,
    pending_form_iv_returns: 12,
    unresolved_level3_escalations: 3,
    monthly_coal_dispatch_mt: "68.4 MT",
    compliance_downtime_hours: "14.2 hrs (Low)",
  };

  const heatmap = data.subsidiary_risk_heatmap || [];
  const auditLog = data.statutory_audit_log || [];
  const repeatIssues = data.high_risk_issues_matrix || [];
  const economic = data.economic_indicators || {
    quarterly_output_achieved_pct: 96.8,
    environmental_cess_collected_cr: "₹ 1,420 Cr",
    safety_capex_utilization_pct: 88.5,
    downtime_hours_by_cause: [
      { cause: "Statutory Inspection Hold", hours: 14.2 },
      { cause: "Equipment Preventive Maintenance", hours: 42.0 },
      { cause: "Weather / Monsoon Inundation", hours: 18.5 },
    ],
  };

  return (
    <div className="space-y-6">
      {/* Statutory Tamper Alert Banner for Ministry */}
      {tamperAlert && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-rose-950 via-red-950 to-slate-900 border-2 border-rose-500 shadow-2xl shadow-rose-950/60 flex flex-col md:flex-row md:items-center justify-between gap-4 animate-pulse">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0 border border-rose-500/40">
              <AlertTriangle className="w-6 h-6 text-rose-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-rose-400 uppercase tracking-wider bg-rose-500/20 px-2 py-0.5 rounded border border-rose-500/30">
                  🚨 STATUTORY TAMPER ALERT
                </span>
                <span className="text-[10px] bg-red-600 text-white px-2 py-0.5 rounded-full font-bold">
                  Escalation Level 3 (Immediate Intervention)
                </span>
              </div>
              <p className="text-sm text-slate-100 font-bold mt-1">
                {tamperAlert.title}
              </p>
              <p className="text-xs text-rose-200/90 mt-0.5 font-mono">
                {tamperAlert.message}
              </p>
            </div>
          </div>
          <Link
            href="/audit-ledger"
            className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shrink-0 text-center shadow-lg shadow-rose-950 flex items-center justify-center gap-2"
          >
            <span>Inspect Forensic SHA-256 Ledger</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}
      {/* Macro National KPIs Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">National Compliance Rate</span>
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="text-3xl font-black text-slate-100 font-mono mt-2">{macroKpis.national_compliance_rate}%</div>
          <div className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1 font-medium">
            <span>Across 8 Coal Subsidiaries (CIL + SCCL)</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Total Mines Monitored</span>
            <Building2 className="w-5 h-5 text-blue-400" />
          </div>
          <div className="text-3xl font-black text-blue-400 font-mono mt-2">{macroKpis.total_mines_monitored}</div>
          <div className="text-[11px] text-slate-500 mt-1">
            214 Opencast • 134 Underground
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Unresolved L3 Escalations</span>
            <AlertTriangle className="w-5 h-5 text-rose-400" />
          </div>
          <div className="text-3xl font-black text-rose-400 font-mono mt-2">{macroKpis.unresolved_level3_escalations}</div>
          <div className="text-[11px] text-rose-400/80 mt-1 font-medium">
            <span>Direct Ministry intervention required</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Monthly Coal Dispatch</span>
            <TrendingUp className="w-5 h-5 text-amber-400" />
          </div>
          <div className="text-3xl font-black text-slate-100 font-mono mt-2">{macroKpis.monthly_coal_dispatch_mt}</div>
          <div className="text-[11px] text-slate-500 mt-1">
            Downtime Impact: <strong className="text-emerald-400 font-mono">{macroKpis.compliance_downtime_hours}</strong>
          </div>
        </div>
      </div>

      {/* Main Grid: Subsidiary Risk Heatmap (Left 7 cols) + High-Risk Repeat Issues (Right 5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 7 Cols: Macro Subsidiary Risk Heatmap */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-400" />
                <h3 className="font-bold text-slate-100 text-sm">Subsidiary-Level Risk Heatmap &amp; Compliance</h3>
              </div>
              <span className="text-[10px] font-mono text-slate-400">CIL Pan-India Matrix</span>
            </div>

            <div className="space-y-2.5">
              {heatmap.map((sub: any) => {
                const isHighRisk = sub.avg_risk_score > 50;
                const isLowRisk = sub.avg_risk_score < 30;

                return (
                  <div
                    key={sub.code}
                    className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/80 hover:border-slate-700 transition-all flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center font-black text-xs text-slate-200 font-mono">
                        {sub.code}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-200 text-xs">{sub.name}</span>
                          <span className="text-[10px] text-slate-500 font-mono">({sub.mines_count} Mines)</span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          Compliance: <strong className="text-emerald-400 font-mono">{sub.compliance_rate}%</strong>
                        </div>
                      </div>
                    </div>

                    <div className="text-right flex items-center gap-3">
                      <div>
                        <span
                          className={`text-xs font-mono font-black block ${
                            isHighRisk ? "text-rose-400" : isLowRisk ? "text-emerald-400" : "text-amber-400"
                          }`}
                        >
                          Risk: {sub.avg_risk_score}/100
                        </span>
                        <span
                          className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                            isHighRisk
                              ? "bg-rose-500/10 text-rose-400"
                              : isLowRisk
                              ? "bg-emerald-500/10 text-emerald-400"
                              : "bg-amber-500/10 text-amber-400"
                          }`}
                        >
                          {sub.status.replace("_", " ")}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-500">Live aggregated telemetry updated 5m ago</span>
            <Link href="/analytics" className="text-emerald-400 hover:underline font-semibold flex items-center gap-1">
              Deep Analytics <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Right 5 Cols: High-Risk Repeated Issues Matrix */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                <h3 className="font-bold text-slate-100 text-sm">High-Risk Repeated Violations</h3>
              </div>
              <span className="text-[10px] font-mono text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded">
                National Trends
              </span>
            </div>

            <div className="space-y-3">
              {repeatIssues.map((issue: any, i: number) => (
                <div key={i} className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/80">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5 font-mono text-xs">
                      <span className="font-bold text-amber-400">{issue.rule}</span>
                      <span className="text-slate-500">•</span>
                      <span className="text-[10px] text-slate-400 uppercase">{issue.body}</span>
                    </div>
                    <span className="text-xs font-mono font-bold text-rose-400">{issue.violations_count} Pits</span>
                  </div>
                  <div className="text-xs text-slate-200 font-medium">{issue.category}</div>
                  <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
                    <span>Impact: <strong className="text-rose-400">{issue.impact}</strong></span>
                    <span className="font-mono text-slate-400">30d Trend: {issue.trend}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-500">DGMS automated warning triggers</span>
            <Link href="/capa" className="text-rose-400 hover:underline font-semibold flex items-center gap-1">
              View CAPA Tracker <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* Statutory Inspection Audit Log (National Overview) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <FileCheck2 className="w-4 h-4 text-blue-400" />
            <h3 className="font-bold text-slate-100 text-sm">National Statutory Inspection Audit Log</h3>
          </div>
          <Link href="/audit-ledger" className="text-xs text-blue-400 hover:underline font-semibold flex items-center gap-1">
            Cryptographic SHA-256 Ledger <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {auditLog.map((log: any) => (
            <div key={log.id} className="p-4 rounded-xl border border-slate-800 bg-slate-950 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-mono font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded">
                    {log.subsidiary}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">{log.date}</span>
                </div>
                <div className="font-bold text-slate-200 text-xs mt-2">{log.mine}</div>
                <div className="text-[11px] text-slate-400 mt-0.5">{log.type}</div>
                <div className="text-[10px] text-slate-500 mt-1">Inspector: {log.inspector}</div>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-900 flex items-center justify-between">
                <span
                  className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                    log.status === "COMPLETED" ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"
                  }`}
                >
                  {log.status}
                </span>
                <span className="text-xs font-mono font-bold text-slate-300">Score: {log.score}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
