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
  CalendarCheck2,
  Radio,
  Megaphone,
  UserCheck,
  UserX,
  AlertOctagon,
  FileText,
  BadgeAlert,
  Calendar,
  X,
  ShieldAlert,
} from "lucide-react";
import { DynamicRiskMeter } from "@/components/scorecard/dynamic-risk-meter";
import { acknowledgeAlert } from "@/lib/api/compliance";
import { ManagerEscalationModal } from "./ManagerEscalationModal";
import { useQuery } from "@tanstack/react-query";
import {
  fetchWorkerLeaves,
  reviewWorkerLeave,
  fetchMyWorkerIssues,
} from "@/lib/api/worker";
import { WorkerLeave, WorkerIssueOut } from "@/lib/types/domain";

interface ManagerDashboardProps {
  data: Record<string, any>;
  mineSiteName?: string;
}

export function ManagerDashboard({ data, mineSiteName }: ManagerDashboardProps) {
  const [acknowledgedAlerts, setAcknowledgedAlerts] = useState<Record<string, boolean>>({});
  const [isEscalationModalOpen, setIsEscalationModalOpen] = useState(false);
  const [reviewingLeaveId, setReviewingLeaveId] = useState<string | null>(null);
  const [reviewAction, setReviewAction] = useState<"APPROVED" | "REJECTED">("APPROVED");
  const [reviewNotes, setReviewNotes] = useState("");
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewSuccessMessage, setReviewSuccessMessage] = useState<string | null>(null);
  const [activeEmergencyFilter, setActiveEmergencyFilter] = useState<"ALL" | "EMERGENCY_STOP">("ALL");

  const effectiveMineId = data?.mine_site_id || "11111111-1111-4111-a111-111111111111";

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

  // 1. Live Query for Worker Leaves (Mines Rules 1955 Chapter VII)
  const { data: workerLeaves = [], refetch: refetchLeaves } = useQuery<WorkerLeave[]>({
    queryKey: ["worker-leaves", effectiveMineId],
    queryFn: () => fetchWorkerLeaves(effectiveMineId),
    initialData: data.worker_leaves || [],
    refetchInterval: 12000,
  });

  // 2. Live Query for Worker Emergency Alerts & Pit Stops
  const { data: emergencyIssues = [], refetch: refetchIssues } = useQuery<WorkerIssueOut[]>({
    queryKey: ["worker-issues-emergency", effectiveMineId],
    queryFn: async () => {
      const all = await fetchMyWorkerIssues(effectiveMineId);
      return all.filter((i) => i.is_emergency_stop || i.urgency === "EMERGENCY_STOP" || i.urgency === "HIGH");
    },
    initialData: (data.emergency_alerts as any) || [],
    refetchInterval: 12000,
  });

  const handleAck = async (id: string) => {
    setAcknowledgedAlerts((prev) => ({ ...prev, [id]: true }));
    try {
      await acknowledgeAlert(id);
    } catch {
      // optimistic update retained
    }
  };

  // Submit Leave Approval or Rejection
  const handleConfirmReview = async () => {
    if (!reviewingLeaveId) return;
    setReviewLoading(true);
    try {
      await reviewWorkerLeave(
        reviewingLeaveId,
        reviewAction,
        reviewNotes || `Statutory review completed (${reviewAction}) by Colliery Manager.`
      );
      setReviewSuccessMessage(`Leave application marked as ${reviewAction}. Shift roster updated.`);
      setTimeout(() => setReviewSuccessMessage(null), 5000);
      setReviewingLeaveId(null);
      setReviewNotes("");
      await refetchLeaves();
    } catch (err: any) {
      console.error("Failed to review leave application:", err);
      alert(err.message || "Failed to update leave application status");
    } finally {
      setReviewLoading(false);
    }
  };

  const pendingLeaves = workerLeaves.filter(
    (l) => l.status === "SUBMITTED" || l.status === "QUEUED_OFFLINE" || l.status === "PENDING"
  );
  const approvedLeaves = workerLeaves.filter((l) => l.status === "APPROVED");

  const filteredEmergencyIssues = emergencyIssues.filter((i) => {
    if (activeEmergencyFilter === "EMERGENCY_STOP") {
      return i.is_emergency_stop || i.urgency === "EMERGENCY_STOP";
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* Top Notification Feedback Banner */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {reviewSuccessMessage && (
        <div className="p-3.5 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 text-xs font-semibold flex items-center justify-between shadow-xl animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{reviewSuccessMessage}</span>
          </div>
          <button
            onClick={() => setReviewSuccessMessage(null)}
            className="text-emerald-400 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* Statutory Operational Actions Bar */}
      {/* ─────────────────────────────────────────────────────────────────── */}
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
              {mineSiteName || "Godavarikhani No. 11A Incline (GDK-11A) SCCL"} • Operational Shift Command
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
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

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* SECTION 1: WORKER EMERGENCY ALERTS & PIT STOPS PORTAL               */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="p-5 rounded-3xl bg-gradient-to-br from-rose-950/30 via-slate-900 to-slate-900 border border-rose-500/30 shadow-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0 border border-rose-500/30">
              <Flame className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-slate-100 text-sm tracking-wide">
                  Underground Emergency Pit Alerts &amp; Worker Stops
                </h3>
                {filteredEmergencyIssues.some((i) => i.is_emergency_stop || i.urgency === "EMERGENCY_STOP") && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse">
                    🚨 PIT HALT ACTIVE
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400">
                Direct statutory pit halt grievances reported by Mining Sirdars &amp; Underground Crews
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveEmergencyFilter("ALL")}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                activeEmergencyFilter === "ALL"
                  ? "bg-slate-700 text-white"
                  : "bg-slate-800/80 text-slate-400 hover:text-slate-200"
              }`}
            >
              All Alerts ({emergencyIssues.length})
            </button>
            <button
              onClick={() => setActiveEmergencyFilter("EMERGENCY_STOP")}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                activeEmergencyFilter === "EMERGENCY_STOP"
                  ? "bg-rose-600 text-white shadow-md shadow-rose-950"
                  : "bg-rose-950/40 text-rose-300 border border-rose-500/20 hover:border-rose-500/50"
              }`}
            >
              Emergency Stops Only ({emergencyIssues.filter((i) => i.is_emergency_stop || i.urgency === "EMERGENCY_STOP").length})
            </button>
          </div>
        </div>

        {/* Emergency Alert Cards Grid */}
        {filteredEmergencyIssues.length === 0 ? (
          <div className="p-6 rounded-2xl bg-slate-950/60 border border-slate-800 text-center">
            <CheckCircle2 className="w-7 h-7 text-emerald-400 mx-auto mb-2 opacity-80" />
            <div className="text-xs font-bold text-slate-200">All Underground Sections Operating Safely</div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              No emergency pit stop grievances or unaddressed high-hazard notices currently reported.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {filteredEmergencyIssues.map((issue) => {
              const isAck = acknowledgedAlerts[issue.id];
              const isEmergencyStop = issue.is_emergency_stop || issue.urgency === "EMERGENCY_STOP";
              return (
                <div
                  key={issue.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    isEmergencyStop
                      ? "bg-gradient-to-br from-rose-950/40 to-slate-950 border-rose-500/50 shadow-lg shadow-rose-950/30"
                      : "bg-slate-950/80 border-slate-800 hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded-full ${
                            isEmergencyStop
                              ? "bg-rose-500 text-slate-950 animate-pulse"
                              : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                          }`}
                        >
                          {isEmergencyStop ? "🛑 EMERGENCY STOP" : issue.urgency || "HIGH HAZARD"}
                        </span>
                        <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                          {issue.issue_category}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {typeof issue.created_at === "string" ? issue.created_at.slice(0, 16) : ""}
                        </span>
                      </div>

                      <div className="text-xs font-bold text-slate-100 leading-snug">
                        {issue.description}
                      </div>

                      <div className="text-[11px] text-slate-400 flex items-center gap-2 font-mono">
                        <span className="text-rose-400 font-semibold">📍 Location:</span>
                        <span>{issue.location_description}</span>
                      </div>

                      <div className="text-[10px] text-slate-500 flex items-center gap-2">
                        <span>Reported by:</span>
                        <span className="text-slate-300 font-semibold">{issue.reported_by_name || "Mining Sirdar"}</span>
                        <span>• Status:</span>
                        <span className="text-amber-400 font-semibold uppercase">{issue.status}</span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 shrink-0">
                      <button
                        onClick={() => handleAck(issue.id)}
                        disabled={isAck}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                          isAck
                            ? "bg-slate-800 text-slate-500 border border-slate-700 cursor-default"
                            : "bg-rose-500 hover:bg-rose-400 text-slate-950 shadow-md shadow-rose-950"
                        }`}
                      >
                        {isAck ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Acknowledged</span>
                          </>
                        ) : (
                          <>
                            <ShieldAlert className="w-3.5 h-3.5" />
                            <span>Acknowledge</span>
                          </>
                        )}
                      </button>

                      <Link
                        href="/capa"
                        className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-center transition-all"
                      >
                        Open CAPA
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* SECTION 2: WORKER STATUTORY LEAVE APPLICATIONS (MINES RULES 1955)   */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <CalendarCheck2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-100 text-sm tracking-wide">
                  Worker Statutory Leave Applications Cockpit
                </h3>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded font-bold">
                  Mines Rules 1955 Chapter VII
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Review, approve, or reject shift leaves with shift relief allocation
              </p>
            </div>
          </div>

          {/* Quick Summary Badges */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="px-3 py-1 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono">
              <span className="text-slate-500">Pending Review: </span>
              <span className="font-bold text-amber-400">{pendingLeaves.length}</span>
            </div>
            <div className="px-3 py-1 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono">
              <span className="text-slate-500">Approved: </span>
              <span className="font-bold text-emerald-400">{approvedLeaves.length}</span>
            </div>
          </div>
        </div>

        {/* Worker Leaves Table / Cards */}
        {workerLeaves.length === 0 ? (
          <div className="p-6 rounded-2xl bg-slate-950/60 border border-slate-800 text-center">
            <Calendar className="w-7 h-7 text-slate-600 mx-auto mb-2" />
            <div className="text-xs font-bold text-slate-300">No Leave Applications Found</div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Workers have not submitted any statutory leave requests for this colliery.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-[11px] font-mono font-semibold uppercase">
                  <th className="py-2.5 px-3">Worker &amp; Badge</th>
                  <th className="py-2.5 px-3">Leave Category</th>
                  <th className="py-2.5 px-3">Dates &amp; Duration</th>
                  <th className="py-2.5 px-3">Reason / Justification</th>
                  <th className="py-2.5 px-3">Nominated Relief</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Manager Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {workerLeaves.map((leave) => {
                  const isPending =
                    leave.status === "SUBMITTED" ||
                    leave.status === "QUEUED_OFFLINE" ||
                    leave.status === "PENDING";
                  return (
                    <tr
                      key={leave.id}
                      className="hover:bg-slate-950/40 transition-colors"
                    >
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-200">{leave.worker_name}</div>
                        <div className="text-[10px] font-mono text-slate-500">{leave.worker_id}</div>
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                            leave.leave_type === "EARNED_STATUTORY"
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : leave.leave_type === "SICK_MEDICAL"
                              ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                              : leave.leave_type === "CASUAL"
                              ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                              : "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                          }`}
                        >
                          {leave.leave_type}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <div className="text-slate-200 font-mono font-medium">
                          {leave.start_date} → {leave.end_date}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {leave.total_days} day{leave.total_days > 1 ? "s" : ""}
                        </div>
                      </td>
                      <td className="py-3 px-3 max-w-xs">
                        <p className="text-[11px] text-slate-300 truncate" title={leave.reason}>
                          {leave.reason}
                        </p>
                      </td>
                      <td className="py-3 px-3">
                        <div className="text-slate-300 text-[11px]">
                          {leave.relief_worker_name || leave.relief_worker_id || "Unassigned"}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full ${
                            leave.status === "APPROVED"
                              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                              : leave.status === "REJECTED"
                              ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                              : "bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse"
                          }`}
                        >
                          {leave.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        {isPending ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => {
                                setReviewingLeaveId(leave.id);
                                setReviewAction("APPROVED");
                                setReviewNotes("Shift relief allocated. Approved under Mines Rules 1955.");
                              }}
                              className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500 text-emerald-300 hover:text-slate-950 border border-emerald-500/30 text-[11px] font-bold transition-all flex items-center gap-1"
                              title="Approve Leave"
                            >
                              <Check className="w-3 h-3" />
                              <span>Approve</span>
                            </button>
                            <button
                              onClick={() => {
                                setReviewingLeaveId(leave.id);
                                setReviewAction("REJECTED");
                                setReviewNotes("Statutory minimum man-shift quota constraint.");
                              }}
                              className="px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-slate-950 border border-rose-500/30 text-[11px] font-bold transition-all flex items-center gap-1"
                              title="Reject Leave"
                            >
                              <X className="w-3 h-3" />
                              <span>Reject</span>
                            </button>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-500 font-mono">
                            {leave.reviewed_by ? `Reviewed by ${leave.reviewed_by.split(" ")[0]}` : "Finalized"}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* SECTION 3: CENTER 3-COLUMN METRICS (RISK + HAZARD + MUSTER)         */}
      {/* ─────────────────────────────────────────────────────────────────── */}
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

        {/* Col 5-8: Real-Time Operational Hazard Alerts */}
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

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* SECTION 4: RECENT SAFETY AUDIT RESULTS FEED                         */}
      {/* ─────────────────────────────────────────────────────────────────── */}
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

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* Modal: Leave Application Review & Shift Relief Allocation          */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {reviewingLeaveId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                {reviewAction === "APPROVED" ? (
                  <UserCheck className="w-5 h-5 text-emerald-400" />
                ) : (
                  <UserX className="w-5 h-5 text-rose-400" />
                )}
                <h3 className="font-bold text-slate-100 text-sm">
                  {reviewAction === "APPROVED" ? "Approve Leave Application" : "Reject Leave Application"}
                </h3>
              </div>
              <button
                onClick={() => setReviewingLeaveId(null)}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="text-xs text-slate-300">
                Provide Colliery Manager remarks and shift roster relief notes under Mines Rules 1955:
              </div>

              <div>
                <label className="text-[11px] font-mono text-slate-400 block mb-1">
                  Manager Review Remarks:
                </label>
                <textarea
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="e.g. Shift relief allocated to Sirdar Shankaraiah. Approved."
                  rows={3}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReviewingLeaveId(null)}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmReview}
                  disabled={reviewLoading}
                  className={`px-4 py-1.5 rounded-xl text-xs font-bold text-slate-950 transition-all ${
                    reviewAction === "APPROVED"
                      ? "bg-emerald-400 hover:bg-emerald-300"
                      : "bg-rose-500 hover:bg-rose-400 text-white"
                  }`}
                >
                  {reviewLoading ? "Submitting..." : `Confirm ${reviewAction}`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
