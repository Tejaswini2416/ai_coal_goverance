"use client";

import React, { useState, useEffect } from "react";
import {
  Bell,
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  Clock,
  Filter,
  Flame,
  Radio,
  FileCheck2,
  Trash2,
  Mail,
  Send,
  Building2,
  ExternalLink,
  ChevronRight,
  AlertOctagon,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import { useAuthStore } from "@/lib/store/auth-store";
import { dispatchOfficialEscalation, fetchEscalationHistory } from "@/lib/api/escalations";
import { OfficialEscalationResponse } from "@/lib/types/domain";

interface NotificationItem {
  id: string;
  type: "CRITICAL_ALERT" | "STATUTORY_NOTICE" | "OPERATIONAL_UPDATE" | "SYSTEM_INFO" | "OFFICIAL_ESCALATION";
  title: string;
  colliery: string;
  message: string;
  timestamp: string;
  read: boolean;
}

export default function NotificationsPage() {
  const { activeMineSiteId, activeMineName, userRole, userEmail } = useAuthStore();
  const [filter, setFilter] = useState<string>("ALL");

  // Escalation Modal State
  const [isEscalationOpen, setIsEscalationOpen] = useState(false);
  const [targetRoles, setTargetRoles] = useState<string[]>(["MINISTRY_AUDITOR", "DGMS_INSPECTOR"]);
  const [priority, setPriority] = useState<"NORMAL" | "URGENT" | "STATUTORY_EMERGENCY">("URGENT");
  const [category, setCategory] = useState<"SAFETY_BREACH" | "PRODUCTION_HALT" | "VENTILATION_CRISIS" | "GENERAL_COMPLIANCE">("SAFETY_BREACH");
  const [subject, setSubject] = useState("");
  const [messageBody, setMessageBody] = useState("");
  const [includeRiskSnapshot, setIncludeRiskSnapshot] = useState(true);
  const [dispatching, setDispatching] = useState(false);
  const [dispatchResult, setDispatchResult] = useState<OfficialEscalationResponse | null>(null);
  const [dispatchError, setDispatchError] = useState<string | null>(null);

  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: "ntf-00",
      type: "OFFICIAL_ESCALATION",
      title: "[STATUTORY ESCALATION] Seam 3 High Methane Influx & Airflow Deficit",
      colliery: "Ramagundam RG-OCP 3",
      message: "Formal statutory communication dispatched to Ministry Auditor & DGMS Inspector South Zone. Immutable SHA-256 Ledger Stamp: 7d4a...b3e9.",
      timestamp: "Just now",
      read: false,
    },
    {
      id: "ntf-01",
      type: "CRITICAL_ALERT",
      title: "Haul Road Over-Speeding Warning (HEMM Fleet)",
      colliery: "Ramagundam RG-OCP 3",
      message: "Vehicle AP-36-DM-8812 exceeded 30 km/h statutory pit-head speed limit (Recorded: 34 km/h). DGMS automated telematics warning emitted.",
      timestamp: "10 mins ago",
      read: false,
    },
    {
      id: "ntf-02",
      type: "STATUTORY_NOTICE",
      title: "Statutory Form-IV Periodic Safety Audit Scheduled",
      colliery: "Godavarikhani No. 11A Incline (GDK-11A)",
      message: "DGMS Inspector Er. K. Venkat Rao scheduled physical seam-3 methane & roof-bolting inspection for tomorrow 09:00 AM.",
      timestamp: "1 hour ago",
      read: false,
    },
    {
      id: "ntf-03",
      type: "OPERATIONAL_UPDATE",
      title: "Shift-A Coal Extraction Quota Completed",
      colliery: "Kothagudem Opencast Project (KOCP)",
      message: "Shift-A target of 4,000 Tonnes achieved with 100% weighbridge gross-tare reconciliation. Shift-B handover in progress.",
      timestamp: "3 hours ago",
      read: true,
    },
    {
      id: "ntf-04",
      type: "SYSTEM_INFO",
      title: "Cryptographic SHA-256 Chain Verification Passed",
      colliery: "Kasipet Underground Mine",
      message: "12 consecutive shift inspection hashes cryptographically verified intact in Beanie MongoDB ledger.",
      timestamp: "5 hours ago",
      read: true,
    },
  ]);

  const toggleRole = (r: string) => {
    setTargetRoles((prev) =>
      prev.includes(r) ? prev.filter((item) => item !== r) : [...prev, r]
    );
  };

  const handleDispatchEscalation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (targetRoles.length === 0) {
      setDispatchError("Please select at least one recipient authority role.");
      return;
    }
    if (!subject.trim() || !messageBody.trim()) {
      setDispatchError("Please provide both subject and detailed message body.");
      return;
    }

    setDispatching(true);
    setDispatchError(null);

    try {
      const res = await dispatchOfficialEscalation({
        mine_site_id: activeMineSiteId || "11111111-1111-4111-a111-111111111111",
        recipient_roles: targetRoles,
        priority,
        category,
        subject: subject.trim(),
        message_body: messageBody.trim(),
        include_risk_snapshot: includeRiskSnapshot,
      });

      setDispatchResult(res);

      // Prepend to live notifications feed
      setNotifications((prev) => [
        {
          id: `esc-${Date.now()}`,
          type: "OFFICIAL_ESCALATION",
          title: `[OFFICIAL ${priority}] ${subject}`,
          colliery: activeMineName || "Telangana Colliery",
          message: `${messageBody.substring(0, 180)}... [SHA-256: ${res.audit_block_hash?.substring(0, 12)}...]`,
          timestamp: "Just now",
          read: false,
        },
        ...prev,
      ]);

      // Reset fields
      setSubject("");
      setMessageBody("");
    } catch (err: any) {
      setDispatchError(err?.message || "Failed to dispatch official escalation.");
    } finally {
      setDispatching(false);
    }
  };

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const filtered = notifications.filter((n) => {
    if (filter === "UNREAD") return !n.read;
    if (filter === "ALERTS")
      return n.type === "CRITICAL_ALERT" || n.type === "STATUTORY_NOTICE" || n.type === "OFFICIAL_ESCALATION";
    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl">
        <div>
          <div className="flex items-center gap-2.5 text-purple-400">
            <Bell className="w-6 h-6" />
            <h1 className="text-xl font-black text-slate-100 tracking-tight">
              Operational &amp; Statutory Safety Notifications
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-Time DGMS Directives, Official Ministry Escalations &amp; Cryptographic Ledger Broadcasts for{" "}
            <strong className="text-purple-300">{activeMineName}</strong>
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Colliery Manager Official Escalation CTA */}
          <button
            onClick={() => {
              setDispatchResult(null);
              setDispatchError(null);
              setIsEscalationOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-rose-600 to-purple-600 hover:from-rose-500 hover:to-purple-500 text-white font-black text-xs shadow-lg shadow-rose-950/40 border border-rose-400/30 active:scale-95 transition-all"
          >
            <Mail className="w-4 h-4" />
            <span>Dispatch Formal Escalation (Ministry/DGMS)</span>
          </button>

          <button
            onClick={markAllRead}
            className="px-4 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white hover:border-slate-700 transition-all flex items-center gap-1.5"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Mark All Read</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setFilter("ALL")}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all ${
            filter === "ALL"
              ? "bg-purple-600 text-white shadow-md shadow-purple-950"
              : "bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800"
          }`}
        >
          All Notifications ({notifications.length})
        </button>
        <button
          onClick={() => setFilter("UNREAD")}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all ${
            filter === "UNREAD"
              ? "bg-purple-600 text-white shadow-md shadow-purple-950"
              : "bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800"
          }`}
        >
          Unread ({notifications.filter((n) => !n.read).length})
        </button>
        <button
          onClick={() => setFilter("ALERTS")}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all ${
            filter === "ALERTS"
              ? "bg-purple-600 text-white shadow-md shadow-purple-950"
              : "bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800"
          }`}
        >
          Critical Safety Alerts
        </button>
      </div>

      {/* Notification List */}
      <div className="space-y-3">
        {filtered.map((ntf) => {
          const isEscalation = ntf.type === "OFFICIAL_ESCALATION";
          const isCritical = ntf.type === "CRITICAL_ALERT";
          const isNotice = ntf.type === "STATUTORY_NOTICE";

          return (
            <div
              key={ntf.id}
              className={`p-5 rounded-3xl border transition-all ${
                isEscalation
                  ? "bg-gradient-to-r from-rose-950/30 via-slate-900 to-purple-950/20 border-rose-500/40 shadow-xl shadow-rose-950/30"
                  : !ntf.read
                  ? "bg-slate-900 border-purple-500/30 shadow-lg shadow-purple-950/20"
                  : "bg-slate-900/60 border-slate-800"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div
                    className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 ${
                      isEscalation
                        ? "bg-rose-500/20 text-rose-400 border border-rose-500/40 shadow-md"
                        : isCritical
                        ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                        : isNotice
                        ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                        : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    }`}
                  >
                    {isEscalation ? (
                      <Mail className="w-5 h-5 text-rose-400" />
                    ) : isCritical ? (
                      <ShieldAlert className="w-5 h-5" />
                    ) : isNotice ? (
                      <AlertTriangle className="w-5 h-5" />
                    ) : (
                      <CheckCircle2 className="w-5 h-5" />
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-slate-100 text-sm flex items-center gap-1.5">
                        {isEscalation && (
                          <span className="text-[10px] font-mono font-black uppercase px-2 py-0.5 rounded bg-rose-500 text-white shadow-sm">
                            OFFICIAL DISPATCH
                          </span>
                        )}
                        <span>{ntf.title}</span>
                      </h3>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-950 text-slate-400 border border-slate-800">
                        {ntf.colliery}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">{ntf.message}</p>
                    <div className="text-[10px] text-slate-500 font-mono flex items-center gap-2 pt-1">
                      <Clock className="w-3 h-3" />
                      <span>{ntf.timestamp}</span>
                    </div>
                  </div>
                </div>

                {!ntf.read && (
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-400 animate-pulse shrink-0 mt-1" />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL: DISPATCH FORMAL STATUTORY ESCALATION */}
      {isEscalationOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-rose-500/40 rounded-3xl w-full max-w-2xl shadow-2xl p-6 relative max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3.5 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-slate-100 text-base">
                    Official Statutory Escalation &amp; Email Dispatch
                  </h3>
                  <p className="text-[10px] text-slate-400">
                    Formal statutory correspondence to Ministry of Coal &amp; DGMS Inspectorate with SHA-256 Ledger Stamp.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsEscalationOpen(false)}
                className="text-slate-400 hover:text-white text-sm px-2.5 py-1 rounded-lg hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            {dispatchResult ? (
              <div className="space-y-4 py-2 animate-in fade-in duration-200">
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 space-y-2">
                  <div className="flex items-center gap-2 text-sm font-bold text-emerald-400">
                    <ShieldCheck className="w-5 h-5" />
                    <span>Statutory Communication Dispatched &amp; Authenticated!</span>
                  </div>
                  <p className="text-xs leading-relaxed">{dispatchResult.delivery_summary}</p>
                </div>

                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-2.5 text-xs">
                  <div className="flex items-center justify-between border-b border-slate-850 pb-2">
                    <span className="text-slate-400">Dispatched To:</span>
                    <div className="flex gap-1.5 flex-wrap">
                      {dispatchResult.target_emails.map((e) => (
                        <span key={e} className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 font-mono text-[11px] text-slate-200">
                          {e}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="border-b border-slate-850 pb-2">
                    <span className="text-slate-400 block mb-1">Cryptographic Ledger Stamp (SHA-256):</span>
                    <span className="font-mono text-[11px] text-emerald-400 bg-slate-900 px-2 py-1 rounded border border-slate-800 block break-all">
                      {dispatchResult.audit_block_hash}
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-400 flex items-center justify-between">
                    <span>In-App Alerts Emitted: <strong className="text-slate-200">{dispatchResult.notifications_created}</strong></span>
                    <span className="font-mono">{new Date(dispatchResult.dispatched_at).toLocaleTimeString()}</span>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => {
                      setDispatchResult(null);
                      setIsEscalationOpen(false);
                    }}
                    className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-950"
                  >
                    Done &amp; Return to Feed
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleDispatchEscalation} className="space-y-4">
                {dispatchError && (
                  <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
                    <AlertOctagon className="w-4 h-4 shrink-0" />
                    <span>{dispatchError}</span>
                  </div>
                )}

                {/* 1. Recipient Authority Roles */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    1. Recipient Authority Roles (Multi-Select)
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {[
                      { role: "MINISTRY_AUDITOR", title: "Ministry Auditor", email: "ministry.auditor@coal.gov.in" },
                      { role: "DGMS_INSPECTOR", title: "DGMS Statutory Inspector", email: "dgms.inspector.south@dgms.gov.in" },
                    ].map((item) => {
                      const isSelected = targetRoles.includes(item.role);
                      return (
                        <div
                          key={item.role}
                          onClick={() => toggleRole(item.role)}
                          className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-start gap-2.5 ${
                            isSelected
                              ? "bg-rose-500/15 border-rose-500/50 shadow-md"
                              : "bg-slate-950 border-slate-800 hover:border-slate-750"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                            className="mt-0.5 rounded text-rose-600 focus:ring-rose-500"
                          />
                          <div>
                            <div className="text-xs font-bold text-slate-200">{item.title}</div>
                            <div className="text-[10px] font-mono text-slate-400">{item.email}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Priority & Statutory Category */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      2. Statutory Priority Level
                    </label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-rose-500 font-semibold"
                    >
                      <option value="NORMAL">NORMAL — Formal Inquiry</option>
                      <option value="URGENT">URGENT — Statutory Breach Warning</option>
                      <option value="STATUTORY_EMERGENCY">STATUTORY EMERGENCY — Immediate Threat</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Statutory Category
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-rose-500"
                    >
                      <option value="SAFETY_BREACH">Safety &amp; Roof Support Breach</option>
                      <option value="VENTILATION_CRISIS">Ventilation / Gaseous Influx Crisis</option>
                      <option value="PRODUCTION_HALT">Statutory Production Halt</option>
                      <option value="GENERAL_COMPLIANCE">General Regulatory Compliance</option>
                    </select>
                  </div>
                </div>

                {/* 3. Formal Subject */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    3. Formal Subject Line
                  </label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="e.g. Statutory Emergency: Rapid Influx of CH4 in Seam 3 Return Airway"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-rose-500"
                    required
                  />
                </div>

                {/* 4. Official Notice Body */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    4. Statutory Message Body
                  </label>
                  <textarea
                    rows={4}
                    value={messageBody}
                    onChange={(e) => setMessageBody(e.target.value)}
                    placeholder="Detail the statutory observations, corrective actions triggered on-ground, and requested Ministry/DGMS intervention..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-rose-500 resize-none"
                    required
                  />
                </div>

                {/* 5. Include AI Risk & Gas Telemetry Snapshot */}
                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-200 block">
                      Attach Live AI Risk &amp; Gas Telemetry Snapshot
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Auto-bundles current CH₄, CO, and active CAPA metrics into statutory email &amp; ledger block.
                    </span>
                  </div>

                  <input
                    type="checkbox"
                    checked={includeRiskSnapshot}
                    onChange={(e) => setIncludeRiskSnapshot(e.target.checked)}
                    className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 cursor-pointer"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsEscalationOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-semibold"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={dispatching}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-purple-600 hover:from-rose-500 hover:to-purple-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-rose-950/40 transition-all disabled:opacity-50"
                  >
                    {dispatching ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    <span>{dispatching ? "Dispatching to Authorities..." : "Dispatch Statutory Escalation"}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

