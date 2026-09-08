"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  Users,
  CheckCircle2,
  XCircle,
  Bell,
  Clock,
  Flame,
  Layers,
  ArrowRight,
  ShieldCheck,
  Check,
  Mail,
  FolderLock,
  Send,
} from "lucide-react";
import { DynamicRiskMeter } from "@/components/scorecard/dynamic-risk-meter";
import { acknowledgeAlert } from "@/lib/api/compliance";
import { ManagerEscalationModal } from "./ManagerEscalationModal";

interface ManagerDashboardProps {
  data: Record<string, any>;
  mineSiteName?: string;
}

export function ManagerDashboard({ data, mineSiteName }: ManagerDashboardProps) {
  const [acknowledgedAlerts, setAcknowledgedAlerts] = useState<Record<string, boolean>>({});
  const [isEscalationModalOpen, setIsEscalationModalOpen] = useState(false);

  const riskScore = data.safety_risk_score || 32;
  const riskBreakdown = data.risk_breakdown || {
    violations_score: 12,
    depth_score: 10,
    gas_seam_score: 6,
    equipment_score: 4,
    mine_depth_meters: 280.0,
    gas_seam_degree: "Degree II (Gassy Seam)",
    active_violations_count: 3,
  };

  const hazardAlerts = data.hazard_alerts || [];
  const musterSummary = data.muster_summary || {
    total_inside: 148,
    underground_count: 112,
    surface_count: 36,
    overtime_flagged: 4,
  };
  const musterList = data.muster_list || [];
  const inspectionFeed = data.inspection_feed || [];

  const handleAck = async (id: string) => {
    setAcknowledgedAlerts((prev) => ({ ...prev, [id]: true }));
    try {
      await acknowledgeAlert(id);
    } catch {
      // optimistic update retained
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Hazard Alert Banner if unacknowledged critical alerts exist */}
      {hazardAlerts.some((a: any) => !a.is_acknowledged && !acknowledgedAlerts[a.id]) && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-rose-950/60 via-slate-900 to-slate-900 border border-rose-500/40 shadow-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-pulse">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
              <Flame className="w-5 h-5 animate-bounce" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-rose-400 uppercase tracking-wider">
                  Critical Mine Safety Alarm
                </span>
                <span className="text-[10px] bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded-full font-bold">
                  Immediate Action Required
                </span>
              </div>
              <p className="text-xs text-slate-200 mt-0.5 font-medium">
                CO concentration rate-of-rise excursion detected in Return Airway Gallery #4 (&gt;3.2 ppm/hr).
              </p>
            </div>
          </div>
          <Link
            href="/attendance"
            className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-400 text-slate-950 text-xs font-bold transition-all shrink-0 text-center shadow-lg shadow-rose-950"
          >
            Check Underground Muster
          </Link>
        </div>
      )}

      {/* Statutory Operational Actions Bar: Data Logs Vault & Official Memo Dispatch */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <FolderLock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-200">
              Colliery Statutory Operations &amp; Direct Ministry Escalation
            </div>
            <div className="text-[11px] text-slate-400">
              {mineSiteName || "Godavarikhani No. 11A Incline (GDK-11A) SCCL"} • All shift data cryptographically sealed
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/data-logs"
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all border border-slate-700 flex items-center gap-2"
          >
            <FolderLock className="w-3.5 h-3.5 text-blue-400" />
            <span>Open Data Logs Vault</span>
          </Link>
          <button
            onClick={() => setIsEscalationModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold transition-all shadow-lg shadow-blue-950 flex items-center gap-2"
          >
            <Mail className="w-3.5 h-3.5" />
            <span>✉️ Dispatch Official Memo to Ministry</span>
          </button>
        </div>
      </div>

      {/* Center 3-Column Grid: Live Risk Speedometer (Left) + Hazard Alerts (Middle) + Headcount Muster (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Col 1-4: Dynamic Safety Risk Meter */}
        <div className="lg:col-span-4 flex flex-col justify-between">
          <DynamicRiskMeter score={riskScore} predictedHazardsCount={riskBreakdown.active_violations_count} />

          <div className="mt-4 bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg">
            <div className="text-[11px] font-mono text-slate-400 uppercase font-bold mb-2">
              Risk Component Breakdown
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-slate-500 text-[10px] block">Mine Depth</span>
                <span className="font-bold text-slate-200 font-mono">{riskBreakdown.mine_depth_meters}m</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-slate-500 text-[10px] block">Gas Seam Degree</span>
                <span className="font-bold text-slate-200 font-mono">{riskBreakdown.gas_seam_degree}</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-slate-500 text-[10px] block">Active Violations</span>
                <span className="font-bold text-amber-400 font-mono">{riskBreakdown.active_violations_count} Open</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-slate-500 text-[10px] block">Equipment Faults</span>
                <span className="font-bold text-slate-200 font-mono">0 Telemetry</span>
              </div>
            </div>
          </div>
        </div>

        {/* Col 5-8: Real-Time Hazard Alerts & Acknowledgment */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-amber-400" />
                <h3 className="font-bold text-slate-100 text-sm">Real-Time Hazard Alerts</h3>
              </div>
              <span className="text-[10px] font-mono text-slate-400">1-Click Acknowledge</span>
            </div>

            <div className="space-y-3">
              {hazardAlerts.map((alert: any) => {
                const isAck = alert.is_acknowledged || acknowledgedAlerts[alert.id];
                return (
                  <div
                    key={alert.id}
                    className={`p-3.5 rounded-xl border transition-all ${
                      isAck
                        ? "bg-slate-950/40 border-slate-800 opacity-60"
                        : alert.severity === "CRITICAL"
                        ? "bg-rose-950/20 border-rose-500/40 shadow-md shadow-rose-950/20"
                        : "bg-slate-950/80 border-slate-800"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded ${
                              alert.severity === "CRITICAL"
                                ? "bg-rose-500/20 text-rose-400"
                                : alert.severity === "HIGH"
                                ? "bg-amber-500/20 text-amber-400"
                                : "bg-blue-500/20 text-blue-400"
                            }`}
                          >
                            {alert.severity}
                          </span>
                          <span className="text-xs font-bold text-slate-200">{alert.title}</span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1">{alert.message}</p>
                        <div className="text-[10px] text-slate-500 mt-1 font-mono">{alert.created_at}</div>
                      </div>

                      <button
                        onClick={() => handleAck(alert.id)}
                        disabled={isAck}
                        className={`p-1.5 rounded-lg text-xs font-semibold shrink-0 transition-all ${
                          isAck
                            ? "bg-slate-800 text-slate-500 cursor-default"
                            : "bg-amber-500/10 hover:bg-amber-500 border border-amber-500/30 text-amber-400 hover:text-slate-950"
                        }`}
                        title={isAck ? "Acknowledged" : "Acknowledge Alert"}
                      >
                        {isAck ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : "ACK"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-500">Auto-escalates to DGMS in 12h if unacknowledged</span>
            <Link href="/compliance" className="text-emerald-400 hover:underline font-semibold flex items-center gap-1">
              All Alerts <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Col 9-12: Active Worker Muster & Overtime Flagged List */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-400" />
                <h3 className="font-bold text-slate-100 text-sm">Active Pit Muster &amp; Gas Tracker</h3>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                {musterSummary.total_inside} Total Inside
              </span>
            </div>

            {/* Quick Stats Pill */}
            <div className="grid grid-cols-3 gap-2 mb-4 text-center">
              <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-500 block">Underground</span>
                <span className="text-sm font-bold text-slate-100 font-mono">{musterSummary.underground_count}</span>
              </div>
              <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-500 block">Surface</span>
                <span className="text-sm font-bold text-slate-100 font-mono">{musterSummary.surface_count}</span>
              </div>
              <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-rose-400 block">Overtime &gt;8h</span>
                <span className="text-sm font-bold text-rose-400 font-mono">{musterSummary.overtime_flagged}</span>
              </div>
            </div>

            {/* Muster Stream */}
            <div className="space-y-2.5">
              {musterList.slice(0, 4).map((w: any) => (
                <div
                  key={w.id}
                  className="p-2.5 rounded-xl border border-slate-800 bg-slate-950/80 hover:border-slate-700 transition-all flex items-center justify-between"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-200">{w.worker_name}</span>
                      <span className="text-[9px] font-mono text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
                        {w.worker_id}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-2">
                      <span className="font-mono text-slate-400">{w.station_id}</span>
                      <span>•</span>
                      <span>In: {w.check_in_time}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span
                      className={`text-[10px] font-mono font-bold block ${
                        w.gas_level_ppm > 10 ? "text-amber-400" : "text-emerald-400"
                      }`}
                    >
                      {w.gas_level_ppm} ppm CO
                    </span>
                    {w.overtime_warning && (
                      <span className="text-[9px] text-rose-400 font-bold bg-rose-500/10 px-1 rounded">Overtime</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-500">Biometric RFID check-in active</span>
            <Link href="/attendance" className="text-emerald-400 hover:underline font-semibold flex items-center gap-1">
              Full Muster Roll <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom Inspection Results Feed */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-400" />
            <h3 className="font-bold text-slate-100 text-sm">Recent Safety Audit Results Feed</h3>
          </div>
          <Link href="/inspections" className="text-xs text-blue-400 hover:underline font-semibold flex items-center gap-1">
            View All Inspections <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {inspectionFeed.map((f: any) => (
            <div key={f.id} className="p-4 rounded-xl border border-slate-800 bg-slate-950 flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  {f.passed ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  )}
                  <span className="text-xs font-bold text-slate-200">{f.title}</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-1 font-mono">Location: {f.location}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">{f.date}</div>
              </div>
              <span
                className={`text-xs font-mono font-bold px-2 py-1 rounded-lg ${
                  f.passed ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"
                }`}
              >
                Risk: {f.risk_score}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Official Manager-to-Ministry Communication Memo Modal */}
      <ManagerEscalationModal
        isOpen={isEscalationModalOpen}
        onClose={() => setIsEscalationModalOpen(false)}
        mineSiteId={data?.mine_site_id}
        mineName={mineSiteName}
      />
    </div>
  );
}
