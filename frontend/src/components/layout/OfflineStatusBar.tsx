"use client";

import React, { useState, useEffect } from "react";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { WifiOff, RefreshCw, CheckCircle2, Database, ShieldAlert } from "lucide-react";

export function OfflineStatusBar() {
  const [mounted, setMounted] = useState(false);
  const { isOnline, isSyncing, pendingCount, syncNow } = useNetworkStatus();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || (isOnline && pendingCount === 0)) {
    return null;
  }

  return (
    <aside
      aria-label="Network status banner"
      className={`w-full px-4 py-2.5 transition-all text-xs font-mono flex items-center justify-between border-b ${
        !isOnline
          ? "bg-amber-500/10 border-amber-500/30 text-amber-300"
          : "bg-blue-500/10 border-blue-500/30 text-blue-300"
      }`}
    >
      <div className="flex items-center gap-2.5 max-w-4xl">
        {!isOnline ? (
          <WifiOff className="w-4 h-4 text-amber-400 shrink-0 animate-pulse" />
        ) : (
          <RefreshCw className={`w-4 h-4 text-blue-400 shrink-0 ${isSyncing ? "animate-spin" : ""}`} />
        )}
        <div>
          {!isOnline ? (
            <span>
              <strong>📶 OFFLINE MODE:</strong> Operating on local pit cache. All actions will sync automatically upon reconnection.
            </span>
          ) : (
            <span>
              <strong>RECONNECTED:</strong> Online connection restored. Background reconciler is active.
            </span>
          )}
          {pendingCount > 0 && (
            <span className="ml-2 font-bold text-amber-400 bg-amber-500/20 px-2 py-0.5 rounded-full">
              {pendingCount} Local Mutation{pendingCount > 1 ? "s" : ""} Queued
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-[10px] text-slate-400 hidden sm:inline-flex items-center gap-1">
          <Database className="w-3 h-3 text-emerald-400" /> Dexie IndexedDB Active
        </span>
        {isOnline && (
          <button
            onClick={() => syncNow()}
            disabled={isSyncing}
            className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold flex items-center gap-1 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3 h-3 ${isSyncing ? "animate-spin" : ""}`} />
            <span>{isSyncing ? "Syncing..." : "Sync Now"}</span>
          </button>
        )}
      </div>
    </aside>
  );
}
