"use client";

import dynamic from "next/dynamic";
import React from "react";

// Safe Dynamic SSR loading for Leaflet maps
export const DynamicLeaseholdMap = dynamic(
  () => import("./leasehold-map").then((mod) => mod.LeaseholdMap),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[520px] rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center shadow-2xl">
        <div className="flex flex-col items-center gap-3">
          <div className="w-9 h-9 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
          <div className="text-center">
            <span className="text-xs text-slate-300 font-semibold uppercase tracking-wider block">
              Initializing Spatial Engine
            </span>
            <span className="text-[11px] text-slate-500 font-mono">
              Loading Leaflet & Leasehold Multipolygons...
            </span>
          </div>
        </div>
      </div>
    ),
  }
);

export const DynamicMineMap = dynamic(
  () => import("./MineMap").then((mod) => mod.MineMap),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[520px] rounded-3xl bg-slate-950 border border-slate-800 flex items-center justify-center shadow-2xl">
        <div className="flex flex-col items-center gap-3">
          <div className="w-9 h-9 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
          <div className="text-center">
            <span className="text-xs text-slate-300 font-semibold uppercase tracking-wider block">
              Initializing Telangana Multi-Site GIS Engine
            </span>
            <span className="text-[11px] text-slate-500 font-mono">
              Loading 4 SCCL Colliery Boundaries &amp; Satellites...
            </span>
          </div>
        </div>
      </div>
    ),
  }
);

export { UndergroundLevel } from "./underground-level";
