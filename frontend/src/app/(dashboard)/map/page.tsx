"use client";

import React, { useState, useEffect } from "react";
import { DynamicLeaseholdMap, UndergroundLevel } from "@/components/geospatial";
import { fetchInspections } from "@/lib/api/inspections";
import { fetchUndergroundStations } from "@/lib/api/underground";
import { useAuthStore } from "@/lib/store/auth-store";
import { useTenantStore } from "@/lib/store/tenant-store";
import { Inspection, MineUndergroundStation, LocationType } from "@/lib/types/domain";
import { Map, HardHat, Compass, ShieldAlert, Layers, CheckCircle } from "lucide-react";

export default function GeospatialMapPage() {
  const { activeMineSiteId, activeMineName } = useAuthStore();
  const { selectedMine, selectedMineId } = useTenantStore();
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [stations, setStations] = useState<MineUndergroundStation[]>([]);
  const [activeTab, setActiveTab] = useState<"SURFACE" | "UNDERGROUND">("SURFACE");
  const [selectedInspectionId, setSelectedInspectionId] = useState<string | null>(null);

  const effectiveMineId = selectedMineId || activeMineSiteId;
  const effectiveMineName = selectedMine?.name || activeMineName;

  useEffect(() => {
    fetchInspections(effectiveMineId).then(setInspections);
    fetchUndergroundStations(effectiveMineId).then(setStations);
  }, [effectiveMineId]);

  const breachCount = inspections.filter((i) => i.is_geofence_breached).length;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header and Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <Map className="w-5 h-5 text-emerald-400" />
            <h1 className="text-xl font-bold text-slate-100">
              Interactive Geospatial & Leasehold Inspection Map
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            PostGIS boundary & statutory geofence verification for <strong className="text-emerald-300">{effectiveMineName}</strong>
            {selectedMine?.district ? ` (${selectedMine.district}, Telangana)` : ""}.
          </p>
        </div>

        {/* Surface vs Underground Toggle */}
        <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab("SURFACE")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === "SURFACE"
                ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-950"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Compass className="w-4 h-4" />
            <span>Surface Leasehold (GPS)</span>
          </button>

          <button
            onClick={() => setActiveTab("UNDERGROUND")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === "UNDERGROUND"
                ? "bg-amber-400 text-slate-950 shadow-md shadow-amber-950"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <HardHat className="w-4 h-4" />
            <span>Underground Gallery & Stations</span>
          </button>
        </div>
      </div>

      {/* Geofence Breach Banner if any */}
      {breachCount > 0 && activeTab === "SURFACE" && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-between text-xs text-rose-300 shadow-md">
          <div className="flex items-center gap-2.5">
            <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 animate-pulse" />
            <div>
              <strong className="font-bold text-rose-400">Critical Geofence Breach Alert:</strong>{" "}
              {breachCount} inspection point(s) recorded outside the approved statutory leasehold perimeter!
            </div>
          </div>
          <span className="font-mono text-[11px] bg-rose-950 px-2 py-0.5 rounded border border-rose-800">
            CMR 2017 Reg 108
          </span>
        </div>
      )}

      {/* Map Content (SSR-safe dynamic import) */}
      <div className="w-full">
        {activeTab === "SURFACE" ? (
          <DynamicLeaseholdMap
            inspections={inspections}
            selectedInspectionId={selectedInspectionId}
            onSelectInspection={(id) => setSelectedInspectionId(id)}
            activeMine={selectedMine}
          />
        ) : (
          <UndergroundLevel
            stations={stations}
            inspections={inspections}
          />
        )}
      </div>
    </div>
  );
}
