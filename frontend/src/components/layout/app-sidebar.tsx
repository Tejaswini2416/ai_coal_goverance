"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/lib/store/auth-store";
import { UserRole } from "@/lib/types/domain";
import {
  LayoutDashboard,
  Map,
  ClipboardCheck,
  CalendarDays,
  Users,
  KanbanSquare,
  FileCheck2,
  FileKey2,
  HardHat,
  ShieldCheck,
  BarChart3,
  Truck,
  Bell,
  Activity,
  Award,
  Layers,
  Flame,
  AlertTriangle,
  FolderLock,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
}

export function AppSidebar() {
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const { userRole, userName } = useAuthStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  const getNavItemsForRole = (role: UserRole): NavItem[] => {
    switch (role) {
      case UserRole.CONTRACTOR_ADMIN:
        return [
          {
            label: "Contractor Cockpit",
            href: "/overview",
            icon: LayoutDashboard,
            badge: "Multi-Pit",
          },
          {
            label: "Production & Dispatch",
            href: "/contractor/production",
            icon: Truck,
            badge: "Tonnage",
          },
          {
            label: "Safety Risk Score",
            href: "/contractor/risk-score",
            icon: ShieldCheck,
            badge: "KPIs",
          },
          {
            label: "Active Cast Sites",
            href: "/contractor/mines",
            icon: Map,
            badge: "4 Mines",
          },
          {
            label: "Operational Notifications",
            href: "/notifications",
            icon: Bell,
            badge: "Live",
          },
        ];

      case UserRole.DGMS_INSPECTOR:
      case UserRole.REGULATORY_OFFICER:
        return [
          {
            label: "Inspector Cockpit",
            href: "/overview",
            icon: LayoutDashboard,
            badge: "Schedules",
          },
          {
            label: "Statutory Inspections",
            href: "/inspections",
            icon: ClipboardCheck,
            badge: "Audits",
          },
          {
            label: "New Form-IV Audit",
            href: "/inspections/new",
            icon: FileCheck2,
            badge: "Geofenced",
          },
          {
            label: "Inspector Scheduling",
            href: "/schedules",
            icon: CalendarDays,
            badge: "Auto-Escalate",
          },
          {
            label: "Statutory CAPA Board",
            href: "/capa",
            icon: KanbanSquare,
            badge: "6-Stage",
          },
          {
            label: "Geospatial & Satellite Map",
            href: "/map",
            icon: Map,
            badge: "ESRI Sat",
          },
        ];

      case UserRole.COLLIERY_MANAGER:
      case UserRole.AREA_ADMIN:
        return [
          {
            label: "Colliery Cockpit",
            href: "/overview",
            icon: LayoutDashboard,
            badge: "Live Gauges",
          },
          {
            label: "Workforce & Biometrics",
            href: "/attendance",
            icon: Users,
            badge: "Telemetry",
          },
          {
            label: "AI Safety Risk Analysis",
            href: "/analytics",
            icon: BarChart3,
            badge: "4-Pillar",
          },
          {
            label: "Data Logs",
            href: "/data-logs",
            icon: FolderLock,
            badge: "Immutable",
          },
          {
            label: "CAPA Remediation Board",
            href: "/capa",
            icon: KanbanSquare,
            badge: "Directives",
          },
          {
            label: "Leasehold & Gallery Map",
            href: "/map",
            icon: Map,
            badge: "ESRI Sat",
          },
        ];

      case UserRole.MINISTRY_AUDITOR:
        return [
          {
            label: "Executive Scorecard",
            href: "/overview",
            icon: LayoutDashboard,
            badge: "Macro",
          },
          {
            label: "Cryptographic Audit Ledger",
            href: "/audit-ledger",
            icon: FileKey2,
            badge: "SHA-256",
          },
          {
            label: "AI Governance Analytics",
            href: "/analytics",
            icon: BarChart3,
            badge: "Trends",
          },
          {
            label: "Statutory Clearances",
            href: "/compliance",
            icon: FileCheck2,
            badge: "Certificates",
          },
          {
            label: "Multi-Mine Telangana GIS",
            href: "/map",
            icon: Map,
            badge: "Sat/Vector",
          },
        ];

      case UserRole.MINING_SIRDAR:
      case UserRole.FIELD_WORKER:
      default:
        return [
          {
            label: "Worker Shift Cockpit",
            href: "/overview",
            icon: LayoutDashboard,
            badge: "Live CH4/CO",
          },
          {
            label: "Report Issue / Hazard",
            href: "/worker/issues",
            icon: AlertTriangle,
            badge: "Portal",
          },
          {
            label: "Biometric Shift Muster",
            href: "/attendance",
            icon: Users,
            badge: "Muster",
          },
          {
            label: "Underground Gallery Map",
            href: "/map",
            icon: Map,
            badge: "Stations",
          },
        ];
    }
  };

  const currentRole = mounted ? userRole : UserRole.MINISTRY_AUDITOR;
  const navItems = getNavItemsForRole(currentRole);

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case UserRole.CONTRACTOR_ADMIN:
        return { label: "Contractor Portal", color: "bg-purple-500/20 text-purple-300 border-purple-500/30" };
      case UserRole.DGMS_INSPECTOR:
      case UserRole.REGULATORY_OFFICER:
        return { label: "DGMS Inspector", color: "bg-sky-500/20 text-sky-300 border-sky-500/30" };
      case UserRole.COLLIERY_MANAGER:
      case UserRole.AREA_ADMIN:
        return { label: "Colliery Manager", color: "bg-amber-500/20 text-amber-300 border-amber-500/30" };
      case UserRole.MINISTRY_AUDITOR:
        return { label: "Ministry Auditor", color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" };
      default:
        return { label: "Mining Sirdar", color: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30" };
    }
  };

  const roleBadge = getRoleBadge(currentRole);

  return (
    <aside className="w-64 bg-slate-950 border-r border-slate-800 flex flex-col justify-between shrink-0 min-h-screen">
      <div>
        {/* Ministry Brand Header */}
        <Link
          href="/overview"
          className="h-16 border-b border-slate-800 flex items-center px-5 gap-3 bg-slate-900/40 hover:bg-slate-900/80 transition-colors cursor-pointer group"
          title="Go to Dashboard Cockpit"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-slate-950 shadow-md shadow-emerald-950 group-hover:scale-105 transition-transform">
            <HardHat className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <div className="font-extrabold text-slate-100 text-sm tracking-tight leading-tight group-hover:text-emerald-300 transition-colors">
              COAL GOV AI
            </div>
            <div className="text-[10px] text-emerald-400 font-semibold tracking-wider uppercase">
              SIH26024 • MoC Portal
            </div>
          </div>
        </Link>

        {/* User Role Indicator Banner */}
        <div className="px-4 pt-3 pb-1">
          <div className={`px-2.5 py-1.5 rounded-xl border text-xs font-medium flex items-center justify-between ${roleBadge.color}`}>
            <span className="font-bold truncate">{roleBadge.label}</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0 ml-2" />
          </div>
        </div>

        {/* Dynamic Navigation Links */}
        <nav className="p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== "/overview" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                  isActive
                    ? "bg-purple-500/15 text-purple-300 border border-purple-500/30 shadow-sm shadow-purple-950"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 transition-colors ${
                      isActive ? "text-purple-400" : "text-slate-400 group-hover:text-slate-200"
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[9px] font-mono px-1.5 py-0.5 rounded border uppercase tracking-wider ${
                      isActive
                        ? "bg-purple-500/20 text-purple-300 border-purple-500/30"
                        : "bg-slate-900 text-slate-400 border-slate-800"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* System Integrity Badge in Footer */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-900/30">
        <div className="p-3 rounded-xl border border-slate-800 bg-slate-950/70 text-xs space-y-1.5">
          <div className="flex items-center gap-1.5 text-emerald-400 font-semibold text-[11px]">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>FastAPI • MongoDB Connected</span>
          </div>
          <p className="text-[10px] text-slate-400 leading-relaxed">
            Role-gated authorization and SHA-256 tamper watchdog active.
          </p>
        </div>
      </div>
    </aside>
  );
}
