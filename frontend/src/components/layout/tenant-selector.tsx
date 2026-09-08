"use client";

import React, { useState } from "react";
import { useAuthStore } from "@/lib/store/auth-store";
import { MOCK_TENANTS } from "@/lib/api/tenants";
import { TenantTier, UserRole } from "@/lib/types/domain";
import { ChevronRight, Building2, MapPin, Landmark, Layers } from "lucide-react";

export function TenantSelector() {
  const { activeTenantPath, activeMineName, setActiveTenant, userRole } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);

  // Split path into breadcrumbs, e.g. "MOC.SECL.KORBA.PIT1"
  const segments = activeTenantPath.split(".");

  const mineSites = MOCK_TENANTS.filter((t) => t.tier === TenantTier.MINE_SITE);

  const getTierIcon = (segment: string) => {
    if (segment === "MOC") return <Landmark className="w-3.5 h-3.5 text-emerald-400" />;
    if (segment === "SECL") return <Building2 className="w-3.5 h-3.5 text-blue-400" />;
    if (segment === "KORBA") return <Layers className="w-3.5 h-3.5 text-amber-400" />;
    return <MapPin className="w-3.5 h-3.5 text-teal-400" />;
  };

  return (
    <div className="relative">
      <div className="flex items-center gap-1.5 bg-slate-900/90 border border-slate-800 px-3 py-1.5 rounded-lg text-xs shadow-inner">
        {/* ltree Breadcrumb Sequence */}
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
          {segments.map((seg, idx) => (
            <React.Fragment key={idx}>
              {idx > 0 && <ChevronRight className="w-3 h-3 text-slate-600 flex-shrink-0" />}
              <span className="inline-flex items-center gap-1 text-slate-300 font-mono font-medium whitespace-nowrap">
                {getTierIcon(seg)}
                {seg}
              </span>
            </React.Fragment>
          ))}
        </div>

        {/* Change Mine Site Scope Button */}
        {userRole === UserRole.MINISTRY_AUDITOR && (
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="ml-2 text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 px-2 py-0.5 rounded transition-colors whitespace-nowrap"
          >
            Scope Mine ▼
          </button>
        )}
      </div>

      {/* Dropdown for scoping down to specific mine sites */}
      {isOpen && (
        <div className="absolute top-full mt-2 left-0 w-80 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-2 z-50 text-xs">
          <div className="px-2.5 py-1.5 font-bold text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
            Select Mine Site Scope (ltree Subtree)
          </div>
          <div className="mt-1 space-y-1 max-h-56 overflow-y-auto">
            {mineSites.map((site) => (
              <button
                key={site.id}
                onClick={() => {
                  setActiveTenant(site.path, site.id, site.name);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-2.5 py-2 rounded-lg flex flex-col gap-0.5 transition-colors ${
                  activeTenantPath === site.path
                    ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                    : "text-slate-300 hover:bg-slate-800"
                }`}
              >
                <div className="font-semibold">{site.name}</div>
                <div className="text-[10px] font-mono text-slate-500">{site.path}</div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
