"use client";

import React, { useState, useEffect } from "react";
import {
  AlertTriangle,
  Plus,
  Send,
  Camera,
  Layers,
  Wind,
  HardHat,
  AlertOctagon,
  CheckCircle2,
  RefreshCw,
  MapPin,
  FileCheck,
  Radio,
  Loader2,
  ShieldAlert,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import { useAuthStore } from "@/lib/store/auth-store";
import { WorkerIssueReport, WorkerIssueOut } from "@/lib/types/domain";
import { reportWorkerIssue, fetchMyWorkerIssues } from "@/lib/api/worker";
import { offlineDb } from "@/lib/db/offline-db";

const ISSUE_CATEGORIES = [
  {
    id: "VENTILATION_GAS",
    label: "Poor Ventilation / Gaseous Odors (CH₄/CO)",
    icon: Wind,
    cmrRule: "CMR 2017 Reg 153 & 154",
  },
  {
    id: "ROOF_SUPPORT",
    label: "Loose Roof / Side Spalling / Strata Warning",
    icon: Layers,
    cmrRule: "CMR 2017 Reg 123 (SSR)",
  },
  {
    id: "EQUIPMENT_DEFECT",
    label: "Machine Brake / Cable Sheath / Conveyor Idler",
    icon: HardHat,
    cmrRule: "CMR 2017 Reg 130 & DGMS Tech Circ",
  },
  {
    id: "WATER_LOGGING",
    label: "Water Sump Inundation / Slurry Accumulation",
    icon: AlertOctagon,
    cmrRule: "CMR 2017 Reg 145",
  },
  {
    id: "WELFARE",
    label: "Drinking Water / Illumination / PPE Shortage",
    icon: CheckCircle2,
    cmrRule: "Mines Act 1952 / Rule 29B",
  },
];

export default function WorkerIssuesPage() {
  const { activeMineSiteId, activeMineName, userName } = useAuthStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form State
  const [category, setCategory] = useState("VENTILATION_GAS");
  const [locationDesc, setLocationDesc] = useState("Kasipet Incline No. 1 Haulage Station");
  const [description, setDescription] = useState("");
  const [isEmergency, setIsEmergency] = useState(false);
  const [photoUrl, setPhotoUrl] = useState("");

  // List State
  const [issues, setIssues] = useState<WorkerIssueOut[]>([]);
  const [loadingIssues, setLoadingIssues] = useState(true);

  const loadIssues = async () => {
    setLoadingIssues(true);
    try {
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        const localIssues = await offlineDb.worker_issues.toArray();
        setIssues(localIssues as any);
        return;
      }
      const list = await fetchMyWorkerIssues(activeMineSiteId);
      setIssues(list);
    } catch (e) {
      console.warn("API load failed, falling back to local Dexie store:", e);
      try {
        const localIssues = await offlineDb.worker_issues.toArray();
        if (localIssues.length > 0) {
          setIssues(localIssues as any);
        }
      } catch (dexErr) {
        console.error("Dexie read error:", dexErr);
      }
    } finally {
      setLoadingIssues(false);
    }
  };

  useEffect(() => {
    loadIssues();
  }, [activeMineSiteId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      setErrorMsg("Please enter an issue description.");
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

    // Offline intercept
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      const localIssueId = `offline-issue-${Date.now()}`;
      try {
        await offlineDb.worker_issues.put({
          id: localIssueId,
          mine_site_id: payload.mine_site_id,
          issue_category: payload.issue_category,
          location_description: payload.location_description,
          description: payload.description,
          urgency: payload.urgency,
          photo_evidence_url: payload.photo_evidence_url,
          status: "QUEUED_OFFLINE",
          is_synced: 0,
          created_at: new Date().toISOString(),
        });
        setSuccessMsg(
          "📶 OFFLINE MODE: Hazard report queued locally in Dexie IndexedDB. Will synchronize automatically upon reconnection."
        );
        setDescription("");
        setIsEmergency(false);
        setPhotoUrl("");
        setIssues((prev: any) => [
          {
            id: localIssueId,
            ...payload,
            status: "QUEUED_OFFLINE",
            created_at: new Date().toISOString(),
          },
          ...prev,
        ]);
        setTimeout(() => {
          setModalOpen(false);
          setSuccessMsg(null);
        }, 2500);
      } catch (err: any) {
        setErrorMsg("Failed to store report in local Dexie database.");
      } finally {
        setSubmitting(false);
      }
      return;
    }

    try {
      const created = await reportWorkerIssue(payload);
      setSuccessMsg(
        isEmergency
          ? "CRITICAL HAZARD BROADCAST SENT to Colliery Manager and Shift Overman."
          : "Grievance submitted successfully and queued in safety register."
      );
      setDescription("");
      setIsEmergency(false);
      setPhotoUrl("");
      setIssues((prev) => [created, ...prev]);
      setTimeout(() => {
        setModalOpen(false);
        setSuccessMsg(null);
      }, 2000);
    } catch (err: any) {
      // Fallback on unexpected server error: store locally in Dexie
      const localIssueId = `offline-issue-${Date.now()}`;
      await offlineDb.worker_issues.put({
        id: localIssueId,
        mine_site_id: payload.mine_site_id,
        issue_category: payload.issue_category,
        location_description: payload.location_description,
        description: payload.description,
        urgency: payload.urgency,
        photo_evidence_url: payload.photo_evidence_url,
        status: "QUEUED_OFFLINE",
        is_synced: 0,
        created_at: new Date().toISOString(),
      });
      setSuccessMsg(
        "📶 Server unreachable. Report saved locally in offline pit queue."
      );
      setIssues((prev: any) => [
        {
          id: localIssueId,
          ...payload,
          status: "QUEUED_OFFLINE",
          created_at: new Date().toISOString(),
        },
        ...prev,
      ]);
      setTimeout(() => {
        setModalOpen(false);
        setSuccessMsg(null);
      }, 2500);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Link
              href="/overview"
              className="text-slate-400 hover:text-slate-200 text-xs flex items-center gap-1 font-semibold"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
            </Link>
          </div>
          <h1 className="text-2xl font-black text-slate-100 tracking-tight mt-1 flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-amber-400" />
            <span>Worker Issue &amp; Hazard Addressal Portal</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Log on-ground defects, strata instability, ventilation faults, or machinery issues directly for{" "}
            <strong className="text-emerald-300">{activeMineName}</strong>.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadIssues}
            disabled={loadingIssues}
            className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-semibold flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingIssues ? "animate-spin text-amber-400" : ""}`} />
            <span>Sync Issues</span>
          </button>

          <button
            onClick={() => setModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white text-xs font-bold shadow-lg shadow-rose-950/40 border border-rose-400/30 flex items-center gap-1.5 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Log New Hazard</span>
          </button>
        </div>
      </div>

      {/* Issues Tracking List */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
          <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
          <span>Active Grievances &amp; Resolution Tracking</span>
        </h2>

        {loadingIssues ? (
          <div className="space-y-3">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-20 rounded-xl bg-slate-950 border border-slate-800 animate-pulse" />
            ))}
          </div>
        ) : issues.length === 0 ? (
          <div className="p-8 rounded-xl bg-slate-950/60 border border-slate-800 text-center">
            <FileCheck className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-xs text-slate-400">No issues or hazards reported currently.</p>
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

                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-full border ${statusColor}`}>
                        ● {item.status.replace(/_/g, " ")}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed pl-1">{item.description}</p>

                  <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
                    <span>Reported by: <strong className="text-slate-400">{item.reported_by_name || userName || "Mining Sirdar"}</strong></span>
                    <span>{new Date(item.created_at).toLocaleString()}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL */}
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

            <form onSubmit={handleSubmit} className="space-y-4">
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
    </div>
  );
}
