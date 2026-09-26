"use client";

import { useState, useEffect, useCallback } from "react";
import { useSyncStore } from "@/lib/store/sync-store";
import { offlineDb } from "@/lib/db/offline-db";
import { flushOfflineSyncQueue } from "@/lib/sync/sync-manager";

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState<boolean>(() =>
    typeof navigator !== "undefined" ? navigator.onLine : true
  );
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [pendingCount, setPendingCount] = useState<number>(0);

  const refreshPendingCount = useCallback(async () => {
    try {
      const inspections = await offlineDb.pending_inspections.where("is_synced").equals(0).count();
      const capas = await offlineDb.pending_capas.where("is_synced").equals(0).count();
      const workerReports = await offlineDb.worker_issues.where("is_synced").equals(0).count();
      const workerLeaves = await offlineDb.worker_leaves.where("is_synced").equals(0).count();
      const managerActions = await offlineDb.offline_manager_actions.where("is_synced").equals(0).count();
      setPendingCount(inspections + capas + workerReports + workerLeaves + managerActions);
    } catch {
      setPendingCount(0);
    }
  }, []);

  const syncNow = useCallback(async () => {
    if (typeof navigator !== "undefined" && !navigator.onLine) return;
    setIsSyncing(true);
    try {
      await flushOfflineSyncQueue();
      await refreshPendingCount();
    } catch (err) {
      console.warn("Background synchronization error:", err);
    } finally {
      setIsSyncing(false);
    }
  }, [refreshPendingCount]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleOnline = () => {
      setIsOnline(true);
      useSyncStore.getState().setIsOnline(true);
      syncNow();
    };

    const handleOffline = () => {
      setIsOnline(false);
      useSyncStore.getState().setIsOnline(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Initial check on mount: If running online, immediately drain any queued offline records
    refreshPendingCount().then(() => {
      if (typeof navigator !== "undefined" && navigator.onLine) {
        syncNow();
      }
    });

    // Periodic auto-sync worker: Checks every 6 seconds and syncs offline data as soon as online
    const autoSyncInterval = setInterval(async () => {
      if (typeof navigator !== "undefined" && navigator.onLine) {
        await refreshPendingCount();
        const pending = useSyncStore.getState().pendingCount;
        if (pending > 0 && !useSyncStore.getState().isSyncing) {
          await syncNow();
        }
      }
    }, 6000);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      clearInterval(autoSyncInterval);
    };
  }, [syncNow, refreshPendingCount]);

  return {
    isOnline,
    isSyncing,
    pendingCount,
    syncNow,
    refreshPendingCount,
  };
}
