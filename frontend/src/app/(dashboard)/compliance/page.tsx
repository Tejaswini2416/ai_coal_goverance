"use client";

import React, { useEffect, useState } from "react";
import { fetchComplianceSchedules, fetchComplianceAlerts, acknowledgeAlert } from "@/lib/api/compliance";
import { downloadComplianceCertificatePdf } from "@/lib/api/reports";
import { useAuthStore } from "@/lib/store/auth-store";
import { StatutorySchedule, ComplianceAlert } from "@/lib/types/domain";
import { getDaysRemaining, getExpiryBadgeClass, formatShortDate, formatDate } from "@/lib/utils/dates";
import {
  FileCheck2,
  Bell,
  Clock,
  AlertTriangle,
  CheckCircle,
  FileText,
  ShieldCheck,
  FileDown,
} from "lucide-react";

export default function CompliancePage() {
  const { activeMineSiteId, activeMineName } = useAuthStore();
  const [schedules, setSchedules] = useState<StatutorySchedule[]>([]);
  const [alerts, setAlerts] = useState<ComplianceAlert[]>([]);
  const [downloadingCert, setDownloadingCert] = useState(false);

  useEffect(() => {
    fetchComplianceSchedules(activeMineSiteId).then(setSchedules);
    fetchComplianceAlerts(activeMineSiteId).then(setAlerts);
  }, [activeMineSiteId]);

  const handleAcknowledge = async (alertId: string) => {
    await acknowledgeAlert(alertId);
    setAlerts((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, is_acknowledged: true } : a))
    );
  };

  const handleDownloadCert = async () => {
    if (!activeMineSiteId) return;
    setDownloadingCert(true);
    try {
      await downloadComplianceCertificatePdf(activeMineSiteId);
    } catch (err) {
      console.error("Failed to download compliance certificate", err);
    } finally {
      setDownloadingCert(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <FileCheck2 className="w-5 h-5 text-emerald-400" />
            <h1 className="text-xl font-bold text-slate-100">
              Statutory Permissions, Leases & DGMS Return Schedules
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Automated expiry alerts at <strong className="text-amber-400">30, 15, 7, and 1-day</strong> thresholds for <strong className="text-emerald-300">{activeMineName}</strong>.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleDownloadCert}
            disabled={downloadingCert}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-950 transition-all active:scale-95 disabled:opacity-50"
            title="Download Official DGMS Clearance Certificate PDF"
          >
            <FileDown className="w-4 h-4" />
            <span>{downloadingCert ? "Generating..." : "Download Compliance Certificate (PDF)"}</span>
          </button>
        </div>
      </div>

      {/* Statutory Clearances Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden shadow-2xl">
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-emerald-400" />
            <h3 className="font-bold text-slate-100 text-sm">
              Registered Statutory Clearances & Environmental Consents
            </h3>
          </div>
          <span className="text-[10px] font-mono text-slate-400">
            {schedules.length} Active Permits
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-800">
              <tr>
                <th className="px-5 py-3">Permit / License #</th>
                <th className="px-5 py-3">Statutory Category</th>
                <th className="px-5 py-3">Issued Date</th>
                <th className="px-5 py-3">Expiry Date</th>
                <th className="px-5 py-3">Time Remaining</th>
                <th className="px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium text-slate-300">
              {schedules.map((sch) => {
                const daysLeft = getDaysRemaining(sch.expiry_date);
                const badgeClass = getExpiryBadgeClass(daysLeft);

                return (
                  <tr key={sch.id} className="hover:bg-slate-850/60 transition-colors">
                    <td className="px-5 py-3.5 font-mono font-bold text-slate-100">
                      {sch.permit_number}
                    </td>
                    <td className="px-5 py-3.5 text-slate-300">{sch.permit_type}</td>
                    <td className="px-5 py-3.5 font-mono text-[11px] text-slate-400">
                      {formatShortDate(sch.issued_date)}
                    </td>
                    <td className="px-5 py-3.5 font-mono text-[11px] text-slate-300">
                      {formatShortDate(sch.expiry_date)}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`text-[11px] font-mono font-bold px-2.5 py-1 rounded-full ${badgeClass}`}>
                        {daysLeft > 0 ? `${daysLeft} days` : "EXPIRED"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {sch.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Active Statutory Alerts & Acknowledgments */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-rose-400" />
            <h3 className="font-bold text-slate-100 text-sm">
              Official Compliance Expiry Alerts & Notices
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            Requires Colliery Manager / DGMS Officer Acknowledgment
          </span>
        </div>

        <div className="space-y-3">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-4 rounded-xl border flex items-center justify-between gap-4 transition-all ${
                alert.is_acknowledged
                  ? "bg-slate-950/40 border-slate-800 text-slate-400"
                  : "bg-rose-950/20 border-rose-500/40 text-rose-300 shadow-md"
              }`}
            >
              <div className="flex items-center gap-3">
                <AlertTriangle
                  className={`w-5 h-5 shrink-0 ${
                    alert.is_acknowledged ? "text-slate-500" : "text-rose-400 animate-pulse"
                  }`}
                />
                <div>
                  <div className="text-xs font-bold text-slate-200">
                    {alert.severity} Alert: Clearance Expires in {alert.days_until_expiry} Day(s)
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Schedule ID: <span className="font-mono">{alert.schedule_id}</span> • Generated {formatDate(alert.created_at)}
                  </div>
                </div>
              </div>

              {alert.is_acknowledged ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-lg border border-emerald-500/20">
                  <CheckCircle className="w-3.5 h-3.5" /> Acknowledged
                </span>
              ) : (
                <button
                  onClick={() => handleAcknowledge(alert.id)}
                  className="px-4 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-xs font-bold transition-all"
                >
                  Acknowledge Notice
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
