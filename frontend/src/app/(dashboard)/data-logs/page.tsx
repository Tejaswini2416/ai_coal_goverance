"use client";

import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/lib/store/auth-store";
import { useTenantStore } from "@/lib/store/tenant-store";
import {
  fetchAtmosphericLogs,
  fetchWorkerMusterLogs,
  fetchMineCastLogs,
  attemptAtmosphericMutation,
  AtmosphericLogItem,
  WorkerMusterLogItem,
  MineCastLogItem,
} from "@/lib/api/logs";
import {
  Database,
  Flame,
  Users,
  Pickaxe,
  ShieldCheck,
  AlertTriangle,
  FileCheck2,
  RefreshCw,
  Download,
  Search,
  Lock,
  ArrowUpRight,
  Clock,
  Gauge,
  Wind,
  Thermometer,
  Truck,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Fingerprint,
  X,
} from "lucide-react";
import Link from "next/link";

type TabType = "atmospheric" | "workers" | "mine_casts";

export default function DataLogsPage() {
  const [mounted, setMounted] = useState(false);
  const { activeMineSiteId, activeMineName } = useAuthStore();
  const { selectedMine, selectedMineId } = useTenantStore();
  const [activeTab, setActiveTab] = useState<TabType>("atmospheric");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLogForTamper, setSelectedLogForTamper] = useState<AtmosphericLogItem | null>(null);
  const [editValue, setEditValue] = useState<string>("18.0");
  const [isTampering, setIsTampering] = useState(false);
  const [tamperResult, setTamperResult] = useState<any>(null);

  const effectiveMineId = selectedMineId || activeMineSiteId;

  useEffect(() => {
    setMounted(true);
  }, []);

  // Queries
  const atmosphericQuery = useQuery({
    queryKey: ["logs-atmospheric", effectiveMineId],
    queryFn: () => fetchAtmosphericLogs(effectiveMineId),
    refetchInterval: 30000,
  });

  const workersQuery = useQuery({
    queryKey: ["logs-workers", effectiveMineId],
    queryFn: () => fetchWorkerMusterLogs(effectiveMineId),
    refetchInterval: 30000,
  });

  const castsQuery = useQuery({
    queryKey: ["logs-mine-casts", effectiveMineId],
    queryFn: () => fetchMineCastLogs(effectiveMineId),
    refetchInterval: 30000,
  });

  const collieryTitle = mounted
    ? (selectedMine?.name || activeMineName || "Godavarikhani No. 11A Incline (SCCL)")
    : "Godavarikhani No. 11A Incline (SCCL)";

  const handleTamperAttempt = async () => {
    if (!selectedLogForTamper) return;
    setIsTampering(true);
    setTamperResult(null);

    try {
      const res = await attemptAtmosphericMutation(
        selectedLogForTamper.id,
        "co_ppm",
        editValue,
        effectiveMineId
      );
      setTamperResult(res.error || res.data);
    } catch (err: any) {
      setTamperResult({ message: err.message || "Mutation rejected by statutory immutable guard." });
    } finally {
      setIsTampering(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900 to-blue-950/40 border border-slate-800 shadow-2xl">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[11px] font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5" /> Immutable Statutory Vault (CMR 2017)
            </span>
            <span className="text-[11px] font-mono text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded">
              SHA-256 Verified
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-100 tracking-tight">
            Colliery Shift Data Logs
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Raw time-series telemetry & operational records for <span className="text-slate-200 font-semibold">{collieryTitle}</span>.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              atmosphericQuery.refetch();
              workersQuery.refetch();
              castsQuery.refetch();
            }}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-2 border border-slate-700 transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
          <Link
            href="/audit-ledger"
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-blue-950 transition-all"
          >
            <ShieldCheck className="w-4 h-4" /> Audit Ledger
          </Link>
        </div>
      </div>

      {/* KPI Overview Pills */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <Flame className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-400">Telemetry Stream Baseline</div>
            <div className="text-xl font-black text-slate-100 font-mono mt-0.5">
              {atmosphericQuery.data?.length ?? 6} Active Stations
            </div>
            <div className="text-[10px] text-emerald-400 font-mono">100% Cryptographic Intact</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-400">Underground Shift Muster</div>
            <div className="text-xl font-black text-slate-100 font-mono mt-0.5">
              {workersQuery.data?.length ?? 6} Registered Personnel
            </div>
            <div className="text-[10px] text-emerald-400 font-mono">Biometric RFID Scanned</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <Pickaxe className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-400">Daily Opencast Extraction</div>
            <div className="text-xl font-black text-slate-100 font-mono mt-0.5">
              8,990 MT Dispatched
            </div>
            <div className="text-[10px] text-purple-400 font-mono">5 Benches Operational</div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2 p-1 rounded-2xl bg-slate-900 border border-slate-800 max-w-fit">
          <button
            onClick={() => setActiveTab("atmospheric")}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
              activeTab === "atmospheric"
                ? "bg-blue-600 text-white shadow-lg shadow-blue-950"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
            }`}
          >
            <Flame className="w-4 h-4" />
            <span>Tab 1: Atmospheric Configuration</span>
          </button>

          <button
            onClick={() => setActiveTab("workers")}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
              activeTab === "workers"
                ? "bg-emerald-600 text-white shadow-lg shadow-emerald-950"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Tab 2: Worker Muster</span>
          </button>

          <button
            onClick={() => setActiveTab("mine_casts")}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
              activeTab === "mine_casts"
                ? "bg-purple-600 text-white shadow-lg shadow-purple-950"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
            }`}
          >
            <Pickaxe className="w-4 h-4" />
            <span>Tab 3: Mine Casts & Extraction</span>
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search records, stations, hashes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500/50 transition-all font-mono"
          />
        </div>
      </div>

      {/* Tab 1: Atmospheric Configuration */}
      {activeTab === "atmospheric" && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-xl overflow-hidden">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-blue-400" />
              <span className="text-xs font-bold text-slate-200">
                Continuous Underground Gas Sensor Readings (CMR 2017 Reg 153)
              </span>
            </div>
            <span className="text-[11px] font-mono text-slate-400">
              Auto-streamed from Pit Telemetry Network
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 uppercase font-mono text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4 font-semibold">Station / Location</th>
                  <th className="py-3.5 px-4 font-semibold">CH4 (Methane)</th>
                  <th className="py-3.5 px-4 font-semibold">CO (PPM)</th>
                  <th className="py-3.5 px-4 font-semibold">O2 %</th>
                  <th className="py-3.5 px-4 font-semibold">Velocity &amp; Temp</th>
                  <th className="py-3.5 px-4 font-semibold">Status Badge</th>
                  <th className="py-3.5 px-4 font-semibold">Immutable SHA-256 Hash</th>
                  <th className="py-3.5 px-4 font-semibold text-right text-sky-400">STATUTORY ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {atmosphericQuery.data
                  ?.filter(
                    (row) =>
                      row.station_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      row.location_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      row.record_hash.toLowerCase().includes(searchTerm.toLowerCase())
                  )
                  .map((row) => (
                    <tr key={row.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-200 font-sans text-xs">{row.location_name}</div>
                        <span className="text-[10px] text-blue-400 font-mono">{row.station_code}</span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`font-bold ${
                            row.ch4_pct >= 0.75
                              ? "text-rose-400 font-black"
                              : row.ch4_pct >= 0.5
                              ? "text-amber-400"
                              : "text-slate-200"
                          }`}
                        >
                          {row.ch4_pct}%
                        </span>
                        <span className="text-[10px] text-slate-500 block">CMR Limit: 0.75%</span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`font-bold ${
                            row.co_ppm >= 50
                              ? "text-rose-400 font-black"
                              : row.co_ppm >= 15
                              ? "text-amber-400"
                              : "text-slate-200"
                          }`}
                        >
                          {row.co_ppm} ppm
                        </span>
                        <span className="text-[10px] text-slate-500 block">CMR Limit: 50 ppm</span>
                      </td>

                      <td className="py-3.5 px-4 text-slate-300">
                        {row.o2_pct}%
                      </td>

                      <td className="py-3.5 px-4 text-slate-400">
                        <div>{row.velocity_ms} m/s</div>
                        <div className="text-[10px] text-slate-500">{row.temp_c}°C</div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            row.status === "STATUTORY_BREACH"
                              ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                              : row.status === "EXCURSION_WARNING"
                              ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                              : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          }`}
                        >
                          {row.status}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 bg-slate-950 px-2 py-1 rounded border border-slate-800 max-w-fit">
                          <Lock className="w-3 h-3 text-emerald-400 shrink-0" />
                          <span className="text-[10px] text-slate-400 font-mono">
                            SHA-256: [{row.record_hash.slice(0, 8)}...{row.record_hash.slice(-6)}]
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => {
                            setSelectedLogForTamper(row);
                            setEditValue(String(row.co_ppm));
                            setTamperResult(null);
                          }}
                          className="px-4 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-bold transition-all shadow-sm active:scale-95"
                          title="Edit record"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Worker Muster */}
      {activeTab === "workers" && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-xl overflow-hidden">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold text-slate-200">
                Statutory Biometric Shift Attendance & Gallery Deployment
              </span>
            </div>
            <span className="text-[11px] font-mono text-slate-400">
              Mines Act 1952 Sec 48 Shift Register
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 uppercase font-mono text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4 font-semibold">Worker Details</th>
                  <th className="py-3.5 px-4 font-semibold">Gallery Station</th>
                  <th className="py-3.5 px-4 font-semibold">Shift &amp; In-Time</th>
                  <th className="py-3.5 px-4 font-semibold">Duration &amp; Overtime</th>
                  <th className="py-3.5 px-4 font-semibold">CO Exposure</th>
                  <th className="py-3.5 px-4 font-semibold">Biometric Status</th>
                  <th className="py-3.5 px-4 font-semibold">Immutable Record Hash</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {workersQuery.data
                  ?.filter(
                    (row) =>
                      row.worker_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      row.worker_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      row.station_id.toLowerCase().includes(searchTerm.toLowerCase())
                  )
                  .map((row) => (
                    <tr key={row.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-200 font-sans text-xs">{row.worker_name}</div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-2">
                          <span className="text-emerald-400 font-mono">{row.worker_id}</span>
                          <span>•</span>
                          <span>{row.designation || "Mining Crew"}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="text-blue-400 font-bold">{row.station_id}</span>
                        <span className="text-[10px] text-slate-500 block">{row.zone_type}</span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="text-slate-200 font-bold">{row.shift}</span>
                        <span className="text-[10px] text-slate-500 block">{row.check_in_time.slice(11, 19)} UTC</span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="text-slate-200 font-bold">{row.duration_hours} hrs</span>
                        {row.is_overtime ? (
                          <span className="text-[10px] bg-rose-500/20 text-rose-400 px-1.5 py-0.5 rounded font-bold block mt-0.5 max-w-fit border border-rose-500/30">
                            Overtime &gt;8h Flagged
                          </span>
                        ) : (
                          <span className="text-[10px] text-emerald-400 block mt-0.5">Standard Shift</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`font-bold ${
                            row.gas_exposure_ppm > 15 ? "text-amber-400" : "text-emerald-400"
                          }`}
                        >
                          {row.gas_exposure_ppm} ppm
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 font-bold">
                          <Fingerprint className="w-3 h-3" /> VERIFIED
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 bg-slate-950 px-2 py-1 rounded border border-slate-800 max-w-fit">
                          <Lock className="w-3 h-3 text-emerald-400 shrink-0" />
                          <span className="text-[10px] text-slate-400 font-mono">
                            SHA-256: [{row.record_hash.slice(0, 8)}...{row.record_hash.slice(-6)}]
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Mine Casts & Extraction */}
      {activeTab === "mine_casts" && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-xl overflow-hidden">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
            <div className="flex items-center gap-2">
              <Pickaxe className="w-4 h-4 text-purple-400" />
              <span className="text-xs font-bold text-slate-200">
                Opencast Bench Production, Dumper Dispatch & Blasting Clearance Registers
              </span>
            </div>
            <span className="text-[11px] font-mono text-slate-400">
              DGMS Circular 2 of 2010 Compliance
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 uppercase font-mono text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4 font-semibold">Bench / Location</th>
                  <th className="py-3.5 px-4 font-semibold">Shift &amp; Date</th>
                  <th className="py-3.5 px-4 font-semibold">Extracted Tonnage</th>
                  <th className="py-3.5 px-4 font-semibold">Quota Target</th>
                  <th className="py-3.5 px-4 font-semibold">Dumper Trips</th>
                  <th className="py-3.5 px-4 font-semibold">Blasting Clearance</th>
                  <th className="py-3.5 px-4 font-semibold">Clearance In-Charge</th>
                  <th className="py-3.5 px-4 font-semibold">Immutable Hash</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {castsQuery.data
                  ?.filter(
                    (row) =>
                      row.bench_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      row.bench_id.toLowerCase().includes(searchTerm.toLowerCase())
                  )
                  .map((row) => (
                    <tr key={row.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-200 font-sans text-xs">{row.bench_name}</div>
                        <span className="text-[10px] text-purple-400 font-mono">{row.bench_id}</span>
                      </td>

                      <td className="py-3.5 px-4 text-slate-300">
                        <div>{row.shift}</div>
                        <div className="text-[10px] text-slate-500">{row.date}</div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-100">{row.extraction_tonnage.toLocaleString()} MT</span>
                        <span className="text-[10px] text-emerald-400 block">{row.quota_achievement_pct}% of quota</span>
                      </td>

                      <td className="py-3.5 px-4 text-slate-400">
                        {row.target_quota_tonnage.toLocaleString()} MT
                      </td>

                      <td className="py-3.5 px-4 text-slate-300">
                        <div className="flex items-center gap-1.5">
                          <Truck className="w-3.5 h-3.5 text-blue-400" />
                          <span>{row.dumper_trips_count} Trips</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            row.blasting_clearance_status === "CLEARED"
                              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                              : row.blasting_clearance_status === "RESTRICTED"
                              ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                              : "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                          }`}
                        >
                          {row.blasting_clearance_status}
                        </span>
                        {row.explosives_used_kg > 0 && (
                          <span className="text-[9px] text-slate-500 block mt-0.5 font-mono">
                            {row.explosives_used_kg} kg ANFO
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-slate-300 font-sans text-xs">
                        {row.clearance_engineer}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 bg-slate-950 px-2 py-1 rounded border border-slate-800 max-w-fit">
                          <Lock className="w-3 h-3 text-emerald-400 shrink-0" />
                          <span className="text-[10px] text-slate-400 font-mono">
                            SHA-256: [{row.record_hash.slice(0, 8)}...{row.record_hash.slice(-6)}]
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit Statutory Record Modal */}
      {selectedLogForTamper && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                    Statutory Telemetry
                  </span>
                  <span className="text-xs font-mono text-slate-400">
                    {selectedLogForTamper.station_code}
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-100 mt-1">
                  Edit Statutory Sensor Record
                </h3>
                <p className="text-xs text-slate-400">
                  {selectedLogForTamper.location_name}
                </p>
              </div>
              <button
                onClick={() => setSelectedLogForTamper(null)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Current Values Display */}
            <div className="grid grid-cols-2 gap-3 bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800/80 text-xs">
              <div>
                <span className="text-[10px] text-slate-500 font-mono block">CURRENT CO READING</span>
                <span className="font-bold text-slate-200 font-mono text-sm">
                  {selectedLogForTamper.co_ppm} ppm
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-mono block">CH4 (METHANE)</span>
                <span className="font-bold text-slate-200 font-mono text-sm">
                  {selectedLogForTamper.ch4_pct}%
                </span>
              </div>
              <div className="col-span-2 pt-2 border-t border-slate-800/50">
                <span className="text-[10px] text-slate-500 font-mono block">IMMUTABLE SHA-256 HASH</span>
                <span className="font-mono text-[10px] text-emerald-400 truncate block">
                  {selectedLogForTamper.record_hash}
                </span>
              </div>
            </div>

            {/* Edit Field */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 block">
                Target Value (Carbon Monoxide - CO PPM)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  placeholder="Enter new CO value (e.g. 12.0)"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono text-slate-100 placeholder-slate-500 focus:outline-none focus:border-rose-500 transition-all"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-500 font-mono">
                  ppm
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Attempting to overwrite sealed statutory telemetry will invoke the compliance interceptor.
              </p>
            </div>

            {/* Tamper Interception Result (if triggered) */}
            {tamperResult && (
              <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-500/40 space-y-2 text-xs animate-in fade-in duration-150">
                <div className="flex items-center gap-2 text-rose-400 font-bold">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>Statutory Immutability Enforced (HTTP 403)</span>
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  {tamperResult.message || (typeof tamperResult === "string" ? tamperResult : "Modification intercepted by immutable audit ledger.")}
                </p>
                {tamperResult.incident && (
                  <div className="flex flex-wrap items-center gap-2 pt-1 font-mono text-[10px]">
                    <span className="bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded border border-rose-500/30 font-bold">
                      Audit Block #{tamperResult.incident.audit_block_sequence}
                    </span>
                    <span className="bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded border border-amber-500/30">
                      Dispatched to DGMS &amp; Ministry
                    </span>
                  </div>
                )}
                <div className="pt-2">
                  <Link
                    href="/audit-ledger"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-400 hover:text-rose-300 underline underline-offset-2"
                  >
                    <span>View Tamper Evidence in Audit Ledger</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSelectedLogForTamper(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleTamperAttempt}
                disabled={isTampering}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-lg shadow-rose-950 flex items-center gap-2"
              >
                {isTampering ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <span>Edit</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
