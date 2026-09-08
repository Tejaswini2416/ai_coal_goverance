"use client";

import React from "react";
import Link from "next/link";
import { InspectionWizard } from "@/components/inspections/inspection-wizard";
import { useAuthStore } from "@/lib/store/auth-store";
import { ArrowLeft, ShieldAlert } from "lucide-react";

export default function NewInspectionPage() {
  const { userRole } = useAuthStore();

  const allowedRoles = [
    "COLLIERY_MANAGER",
    "AREA_ADMIN",
    "DGMS_INSPECTOR",
    "MINISTRY_AUDITOR",
    "REGULATORY_OFFICER",
  ];

  if (userRole && !allowedRoles.includes(userRole)) {
    return (
      <div className="max-w-2xl mx-auto my-12 p-8 bg-slate-900 border border-slate-800 rounded-3xl text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-100">Statutory Inspection Access Restricted</h2>
        <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
          Statutory field audits and DGMS Form-IV filing are restricted to <strong>Colliery Managers</strong>, <strong>DGMS Inspectors</strong>, and <strong>Ministry Regulatory Auditors</strong>.
        </p>
        <div className="pt-4">
          <Link
            href="/overview"
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold inline-flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Dashboard</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Back Link */}
      <div className="flex items-center justify-between">
        <Link
          href="/inspections"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Inspections List</span>
        </Link>
        <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded border border-emerald-500/30">
          PWA Offline Form Enabled
        </span>
      </div>

      {/* Main Wizard Form */}
      <InspectionWizard />
    </div>
  );
}
