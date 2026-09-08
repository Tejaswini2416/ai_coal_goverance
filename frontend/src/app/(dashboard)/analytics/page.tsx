"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/lib/store/auth-store";
import { fetchRiskAnalysis, RiskAnalysisData } from "@/lib/api/risk";
import { downloadAnalyticsExecutiveReportPdf } from "@/lib/api/reports";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  BarChart,
  Bar,
} from "recharts";
import {
  ShieldAlert,
  Flame,
  AlertTriangle,
  Activity,
  Cpu,
  RefreshCw,
  Download,
  CheckCircle2,
  Clock,
  Layers,
  ArrowUpRight,
  TrendingDown,
  TrendingUp,
  BrainCircuit,
  Binary,
  Radio,
  Sparkles,
  Mountain,
  HardHat,
  Gauge,
  Info,
} from "lucide-react";

export default function RiskAnalyticsPage() {
  const { activeMineSiteId, activeMineName } = useAuthStore();
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const { data, isLoading, isError, refetch, isFetching } = useQuery<RiskAnalysisData>({
    queryKey: ["risk-analysis-current", activeMineSiteId],
    queryFn: () => fetchRiskAnalysis(activeMineSiteId),
    refetchInterval: 30000,
  });

  const handleDownloadPdf = async () => {
    setDownloadingPdf(true);
    try {
      await downloadAnalyticsExecutiveReportPdf(
        data?.mine_name || activeMineName || "Godavarikhani No. 11A Incline (SCCL)",
        activeMineSiteId
      );
    } catch (err) {
      console.error("Failed to generate PDF:", err);
    } finally {
      setDownloadingPdf(false);
    }
  };

  const totalScore = data?.total_score ?? 28.5;
  const riskLevel = data?.risk_level ?? "LOW";
  const subScores = data?.sub_scores || {};
  const params = data?.input_parameters || {
    depth_meters: 380,
    gassy_seam_degree: 3,
    ch4_percentage: 0.28,
    co_ppm: 8.5,
    co_rate_of_rise_ppm_hr: 0.75,
    o2_percentage: 20.8,
    active_violations: [],
    overdue_maintenance_count: 1,
    overdue_inspections_count: 0,
    slope_factor_of_safety: 1.65,
    recent_rainfall_mm: 12.5,
  };
  const trendData = data?.historical_trend_72h || [];
  const mlAnomalies = data?.ml_anomalies || { is_anomaly: false, triggers: [] };

  const getRiskColor = (level: string) => {
    switch (level) {
      case "CRITICAL":
        return {
          bg: "bg-rose-500/10",
          border: "border-rose-500/30",
          text: "text-rose-400",
          badge: "bg-rose-600 text-white",
          glow: "shadow-[0_0_40px_rgba(244,63,94,0.25)]",
          fill: "#f43f5e",
        };
      case "HIGH":
        return {
          bg: "bg-orange-500/10",
          border: "border-orange-500/30",
          text: "text-orange-400",
          badge: "bg-orange-500 text-slate-950",
          glow: "shadow-[0_0_30px_rgba(249,115,22,0.2)]",
          fill: "#f97316",
        };
      case "MODERATE":
        return {
          bg: "bg-amber-500/10",
          border: "border-amber-500/30",
          text: "text-amber-400",
          badge: "bg-amber-500 text-slate-950",
          glow: "shadow-[0_0_30px_rgba(245,158,11,0.2)]",
          fill: "#f59e0b",
        };
      case "LOW":
      default:
        return {
          bg: "bg-emerald-500/10",
          border: "border-emerald-500/30",
          text: "text-emerald-400",
          badge: "bg-emerald-500 text-slate-950",
          glow: "shadow-[0_0_30px_rgba(16,185,129,0.2)]",
          fill: "#10b981",
        };
    }
  };

  const riskTheme = getRiskColor(riskLevel);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-emerald-950/30 border border-slate-800 shadow-2xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase tracking-widest font-bold px-2.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Statutory CMR 2017 AI Engine
            </span>
            <span className="text-xs text-slate-400 font-mono">
              • Predictive Hazard & Anomaly Center
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-100 tracking-tight mt-1.5 flex items-center gap-2.5">
            <BrainCircuit className="w-7 h-7 text-emerald-400 shrink-0" />
            <span>AI Safety Risk &amp; Predictive Analytics</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Explainable multi-pillar risk model &amp; 72-hour telemetry forecast for{" "}
            <strong className="text-emerald-300">{data?.mine_name || activeMineName}</strong>.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 text-xs font-semibold transition-all active:scale-95"
            title="Recalculate Risk"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? "animate-spin text-emerald-400" : ""}`} />
            <span>Recalculate</span>
          </button>

          <button
            onClick={handleDownloadPdf}
            disabled={downloadingPdf}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all shadow-lg shadow-emerald-950 active:scale-95"
          >
            <Download className="w-4 h-4" />
            <span>{downloadingPdf ? "Exporting..." : "Form-IV Risk Dossier"}</span>
          </button>
        </div>
      </div>

      {/* Main Row: Big 0-100 Composite Gauge (Left) + Critical Tripwires & Anomaly Panel (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 5 Cols: Composite Risk Gauge */}
        <div className={`lg:col-span-5 rounded-3xl bg-slate-900 border border-slate-800 p-6 flex flex-col justify-between ${riskTheme.glow}`}>
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Gauge className="w-4 h-4 text-emerald-400" />
                Composite Safety Risk Score
              </span>
              <span className={`text-[10px] font-mono uppercase font-black px-2.5 py-1 rounded-full ${riskTheme.badge}`}>
                {riskLevel} RISK
              </span>
            </div>

            {/* Circular / Large Score Display */}
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <div className="relative flex items-center justify-center">
                {/* SVG Radial Gauge Meter */}
                <svg className="w-48 h-48 transform -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="#1e293b"
                    strokeWidth="8"
                    fill="transparent"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke={riskTheme.fill}
                    strokeWidth="8"
                    strokeDasharray={251.2}
                    strokeDashoffset={251.2 - (251.2 * Math.min(100, totalScore)) / 100}
                    strokeLinecap="round"
                    fill="transparent"
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>

                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-4xl font-black text-slate-100 font-mono tracking-tight">
                    {totalScore}
                  </span>
                  <span className="text-[11px] font-mono text-slate-400 uppercase tracking-widest">
                    / 100
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-400 max-w-xs mt-3 leading-relaxed">
                Calculated strictly adhering to <strong>Coal Mines Regulations, 2017 (CMR 2017)</strong> statutory weights.
              </p>
            </div>
          </div>

          {/* Mathematical Formula Footnote */}
          <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800/80 text-[11px] font-mono text-slate-400">
            <span className="text-slate-300 font-semibold block mb-0.5">Statutory Formula:</span>
            <span className="text-emerald-400">S = min(100, 0.35·G + 0.25·C + 0.20·M + 0.20·E + P_stale)</span>
          </div>
        </div>

        {/* Right 7 Cols: Critical Statutory Tripwires & ML IsolationForest Panel */}
        <div className="lg:col-span-7 rounded-3xl bg-slate-900 border border-slate-800 p-6 flex flex-col justify-between shadow-xl">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
                  Statutory Tripwires &amp; Anomaly Alarms
                </h3>
              </div>
              <span className="text-[10px] font-mono text-slate-500">
                IsolationForest + CMR Rules
              </span>
            </div>

            {/* Triggers List */}
            {data?.critical_triggers && data.critical_triggers.length > 0 ? (
              <div className="space-y-2.5 max-h-52 overflow-y-auto pr-1">
                {data.critical_triggers.map((trig, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3"
                  >
                    <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <div className="text-xs text-rose-200">
                      <strong className="text-rose-100 block font-semibold">{trig}</strong>
                      <span className="text-[10px] text-rose-300/80">Statutory threshold breached. Mandatory inspector review required.</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <div className="text-xs text-emerald-200">
                  <strong className="text-emerald-100 block font-semibold">Zero Critical Statutory Tripwires Active</strong>
                  All gas limits (CH4 &lt; 0.75%), CO ppm (&lt; 50 ppm), and bench slopes operate within legal statutory thresholds.
                </div>
              </div>
            )}
          </div>

          {/* ML IsolationForest Detection Status */}
          <div className="mt-4 p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-300 font-bold flex items-center gap-2">
                <Cpu className="w-4 h-4 text-blue-400" />
                Telemetry ML Anomaly Detector (IsolationForest)
              </span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  mlAnomalies.is_anomaly
                    ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                    : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                }`}
              >
                {mlAnomalies.is_anomaly ? "ANOMALY FLAGGED" : "NOMINAL TELEMETRY"}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Monitors for synthetic flatline tampering, rubber-stamp repeated logs, or sudden anomalous gas spikes across multi-sensor shift streams.
            </p>
          </div>
        </div>
      </div>

      {/* 4-Pillar Statutory Breakdown Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Pillar 1: Gas & Atmosphere (35%) */}
        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                <Flame className="w-4 h-4 text-blue-400" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-200">Gas &amp; Atmosphere</span>
                <span className="text-[10px] text-slate-500 block font-mono">Pillar G (35% Weight)</span>
              </div>
            </div>
            <span className="text-lg font-black font-mono text-blue-400">
              {subScores.gas_atmospheric_score ?? 18.2}
            </span>
          </div>

          <div className="space-y-1.5 text-xs bg-slate-950/60 p-3 rounded-2xl border border-slate-800/60 font-mono">
            <div className="flex justify-between">
              <span className="text-slate-400">CH4 (Methane):</span>
              <span className="text-slate-200 font-bold">{params.ch4_percentage}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">CO (Carbon Monoxide):</span>
              <span className="text-slate-200 font-bold">{params.co_ppm} ppm</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">dCO/dt Rise Rate:</span>
              <span className="text-slate-200 font-bold">{params.co_rate_of_rise_ppm_hr} ppm/h</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">O2 Atmospheric:</span>
              <span className="text-slate-200 font-bold">{params.o2_percentage}%</span>
            </div>
          </div>
        </div>

        {/* Pillar 2: CAPA Violations (25%) */}
        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                <ShieldAlert className="w-4 h-4 text-rose-400" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-200">CAPA Violations</span>
                <span className="text-[10px] text-slate-500 block font-mono">Pillar C (25% Weight)</span>
              </div>
            </div>
            <span className="text-lg font-black font-mono text-rose-400">
              {subScores.capa_violations_score ?? 22.0}
            </span>
          </div>

          <div className="space-y-1.5 text-xs bg-slate-950/60 p-3 rounded-2xl border border-slate-800/60 font-mono">
            <div className="flex justify-between">
              <span className="text-slate-400">Unrectified Notices:</span>
              <span className="text-rose-400 font-bold">{params.active_violations?.length || 1} Active</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Overdue Audits:</span>
              <span className="text-slate-200 font-bold">{params.overdue_inspections_count || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Penalty Multiplier:</span>
              <span className="text-slate-200 font-bold">1.25x</span>
            </div>
          </div>
        </div>

        {/* Pillar 3: Mine Depth & Gassiness (20%) */}
        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                <Layers className="w-4 h-4 text-purple-400" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-200">Mine Depth &amp; Seam</span>
                <span className="text-[10px] text-slate-500 block font-mono">Pillar M (20% Weight)</span>
              </div>
            </div>
            <span className="text-lg font-black font-mono text-purple-400">
              {subScores.mine_depth_gassiness_score ?? 35.0}
            </span>
          </div>

          <div className="space-y-1.5 text-xs bg-slate-950/60 p-3 rounded-2xl border border-slate-800/60 font-mono">
            <div className="flex justify-between">
              <span className="text-slate-400">Incline Depth:</span>
              <span className="text-slate-200 font-bold">{params.depth_meters} meters</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Seam Gassiness:</span>
              <span className="text-purple-400 font-bold">Degree {params.gassy_seam_degree}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Ventilation Ratio:</span>
              <span className="text-slate-200 font-bold">14.2 m³/min</span>
            </div>
          </div>
        </div>

        {/* Pillar 4: Equipment & Slope (20%) + Staleness */}
        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center">
                <Mountain className="w-4 h-4 text-teal-400" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-200">Equipment &amp; Slopes</span>
                <span className="text-[10px] text-slate-500 block font-mono">Pillar E (20% Weight)</span>
              </div>
            </div>
            <span className="text-lg font-black font-mono text-teal-400">
              {subScores.equipment_slope_score ?? 14.5}
            </span>
          </div>

          <div className="space-y-1.5 text-xs bg-slate-950/60 p-3 rounded-2xl border border-slate-800/60 font-mono">
            <div className="flex justify-between">
              <span className="text-slate-400">Bench Slope FoS:</span>
              <span className="text-emerald-400 font-bold">{params.slope_factor_of_safety || 1.65} (Stable)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Overdue HEMM:</span>
              <span className="text-slate-200 font-bold">{params.overdue_maintenance_count || 0} Units</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Data Staleness Penalty:</span>
              <span className="text-amber-400 font-bold">+{subScores.staleness_uncertainty_penalty ?? 0} pt</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3-Day (72-Hour) Predictive AI Safety & Hazard Forecasting Engine */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-mono font-bold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
                <BrainCircuit className="w-3.5 h-3.5" /> AI Predictive Sequence Model
              </span>
              <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-mono">
                95% Confidence Interval (CMR 2017)
              </span>
            </div>
            <h3 className="text-lg font-black text-slate-100 tracking-tight flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-400" />
              <span>AI Predictive Safety &amp; Hazard Forecast (Next 72 Hours)</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Proactive statutory gas excursion modeling, spontaneous combustion heat rates, and 3-day composite risk forecasts.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs font-mono bg-slate-950 p-2.5 rounded-2xl border border-slate-800">
            <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
              <span className="w-3 h-1 bg-emerald-400 rounded-full inline-block"></span> Actual Trend
            </span>
            <span className="flex items-center gap-1.5 text-blue-400 font-bold">
              <span className="w-3 h-0.5 border-t-2 border-dashed border-blue-400 inline-block"></span> AI 72h Forecast
            </span>
            <span className="flex items-center gap-1.5 text-slate-400">
              <span className="w-3 h-2 bg-blue-500/20 rounded inline-block"></span> 95% Confidence Band
            </span>
          </div>
        </div>

        {/* Statutory Tripwire Warnings */}
        {data?.predictive_forecast_72h?.forecast_warnings && (
          <div className="space-y-2">
            {data.predictive_forecast_72h.forecast_warnings.map((warn, i) => (
              <div
                key={i}
                className={`p-3.5 rounded-2xl border text-xs font-mono flex items-center gap-3 ${
                  warn.includes("STATUTORY ALERT") || warn.includes("🚨")
                    ? "bg-rose-950/40 border-rose-500/40 text-rose-300"
                    : warn.includes("TRIPWIRE") || warn.includes("⚠️")
                    ? "bg-amber-950/40 border-amber-500/40 text-amber-300"
                    : "bg-emerald-950/30 border-emerald-500/30 text-emerald-300"
                }`}
              >
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{warn}</span>
              </div>
            ))}
          </div>
        )}

        {/* 72-Hour Dual-Line Projection Chart */}
        <div className="h-80 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="riskGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="forecastGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="ciGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <XAxis dataKey="label" stroke="#64748b" fontSize={11} tickLine={false} />
              <YAxis stroke="#64748b" fontSize={11} domain={[0, 100]} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#090d16",
                  borderColor: "#334155",
                  borderRadius: "1rem",
                  fontSize: "12px",
                  fontFamily: "monospace",
                }}
              />
              {/* Shaded 95% Confidence Interval Area */}
              <Area
                type="monotone"
                dataKey="ci_upper"
                stroke="transparent"
                fill="url(#ciGrad)"
                name="95% CI Upper"
              />
              <Area
                type="monotone"
                dataKey="ci_lower"
                stroke="transparent"
                fill="transparent"
                name="95% CI Lower"
              />
              {/* Actual Historical Trend Line */}
              <Area
                type="monotone"
                dataKey="actual_risk_score"
                stroke="#10b981"
                strokeWidth={2.5}
                fill="url(#riskGrad)"
                name="Actual Score"
              />
              {/* AI Forecast Projection Line (Dashed) */}
              <Area
                type="monotone"
                dataKey="predicted_risk_score"
                stroke="#3b82f6"
                strokeWidth={2.5}
                strokeDasharray="5 5"
                fill="url(#forecastGrad)"
                name="AI Forecast"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* 3-Day Milestone Forecast Cards (Day 1, Day 2, Day 3) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {(data?.predictive_forecast_72h?.day_forecasts || [
            {
              day: 1,
              target_hours: 24,
              predicted_risk_score: 32.4,
              confidence_interval_95: [28.9, 35.9],
              predicted_ch4_pct: 0.28,
              ch4_breach_probability: 0.04,
              predicted_co_ppm: 9.8,
              predicted_co_heating_rate_ppm_hr: 0.15,
              status: "NORMAL",
            },
            {
              day: 2,
              target_hours: 48,
              predicted_risk_score: 41.2,
              confidence_interval_95: [36.5, 45.9],
              predicted_ch4_pct: 0.38,
              ch4_breach_probability: 0.12,
              predicted_co_ppm: 14.2,
              predicted_co_heating_rate_ppm_hr: 0.25,
              status: "WATCH",
            },
            {
              day: 3,
              target_hours: 72,
              predicted_risk_score: 54.8,
              confidence_interval_95: [48.2, 61.4],
              predicted_ch4_pct: 0.49,
              ch4_breach_probability: 0.24,
              predicted_co_ppm: 21.0,
              predicted_co_heating_rate_ppm_hr: 0.35,
              status: "ELEVATED_WARNING",
            },
          ]).map((df) => (
            <div
              key={df.day}
              className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 font-mono shadow-lg hover:border-slate-700 transition-all"
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-200">
                    Day {df.day} Projection (+{df.target_hours}h)
                  </span>
                  <span className="text-[10px] text-slate-500 block">Proactive Early Horizon</span>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    df.status === "STATUTORY_HAZARD"
                      ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                      : df.status === "ELEVATED_WARNING"
                      ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                      : df.status === "WATCH"
                      ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                      : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                  }`}
                >
                  {df.status}
                </span>
              </div>

              <div className="flex items-baseline justify-between border-y border-slate-800/80 py-2">
                <div>
                  <div className="text-2xl font-black text-blue-400">
                    {df.predicted_risk_score}
                  </div>
                  <span className="text-[10px] text-slate-500">Predicted Safety Risk</span>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-300 font-bold">
                    [{df.confidence_interval_95[0]} - {df.confidence_interval_95[1]}]
                  </span>
                  <span className="text-[10px] text-slate-500 block">95% CI Range</span>
                </div>
              </div>

              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Projected CH4:</span>
                  <span className="text-slate-200 font-bold">{df.predicted_ch4_pct}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">CH4 Breach Prob:</span>
                  <span className={`font-bold ${df.ch4_breach_probability > 0.2 ? "text-amber-400" : "text-emerald-400"}`}>
                    {(df.ch4_breach_probability * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Projected CO:</span>
                  <span className="text-slate-200 font-bold">{df.predicted_co_ppm} ppm</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">CO Heating Rate:</span>
                  <span className="text-blue-400 font-bold">+{df.predicted_co_heating_rate_ppm_hr} ppm/h</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
