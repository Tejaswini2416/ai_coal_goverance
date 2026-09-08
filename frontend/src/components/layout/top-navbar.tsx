"use client";

import React, { useState, useEffect } from "react";
import { useAuthStore } from "@/lib/store/auth-store";
import { UserRole } from "@/lib/types/domain";
import { TenantSelector } from "./tenant-selector";
import { MineSelector } from "./MineSelector";
import { SyncStatusPill } from "../inspections/sync-status-pill";
import { UserCheck, Shield, ChevronDown, LogOut, Bell, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { NotificationCenterModal } from "../notifications/notification-center-modal";

export function TopNavbar() {
  const [mounted, setMounted] = useState(false);
  const { userRole, userName, switchRole, logout } = useAuthStore();
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  const currentRole = mounted ? userRole : UserRole.MINISTRY_AUDITOR;
  const currentName = mounted ? userName : "Dr. R. K. Sharma (MOC Auditor)";
  const isDemoMode =
    mounted &&
    (process.env.NEXT_PUBLIC_DEMO_MODE === "true" ||
      (typeof window !== "undefined" && window.location.search.includes("demo=true")));

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const roles = [
    { role: UserRole.MINISTRY_AUDITOR, label: "Ministry Auditor (Full Scope)" },
    { role: UserRole.DGMS_INSPECTOR, label: "DGMS Inspector (Statutory Authority)" },
    { role: UserRole.COLLIERY_MANAGER, label: "Colliery Manager (GDK 11A)" },
    { role: UserRole.CONTRACTOR_ADMIN, label: "Contractor Admin (RG-OCP 3)" },
    { role: UserRole.FIELD_WORKER, label: "Mining Sirdar (Kasipet UG)" },
  ];

  return (
    <header className="sticky top-0 z-40 w-full h-16 bg-slate-950/80 backdrop-blur-md border-b border-slate-800 px-6 flex items-center justify-between shadow-md">
      {/* Left: Organization Hierarchy Breadcrumb & Dynamic Telangana Mine Selector */}
      <div className="flex items-center gap-3">
        <MineSelector />
        <div className="hidden lg:block">
          <TenantSelector />
        </div>
      </div>

      {/* Right: Sync Status, Notifications, Role Badge, Logout */}
      <div className="flex items-center gap-2.5">

        {/* Offline / Online Sync Pill */}
        <SyncStatusPill />

        {/* Dynamic RBAC Role Badge / Switcher in Demo Mode */}
        <div className="relative">
          <button
            id="navbar-role-switcher-btn"
            onClick={() => isDemoMode && setRoleMenuOpen(!roleMenuOpen)}
            className={`flex items-center gap-2.5 px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-900/90 text-xs text-slate-200 shadow-sm ${
              isDemoMode ? "hover:bg-slate-800 cursor-pointer" : "cursor-default"
            }`}
          >
            <Shield className="w-4 h-4 text-emerald-400 shrink-0" />
            <div className="text-left">
              <div className="font-bold text-[10px] text-emerald-400 uppercase tracking-wider">
                {currentRole.replace(/_/g, " ")}
              </div>
              <div className="text-[10px] text-slate-400 truncate max-w-[130px]">
                {currentName}
              </div>
            </div>
            {isDemoMode && <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
          </button>

          {isDemoMode && roleMenuOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in duration-150">
              <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800 flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-emerald-400" />
                <span>Demo Role Switcher</span>
              </div>
              <div className="mt-1 space-y-1 max-h-56 overflow-y-auto">
                {roles.map((r) => (
                  <button
                    key={r.role}
                    onClick={() => {
                      switchRole(r.role);
                      setRoleMenuOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-colors flex items-center justify-between ${
                      userRole === r.role
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold"
                        : "text-slate-300 hover:bg-slate-800"
                    }`}
                  >
                    <span>{r.label}</span>
                    {userRole === r.role && <UserCheck className="w-3.5 h-3.5 text-emerald-400" />}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Notifications Button */}
        <button
          onClick={() => setNotifOpen(true)}
          className="relative p-2 rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300 transition-colors"
          title="Statutory Notifications"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-emerald-500 rounded-full" />
        </button>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="p-2 rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors"
          title="Sign Out"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>

      {/* Global Notification Center Modal */}
      <NotificationCenterModal isOpen={notifOpen} onClose={() => setNotifOpen(false)} />
    </header>
  );
}
