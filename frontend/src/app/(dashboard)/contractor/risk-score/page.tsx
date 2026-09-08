"use client";

import React from "react";
import {
  ShieldCheck,
  AlertTriangle,
  Truck,
  Gauge,
  CheckCircle2,
  Calendar,
  Layers,
  Flame,
  Award,
  Clock,
  TrendingDown,
} from "lucide-react";

export default function ContractorRiskScorePage() {
  const safetyMetrics = {
    overall_safety_index: 92.4,
    grade: "GRADE-A CONTRACTOR",
    penalty_deduction: "₹ 0.00 (Zero Penalty)",
    speed_compliance_pct: 98.2,
    fitness_compliance_pct: 96.4,
    ppe_compliance_pct: 100.0,
    zero_accident_days: 184,
  };

  const machineryFitnessList = [
    { vehicle_id: "AP-36-DM-8812", type: "Dumper (100T)", operator: "K. Ramesh Kumar", expiry: "2026-12-15", status: "VALID", speed_violations_30d: 1 },
    { vehicle_id: "TS-09-SH-2201", type: "Shovel (10m³)", operator: "M. Bhaskar Rao", expiry: "2026-11-20", status: "VALID", speed_violations_30d: 0 },
    { vehicle_id: "TS-22-EX-0870", type: "Excavator (5.5m³)", operator: "Ch. Srinivas", expiry: "2026-09-30", status: "VALID", speed_violations_30d: 0 },
    { vehicle_id: "AP-36-DM-9104", type: "Dumper (85T)", operator: "S. Anjaiah", expiry: "2026-09-12", status: "EXPIRING_SOON", speed_violations_30d: 2 },
    { vehicle_id: "TS-09-WT-1021", type: "Water Sprinkler Tanker", operator: "V. Satyam", expiry: "2026-10-05", status: "VALID", speed_violations_30d: 0 },
  ];

  const riskFactors = [
    { name: "Haul Road Over-Speeding (<30 km/h DGMS Limit)", score: 98.2, status: "LOW_RISK", desc: "Monitored via GPS telematics across Ramagundam RG-OCP 3 and KOCP" },
    { name: "Heavy Machinery Fitness & Mechanical Certifications", score: 96.4, status: "LOW_RISK", desc: "1 unit due for statutory DGMS fitness inspection in next 7 days" },
    { name: "Mandatory PPE & Dust Respirator Mask Protocol", score: 100.0, status: "SAFE", desc: "100% biometric verified compliance at pit-head entries" },
    { name: "Blasting Perimeter Clearance Window Adherence", score: 95.0, status: "LOW_RISK", desc: "Zero vehicles inside restricted 500m blasting blast zone during firings" },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl">
        <div>
          <div className="flex items-center gap-2.5 text-purple-400">
            <ShieldCheck className="w-6 h-6" />
            <h1 className="text-xl font-black text-slate-100 tracking-tight">
              Contractor Safety Index &amp; Penalty Surveillance
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Singareni Collieries (SCCL) Statutory Safety Performance &amp; Compliance Audit Profile
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3.5 py-2 rounded-2xl text-xs font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
            <Award className="w-4 h-4" />
            <span>{safetyMetrics.grade}</span>
          </span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl">
          <span className="text-xs font-semibold text-slate-400 block">Composite Safety Index</span>
          <div className="text-3xl font-black text-emerald-400 font-mono mt-1">
            {safetyMetrics.overall_safety_index} <span className="text-sm font-normal text-slate-500">/ 100</span>
          </div>
          <div className="text-[11px] text-emerald-400 mt-1 font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Eligible for Full Statutory Incentive</span>
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl">
          <span className="text-xs font-semibold text-slate-400 block">Contractual Penalty Impact</span>
          <div className="text-3xl font-black text-slate-100 font-mono mt-1">
            {safetyMetrics.penalty_deduction}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Zero deductions across FY2026-27
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl">
          <span className="text-xs font-semibold text-slate-400 block">Haul-Road Speed Adherence</span>
          <div className="text-3xl font-black text-purple-400 font-mono mt-1">
            {safetyMetrics.speed_compliance_pct}%
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Avg Fleet Speed: <strong className="text-slate-200">21.4 km/h</strong> (Limit: 30)
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl">
          <span className="text-xs font-semibold text-slate-400 block">Zero Accident Days</span>
          <div className="text-3xl font-black text-teal-400 font-mono mt-1">
            {safetyMetrics.zero_accident_days} <span className="text-sm font-normal text-slate-500">Days</span>
          </div>
          <div className="text-[11px] text-teal-400/80 mt-1">
            Continuous safe extraction streak
          </div>
        </div>
      </div>

      {/* Safety Audit Breakdown Pillars */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-purple-400" />
            <h3 className="font-bold text-slate-100 text-sm">Contractor Statutory Safety Pillars</h3>
          </div>
          <span className="text-xs font-mono text-slate-400">DGMS CMR 2017 Standards</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {riskFactors.map((rf) => (
            <div
              key={rf.name}
              className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 hover:border-slate-700 transition-all"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="font-bold text-xs text-slate-200">{rf.name}</span>
                <span className="text-xs font-mono font-bold text-emerald-400 shrink-0">
                  {rf.score}%
                </span>
              </div>
              <p className="text-[11px] text-slate-400">{rf.desc}</p>
              <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full"
                  style={{ width: `${rf.score}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Machinery Fitness & Violation Registry */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Truck className="w-5 h-5 text-purple-400" />
            <h3 className="font-bold text-slate-100 text-sm">Heavy Machinery (HEMM) Statutory Fitness Certificates</h3>
          </div>
          <span className="text-xs font-mono text-slate-400">Live GPS Telemetry Sync</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 text-[11px] uppercase tracking-wider">
                <th className="pb-3 font-semibold">Vehicle Code</th>
                <th className="pb-3 font-semibold">Equipment Type</th>
                <th className="pb-3 font-semibold">Certified Operator</th>
                <th className="pb-3 font-semibold">Fitness Valid Until</th>
                <th className="pb-3 font-semibold">Speed Alerts (30D)</th>
                <th className="pb-3 font-semibold">Statutory Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {machineryFitnessList.map((m) => (
                <tr key={m.vehicle_id} className="hover:bg-slate-950/40 transition-colors">
                  <td className="py-3 font-bold text-purple-300">{m.vehicle_id}</td>
                  <td className="py-3 text-slate-300">{m.type}</td>
                  <td className="py-3 text-slate-400">{m.operator}</td>
                  <td className="py-3 font-bold text-slate-200">{m.expiry}</td>
                  <td className="py-3">
                    <span className={m.speed_violations_30d > 0 ? "text-amber-400 font-bold" : "text-emerald-400 font-bold"}>
                      {m.speed_violations_30d} incidents
                    </span>
                  </td>
                  <td className="py-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        m.status === "VALID"
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : "bg-amber-500/15 text-amber-300 border border-amber-500/30"
                      }`}
                    >
                      {m.status === "VALID" ? "FITNESS VALID ✓" : "RENEWAL DUE ⚠️"}
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
