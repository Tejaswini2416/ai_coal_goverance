"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Compass,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Download,
  MapPin,
  Calendar,
  ShieldCheck,
  ChevronRight,
  Loader2,
  FileCheck2,
} from "lucide-react";
import { downloadInspectionCertificatePdf } from "@/lib/api/reports";
import { useQuery } from "@tanstack/react-query";
import { fetchNotifications } from "@/lib/api/notifications";

interface InspectorDashboardProps {
  data: Record<string, any>;
  mineSiteName?: string;
}

export function InspectorDashboard({ data, mineSiteName }: InspectorDashboardProps) {
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const { data: notifications = [] } = useQuery({
    queryKey: ["inspector-notifications"],
    queryFn: () => fetchNotifications(),
    refetchInterval: 5000,
  });

  const tamperAlert = notifications.find(
    (n) =>
      n.category === "STATUTORY_RECORD_TAMPER_ATTEMPT" ||
      n.title?.includes("STATUTORY TAMPER ALERT") ||
      (n.severity === "CRITICAL" && n.title?.toLowerCase().includes("tamper"))
  );

  const kpis = data.kpi || {
    assigned_sites_count: 4,
    inspections_completed_month: 18,
    pending_verifications: 3,
    compliance_pass_rate: 94.2,
  };

  const assignedSites = data.assigned_sites || [];
  const inspectedHistory = data.inspected_history || [];
  const statutoryAlerts = data.statutory_alerts || [];

  const handleDownloadFormIV = async (inspectionId: string, title: string) => {
    setDownloadingId(inspectionId);
    try {
      await downloadInspectionCertificatePdf(inspectionId, title);
    } catch (err) {
      console.error("Failed to download Form-IV:", err);
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Statutory Tamper Alert Banner for DGMS Inspector */}
      {tamperAlert && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-rose-950 via-red-950 to-slate-900 border-2 border-rose-500 shadow-2xl shadow-rose-950/60 flex flex-col md:flex-row md:items-center justify-between gap-4 animate-pulse">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0 border border-rose-500/40">
              <AlertTriangle className="w-6 h-6 text-rose-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-rose-400 uppercase tracking-wider bg-rose-500/20 px-2 py-0.5 rounded border border-rose-500/30">
                  🚨 DGMS STATUTORY TAMPER ALERT
                </span>
                <span className="text-[10px] bg-red-600 text-white px-2 py-0.5 rounded-full font-bold">
                  CMR 2017 Enforcement Priority
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
            <span>Inspect Forensic SHA-256 Mismatch</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      )}
      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Scheduled Sites Assigned</span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-100 mt-2 font-mono">{kpis.assigned_sites_count}</div>
          <div className="text-[11px] text-blue-400/80 font-medium mt-1 flex items-center gap-1">
            <span>Requires on-site statutory verification</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Completed This Month</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-100 mt-2 font-mono">{kpis.inspections_completed_month}</div>
          <div className="text-[11px] text-emerald-400/80 font-medium mt-1 flex items-center gap-1">
            <span>+4 vs last month quota</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Pending CAPA Verifications</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-amber-400 mt-2 font-mono">{kpis.pending_verifications}</div>
          <div className="text-[11px] text-amber-400/80 font-medium mt-1">
            <span>Awaiting field inspector sign-off</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Compliance Pass Rate</span>
            <div className="w-8 h-8 rounded-lg bg-teal-500/10 text-teal-400 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-100 mt-2 font-mono">{kpis.compliance_pass_rate}%</div>
          <div className="text-[11px] text-teal-400/80 font-medium mt-1">
            <span>DGMS & MoEF statutory audits</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Sites Assigned (Left) + Inspected History & Form-IV (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 6 Cols: Sites Assigned Widget */}
        <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-blue-400" />
                <h3 className="font-bold text-slate-100 text-sm">Scheduled Mines Assigned to Inspector</h3>
              </div>
              <span className="text-[10px] font-mono text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                Geofence Enforced
              </span>
            </div>

            <div className="space-y-3">
              {assignedSites.map((site: any) => (
                <div
                  key={site.id}
                  className="p-4 rounded-xl border border-slate-800 bg-slate-950/80 hover:border-blue-500/30 transition-all group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-200 text-xs group-hover:text-blue-300 transition-colors">
                          {site.title}
                        </span>
                        <span
                          className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full font-mono ${
                            site.priority === "CRITICAL"
                              ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                              : site.priority === "HIGH"
                              ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                              : "bg-slate-800 text-slate-300"
                          }`}
                        >
                          {site.priority}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1.5 flex items-center gap-2 font-mono">
                        <span className="text-slate-500">Target:</span>
                        <span className="text-slate-300">{site.location_target}</span>
                      </div>
                      <div className="text-[10px] text-slate-500 mt-1 flex items-center gap-3">
                        <span>Due Date: <strong className="text-slate-300 font-mono">{site.due_date}</strong></span>
                        <span>•</span>
                        <span className="text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Geofence Verified
                        </span>
                      </div>
                    </div>

                    <Link
                      href={`/inspections/new`}
                      className="shrink-0 p-2 rounded-lg bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white transition-all text-xs font-semibold flex items-center gap-1"
                    >
                      <span>Audit</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-500">Showing {assignedSites.length} assigned statutory audits</span>
            <Link href="/schedules" className="text-blue-400 hover:underline font-semibold flex items-center gap-1">
              View All Schedules <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Right 6 Cols: Inspected History & Statutory Form-IV Widget */}
        <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <FileCheck2 className="w-4 h-4 text-emerald-400" />
                <h3 className="font-bold text-slate-100 text-sm">Inspected History &amp; Statutory Form-IV</h3>
              </div>
              <span className="text-[10px] font-mono text-slate-400">DGMS Regulation Compliance</span>
            </div>

            <div className="space-y-3">
              {inspectedHistory.map((insp: any) => (
                <div
                  key={insp.id}
                  className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/80 hover:border-slate-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 font-mono text-xs">
                      <span className="font-bold text-slate-200 truncate">{insp.title}</span>
                      <span
                        className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded shrink-0 ${
                          insp.risk_score < 30
                            ? "bg-emerald-500/10 text-emerald-400"
                            : "bg-amber-500/10 text-amber-400"
                        }`}
                      >
                        Risk: {insp.risk_score}/100
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-2">
                      <span className="text-slate-500 font-mono">{insp.date}</span>
                      <span>•</span>
                      <span className="text-[10px] text-slate-400 uppercase font-mono">{insp.location_type}</span>
                      <span>•</span>
                      <span
                        className={`text-[10px] font-bold ${
                          insp.capa_status === "VERIFIED" ? "text-teal-400" : "text-amber-400"
                        }`}
                      >
                        {insp.capa_status}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDownloadFormIV(insp.id, insp.title)}
                    disabled={downloadingId === insp.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500 border border-emerald-500/30 hover:border-emerald-500 text-emerald-400 hover:text-slate-950 text-xs font-bold transition-all shrink-0 active:scale-95 disabled:opacity-50"
                  >
                    {downloadingId === insp.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Download className="w-3.5 h-3.5" />
                    )}
                    <span>Form-IV PDF</span>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Statutory Notices Feed */}
          {statutoryAlerts.length > 0 && (
            <div className="mt-4 pt-3 border-t border-slate-800 space-y-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">
                Statutory Directives Active
              </span>
              {statutoryAlerts.map((alt: any, i: number) => (
                <div key={i} className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-950 border border-slate-850">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded">
                      {alt.rule}
                    </span>
                    <span className="text-slate-300 text-[11px]">{alt.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
