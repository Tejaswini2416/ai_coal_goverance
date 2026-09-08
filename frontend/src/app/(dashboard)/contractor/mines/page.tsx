"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import { MOCK_TELANGANA_MINES, TelanganaMine } from "@/lib/api/tenants";
import {
  Map,
  Layers,
  Truck,
  HardHat,
  Compass,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";

// Dynamically import Multi-Mine Map
const DynamicMineMap = dynamic(
  () => import("@/components/geospatial/MineMap").then((mod) => mod.MineMap),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[460px] rounded-3xl bg-slate-900 border border-slate-800 flex flex-col items-center justify-center text-slate-500 animate-pulse space-y-3">
        <Compass className="w-8 h-8 animate-spin text-purple-400" />
        <span className="text-xs font-mono">Loading Telangana Multi-Site Colliery Map...</span>
      </div>
    ),
  }
);

export default function ContractorMinesPage() {
  const [selectedMine, setSelectedMine] = useState<TelanganaMine>(MOCK_TELANGANA_MINES[0]);

  const contractorCastDetails = [
    {
      id: "22222222-2222-4222-a222-222222222222",
      name: "Ramagundam Opencast Project-III (RG-OCP 3)",
      area: "Ramagundam Area-2 (Peddapalli)",
      type: "OPENCAST",
      benches_active: 8,
      allocated_dumpers: 24,
      excavators_deployed: 6,
      daily_quota_t: 6000,
      quota_achieved_pct: 96.2,
      safety_score: 94.5,
      status: "OPERATIONAL",
    },
    {
      id: "33333333-3333-4333-a333-333333333333",
      name: "Kothagudem Opencast Project (KOCP)",
      area: "Kothagudem Area (Bhadradri Kothagudem)",
      type: "OPENCAST",
      benches_active: 6,
      allocated_dumpers: 18,
      excavators_deployed: 4,
      daily_quota_t: 4000,
      quota_achieved_pct: 92.8,
      safety_score: 91.0,
      status: "OPERATIONAL",
    },
    {
      id: "11111111-1111-4111-a111-111111111111",
      name: "Godavarikhani No. 11A Incline (GDK-11A)",
      area: "Ramagundam Area-1 (Peddapalli)",
      type: "UNDERGROUND",
      benches_active: 0,
      allocated_dumpers: 4, // Surface haulage
      excavators_deployed: 2,
      daily_quota_t: 2200,
      quota_achieved_pct: 98.4,
      safety_score: 95.0,
      status: "OPERATIONAL",
    },
    {
      id: "44444444-4444-4444-a444-444444444444",
      name: "Kasipet Underground Mine",
      area: "Mandamarri Area (Mancherial)",
      type: "UNDERGROUND",
      benches_active: 0,
      allocated_dumpers: 3,
      excavators_deployed: 1,
      daily_quota_t: 1800,
      quota_achieved_pct: 90.5,
      safety_score: 89.2,
      status: "OPERATIONAL",
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl">
        <div>
          <div className="flex items-center gap-2.5 text-purple-400">
            <Map className="w-6 h-6" />
            <h1 className="text-xl font-black text-slate-100 tracking-tight">
              Active Telangana Colliery Cast Sites &amp; Quotas
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            4 Statutory Concession Cast Sites under Singareni Collieries Company Limited (SCCL) Contract
          </p>
        </div>
      </div>

      {/* Multi-Mine Interactive Map */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-purple-400" />
            <h3 className="font-bold text-slate-100 text-sm">
              Live Geospatial Cast Boundaries &amp; Colliery Fleet Map
            </h3>
          </div>
          <span className="text-xs font-mono text-emerald-400">All 4 SCCL Mines Active</span>
        </div>

        <DynamicMineMap
          onSelectMine={(mine) => setSelectedMine(mine)}
          className="w-full h-[480px]"
        />
      </div>

      {/* 4 Assigned Colliery Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {contractorCastDetails.map((cast) => (
          <div
            key={cast.id}
            className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4 hover:border-slate-700 transition-all"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <span
                  className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded ${
                    cast.type === "OPENCAST"
                      ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                      : "bg-sky-500/10 text-sky-400 border border-sky-500/20"
                  }`}
                >
                  {cast.type === "OPENCAST" ? "🚜 OPENCAST CAST PIT" : "⛏️ UNDERGROUND COLLIERY"}
                </span>
                <h3 className="text-base font-black text-slate-100 mt-1.5 leading-tight">
                  {cast.name}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">{cast.area}</p>
              </div>

              <span className="px-2 py-1 rounded-xl text-xs font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {cast.status}
              </span>
            </div>

            {/* Quota Progress Bar */}
            <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-400">Daily Extraction Target:</span>
                <span className="text-emerald-400 font-bold">
                  {Math.round((cast.daily_quota_t * cast.quota_achieved_pct) / 100).toLocaleString()} / {cast.daily_quota_t.toLocaleString()} T ({cast.quota_achieved_pct}%)
                </span>
              </div>
              <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-800">
                <div
                  className="h-full bg-gradient-to-r from-purple-600 to-emerald-400 rounded-full"
                  style={{ width: `${cast.quota_achieved_pct}%` }}
                />
              </div>
            </div>

            {/* Machinery & Quota Specs */}
            <div className="grid grid-cols-3 gap-2 pt-2 text-xs font-mono text-center">
              <div className="p-2.5 rounded-2xl bg-slate-950/80 border border-slate-800/60">
                <span className="text-slate-500 text-[10px] block">Dumpers</span>
                <strong className="text-slate-100 text-sm">{cast.allocated_dumpers}</strong>
              </div>
              <div className="p-2.5 rounded-2xl bg-slate-950/80 border border-slate-800/60">
                <span className="text-slate-500 text-[10px] block">Excavators</span>
                <strong className="text-slate-100 text-sm">{cast.excavators_deployed}</strong>
              </div>
              <div className="p-2.5 rounded-2xl bg-slate-950/80 border border-slate-800/60">
                <span className="text-slate-500 text-[10px] block">Safety Index</span>
                <strong className="text-emerald-400 text-sm">{cast.safety_score}%</strong>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
