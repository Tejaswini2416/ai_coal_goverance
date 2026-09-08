"use client";

import React, { useState, useEffect } from "react";
import { useSyncStore } from "@/lib/store/sync-store";
import { flushOfflineSyncQueue } from "@/lib/sync/sync-manager";
import { Wifi, WifiOff, RefreshCw, AlertCircle, CloudUpload } from "lucide-react";

export function SyncStatusPill() {
  const [mounted, setMounted] = useState(false);
  const {
    isOnline,
    isSyncing,
    pendingCount,
    lastSyncedAt,
    setIsOnline,
    refreshPendingCount,
  } = useSyncStore();

  useEffect(() => {
    setMounted(true);
    refreshPendingCount();

    const handleOnline = () => {
      setIsOnline(true);
      flushOfflineSyncQueue();
    };
    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Periodic check for pending offline items
    const interval = setInterval(() => {
      refreshPendingCount();
    }, 5000);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      clearInterval(interval);
    };
  }, [setIsOnline, refreshPendingCount]);

  const handleManualSync = async () => {
    if (!isOnline || isSyncing) return;
    await flushOfflineSyncQueue();
  };

  const currentOnline = mounted ? isOnline : true;
  const currentPending = mounted ? pendingCount : 0;

  return (
    <div className="flex items-center gap-2">
      {/* Network Connectivity Pill */}
      <div
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all ${
          currentOnline
            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.15)]"
            : "bg-rose-500/15 text-rose-400 border-rose-500/30 animate-pulse shadow-[0_0_12px_rgba(244,63,94,0.2)]"
        }`}
      >
        {currentOnline ? (
          <>
            <Wifi className="w-3.5 h-3.5 text-emerald-400" />
            <span>Online</span>
          </>
        ) : (
          <>
            <WifiOff className="w-3.5 h-3.5 text-rose-400" />
            <span>Offline (Underground Mode)</span>
          </>
        )}
      </div>

      {/* Pending Offline Uploads Pill */}
      {currentPending > 0 && (
        <button
          onClick={handleManualSync}
          disabled={!isOnline || isSyncing}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
            isOnline
              ? "bg-amber-500/15 text-amber-400 border-amber-500/30 hover:bg-amber-500/25 cursor-pointer shadow-md"
              : "bg-slate-800 text-slate-400 border-slate-700 cursor-not-allowed"
          }`}
          title={isOnline ? "Click to flush sync queue to server" : "Waiting for network connectivity"}
        >
          {isSyncing ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400" />
              <span>Syncing ({currentPending})...</span>
            </>
          ) : (
            <>
              <CloudUpload className="w-3.5 h-3.5 text-amber-400" />
              <span>{currentPending} Pending Upload{currentPending > 1 ? "s" : ""}</span>
            </>
          )}
        </button>
      )}
    </div>
  );
}
