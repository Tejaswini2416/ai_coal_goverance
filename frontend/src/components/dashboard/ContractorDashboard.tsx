"use client";

import React from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  Truck,
  Users,
  AlertTriangle,
  TrendingUp,
  Gauge,
  Calendar,
  CheckCircle2,
  Clock,
  ShieldCheck,
  ChevronRight,
  MapPin,
  Flame,
  Layers,
  Activity,
  Compass,
} from "lucide-react";

// Dynamically import Leaflet Map component (disables SSR)
const DynamicContractorPitMap = dynamic(
  () => import("./ContractorPitMap").then((mod) => mod.ContractorPitMap),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[480px] rounded-3xl bg-slate-900 border border-slate-800 flex flex-col items-center justify-center text-slate-500 animate-pulse space-y-3">
        <Compass className="w-8 h-8 animate-spin text-purple-400" />
        <span className="text-xs font-mono">Loading Interactive GIS Pit Cast Map &amp; Machinery Markers...</span>
      </div>
    ),
  }
);

interface ContractorDashboardProps {
  data: Record<string, any>;
  mineSiteName?: string;
}

export function ContractorDashboard({ data, mineSiteName }: ContractorDashboardProps) {
  const zones = data.assigned_working_zones || [];
  const prod = data.production_overview || {
    shift_target_tonnes: 4800,
    shift_actual_tonnes: 4550,
    completion_pct: 94.8,
    dispatch_trips_completed: 142,
    trips_pending: 18,
    production_loss_hours: 1.2,
    loss_reason: "Dust suppression tanker sprinkler replenishment stop",
  };
  const fleet = data.fleet_telemetry || [];
  const contractorKpis = data.contractor_kpis || {
    active_fleet_count: 28,
    fleet_fitness_compliance_pct: 96.4,
    contractor_safety_score: 92.0,
    zero_accident_days: 184,
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Shift Target Output</span>
            <TrendingUp className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="text-3xl font-black text-slate-100 font-mono mt-2">{prod.completion_pct}%</div>
          <div className="text-[11px] text-emerald-400 mt-1 flex items-center justify-between">
            <span>{prod.shift_actual_tonnes} / {prod.shift_target_tonnes} T</span>
            <span className="font-mono">{prod.dispatch_trips_completed} Trips</span>
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Active Heavy Fleet</span>
            <Truck className="w-5 h-5 text-purple-400" />
          </div>
          <div className="text-3xl font-black text-purple-400 font-mono mt-2">{contractorKpis.active_fleet_count}</div>
          <div className="text-[11px] text-slate-500 mt-1">
            Fitness Compliance: <strong className="text-slate-200">{contractorKpis.fleet_fitness_compliance_pct}%</strong>
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Zero Accident Streak</span>
            <ShieldCheck className="w-5 h-5 text-teal-400" />
          </div>
          <div className="text-3xl font-black text-teal-400 font-mono mt-2">{contractorKpis.zero_accident_days} Days</div>
          <div className="text-[11px] text-teal-400/80 mt-1">
            <span>Safety Score: {contractorKpis.contractor_safety_score}/100</span>
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Compliance Downtime</span>
            <Clock className="w-5 h-5 text-amber-400" />
          </div>
          <div className="text-3xl font-black text-amber-400 font-mono mt-2">{prod.production_loss_hours} hrs</div>
          <div className="text-[11px] text-slate-400 mt-1 truncate">
            {prod.loss_reason}
          </div>
        </div>
      </div>

      {/* Real-Time Interactive GIS Pit Map Section */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div>
            <h2 className="text-base font-black text-slate-100 tracking-tight flex items-center gap-2">
              <Layers className="w-5 h-5 text-purple-400" />
              <span>Real-Time Opencast Pit Cast GIS Map &amp; Fleet Tracker</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Live geofenced bench perimeters, blasting hazard zones, and GPS heavy machinery positions for{" "}
              <strong className="text-purple-300">{mineSiteName || "Ramagundam RG-OCP 3 Pit"}</strong>.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span>Real-Time Telemetry Active</span>
          </div>
        </div>

        {/* Dynamic Map Component */}
        <DynamicContractorPitMap />
      </div>

      {/* Main 2-Col Grid: Assigned Working Zones (Left) + Fleet Live Telemetry (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 6 Cols: Assigned Working Zones & Deployed Manpower */}
        <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-400" />
                <h3 className="font-bold text-slate-100 text-sm">Assigned Working Zones &amp; Manpower Quota</h3>
              </div>
              <span className="text-[10px] font-mono text-slate-400">Contractor Section 4</span>
            </div>

            <div className="space-y-3">
              {zones.map((z: any) => (
                <div
                  key={z.zone_id}
                  className="p-4 rounded-2xl border border-slate-800 bg-slate-950/80 hover:border-slate-700 transition-all"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-200 text-xs">{z.name}</span>
                        <span
                          className={`text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded ${
                            z.status === "OPERATIONAL"
                              ? "bg-emerald-500/10 text-emerald-400"
                              : "bg-rose-500/10 text-rose-400"
                          }`}
                        >
                          {z.status}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-2 font-mono">
                        <span>Zone ID: {z.zone_id}</span>
                        <span>•</span>
                        <span className="text-[10px] uppercase text-slate-500">{z.type}</span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs font-mono font-bold text-slate-100 block">
                        {z.present_today} / {z.allocated_manpower}
                      </span>
                      <span className="text-[10px] text-slate-500">Workers Present</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-500">Live biometric attendance synchronizing</span>
            <Link href="/attendance" className="text-emerald-400 hover:underline font-semibold flex items-center gap-1">
              View Worker Roster <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Right 6 Cols: Fleet Vehicle Telemetry & Fitness Expiration */}
        <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-purple-400" />
                <h3 className="font-bold text-slate-100 text-sm">Heavy Machinery Telemetry &amp; Fitness Expiry</h3>
              </div>
              <span className="text-[10px] font-mono text-purple-400">GPS Live Feed</span>
            </div>

            <div className="space-y-3">
              {fleet.map((veh: any) => {
                const isExpiring = veh.compliance === "EXPIRING_SOON";

                return (
                  <div
                    key={veh.vehicle_id}
                    className={`p-3.5 rounded-2xl border transition-all ${
                      isExpiring
                        ? "bg-amber-950/20 border-amber-500/30"
                        : "bg-slate-950/80 border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs text-slate-200">{veh.vehicle_id}</span>
                          <span className="text-[10px] text-slate-400 font-mono">({veh.type})</span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-2">
                          <span>Operator: <strong className="text-slate-300">{veh.operator}</strong></span>
                          <span>•</span>
                          <span className="text-slate-500 font-mono">Speed: {veh.speed_kmh} / {veh.speed_limit_kmh} km/h</span>
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          Fitness Valid Until: <strong className="text-slate-300 font-mono">{veh.fitness_expiry}</strong>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span
                          className={`text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded ${
                            isExpiring
                              ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                              : "bg-emerald-500/10 text-emerald-400"
                          }`}
                        >
                          {veh.compliance}
                        </span>
                        <span className="text-[10px] text-slate-400 block mt-1 font-mono">{veh.status}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-500">DGMS automated speed &amp; payload sensors active</span>
            <Link href="/map" className="text-purple-400 hover:underline font-semibold flex items-center gap-1">
              GIS Fleet Map <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
