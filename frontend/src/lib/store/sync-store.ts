import { create } from "zustand";
import { offlineDb, type SyncConflictItem } from "../db/offline-db";

interface SyncState {
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  lastSyncedAt: Date | null;
  activeConflict: SyncConflictItem | null;
  setIsOnline: (online: boolean) => void;
  setIsSyncing: (syncing: boolean) => void;
  setLastSyncedAt: (date: Date) => void;
  refreshPendingCount: () => Promise<void>;
  setActiveConflict: (conflict: SyncConflictItem | null) => void;
}

export const useSyncStore = create<SyncState>((set) => ({
  isOnline: typeof navigator !== "undefined" ? navigator.onLine : true,
  isSyncing: false,
  pendingCount: 0,
  lastSyncedAt: null,
  activeConflict: null,

  setIsOnline: (online) => set({ isOnline: online }),
  setIsSyncing: (syncing) => set({ isSyncing: syncing }),
  setLastSyncedAt: (date) => set({ lastSyncedAt: date }),

  refreshPendingCount: async () => {
    try {
      const inspections = await offlineDb.pending_inspections.where("is_synced").equals(0).count();
      const capas = await offlineDb.pending_capas.where("is_synced").equals(0).count();
      const workerReports = await offlineDb.worker_issues.where("is_synced").equals(0).count();
      const workerLeaves = await offlineDb.worker_leaves.where("is_synced").equals(0).count();
      const managerActions = await offlineDb.offline_manager_actions.where("is_synced").equals(0).count();
      set({ pendingCount: inspections + capas + workerReports + workerLeaves + managerActions });
    } catch {
      set({ pendingCount: 0 });
    }
  },

  setActiveConflict: (conflict) => set({ activeConflict: conflict }),
}));
