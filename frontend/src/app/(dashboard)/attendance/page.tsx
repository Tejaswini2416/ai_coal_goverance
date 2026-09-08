"use client";

import React, { useState, useEffect } from "react";
import {
  Users,
  HardHat,
  Compass,
  AlertTriangle,
  Flame,
  CheckCircle2,
  Plus,
  ArrowRightLeft,
  Clock,
  Fingerprint,
  Search,
  FileSpreadsheet,
  Download,
  FileText,
  ChevronDown,
  Loader2,
} from "lucide-react";
import { WorkerAttendance, HeadcountSummary } from "@/lib/types/domain";
import {
  fetchAttendance,
  fetchHeadcount,
  checkInWorker,
  checkOutWorker,
  exportAttendanceSpreadsheet,
} from "@/lib/api/attendance";
import { useAuthStore } from "@/lib/store/auth-store";
import { formatDate } from "@/lib/utils/dates";

export default function AttendancePage() {
  const { activeMineSiteId, activeMineName } = useAuthStore();
  const [attendanceList, setAttendanceList] = useState<WorkerAttendance[]>([]);
  const [headcount, setHeadcount] = useState<HeadcountSummary>({
    total_active_inside: 0,
    underground_count: 0,
    surface_count: 0,
    hazardous_exposure_alerts: 0,
  });
  const [loading, setLoading] = useState(true);
  const [filterShift, setFilterShift] = useState<string>("ALL");
  const [filterZone, setFilterZone] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [isCheckInOpen, setIsCheckInOpen] = useState(false);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [exporting, setExporting] = useState<string | null>(null);
  const [exportSuccess, setExportSuccess] = useState<string | null>(null);

  // New Check-in Form
  const [newWorkerId, setNewWorkerId] = useState("W-");
  const [newWorkerName, setNewWorkerName] = useState("");
  const [newZoneType, setNewZoneType] = useState("UNDERGROUND");
  const [newStationId, setNewStationId] = useState("LEVEL3-PANEL7");
  const [newShift, setNewShift] = useState("MORNING");
  const [newGasPpm, setNewGasPpm] = useState("5.0");

  const loadData = async () => {
    setLoading(true);
    try {
      const [list, hc] = await Promise.all([
        fetchAttendance(activeMineSiteId),
        fetchHeadcount(activeMineSiteId),
      ]);
      setAttendanceList(list);
      setHeadcount(hc);
    } catch (err) {
      console.error("Failed to load attendance", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeMineSiteId]);

  const handleExport = async (format: "xlsx" | "csv") => {
    setExporting(format);
    setIsExportMenuOpen(false);
    try {
      await exportAttendanceSpreadsheet({
        mineSiteId: activeMineSiteId,
        format,
        shift: filterShift,
        zoneType: filterZone,
        fallbackRecords: filteredAttendance,
        collieryName: activeMineName,
      });
      setExportSuccess(`DGMS Statutory Register (${format.toUpperCase()}) exported successfully.`);
      setTimeout(() => setExportSuccess(null), 4000);
    } catch (err: any) {
      console.error("Export failed:", err);
      alert(err.message || "Failed to download attendance register");
    } finally {
      setExporting(null);
    }
  };

  const handleCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await checkInWorker({
        worker_id: newWorkerId,
        worker_name: newWorkerName,
        mine_site_id: activeMineSiteId || "00000000-0000-0000-0000-000000000000",
        zone_type: newZoneType,
        station_id: newZoneType === "UNDERGROUND" ? newStationId : undefined,
        shift: newShift,
        biometric_verified: true,
        gas_level_exposure_ppm: parseFloat(newGasPpm) || 0.0,
      });
      setIsCheckInOpen(false);
      setNewWorkerName("");
      setNewWorkerId("W-");
      await loadData();
    } catch (err) {
      console.error("Failed to check-in worker", err);
    }
  };

  const handleCheckOut = async (attendanceId: string) => {
    try {
      await checkOutWorker(attendanceId);
      await loadData();
    } catch (err) {
      console.error("Failed to check-out worker", err);
    }
  };

  const filteredAttendance = attendanceList.filter((att) => {
    const matchesShift = filterShift === "ALL" || att.shift === filterShift;
    const matchesZone = filterZone === "ALL" || att.zone_type === filterZone;
    const matchesSearch =
      att.worker_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      att.worker_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (att.station_id || "").toLowerCase().includes(searchQuery.toLowerCase());
    return matchesShift && matchesZone && matchesSearch;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-400" />
            <h1 className="text-xl font-bold text-slate-100">
              Workforce Attendance & Real-Time Gas Exposure Logging
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Biometric station check-in/out, shift allocation, and atmospheric telemetry for{" "}
            <strong className="text-emerald-300">{activeMineName}</strong>.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* 1-Click Spreadsheet Export Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
              disabled={!!exporting}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 font-bold text-xs shadow-md transition-all active:scale-95 disabled:opacity-50"
            >
              {exporting ? (
                <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
              ) : (
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              )}
              <span>{exporting ? `Exporting ${exporting.toUpperCase()}...` : "Export Statutory Register"}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {isExportMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-750 rounded-xl shadow-2xl z-30 py-1.5 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
                <div className="px-3 py-1.5 border-b border-slate-800 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Select Statutory Format
                </div>
                <button
                  onClick={() => handleExport("xlsx")}
                  className="w-full px-3.5 py-2 text-left text-xs font-semibold text-slate-200 hover:bg-emerald-500/10 hover:text-emerald-300 flex items-center gap-2.5 transition-colors"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div>
                    <div className="font-bold">Excel Register (.xlsx)</div>
                    <div className="text-[10px] text-slate-400">DGMS Form-B Styled Workbook</div>
                  </div>
                </button>
                <button
                  onClick={() => handleExport("csv")}
                  className="w-full px-3.5 py-2 text-left text-xs font-semibold text-slate-200 hover:bg-blue-500/10 hover:text-blue-300 flex items-center gap-2.5 transition-colors"
                >
                  <FileText className="w-4 h-4 text-blue-400 shrink-0" />
                  <div>
                    <div className="font-bold">CSV Spreadsheet (.csv)</div>
                    <div className="text-[10px] text-slate-400">Raw Statutory Export</div>
                  </div>
                </button>
              </div>
            )}
          </div>

          <button
            onClick={() => setIsCheckInOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-950 transition-all active:scale-95"
          >
            <Fingerprint className="w-4 h-4" />
            <span>Log Worker Check-In</span>
          </button>
        </div>
      </div>

      {/* Export Success Toast */}
      {exportSuccess && (
        <div className="bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 px-4 py-3 rounded-2xl text-xs flex items-center gap-2.5 shadow-lg animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{exportSuccess}</span>
        </div>
      )}

      {/* Headcount Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400 font-medium">Active Inside Mine</div>
            <div className="text-2xl font-bold text-slate-100 mt-1">
              {headcount.total_active_inside} <span className="text-xs text-emerald-400 font-normal">Personnel</span>
            </div>
          </div>
          <Users className="w-8 h-8 text-emerald-400 opacity-80" />
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg flex items-center justify-between">
          <div>
            <div className="text-xs text-amber-400 font-medium">Underground Seam Workforce</div>
            <div className="text-2xl font-bold text-amber-300 mt-1">
              {headcount.underground_count}
            </div>
          </div>
          <HardHat className="w-8 h-8 text-amber-400 opacity-80" />
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg flex items-center justify-between">
          <div>
            <div className="text-xs text-blue-400 font-medium">Surface & Haul Pit Workforce</div>
            <div className="text-2xl font-bold text-blue-300 mt-1">
              {headcount.surface_count}
            </div>
          </div>
          <Compass className="w-8 h-8 text-blue-400 opacity-80" />
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg flex items-center justify-between">
          <div>
            <div className="text-xs text-rose-400 font-medium">Elevated Gas Exposure</div>
            <div className="text-2xl font-bold text-rose-400 mt-1">
              {headcount.hazardous_exposure_alerts} <span className="text-xs font-normal">Alerts</span>
            </div>
          </div>
          <Flame className="w-8 h-8 text-rose-500 opacity-80" />
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-4 rounded-2xl">
        <div className="flex flex-wrap items-center gap-2">
          {/* Zone Filter */}
          <span className="text-[11px] text-slate-400 font-semibold uppercase mr-1">Zone:</span>
          {["ALL", "UNDERGROUND", "SURFACE"].map((z) => (
            <button
              key={z}
              onClick={() => setFilterZone(z)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                filterZone === z
                  ? "bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-950"
                  : "bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800"
              }`}
            >
              {z}
            </button>
          ))}

          <div className="h-4 w-px bg-slate-800 mx-2" />

          {/* Shift Filter */}
          <span className="text-[11px] text-slate-400 font-semibold uppercase mr-1">Shift:</span>
          {["ALL", "MORNING", "EVENING", "NIGHT"].map((sh) => (
            <button
              key={sh}
              onClick={() => setFilterShift(sh)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                filterShift === sh
                  ? "bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-950"
                  : "bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800"
              }`}
            >
              {sh}
            </button>
          ))}
        </div>

        <div className="relative flex-1 sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search worker ID / name / station..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Attendance Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-800">
              <tr>
                <th className="px-5 py-3">Worker ID & Name</th>
                <th className="px-5 py-3">Zone & Station</th>
                <th className="px-5 py-3">Shift</th>
                <th className="px-5 py-3">Check-In Time</th>
                <th className="px-5 py-3">Atmospheric Gas Exposure</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-slate-400">
                    Loading attendance records...
                  </td>
                </tr>
              ) : filteredAttendance.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-slate-400">
                    No active attendance records match filter criteria.
                  </td>
                </tr>
              ) : (
                filteredAttendance.map((item) => {
                  const gasPpm = item.gas_level_exposure_ppm || 0;
                  const isDangerousGas = gasPpm > 30;
                  const isWarningGas = gasPpm >= 15 && gasPpm <= 30;

                  return (
                    <tr key={item.id} className="hover:bg-slate-850/60 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="font-bold text-slate-100 flex items-center gap-1.5">
                          <span>{item.worker_name}</span>
                          {item.biometric_verified && (
                            <span title="Biometric Verified">
                              <Fingerprint className="w-3.5 h-3.5 text-emerald-400" />
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] font-mono text-slate-400">{item.worker_id}</div>
                      </td>

                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950 text-slate-300 border border-slate-800">
                          {item.zone_type === "UNDERGROUND" ? (
                            <>
                              <HardHat className="w-3 h-3 text-amber-400" /> Underground
                            </>
                          ) : (
                            <>
                              <Compass className="w-3 h-3 text-blue-400" /> Surface
                            </>
                          )}
                        </span>
                        {item.station_id && (
                          <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                            {item.station_id}
                          </div>
                        )}
                      </td>

                      <td className="px-5 py-3.5">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                          {item.shift}
                        </span>
                      </td>

                      <td className="px-5 py-3.5 font-mono text-[11px] text-slate-400">
                        {formatDate(item.check_in_time)}
                      </td>

                      <td className="px-5 py-3.5">
                        <div
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-bold border ${
                            isDangerousGas
                              ? "bg-rose-500/20 text-rose-400 border-rose-500/30 animate-pulse"
                              : isWarningGas
                              ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
                              : "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                          }`}
                        >
                          <Flame className="w-3.5 h-3.5" />
                          <span>{gasPpm.toFixed(1)} ppm</span>
                        </div>
                      </td>

                      <td className="px-5 py-3.5">
                        {item.status === "ACTIVE_INSIDE" ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                            ACTIVE INSIDE
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                            CHECKED OUT
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-3.5 text-right">
                        {item.status === "ACTIVE_INSIDE" && (
                          <button
                            onClick={() => handleCheckOut(item.id)}
                            className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-[11px] border border-slate-700 transition-all"
                          >
                            Check-Out
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Check-In Form */}
      {isCheckInOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Fingerprint className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-slate-100 text-base">Worker Shift Check-In</h3>
              </div>
              <button
                onClick={() => setIsCheckInOpen(false)}
                className="text-slate-400 hover:text-slate-200 text-lg leading-none"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCheckIn} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Worker ID</label>
                  <input
                    type="text"
                    required
                    value={newWorkerId}
                    onChange={(e) => setNewWorkerId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Worker Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Full name"
                    value={newWorkerName}
                    onChange={(e) => setNewWorkerName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Zone Type</label>
                  <select
                    value={newZoneType}
                    onChange={(e) => setNewZoneType(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="UNDERGROUND">Underground Seam</option>
                    <option value="SURFACE">Surface / Haul Pit</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Shift</label>
                  <select
                    value={newShift}
                    onChange={(e) => setNewShift(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="MORNING">Morning Shift (06:00 - 14:00)</option>
                    <option value="EVENING">Evening Shift (14:00 - 22:00)</option>
                    <option value="NIGHT">Night Shift (22:00 - 06:00)</option>
                  </select>
                </div>
              </div>

              {newZoneType === "UNDERGROUND" && (
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Station / Seam Checkpoint</label>
                  <input
                    type="text"
                    required
                    value={newStationId}
                    onChange={(e) => setNewStationId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              )}

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Atmospheric Gas Level (ppm)</label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={newGasPpm}
                  onChange={(e) => setNewGasPpm(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  DGMS threshold: &lt; 15 ppm safe, &gt; 30 ppm triggers automated hazard alert
                </span>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCheckInOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-bold hover:bg-emerald-400 shadow-lg shadow-emerald-950"
                >
                  Confirm Biometric Check-In
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
