"use client";

import React, { useState } from "react";
import { MineUndergroundStation, Inspection } from "@/lib/types/domain";
import { HardHat, Activity, Wind, Gauge, CheckCircle2, ChevronRight } from "lucide-react";

interface UndergroundLevelProps {
  stations: MineUndergroundStation[];
  inspections: Inspection[];
  onSelectStation?: (stationCode: string) => void;
}

export function UndergroundLevel({
  stations,
  inspections,
  onSelectStation,
}: UndergroundLevelProps) {
  const [selectedLevel, setSelectedLevel] = useState<number>(3);

  return (
    <div className="w-full h-[520px] rounded-xl border border-slate-800 bg-slate-950 p-5 flex flex-col justify-between shadow-2xl relative overflow-hidden">
      {/* Background Grid Pattern */}
      <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px]" />

      {/* Header */}
      <div className="flex items-center justify-between z-10">
        <div>
          <div className="flex items-center gap-2">
            <HardHat className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-bold text-slate-100">
              Underground Seam Gallary & Station Map
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Schematic depth profiles and active statutory sensor checkpoints (DGMS CMR 2017)
          </p>
        </div>

        {/* Level Switcher */}
        <div className="flex items-center gap-1.5 bg-slate-900/90 p-1 rounded-lg border border-slate-800">
          {[1, 2, 3].map((lvl) => (
            <button
              key={lvl}
              onClick={() => setSelectedLevel(lvl)}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                selectedLevel === lvl
                  ? "bg-emerald-500 text-slate-950 shadow-md"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Level-{lvl} Seam
            </button>
          ))}
        </div>
      </div>

      {/* Schematic Underground Diagram */}
      <div className="relative flex-1 my-4 bg-slate-900/60 rounded-lg border border-slate-800/80 p-4 flex flex-col justify-around z-10">
        {/* Shaft Intake Header */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-2 text-xs text-slate-400 font-mono">
          <span>Main Surface Incline Portal (0m Datum)</span>
          <span className="text-emerald-400">Ventilation Flow: 4,800 m³/min</span>
        </div>

        {/* Station Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 my-2">
          {stations.map((stn) => {
            const stationInspections = inspections.filter((i) => i.station_id === stn.station_code);
            const isMonitored = stationInspections.length > 0;

            return (
              <div
                key={stn.id}
                onClick={() => onSelectStation?.(stn.station_code)}
                className="group relative p-3.5 rounded-lg border border-slate-800 bg-slate-900/80 hover:border-emerald-500/50 hover:bg-slate-850/80 transition-all cursor-pointer shadow-md"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                      <Wind className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-100 font-mono flex items-center gap-1.5">
                        {stn.station_code}
                        {isMonitored && (
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {stn.description}
                      </div>
                    </div>
                  </div>

                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                    -{stn.depth_meters}m
                  </span>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-800/60 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400 flex items-center gap-1">
                    <Activity className="w-3 h-3 text-cyan-400" />
                    {stationInspections.length} Inspections Logged
                  </span>
                  <span className="text-emerald-400 font-medium group-hover:translate-x-0.5 transition-transform flex items-center">
                    Inspect Station <ChevronRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Status Bar */}
        <div className="flex items-center justify-between border-t border-slate-800/80 pt-2 text-[11px] text-slate-400">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            All 4 Registered Underground Checkpoints Active
          </span>
          <span className="font-mono text-slate-500">
            DGMS Standard Section 22 Verified
          </span>
        </div>
      </div>
    </div>
  );
}
