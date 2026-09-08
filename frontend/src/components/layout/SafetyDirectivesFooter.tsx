"use client";

import React, { useState } from "react";
import {
  ShieldAlert,
  Flame,
  Wind,
  Layers,
  Truck,
  HardHat,
  ChevronUp,
  ChevronDown,
  ExternalLink,
  BookOpen,
  Sparkles,
  AlertOctagon,
  Scale,
} from "lucide-react";

interface Directive {
  icon: React.ElementType;
  code: string;
  title: string;
  category: string;
  color: string;
  borderColor: string;
  bgColor: string;
  ruleSummary: string;
  statutoryLimit: string;
  enforcementAction: string;
}

const STATUTORY_DIRECTIVES: Directive[] = [
  {
    icon: Flame,
    code: "CMR 2017 Reg 153",
    title: "Gassy Seam & Inflammable Gas Limits",
    category: "Gas Telemetry",
    color: "text-rose-400",
    borderColor: "border-rose-500/30",
    bgColor: "bg-rose-500/10",
    ruleSummary:
      "Methane (CH₄) concentration must never exceed 0.75% in return airways or 1.25% in general underground body. Mandatory Continuous Miner trip interlocking required.",
    statutoryLimit: "CH₄ ≤ 0.75% (Return) | ≤ 1.25% (General Body)",
    enforcementAction: "Immediate electric power trip & evacuation of working face",
  },
  {
    icon: Wind,
    code: "CMR 2017 Reg 154",
    title: "Airflow Velocity & Adequate Ventilation",
    category: "Underground Airflow",
    color: "text-teal-400",
    borderColor: "border-teal-500/30",
    bgColor: "bg-teal-500/10",
    ruleSummary:
      "Minimum 6.0 m³/min clean intake air per underground person on largest shift. Air velocity at face must be maintained strictly between 0.5 m/s and 4.0 m/s.",
    statutoryLimit: "Airflow ≥ 6.0 m³/min/person | Velocity: 0.5 – 4.0 m/s",
    enforcementAction: "Auxiliary ventilation booster startup & statutory hold",
  },
  {
    icon: Layers,
    code: "CMR 2017 Reg 123",
    title: "Systematic Support Rules (SSR) & Strata Stability",
    category: "Roof & Side Spalling",
    color: "text-amber-400",
    borderColor: "border-amber-500/30",
    bgColor: "bg-amber-500/10",
    ruleSummary:
      "Statutory Systematic Support Rules (SSR) strictly enforced. Resin roof bolting minimum anchorage 8.0 tonnes; acoustic tapping and sounding mandatory prior to machine start.",
    statutoryLimit: "Bolt Anchor ≥ 8.0 Tonnes | W-Strap Density 1.2m Grid",
    enforcementAction: "DGMS Section 22 Injunction on unbolted galleries",
  },
  {
    icon: Truck,
    code: "CMR 2017 Reg 130",
    title: "HEMM & Haul Road Berm Dimensions",
    category: "Opencast Traffic",
    color: "text-blue-400",
    borderColor: "border-blue-500/30",
    bgColor: "bg-blue-500/10",
    ruleSummary:
      "Haul road berm height must equal or exceed wheel diameter of largest dumper in operation. Maximum permissible dump speed 20 km/h; minimum following distance 30 meters.",
    statutoryLimit: "Berm Height ≥ Wheel Diameter | Speed ≤ 20 km/h",
    enforcementAction: "Ground fleet impoundment & DGMS Form-IV penalty",
  },
  {
    icon: HardHat,
    code: "Mines Rule 29B",
    title: "Mandatory PPE & Medical Fitness Protocol",
    category: "Workforce Safety",
    color: "text-emerald-400",
    borderColor: "border-emerald-500/30",
    bgColor: "bg-emerald-500/10",
    ruleSummary:
      "Approved ISI/DGMS helmet, high-visibility reflective vest, steel-toe safety boots, cap lamp, and Self-Rescuer (FSR) mandatory for all personnel below ground.",
    statutoryLimit: "100% DGMS Certified Cap Lamp & FSR Compliance",
    enforcementAction: "Immediate gate lockout & biometric check-in rejection",
  },
];

export function SafetyDirectivesFooter() {
  const [expanded, setExpanded] = useState(false);

  return (
    <footer
      id="safety-directives-footer"
      className="sticky bottom-0 z-30 w-full border-t border-slate-800 bg-slate-950/95 backdrop-blur-md shadow-2xl transition-all duration-300"
    >
      {/* Expanded Directives Drawer */}
      {expanded && (
        <div className="border-b border-slate-800/80 bg-slate-900/90 p-4 md:p-6 max-h-[75vh] overflow-y-auto animate-in slide-in-from-bottom duration-300">
          <div className="max-w-7xl mx-auto space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <Scale className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="text-sm font-black text-slate-100 uppercase tracking-wide">
                    Coal Mines Regulations (CMR) 2017 &amp; DGMS Mandatory Safety Framework
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Statutory benchmarks governed by Directorate General of Mines Safety (DGMS) &amp; Ministry of Coal
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  STATUTORY COMPLIANCE MANDATE ACTIVE
                </span>
              </div>
            </div>

            {/* 5 Regulatory Directive Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {STATUTORY_DIRECTIVES.map((directive, idx) => {
                const Icon = directive.icon;
                return (
                  <div
                    key={idx}
                    className={`p-4 rounded-xl border ${directive.borderColor} bg-slate-950/80 hover:bg-slate-950 transition-all shadow-sm flex flex-col justify-between`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className={`p-1.5 rounded-lg ${directive.bgColor} ${directive.color}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <span className={`text-xs font-mono font-bold ${directive.color}`}>
                            {directive.code}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                          {directive.category}
                        </span>
                      </div>

                      <h4 className="text-xs font-bold text-slate-200 mb-1.5">{directive.title}</h4>
                      <p className="text-[11px] text-slate-400 leading-relaxed">{directive.ruleSummary}</p>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-slate-800/80 space-y-1">
                      <div className="flex items-center justify-between text-[10px] font-mono">
                        <span className="text-slate-500">Statutory Limit:</span>
                        <strong className="text-slate-300">{directive.statutoryLimit}</strong>
                      </div>
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-slate-500">Breach Action:</span>
                        <strong className="text-rose-400 truncate max-w-[170px]">{directive.enforcementAction}</strong>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Main Standardized Bar / Collapsed Marquee Ticker */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 h-12 flex items-center justify-between gap-4 text-xs">
        {/* Left: Statutory Compliance Badge */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="w-6 h-6 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Scale className="w-3.5 h-3.5" />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-black text-slate-200 uppercase tracking-wider text-[11px]">
              CMR 2017 &amp; DGMS DIRECTIVES
            </span>
            <span className="hidden sm:inline text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
              ACTIVE
            </span>
          </div>
        </div>

        {/* Center: Live Marquee Summary of Key Regulatory Limits */}
        <div className="hidden md:flex items-center gap-4 text-slate-400 text-[11px] font-mono overflow-hidden truncate">
          <span className="flex items-center gap-1">
            <Flame className="w-3 h-3 text-rose-400 shrink-0" />
            <span>Reg 153 (CH₄ ≤ 0.75% / 1.25%)</span>
          </span>
          <span className="text-slate-600">•</span>
          <span className="flex items-center gap-1">
            <Wind className="w-3 h-3 text-teal-400 shrink-0" />
            <span>Reg 154 (Airflow ≥ 6 m³/min/man)</span>
          </span>
          <span className="text-slate-600">•</span>
          <span className="flex items-center gap-1">
            <Layers className="w-3 h-3 text-amber-400 shrink-0" />
            <span>Reg 123 (SSR Anchor ≥ 8T)</span>
          </span>
          <span className="text-slate-600">•</span>
          <span className="flex items-center gap-1">
            <Truck className="w-3 h-3 text-blue-400 shrink-0" />
            <span>Reg 130 (Berm ≥ Tyre Diameter)</span>
          </span>
        </div>

        {/* Right: Expand / Collapse Toggle Button */}
        <button
          id="safety-directives-toggle-btn"
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-800/80 hover:bg-slate-750 text-slate-200 border border-slate-700 text-xs font-semibold shrink-0 transition-all active:scale-95"
          title={expanded ? "Collapse Statutory Guidelines" : "Expand Statutory Guidelines"}
        >
          <span>{expanded ? "Hide Directives" : "View Full Guidelines"}</span>
          {expanded ? (
            <ChevronDown className="w-3.5 h-3.5 text-emerald-400" />
          ) : (
            <ChevronUp className="w-3.5 h-3.5 text-emerald-400" />
          )}
        </button>
      </div>
    </footer>
  );
}
