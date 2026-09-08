"use client";

import React, { useState, useEffect } from "react";
import { useTenantStore } from "@/lib/store/tenant-store";
import {
  Truck,
  TrendingUp,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowUpRight,
  Download,
  Filter,
} from "lucide-react";

export default function ContractorProductionPage() {
  const { selectedMine } = useTenantStore();
  const [selectedColliery, setSelectedColliery] = useState<"ALL" | "RG_OCP3" | "KOCP">("ALL");

  useEffect(() => {
    if (selectedMine) {
      if (selectedMine.name.includes("RG-OCP") || selectedMine.id.includes("2222")) {
        setSelectedColliery("RG_OCP3");
      } else if (selectedMine.name.includes("KOCP") || selectedMine.id.includes("3333")) {
        setSelectedColliery("KOCP");
      } else {
        setSelectedColliery("ALL");
      }
    }
  }, [selectedMine]);

  const productionData = {
    today_total_tonnage: 9420,
    daily_target_tonnage: 10000,
    completion_rate: 94.2,
    trips_completed: 284,
    active_tippers: 34,
    downtime_hours: 1.4,
    downtime_reason: "Water tanker sprinkler replenishment on haul road sector 3",
  };

  const dispatchTrips = [
    { id: "DSP-801", colliery: "RG-OCP 3", vehicle: "AP-36-DM-8812", operator: "K. Ramesh Kumar", net_weight_t: 85.4, gross_weight_t: 135.2, time: "14:22", destination: "NTPC Ramagundam STPS", status: "DISPATCHED" },
    { id: "DSP-802", colliery: "RG-OCP 3", vehicle: "AP-36-DM-9104", operator: "S. Anjaiah", net_weight_t: 88.0, gross_weight_t: 138.0, time: "14:15", destination: "SCCL Godavari CHP", status: "DISPATCHED" },
    { id: "DSP-803", colliery: "KOCP", vehicle: "TS-09-DM-4412", operator: "P. Venu Gopal", net_weight_t: 79.8, gross_weight_t: 129.5, time: "14:05", destination: "Kothagudem Thermal Station (KTPS)", status: "DISPATCHED" },
    { id: "DSP-804", colliery: "RG-OCP 3", vehicle: "TS-22-EX-0870", operator: "Ch. Srinivas", net_weight_t: 91.2, gross_weight_t: 142.1, time: "13:50", destination: "Ramagundam Rail Loading Siding", status: "DISPATCHED" },
    { id: "DSP-805", colliery: "KOCP", vehicle: "TS-09-DM-5521", operator: "B. Raju", net_weight_t: 84.1, gross_weight_t: 134.0, time: "13:35", destination: "SCCL Rudrampur Depot", status: "DISPATCHED" },
  ];

  const hourlyExtraction = [
    { hour: "06:00", actual: 820, target: 800 },
    { hour: "08:00", actual: 950, target: 900 },
    { hour: "10:00", actual: 1100, target: 1000 },
    { hour: "12:00", actual: 780, target: 950 },
    { hour: "14:00", actual: 1020, target: 1000 },
    { hour: "16:00", actual: 980, target: 950 },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl">
        <div>
          <div className="flex items-center gap-2.5 text-purple-400">
            <Truck className="w-6 h-6" />
            <h1 className="text-xl font-black text-slate-100 tracking-tight">
              Real-Time Coal Extraction &amp; Dispatch Analytics
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Singareni Collieries (SCCL) Contractual Production Dashboard • Shift-A &amp; Shift-B
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedColliery}
            onChange={(e) => setSelectedColliery(e.target.value as any)}
            className="bg-slate-950 border border-slate-800 text-xs text-slate-200 px-3.5 py-2 rounded-xl focus:outline-none focus:border-purple-500 font-mono"
          >
            <option value="ALL">All Telangana Collieries (4 Sites)</option>
            <option value="RG_OCP3">RG-OCP 3 (Ramagundam)</option>
            <option value="KOCP">KOCP (Kothagudem)</option>
          </select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl">
          <span className="text-xs font-semibold text-slate-400 block">Daily Output Achieved</span>
          <div className="text-3xl font-black text-slate-100 font-mono mt-1">
            {productionData.today_total_tonnage.toLocaleString()} <span className="text-sm font-normal text-slate-500">Tonnes</span>
          </div>
          <div className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1 font-semibold">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>{productionData.completion_rate}% of {productionData.daily_target_tonnage.toLocaleString()} T target</span>
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl">
          <span className="text-xs font-semibold text-slate-400 block">Weighbridge Dispatches</span>
          <div className="text-3xl font-black text-purple-400 font-mono mt-1">
            {productionData.trips_completed} <span className="text-sm font-normal text-slate-500">Trips</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Active Tippers / Dumpers: <strong className="text-slate-200 font-mono">{productionData.active_tippers}</strong>
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl">
          <span className="text-xs font-semibold text-slate-400 block">Operational Downtime</span>
          <div className="text-3xl font-black text-amber-400 font-mono mt-1">
            {productionData.downtime_hours} <span className="text-sm font-normal text-slate-500">hrs</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1 truncate">
            {productionData.downtime_reason}
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl">
          <span className="text-xs font-semibold text-slate-400 block">Weighbridge RFID Accuracy</span>
          <div className="text-3xl font-black text-teal-400 font-mono mt-1">
            99.8%
          </div>
          <div className="text-[11px] text-teal-400/80 mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Automated gross-tare verification</span>
          </div>
        </div>
      </div>

      {/* Hourly Output Progress Bar Chart */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-purple-400" />
            <h3 className="font-bold text-slate-100 text-sm">Hourly Excavation vs Statutory Extraction Target</h3>
          </div>
          <span className="text-xs font-mono text-emerald-400">Shift Efficiency: +4.2% Ahead</span>
        </div>

        <div className="space-y-3 pt-2">
          {hourlyExtraction.map((item) => {
            const pct = Math.min(100, Math.round((item.actual / item.target) * 100));
            const isAhead = item.actual >= item.target;

            return (
              <div key={item.hour} className="space-y-1 text-xs">
                <div className="flex justify-between font-mono">
                  <span className="text-slate-400 font-bold">{item.hour} hrs</span>
                  <span className={isAhead ? "text-emerald-400 font-bold" : "text-amber-400 font-bold"}>
                    {item.actual} T / {item.target} T ({pct}%)
                  </span>
                </div>
                <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden border border-slate-800 flex">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isAhead
                        ? "bg-gradient-to-r from-emerald-600 to-teal-400"
                        : "bg-gradient-to-r from-amber-600 to-yellow-400"
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Live Weighbridge Dispatch Ledger */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-purple-400" />
            <h3 className="font-bold text-slate-100 text-sm">Live Weighbridge Coal Dispatch Log</h3>
          </div>
          <span className="text-xs font-mono text-slate-400">Auto-updating every 30s</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 text-[11px] uppercase tracking-wider">
                <th className="pb-3 font-semibold">Trip ID</th>
                <th className="pb-3 font-semibold">Colliery</th>
                <th className="pb-3 font-semibold">HEMM Vehicle</th>
                <th className="pb-3 font-semibold">Operator</th>
                <th className="pb-3 font-semibold">Net Weight</th>
                <th className="pb-3 font-semibold">Destination</th>
                <th className="pb-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {dispatchTrips
                .filter((d) => {
                  if (selectedColliery === "ALL") return true;
                  if (selectedColliery === "RG_OCP3") return d.colliery.includes("RG-OCP");
                  if (selectedColliery === "KOCP") return d.colliery.includes("KOCP");
                  return true;
                })
                .map((d) => (
                  <tr key={d.id} className="hover:bg-slate-950/40 transition-colors">
                    <td className="py-3 font-bold text-purple-300">{d.id}</td>
                    <td className="py-3 text-slate-300">{d.colliery}</td>
                    <td className="py-3 font-bold text-slate-100">{d.vehicle}</td>
                    <td className="py-3 text-slate-400">{d.operator}</td>
                    <td className="py-3 text-emerald-400 font-bold">{d.net_weight_t} Tonnes</td>
                    <td className="py-3 text-slate-300">{d.destination}</td>
                    <td className="py-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {d.status}
                      </span>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
