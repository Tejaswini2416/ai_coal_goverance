"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/lib/store/auth-store";
import { useTenantStore } from "@/lib/store/tenant-store";
import { UserRole } from "@/lib/types/domain";
import { fetchDashboardSummary } from "@/lib/api/dashboard";
import { InspectorDashboard } from "./InspectorDashboard";
import { ManagerDashboard } from "./ManagerDashboard";
import { WorkerDashboard } from "./WorkerDashboard";
import { GovtOfficialDashboard } from "./GovtOfficialDashboard";
import { ContractorDashboard } from "./ContractorDashboard";
import {
  Compass,
  KanbanSquare,
  Shield,
  HardHat,
  Building2,
  Truck,
  RefreshCw,
  Sparkles,
  ShieldAlert,
  Lock,
} from "lucide-react";

export function DashboardView() {
  const { userRole, userName, activeMineName, activeMineSiteId, switchRole, isSimulatedAuth } = useAuthStore();
  const { selectedMineId, selectedMine } = useTenantStore();
  const effectiveMineId = selectedMineId || activeMineSiteId;
  const effectiveMineName = selectedMine?.name || activeMineName || "Ramagundam OCP-3";

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const isDemoMode =
    process.env.NEXT_PUBLIC_DEMO_MODE === "true" ||
    (mounted && typeof window !== "undefined" && window.location.search.includes("demo=true"));

  const [selectedRole, setSelectedRole] = useState<UserRole>(userRole || UserRole.MINISTRY_AUDITOR);

  // Synchronize when store's userRole changes
  useEffect(() => {
    if (userRole) {
      setSelectedRole(userRole);
    }
  }, [userRole]);

  const handleRoleChange = (role: UserRole) => {
    setSelectedRole(role);
    switchRole(role);
  };

  const activeRole = isDemoMode ? selectedRole : (userRole || UserRole.MINISTRY_AUDITOR);

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["dashboard-summary", effectiveMineId, activeRole],
    queryFn: () => fetchDashboardSummary(effectiveMineId, activeRole),
    staleTime: 30000,
  });

  const metrics = data?.metrics || {};

  // Resolve active persona header badges & styling
  const getRoleTheme = (role: UserRole) => {
    switch (role) {
      case UserRole.DGMS_INSPECTOR:
        return {
          title: "DGMS Statutory Safety Inspector Portal",
          desc: "Field audit schedules, geofence compliance verification, and Form-IV regulatory reports",
          badgeColor: "bg-blue-500/10 text-blue-400 border-blue-500/20",
          gradient: "from-slate-900 via-slate-900/90 to-blue-950/40",
          icon: Compass,
        };
      case UserRole.COLLIERY_MANAGER:
      case UserRole.AREA_ADMIN:
        return {
          title: "Colliery Safety & Operational Management Hub",
          desc: "Live pit safety risk gauge, real-time gas alarms, active worker muster, and audit feeds",
          badgeColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
          gradient: "from-slate-900 via-slate-900/90 to-emerald-950/40",
          icon: Shield,
        };
      case UserRole.FIELD_WORKER:
      case UserRole.MINING_SIRDAR:
        return {
          title: "Mining Sirdar & Field Worker Safety Portal",
          desc: "Biometric shift presence, live gallery gas monitors, CMR 2017 safety directives, and SOS protocols",
          badgeColor: "bg-amber-500/10 text-amber-400 border-amber-500/20",
          gradient: "from-slate-900 via-slate-900/90 to-amber-950/40",
          icon: HardHat,
        };
      case UserRole.CONTRACTOR_ADMIN:
        return {
          title: "Contractor Heavy Machinery & Dispatch Hub",
          desc: "Assigned opencast benches, shift tonnage progress, heavy fleet tracking, and fitness certifications",
          badgeColor: "bg-purple-500/10 text-purple-400 border-purple-500/20",
          gradient: "from-slate-900 via-slate-900/90 to-purple-950/40",
          icon: Truck,
        };
      case UserRole.MINISTRY_AUDITOR:
      case UserRole.REGULATORY_OFFICER:
      default:
        return {
          title: "Ministry of Coal • Executive Compliance & Macro Risk Center",
          desc: "Pan-India subsidiary compliance heatmap, national statutory audit log, and economic impact analytics",
          badgeColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
          gradient: "from-slate-900 via-slate-900/90 to-slate-950",
          icon: Building2,
        };
    }
  };

  const theme = getRoleTheme(activeRole);
  const IconComponent = theme.icon;

  if (!userRole) {
    return (
      <div className="p-8 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-center space-y-4">
        <ShieldAlert className="w-12 h-12 text-rose-400 mx-auto" />
        <h2 className="text-xl font-bold text-white">403 — Unauthorized Role Scope</h2>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          Your active session lacks a recognized statutory role. Please log in with authorized DGMS or Ministry of Coal credentials.
        </p>
        <Link
          href="/login"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg transition-all"
        >
          <Lock className="w-4 h-4" />
          <span>Return to Sign In</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Persona Quick Switcher — Rendered ONLY in Demo Mode or when explicitly flagged */}
      {isDemoMode && (
        <div className="bg-slate-900 border border-emerald-500/30 rounded-2xl p-4 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400 shrink-0 animate-pulse" />
            <span className="text-xs font-mono font-bold text-emerald-300 uppercase tracking-wider">
              [DEMO MODE] Switch Persona Cockpit:
            </span>
          </div>

          {/* Persona Select Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleRoleChange(UserRole.MINISTRY_AUDITOR)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeRole === UserRole.MINISTRY_AUDITOR
                  ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-950"
                  : "bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-750"
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Govt Official</span>
            </button>

            <button
              onClick={() => handleRoleChange(UserRole.DGMS_INSPECTOR)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeRole === UserRole.DGMS_INSPECTOR
                  ? "bg-blue-500 text-slate-950 shadow-md shadow-blue-950"
                  : "bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-750"
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Inspector</span>
            </button>

            <button
              onClick={() => handleRoleChange(UserRole.COLLIERY_MANAGER)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeRole === UserRole.COLLIERY_MANAGER
                  ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-950"
                  : "bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-750"
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Colliery Manager</span>
            </button>

            <button
              onClick={() => handleRoleChange(UserRole.FIELD_WORKER)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeRole === UserRole.FIELD_WORKER
                  ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-950"
                  : "bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-750"
              }`}
            >
              <HardHat className="w-3.5 h-3.5" />
              <span>Mining Sirdar / Worker</span>
            </button>

            <button
              onClick={() => handleRoleChange(UserRole.CONTRACTOR_ADMIN)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeRole === UserRole.CONTRACTOR_ADMIN
                  ? "bg-purple-500 text-slate-950 shadow-md shadow-purple-950"
                  : "bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-750"
              }`}
            >
              <Truck className="w-3.5 h-3.5" />
              <span>Contractor</span>
            </button>

            <button
              onClick={() => refetch()}
              className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700 transition-all active:scale-95 ml-1"
              title="Refresh Data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? "animate-spin text-emerald-400" : ""}`} />
            </button>
          </div>
        </div>
      )}

      {/* Main Dynamic Top Banner */}
      <div
        className={`flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl border border-slate-800 shadow-2xl bg-gradient-to-r ${theme.gradient}`}
      >
        <div>
          <div className="flex items-center gap-2">
            <span
              className={`text-[10px] font-mono uppercase tracking-widest font-bold px-2 py-0.5 rounded border ${theme.badgeColor}`}
            >
              {activeRole.replace(/_/g, " ")}
            </span>
            <span className="text-xs text-slate-400 font-mono">• Logged in as <strong className="text-slate-200">{data?.user_name || userName}</strong></span>
          </div>

          <h1 className="text-2xl font-black text-slate-100 tracking-tight mt-1 flex items-center gap-2">
            <IconComponent className="w-6 h-6 text-emerald-400 shrink-0" />
            <span>{theme.title}</span>
          </h1>

          <p className="text-xs text-slate-400 mt-1 max-w-3xl">
            {theme.desc} for <strong className="text-emerald-300">{data?.mine_site_name || effectiveMineName}</strong>.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-3 shrink-0">
          {[
            UserRole.COLLIERY_MANAGER,
            UserRole.AREA_ADMIN,
            UserRole.DGMS_INSPECTOR,
            UserRole.MINISTRY_AUDITOR,
            UserRole.REGULATORY_OFFICER,
          ].includes(activeRole) && (
            <Link
              href="/inspections/new"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all shadow-lg shadow-emerald-950 active:scale-95"
            >
              <Compass className="w-4 h-4" />
              <span>Conduct Inspection</span>
            </Link>
          )}

          <Link
            href="/capa"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 text-xs font-semibold transition-all"
          >
            <KanbanSquare className="w-4 h-4 text-emerald-400" />
            <span>CAPA Board</span>
          </Link>
        </div>
      </div>

      {/* Loading Skeleton */}
      {isLoading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="h-28 rounded-2xl bg-slate-900 border border-slate-800 animate-pulse" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-6 h-80 rounded-2xl bg-slate-900 border border-slate-800 animate-pulse" />
            <div className="lg:col-span-6 h-80 rounded-2xl bg-slate-900 border border-slate-800 animate-pulse" />
          </div>
        </div>
      ) : (
        <>
          {/* Persona Specific Dashboard Renderers */}
          {activeRole === UserRole.DGMS_INSPECTOR && (
            <InspectorDashboard data={metrics} mineSiteName={effectiveMineName} />
          )}

          {(activeRole === UserRole.COLLIERY_MANAGER ||
            activeRole === UserRole.AREA_ADMIN) && (
            <ManagerDashboard data={metrics} mineSiteName={effectiveMineName} />
          )}

          {(activeRole === UserRole.FIELD_WORKER || activeRole === UserRole.MINING_SIRDAR) && (
            <WorkerDashboard data={metrics} mineSiteName={effectiveMineName} />
          )}

          {(activeRole === UserRole.MINISTRY_AUDITOR ||
            activeRole === UserRole.REGULATORY_OFFICER) && (
            <GovtOfficialDashboard data={metrics} mineSiteName={effectiveMineName} />
          )}

          {activeRole === UserRole.CONTRACTOR_ADMIN && (
            <ContractorDashboard data={metrics} mineSiteName={effectiveMineName} />
          )}
        </>
      )}
    </div>
  );
}
