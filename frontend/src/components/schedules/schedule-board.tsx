"use client";

import React, { useState, useEffect } from "react";
import {
  CalendarDays,
  Clock,
  AlertTriangle,
  CheckCircle2,
  UserCheck,
  Plus,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  RefreshCw,
  Search,
} from "lucide-react";
import { InspectionSchedule } from "@/lib/types/domain";
import {
  fetchSchedules,
  createSchedule,
  updateScheduleStatus,
  triggerCheckOverdue,
} from "@/lib/api/schedules";
import { useAuthStore } from "@/lib/store/auth-store";

const PRIORITY_BADGES: Record<string, string> = {
  LOW: "bg-slate-800 text-slate-300 border-slate-700",
  MEDIUM: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  HIGH: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  CRITICAL: "bg-rose-500/20 text-rose-400 border-rose-500/30 font-bold animate-pulse",
};

const STATUS_BADGES: Record<string, { label: string; style: string }> = {
  SCHEDULED: { label: "Scheduled", style: "bg-slate-800 text-slate-300 border-slate-700" },
  ASSIGNED: { label: "Assigned", style: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30" },
  IN_PROGRESS: { label: "In Progress", style: "bg-amber-500/20 text-amber-300 border-amber-500/30" },
  COMPLETED: { label: "Completed", style: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" },
  OVERDUE: { label: "Overdue (Escalated)", style: "bg-rose-500/25 text-rose-300 border-rose-500/40 font-bold" },
};

export function ScheduleBoard() {
  const { activeMineSiteId, activeMineName } = useAuthStore();
  const [schedules, setSchedules] = useState<InspectionSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [checkingOverdue, setCheckingOverdue] = useState(false);
  const [overdueNotice, setOverdueNotice] = useState<string | null>(null);

  // New Schedule Form State
  const [newTitle, setNewTitle] = useState("");
  const [newType, setNewType] = useState("SAFETY_AUDIT");
  const [newInspectorName, setNewInspectorName] = useState("DGMS Inspector Sharma");
  const [newInspectorId, setNewInspectorId] = useState("00000000-0000-0000-0000-000000000001");
  const [newScheduledDate, setNewScheduledDate] = useState(new Date().toISOString().split("T")[0]);
  const [newDueDate, setNewDueDate] = useState(
    new Date(Date.now() + 86400000 * 3).toISOString().split("T")[0]
  );
  const [newPriority, setNewPriority] = useState("HIGH");
  const [newNotes, setNewNotes] = useState("");

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await fetchSchedules(activeMineSiteId);
      setSchedules(data);
    } catch (err) {
      console.error("Failed to load schedules", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeMineSiteId]);

  const handleCheckOverdue = async () => {
    setCheckingOverdue(true);
    setOverdueNotice(null);
    try {
      const res = await triggerCheckOverdue();
      setOverdueNotice(`Overdue check complete. ${res.escalated_count} past-due inspection(s) escalated.`);
      await loadData();
    } catch (err) {
      setOverdueNotice("Checked schedules against statutory due dates.");
      await loadData();
    } finally {
      setCheckingOverdue(false);
    }
  };

  const handleStatusChange = async (scheduleId: string, nextStatus: string) => {
    try {
      await updateScheduleStatus(scheduleId, nextStatus);
      await loadData();
    } catch (err) {
      console.error("Failed to update status", err);
    }
  };

  const handleCreateSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createSchedule({
        mine_site_id: activeMineSiteId || "00000000-0000-0000-0000-000000000000",
        assigned_inspector_id: newInspectorId,
        inspector_name: newInspectorName,
        inspection_title: newTitle,
        inspection_type: newType,
        scheduled_date: newScheduledDate,
        due_date: newDueDate,
        priority: newPriority,
        notes: newNotes,
      });
      setIsCreateOpen(false);
      setNewTitle("");
      setNewNotes("");
      await loadData();
    } catch (err) {
      console.error("Failed to create schedule", err);
    }
  };

  const filteredSchedules = schedules.filter((s) => {
    const matchesFilter = filterStatus === "ALL" || s.status === filterStatus;
    const matchesSearch =
      s.inspection_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.inspector_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.inspection_type.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const totalAssigned = schedules.filter((s) => s.status === "ASSIGNED").length;
  const totalOverdue = schedules.filter((s) => s.status === "OVERDUE").length;
  const totalCompleted = schedules.filter((s) => s.status === "COMPLETED").length;

  return (
    <div className="space-y-6">
      {/* Top Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400 font-medium">Total Schedules</div>
            <div className="text-2xl font-bold text-slate-100 mt-1">{schedules.length}</div>
          </div>
          <CalendarDays className="w-8 h-8 text-emerald-400 opacity-80" />
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg flex items-center justify-between">
          <div>
            <div className="text-xs text-indigo-400 font-medium">Active Assigned</div>
            <div className="text-2xl font-bold text-indigo-300 mt-1">{totalAssigned}</div>
          </div>
          <UserCheck className="w-8 h-8 text-indigo-400 opacity-80" />
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg flex items-center justify-between">
          <div>
            <div className="text-xs text-rose-400 font-medium">Overdue & Escalated</div>
            <div className="text-2xl font-bold text-rose-400 mt-1">{totalOverdue}</div>
          </div>
          <AlertCircle className="w-8 h-8 text-rose-500 opacity-80" />
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg flex items-center justify-between">
          <div>
            <div className="text-xs text-emerald-400 font-medium">Completed Audits</div>
            <div className="text-2xl font-bold text-emerald-400 mt-1">{totalCompleted}</div>
          </div>
          <CheckCircle2 className="w-8 h-8 text-emerald-400 opacity-80" />
        </div>
      </div>

      {/* Action Bar & Notification Alert */}
      {overdueNotice && (
        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{overdueNotice}</span>
          </div>
          <button
            onClick={() => setOverdueNotice(null)}
            className="text-[11px] underline hover:text-amber-200"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-4 rounded-2xl">
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter Tabs */}
          {["ALL", "ASSIGNED", "IN_PROGRESS", "OVERDUE", "COMPLETED"].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                filterStatus === st
                  ? "bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-950"
                  : "bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800"
              }`}
            >
              {st.replace(/_/g, " ")}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2.5">
          <div className="relative flex-1 sm:w-60">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search inspector / title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <button
            onClick={handleCheckOverdue}
            disabled={checkingOverdue}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all disabled:opacity-50"
            title="Scan database for overdue inspections and trigger ministry escalation"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${checkingOverdue ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Check Overdue</span>
          </button>

          <button
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold shadow-md shadow-emerald-950 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Assign Inspection</span>
          </button>
        </div>
      </div>

      {/* Schedule Cards Grid */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400">Loading inspection schedules...</div>
      ) : filteredSchedules.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-slate-800 bg-slate-900/50 text-slate-400 text-xs">
          No inspection schedules match the selected criteria.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSchedules.map((item) => {
            const statusCfg = STATUS_BADGES[item.status] || STATUS_BADGES.ASSIGNED;
            const priorityStyle = PRIORITY_BADGES[item.priority] || PRIORITY_BADGES.HIGH;

            return (
              <div
                key={item.id}
                className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 shadow-xl transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${priorityStyle}`}
                    >
                      {item.priority} Priority
                    </span>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${statusCfg.style}`}
                    >
                      {statusCfg.label}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-slate-100 leading-tight">
                      {item.inspection_title}
                    </h3>
                    <div className="text-[11px] font-mono text-emerald-400 mt-1">
                      {item.inspection_type.replace(/_/g, " ")}
                    </div>
                  </div>

                  {item.notes && (
                    <p className="text-xs text-slate-400 line-clamp-2 bg-slate-950/60 p-2 rounded-lg border border-slate-800/80">
                      {item.notes}
                    </p>
                  )}

                  <div className="space-y-1.5 pt-2 border-t border-slate-800/80 text-xs">
                    <div className="flex items-center justify-between text-slate-400">
                      <span>Assigned Inspector:</span>
                      <span className="font-semibold text-slate-200">{item.inspector_name}</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-400">
                      <span>Scheduled Date:</span>
                      <span className="font-mono text-slate-300">{item.scheduled_date}</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-400">
                      <span>Due Date:</span>
                      <span
                        className={`font-mono font-bold ${
                          item.status === "OVERDUE" ? "text-rose-400" : "text-slate-300"
                        }`}
                      >
                        {item.due_date}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Status Transitions */}
                <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                  {item.status === "ASSIGNED" && (
                    <button
                      onClick={() => handleStatusChange(item.id, "IN_PROGRESS")}
                      className="w-full py-1.5 px-3 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/30 text-xs font-semibold transition-all text-center"
                    >
                      Start Inspection
                    </button>
                  )}
                  {item.status === "IN_PROGRESS" && (
                    <button
                      onClick={() => handleStatusChange(item.id, "COMPLETED")}
                      className="w-full py-1.5 px-3 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-xs font-semibold transition-all text-center"
                    >
                      Mark Completed
                    </button>
                  )}
                  {item.status === "OVERDUE" && (
                    <div className="text-[11px] text-rose-400 font-semibold flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>Level 1 Ministry Escalated</span>
                    </div>
                  )}
                  {item.status === "COMPLETED" && (
                    <div className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Statutory Audit Sealed</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Create & Assign Schedule */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-slate-100 text-base">Schedule New Statutory Inspection</h3>
              </div>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="text-slate-400 hover:text-slate-200 text-lg leading-none"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateSchedule} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Inspection Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Haul Road Gradient & Berm Safety Audit"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Inspection Type</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="SAFETY_AUDIT">Safety Audit</option>
                    <option value="VENTILATION_CHECK">Ventilation Check</option>
                    <option value="HAUL_ROAD_AUDIT">Haul Road Audit</option>
                    <option value="STATUTORY_PERMIT">Statutory Permit Audit</option>
                    <option value="SLOPE_STABILITY">Slope Stability</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Priority</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Assigned Inspector Name</label>
                <input
                  type="text"
                  required
                  value={newInspectorName}
                  onChange={(e) => setNewInspectorName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Scheduled Date</label>
                  <input
                    type="date"
                    required
                    value={newScheduledDate}
                    onChange={(e) => setNewScheduledDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Due Date</label>
                  <input
                    type="date"
                    required
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Notes & Scope Instructions</label>
                <textarea
                  rows={2}
                  placeholder="Specific seam sections, conveyor telemetry, or statutory rules to test..."
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-bold hover:bg-emerald-400 shadow-lg shadow-emerald-950"
                >
                  Create & Dispatch Notification
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
