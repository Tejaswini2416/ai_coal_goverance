"use client";

import React, { useState, useEffect } from "react";
import {
  UserCheck,
  Clock,
  ShieldAlert,
  Wind,
  PhoneCall,
  Flame,
  CheckCircle2,
  AlertOctagon,
  HardHat,
  BookOpen,
  MapPin,
  HelpCircle,
  AlertTriangle,
  Plus,
  Send,
  Camera,
  Layers,
  Sparkles,
  Check,
  Loader2,
  RefreshCw,
  Search,
  WifiOff,
  Radio,
  FileCheck,
  Calendar,
  CalendarDays,
  FileCheck2,
  FileText,
  UserCheck2,
  Briefcase,
  ChevronRight,
} from "lucide-react";
import { useAuthStore } from "@/lib/store/auth-store";
import { WorkerIssueReport, WorkerIssueOut, WorkerLeave, WorkerLeaveRequest } from "@/lib/types/domain";
import { reportWorkerIssue, fetchMyWorkerIssues, submitWorkerLeave, fetchWorkerLeaves } from "@/lib/api/worker";

interface WorkerDashboardProps {
  data: Record<string, any>;
  mineSiteName?: string;
}

const ISSUE_CATEGORIES = [
  {
    id: "VENTILATION_GAS",
    label: "Poor Ventilation / Gaseous Odors (CH₄/CO)",
    icon: Wind,
    color: "text-rose-400 bg-rose-500/10 border-rose-500/30",
    cmrRule: "CMR 2017 Reg 153 & 154",
  },
  {
    id: "ROOF_SUPPORT",
    label: "Loose Roof / Side Spalling / Strata Warning",
    icon: Layers,
    color: "text-amber-400 bg-amber-500/10 border-amber-500/30",
    cmrRule: "CMR 2017 Reg 123 (SSR)",
  },
  {
    id: "EQUIPMENT_DEFECT",
    label: "Machine Brake / Cable Sheath / Conveyor Idler",
    icon: HardHat,
    color: "text-blue-400 bg-blue-500/10 border-blue-500/30",
    cmrRule: "CMR 2017 Reg 130 & DGMS Tech Circ",
  },
  {
    id: "WATER_LOGGING",
    label: "Water Sump Inundation / Slurry Accumulation",
    icon: AlertOctagon,
    color: "text-teal-400 bg-teal-500/10 border-teal-500/30",
    cmrRule: "CMR 2017 Reg 145",
  },
  {
    id: "WELFARE",
    label: "Drinking Water / Illumination / PPE Shortage",
    icon: CheckCircle2,
    color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
    cmrRule: "Mines Act 1952 / Rule 29B",
  },
];

export function WorkerDashboard({ data, mineSiteName }: WorkerDashboardProps) {
  const { activeMineSiteId, activeMineName, userName } = useAuthStore();
  const [activePortalTab, setActivePortalTab] = useState<"HAZARDS" | "LEAVES">("HAZARDS");
  
  // Hazard Modal & Form State
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [category, setCategory] = useState("VENTILATION_GAS");
  const [locationDesc, setLocationDesc] = useState("Level 3 Gallery 4 near Panel 7 Intake");
  const [description, setDescription] = useState("");
  const [isEmergency, setIsEmergency] = useState(false);
  const [photoUrl, setPhotoUrl] = useState("");

  // Hazard Tracking List
  const [issues, setIssues] = useState<WorkerIssueOut[]>([]);
  const [loadingIssues, setLoadingIssues] = useState(true);

  // Leave Applications State
  const [leaves, setLeaves] = useState<WorkerLeave[]>([]);
  const [loadingLeaves, setLoadingLeaves] = useState(true);
  const [leaveModalOpen, setLeaveModalOpen] = useState(false);
  const [submittingLeave, setSubmittingLeave] = useState(false);
  const [leaveSuccessMsg, setLeaveSuccessMsg] = useState<string | null>(null);
  const [leaveErrorMsg, setLeaveErrorMsg] = useState<string | null>(null);

  // Leave Form State
  const [leaveType, setLeaveType] = useState<string>("EARNED_STATUTORY");
  const [leaveStartDate, setLeaveStartDate] = useState<string>("2026-09-15");
  const [leaveEndDate, setLeaveEndDate] = useState<string>("2026-09-18");
  const [leaveTotalDays, setLeaveTotalDays] = useState<number>(4);
  const [leaveReason, setLeaveReason] = useState<string>("");
  const [reliefWorkerId, setReliefWorkerId] = useState<string>("W-108");
  const [reliefWorkerName, setReliefWorkerName] = useState<string>("K. Shankaraiah (Mining Sirdar)");

  const profile = data.worker_profile || {
    worker_id: "W-104",
    worker_name: userName || "Rajesh Kumar Mandal",
    designation: "Certified Mining Sirdar / Gas Testing Overman",
    active_mine: mineSiteName || activeMineName || "Godavarikhani No. 11A Incline (GDK-11A) SCCL",
    assigned_zone: "Level 3 Return Airway (Panel 7)",
    shift: "Morning Shift (06:00 AM - 02:00 PM)",
    biometric_status: "VERIFIED_PRESENT",
    check_in_time: "06:00 AM",
    hours_logged_today: "5.5 hrs",
    overtime_hours_this_week: "1.5 hrs (Within statutory 8h limit)",
  };

  const gasLive = data.gas_telemetry_live || {
    ch4_methane_pct: 0.42,
    ch4_status: "SAFE",
    ch4_limit_pct: 1.25,
    co_carbon_monoxide_ppm: 8.5,
    co_status: "NORMAL",
    co_limit_ppm: 50.0,
    airflow_velocity_mps: 2.4,
    airflow_status: "ADEQUATE",
    ambient_temp_c: 27.8,
  };

  const safetyRules = data.statutory_safety_rules || [];
  const sosProtocol = data.sos_protocol || {
    emergency_hotline: "Pit-Bottom Dial #101 / Control Room 07752-240101",
    refuge_chamber_location: "Refuge Chamber 3B (180m West of Panel 7 Intake)",
    evacuation_route: "Intake Airway (Green Beacon Marked Route) ➔ Shaft #2 Cage",
  };

  const loadIssues = async () => {
    setLoadingIssues(true);
    try {
      const list = await fetchMyWorkerIssues(activeMineSiteId);
      setIssues(list);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingIssues(false);
    }
  };

  const loadLeaves = async () => {
    setLoadingLeaves(true);
    try {
      const list = await fetchWorkerLeaves(activeMineSiteId, profile.worker_id);
      setLeaves(list);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingLeaves(false);
    }
  };

  useEffect(() => {
    loadIssues();
    loadLeaves();
  }, [activeMineSiteId]);

  const handleSubmitLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveReason.trim()) {
      setLeaveErrorMsg("Please state a reason for the leave application.");
      return;
    }

    setSubmittingLeave(true);
    setLeaveErrorMsg(null);
    setLeaveSuccessMsg(null);

    const payload: WorkerLeaveRequest = {
      mine_site_id: activeMineSiteId || "11111111-1111-4111-a111-111111111111",
      worker_id: profile.worker_id,
      worker_name: profile.worker_name,
      leave_type: leaveType,
      start_date: leaveStartDate,
      end_date: leaveEndDate,
      total_days: Number(leaveTotalDays) || 1,
      reason: leaveReason.trim(),
      relief_worker_id: reliefWorkerId,
      relief_worker_name: reliefWorkerName,
    };

    try {
      const created = await submitWorkerLeave(payload);
      setLeaveSuccessMsg("Statutory Leave Application submitted! Colliery Manager notified for shift relief verification.");
      setLeaveReason("");
      setLeaves((prev) => [created, ...prev]);

      setTimeout(() => {
        setLeaveModalOpen(false);
        setLeaveSuccessMsg(null);
      }, 2000);
    } catch (err: any) {
      setLeaveErrorMsg(err?.message || "Failed to submit leave application.");
    } finally {
      setSubmittingLeave(false);
    }
  };

  const handleSubmitIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      setErrorMsg("Please provide a description of the hazard.");
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const payload: WorkerIssueReport = {
      mine_site_id: activeMineSiteId || "11111111-1111-4111-a111-111111111111",
      issue_category: category,
      location_description: locationDesc,
      description: description.trim(),
      urgency: isEmergency ? "EMERGENCY_STOP" : "HIGH",
      photo_evidence_url: photoUrl.trim() || undefined,
    };

    try {
      const created = await reportWorkerIssue(payload);
      setSuccessMsg(
        isEmergency
          ? "EMERGENCY STOP WARNING BROADCAST! Colliery Manager and Control Room notified immediately."
          : "Issue reported successfully. Logged to mine safety register & queued."
      );
      // Reset form
      setDescription("");
      setIsEmergency(false);
      setPhotoUrl("");
      setIssues((prev) => [created, ...prev]);

      setTimeout(() => {
        setModalOpen(false);
        setSuccessMsg(null);
      }, 2000);
    } catch (err: any) {
      setErrorMsg(err?.message || "Failed to submit issue.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Worker Greeting & Live Shift Card */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-amber-950/30 border border-slate-800 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0 shadow-lg shadow-amber-950/30">
            <HardHat className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                {profile.worker_id}
              </span>
              <h1 className="text-xl font-bold text-slate-100">{profile.worker_name}</h1>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
                <CheckCircle2 className="w-3 h-3" />
                {profile.biometric_status.replace(/_/g, " ")}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-2">
              <span>{profile.designation}</span>
              <span>&bull;</span>
              <span className="text-slate-300 font-medium">{profile.active_mine}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-right">
            <div className="text-[10px] uppercase font-bold text-slate-400">Shift Allocation</div>
            <div className="text-xs font-bold text-slate-200 mt-0.5">{profile.shift}</div>
          </div>
          <div className="px-4 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-right">
            <div className="text-[10px] uppercase font-bold text-slate-400">Hours Logged Today</div>
            <div className="text-xs font-mono font-bold text-amber-400 mt-0.5">{profile.hours_logged_today}</div>
          </div>
        </div>
      </div>

      {/* Live Safety Telemetry Gauge Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Methane Meter */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">CH₄ Methane Concentration</span>
            <Flame className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-black text-emerald-400 font-mono mt-2">{gasLive.ch4_methane_pct}%</div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
            <span>Status: <strong className="text-emerald-400 font-bold">{gasLive.ch4_status}</strong></span>
            <span>Limit: {gasLive.ch4_limit_pct}%</span>
          </div>
        </div>

        {/* Carbon Monoxide Meter */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">CO Carbon Monoxide</span>
            <ShieldAlert className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-3xl font-black text-blue-400 font-mono mt-2">{gasLive.co_carbon_monoxide_ppm} ppm</div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
            <span>Status: <strong className="text-blue-400 font-bold">{gasLive.co_status}</strong></span>
            <span>Limit: {gasLive.co_limit_ppm} ppm</span>
          </div>
        </div>

        {/* Airflow Velocity */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Face Airflow Velocity</span>
            <Wind className="w-4 h-4 text-teal-400" />
          </div>
          <div className="text-3xl font-black text-slate-100 font-mono mt-2">{gasLive.airflow_velocity_mps} m/s</div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
            <span>Status: <strong className="text-teal-400 font-bold">{gasLive.airflow_status}</strong></span>
            <span>Min: 0.5 m/s</span>
          </div>
        </div>

        {/* Working Zone */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Assigned Working Zone</span>
            <MapPin className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-sm font-bold text-slate-200 mt-2 truncate">{profile.assigned_zone}</div>
          <div className="text-[11px] text-slate-500 mt-2">
            Pit Ambient Temp: <strong className="text-slate-300 font-mono">{gasLive.ambient_temp_c}°C</strong>
          </div>
        </div>
      </div>

      {/* PORTAL NAVIGATION TABS: Hazards vs Statutory Leave */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActivePortalTab("HAZARDS")}
          className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 ${
            activePortalTab === "HAZARDS"
              ? "bg-amber-500 text-slate-950 shadow-lg shadow-amber-950/40 font-extrabold"
              : "bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800"
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          <span>On-Ground Hazards &amp; Grievance Addressal</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-950/40 font-mono">
            {issues.length}
          </span>
        </button>

        <button
          onClick={() => setActivePortalTab("LEAVES")}
          className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 ${
            activePortalTab === "LEAVES"
              ? "bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-950/40 font-extrabold"
              : "bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800"
          }`}
        >
          <CalendarDays className="w-4 h-4" />
          <span>Statutory Leave &amp; Shift Relief Portal (Mines Rules 1955)</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-950/40 font-mono">
            {leaves.length}
          </span>
        </button>
      </div>

      {/* TAB 1: WORKER ISSUE & HAZARD ADDRESSAL PORTAL */}
      {activePortalTab === "HAZARDS" && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                <h2 className="text-lg font-black text-slate-100">Worker Issue &amp; Hazard Addressal Portal</h2>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Log on-ground defects, strata instability, ventilation faults, or machinery issues directly to Colliery Management.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={loadIssues}
                disabled={loadingIssues}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-semibold border border-slate-700 flex items-center gap-1.5 transition-all"
                title="Refresh issues list"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingIssues ? "animate-spin text-amber-400" : ""}`} />
                <span>Sync Status</span>
              </button>

              <button
                onClick={() => setModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all shadow-md flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Log New Grievance</span>
              </button>
            </div>
          </div>

          {/* My Reported Issues Real-Time Resolution List */}
          <div>
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span>My Reported Issues &amp; Resolution Tracking</span>
            </h3>

            {loadingIssues ? (
              <div className="space-y-3">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="h-20 rounded-xl bg-slate-950 border border-slate-800 animate-pulse" />
                ))}
              </div>
            ) : issues.length === 0 ? (
              <div className="p-8 rounded-xl bg-slate-950/60 border border-slate-800 text-center">
                <FileCheck className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="text-xs text-slate-400">No active hazards or grievances reported for this shift.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {issues.map((item) => {
                  const isEmergencyStop = item.urgency === "EMERGENCY_STOP" || item.is_emergency_stop;
                  const statusColor =
                    item.status === "RECTIFIED"
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                      : item.status === "INVESTIGATING"
                      ? "bg-blue-500/10 text-blue-400 border-blue-500/30"
                      : "bg-amber-500/10 text-amber-400 border-amber-500/30";

                  return (
                    <div
                      key={item.id}
                      className={`p-4 rounded-xl border bg-slate-950/80 transition-all ${
                        isEmergencyStop
                          ? "border-rose-500/40 bg-rose-950/10"
                          : "border-slate-800 hover:border-slate-700"
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded border bg-slate-800 text-slate-300">
                            {item.issue_category.replace(/_/g, " ")}
                          </span>

                          <span
                            className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded border ${
                              isEmergencyStop
                                ? "bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse"
                                : "bg-slate-800 text-slate-400 border-slate-700"
                            }`}
                          >
                            {isEmergencyStop ? "🛑 EMERGENCY STOP" : item.urgency}
                          </span>

                          <span className="text-xs text-slate-300 font-semibold flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-amber-400" />
                            {item.location_description}
                          </span>
                        </div>

                        {/* Status Progress Pill */}
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-full border ${statusColor}`}>
                            ● {item.status.replace(/_/g, " ")}
                          </span>
                        </div>
                      </div>

                      <p className="text-xs text-slate-300 leading-relaxed pl-1">{item.description}</p>

                      <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
                        <span>Reported by: <strong className="text-slate-400">{item.reported_by_name || "Mining Sirdar"}</strong></span>
                        <span>{new Date(item.created_at).toLocaleString()}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: STATUTORY LEAVE APPLICATIONS & SHIFT RELIEF PORTAL */}
      {activePortalTab === "LEAVES" && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6 animate-in fade-in duration-200">
          {/* Leave Section Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-emerald-400" />
                <h2 className="text-lg font-black text-slate-100">
                  Statutory Leave Applications &amp; Shift Relief Allocation
                </h2>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Formal leave submission pursuant to <strong>Mines Rules 1955 Chapter VII (Statutory Leave with Wages)</strong>.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={loadLeaves}
                disabled={loadingLeaves}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-semibold border border-slate-700 flex items-center gap-1.5 transition-all"
                title="Refresh leave applications"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingLeaves ? "animate-spin text-emerald-400" : ""}`} />
                <span>Sync Leaves</span>
              </button>

              <button
                onClick={() => setLeaveModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all shadow-md flex items-center gap-1.5 shadow-emerald-950/40"
              >
                <Plus className="w-4 h-4" />
                <span>Apply for Statutory Leave</span>
              </button>
            </div>
          </div>

          {/* Statutory Leave Balances Metric Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div>
                <div className="text-xs text-slate-400 font-medium">Earned Statutory Leave</div>
                <div className="text-2xl font-bold text-emerald-400 mt-1">
                  14 <span className="text-xs font-normal text-slate-400">Days Remaining</span>
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">Accrued 1 day per 20 underground shifts</div>
              </div>
              <Calendar className="w-8 h-8 text-emerald-400 opacity-80" />
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div>
                <div className="text-xs text-slate-400 font-medium">Medical / Sick Leave</div>
                <div className="text-2xl font-bold text-blue-400 mt-1">
                  8 <span className="text-xs font-normal text-slate-400">Days Available</span>
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">Full statutory sick wage protection</div>
              </div>
              <FileCheck2 className="w-8 h-8 text-blue-400 opacity-80" />
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div>
                <div className="text-xs text-slate-400 font-medium">Casual Contingency Leave</div>
                <div className="text-2xl font-bold text-amber-400 mt-1">
                  5 <span className="text-xs font-normal text-slate-400">Days Available</span>
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">Personal emergency / family quota</div>
              </div>
              <Briefcase className="w-8 h-8 text-amber-400 opacity-80" />
            </div>
          </div>

          {/* Leave Applications History Table */}
          <div>
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-emerald-400" />
              <span>Leave Application History &amp; Approval Status</span>
            </h3>

            {loadingLeaves ? (
              <div className="space-y-3">
                {[1, 2].map((n) => (
                  <div key={n} className="h-20 rounded-xl bg-slate-950 border border-slate-800 animate-pulse" />
                ))}
              </div>
            ) : leaves.length === 0 ? (
              <div className="p-8 rounded-xl bg-slate-950/60 border border-slate-800 text-center">
                <Calendar className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="text-xs text-slate-400">No leave applications recorded for this financial cycle.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {leaves.map((leave) => {
                  const isApproved = leave.status === "APPROVED";
                  const isRejected = leave.status === "REJECTED";
                  const statusBadgeClass = isApproved
                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                    : isRejected
                    ? "bg-rose-500/20 text-rose-300 border-rose-500/40"
                    : "bg-amber-500/20 text-amber-300 border-amber-500/40";

                  return (
                    <div
                      key={leave.id}
                      className="p-4 rounded-xl border border-slate-800 bg-slate-950/80 hover:border-slate-700 transition-all"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded border bg-slate-800 text-slate-300">
                            {leave.leave_type.replace(/_/g, " ")}
                          </span>

                          <span className="text-xs text-slate-200 font-bold flex items-center gap-1.5">
                            <CalendarDays className="w-3.5 h-3.5 text-emerald-400" />
                            {leave.start_date} ➔ {leave.end_date}
                          </span>

                          <span className="text-[11px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                            {leave.total_days} {leave.total_days === 1 ? "Day" : "Days"}
                          </span>
                        </div>

                        <span className={`text-[10px] font-mono font-bold uppercase px-2.5 py-1 rounded-full border ${statusBadgeClass}`}>
                          ● {leave.status}
                        </span>
                      </div>

                      <p className="text-xs text-slate-300 pl-1 leading-relaxed">{leave.reason}</p>

                      <div className="mt-3 pt-2 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-slate-400 gap-1.5">
                        <div className="flex items-center gap-1.5">
                          <UserCheck2 className="w-3.5 h-3.5 text-amber-400" />
                          <span>Nominated Shift Relief: <strong className="text-slate-200">{leave.relief_worker_name || "Unassigned"}</strong></span>
                        </div>

                        {leave.reviewed_by && (
                          <div className="text-slate-400">
                            Reviewed by: <strong className="text-emerald-300">{leave.reviewed_by}</strong>
                            {leave.review_notes && <span className="text-slate-500 ml-1">({leave.review_notes})</span>}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Bottom Grid: Statutory Safety Rules (Left) + Emergency SOS (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 8 Cols: CMR 2017 Statutory Safety Rules Guidelines */}
        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-amber-400" />
              <h3 className="font-bold text-slate-100 text-sm">Essential CMR 2017 Safety Directives (Mining Sirdar Duty)</h3>
            </div>
            <span className="text-[10px] font-mono text-amber-400">DGMS Standard</span>
          </div>

          <div className="space-y-4">
            {safetyRules.map((rule: any, i: number) => (
              <div key={i} className="p-4 rounded-xl border border-slate-800 bg-slate-950/80 hover:border-slate-700 transition-all">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2 font-mono text-xs">
                    <span className="font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                      {rule.rule_code}
                    </span>
                    <span className="font-bold text-slate-200">{rule.title}</span>
                  </div>
                  <span
                    className={`text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded ${
                      rule.importance === "CRITICAL"
                        ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                        : "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                    }`}
                  >
                    {rule.importance}
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">{rule.directive}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Right 4 Cols: Emergency SOS Protocol & Refuge Chamber */}
        <div className="lg:col-span-4 bg-gradient-to-b from-rose-950/30 via-slate-900 to-slate-900 border border-rose-500/30 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3 mb-4">
              <AlertOctagon className="w-5 h-5 text-rose-400" />
              <h3 className="font-bold text-slate-100 text-sm">Emergency SOS &amp; Evacuation Protocol</h3>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-500 font-mono block mb-1">EMERGENCY HOTLINE</span>
                <span className="font-bold text-rose-400 font-mono text-sm">{sosProtocol.emergency_hotline}</span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-500 font-mono block mb-1">NEAREST REFUGE CHAMBER</span>
                <span className="font-bold text-slate-200">{sosProtocol.refuge_chamber_location}</span>
                <span className="text-[11px] text-emerald-400 block mt-1">Equipped with 48h Oxygen Supply &amp; Food</span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-500 font-mono block mb-1">PRIMARY ESCAPEWAY</span>
                <span className="font-bold text-slate-200">{sosProtocol.evacuation_route}</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800 text-center">
            <span className="text-[10px] text-slate-500 block">
              In case of uncontainable gas ingress or roof fall, sound local klaxon and activate personal self-rescuer mask.
            </span>
          </div>
        </div>
      </div>

      {/* MODAL: REPORT ON-GROUND HAZARD / ISSUE */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-amber-500/40 rounded-2xl w-full max-w-xl shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                <h3 className="font-black text-slate-100 text-base">Address an Issue / Report Hazard</h3>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-white text-sm px-2 py-1 rounded-lg hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            {successMsg && (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs mb-4 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {errorMsg && (
              <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs mb-4 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmitIssue} className="space-y-4">
              {/* Category Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  1. Issue / Hazard Category
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {ISSUE_CATEGORIES.map((cat) => {
                    const Icon = cat.icon;
                    const isSelected = category === cat.id;
                    return (
                      <button
                        type="button"
                        key={cat.id}
                        onClick={() => setCategory(cat.id)}
                        className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all ${
                          isSelected
                            ? "bg-amber-500/20 border-amber-500/60 shadow-md"
                            : "bg-slate-950 border-slate-800 hover:border-slate-700"
                        }`}
                      >
                        <Icon className={`w-4 h-4 shrink-0 mt-0.5 ${isSelected ? "text-amber-400" : "text-slate-400"}`} />
                        <div>
                          <div className={`text-xs font-bold ${isSelected ? "text-slate-100" : "text-slate-300"}`}>
                            {cat.label}
                          </div>
                          <span className="text-[10px] text-slate-500 block">{cat.cmrRule}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Underground Gallery / Location Description */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  2. Underground Gallery / Incline Location
                </label>
                <input
                  type="text"
                  value={locationDesc}
                  onChange={(e) => setLocationDesc(e.target.value)}
                  placeholder="e.g. Gallery 4, 380m Level near Shaft Bottom / Incline 1"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              {/* Detailed Hazard Description */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  3. Description &amp; Ground Observations
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the condition, smell, cracking sounds, mechanical brake slip, or gas reading observed..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-amber-500 resize-none"
                  required
                />
              </div>

              {/* Optional Photo / Evidence Link */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center justify-between">
                  <span>4. Photo Evidence URL / Link (Optional)</span>
                  <Camera className="w-3.5 h-3.5 text-slate-400" />
                </label>
                <input
                  type="text"
                  value={photoUrl}
                  onChange={(e) => setPhotoUrl(e.target.value)}
                  placeholder="https://... or S3 snapshot link"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-amber-500 font-mono text-[11px]"
                />
              </div>

              {/* Emergency Stop Toggle */}
              <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-500/30 flex items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-bold text-rose-300 block flex items-center gap-1.5">
                    <AlertOctagon className="w-4 h-4 text-rose-400" />
                    Emergency Safety Threat (Halts Extraction)
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Immediately escalates CRITICAL alert to Colliery Manager and triggers sirens.
                  </span>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isEmergency}
                    onChange={(e) => setIsEmergency(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-600"></div>
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className={`px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg transition-all ${
                    isEmergency
                      ? "bg-rose-600 hover:bg-rose-500 text-white shadow-rose-950/40"
                      : "bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-950/40"
                  }`}
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  <span>{isEmergency ? "Trigger Emergency Broadcast" : "Submit Issue Report"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: APPLY FOR STATUTORY LEAVE (MINES RULES 1955) */}
      {leaveModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-emerald-500/40 rounded-2xl w-full max-w-xl shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="font-black text-slate-100 text-base">Apply for Statutory Leave</h3>
                  <span className="text-[10px] text-slate-400">Mines Rules 1955 Chapter VII (Leave with Wages)</span>
                </div>
              </div>
              <button
                onClick={() => setLeaveModalOpen(false)}
                className="text-slate-400 hover:text-white text-sm px-2 py-1 rounded-lg hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            {leaveSuccessMsg && (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs mb-4 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{leaveSuccessMsg}</span>
              </div>
            )}

            {leaveErrorMsg && (
              <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs mb-4 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>{leaveErrorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmitLeave} className="space-y-4">
              {/* Leave Type Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  1. Statutory Leave Category
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {[
                    { id: "EARNED_STATUTORY", label: "Earned Leave", desc: "14 days balance", icon: Calendar },
                    { id: "SICK_MEDICAL", label: "Medical Sick", desc: "8 days balance", icon: FileCheck2 },
                    { id: "CASUAL", label: "Casual Leave", desc: "5 days balance", icon: Briefcase },
                  ].map((lt) => {
                    const Icon = lt.icon;
                    const isSelected = leaveType === lt.id;
                    return (
                      <button
                        type="button"
                        key={lt.id}
                        onClick={() => setLeaveType(lt.id)}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          isSelected
                            ? "bg-emerald-500/20 border-emerald-500/60 shadow-md"
                            : "bg-slate-950 border-slate-800 hover:border-slate-700"
                        }`}
                      >
                        <Icon className={`w-4 h-4 shrink-0 mb-1 ${isSelected ? "text-emerald-400" : "text-slate-400"}`} />
                        <div className={`text-xs font-bold ${isSelected ? "text-slate-100" : "text-slate-300"}`}>
                          {lt.label}
                        </div>
                        <span className="text-[10px] text-slate-500 block">{lt.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Date Pickers */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={leaveStartDate}
                    onChange={(e) => setLeaveStartDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={leaveEndDate}
                    onChange={(e) => setLeaveEndDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Total Shift Days
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={90}
                    value={leaveTotalDays}
                    onChange={(e) => setLeaveTotalDays(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 font-mono font-bold"
                    required
                  />
                </div>
              </div>

              {/* Nominated Shift Relief Worker */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  2. Nominated Shift Relief (Mining Sirdar / Overman)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={reliefWorkerId}
                    onChange={(e) => setReliefWorkerId(e.target.value)}
                    placeholder="Relief Badge ID (e.g. W-108)"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                  <input
                    type="text"
                    value={reliefWorkerName}
                    onChange={(e) => setReliefWorkerName(e.target.value)}
                    placeholder="Relief Person Name"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <span className="text-[10px] text-slate-500 mt-1 block">
                  DGMS mandate: Shift must maintain certified statutory overman coverage during absence.
                </span>
              </div>

              {/* Reason for Leave */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  3. Reason for Leave Application
                </label>
                <textarea
                  rows={3}
                  value={leaveReason}
                  onChange={(e) => setLeaveReason(e.target.value)}
                  placeholder="State reason (e.g. Annual statutory vacation entitlement, family contingency, medical checkup)..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 resize-none"
                  required
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setLeaveModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submittingLeave}
                  className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-950/40 transition-all"
                >
                  {submittingLeave ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  <span>Submit Leave Application</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
