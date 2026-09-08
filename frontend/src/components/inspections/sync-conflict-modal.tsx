"use client";

import React, { useState } from "react";
import { useSyncStore } from "@/lib/store/sync-store";
import { arbitrateConflict } from "@/lib/sync/sync-manager";
import { AlertOctagon, GitMerge, Check, Server, Smartphone, X } from "lucide-react";

export function SyncConflictModal() {
  const { activeConflict, setActiveConflict } = useSyncStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!activeConflict) return null;

  const diffEntries = Object.entries(activeConflict.diff || {});

  const handleResolve = async (
    resolution: "RESOLVED_CLIENT" | "RESOLVED_SERVER" | "AUTO_MERGED"
  ) => {
    setIsSubmitting(true);
    try {
      await arbitrateConflict({
        conflict_id: activeConflict.id,
        resolution,
      });
    } catch (err) {
      console.error("Arbitration failed:", err);
      // Fallback close
      setActiveConflict(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 bg-rose-950/40 border-b border-rose-900/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <AlertOctagon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-base flex items-center gap-2">
                Sync Conflict Detected (HTTP 207 Conflict)
              </h3>
              <p className="text-xs text-rose-300/80">
                Conflict ID: <span className="font-mono">{activeConflict.id}</span> • Optimistic Version Clash
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveConflict(null)}
            className="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Diff Content */}
        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          <div className="text-xs text-slate-300">
            A version mismatch occurred between your offline record (v{activeConflict.client_version}) and the server state (v{activeConflict.server_version}). Please review the field differences and select an arbitration strategy:
          </div>

          {/* Side-by-side Field Comparison */}
          <div className="border border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-800">
            <div className="grid grid-cols-3 bg-slate-950 px-4 py-2.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              <div>Field Name</div>
              <div className="text-amber-400 flex items-center gap-1">
                <Smartphone className="w-3.5 h-3.5" /> Client Local (v{activeConflict.client_version})
              </div>
              <div className="text-cyan-400 flex items-center gap-1">
                <Server className="w-3.5 h-3.5" /> Server Snapshot (v{activeConflict.server_version})
              </div>
            </div>

            {diffEntries.map(([field, [clientVal, serverVal]]) => (
              <div key={field} className="grid grid-cols-3 px-4 py-3 text-xs bg-slate-900/60 items-center">
                <div className="font-mono font-medium text-slate-300">{field}</div>
                <div className="text-amber-200 bg-amber-500/10 border border-amber-500/20 px-2 py-1 rounded mr-2 font-mono text-[11px] break-words">
                  {String(clientVal ?? "(empty)")}
                </div>
                <div className="text-cyan-200 bg-cyan-500/10 border border-cyan-500/20 px-2 py-1 rounded font-mono text-[11px] break-words">
                  {String(serverVal ?? "(empty)")}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Actions — Mapped to POST /api/v1/sync/arbitrate */}
        <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-3">
          <button
            disabled={isSubmitting}
            onClick={() => handleResolve("RESOLVED_SERVER")}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-semibold transition-all"
          >
            <Server className="w-3.5 h-3.5 text-cyan-400" />
            Keep Server Version
          </button>

          <button
            disabled={isSubmitting}
            onClick={() => handleResolve("RESOLVED_CLIENT")}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-amber-500/40 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 text-xs font-semibold transition-all"
          >
            <Smartphone className="w-3.5 h-3.5 text-amber-400" />
            Force Client Version
          </button>

          <button
            disabled={isSubmitting}
            onClick={() => handleResolve("AUTO_MERGED")}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-emerald-500/40 bg-emerald-600 hover:bg-emerald-500 text-slate-950 text-xs font-bold transition-all shadow-lg shadow-emerald-950"
          >
            <GitMerge className="w-3.5 h-3.5" />
            Auto-Merge & Arbitrate
          </button>
        </div>
      </div>
    </div>
  );
}
