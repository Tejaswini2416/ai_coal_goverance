"use client";

import { create } from "zustand";

export interface AuditIntegrityResult {
  is_valid: boolean;
  tampered_record_id?: string | null;
  sequence_number?: number | null;
  mine_site_id?: string | null;
  mine_name?: string | null;
  expected_hash?: string | null;
  calculated_hash?: string | null;
  tampered_at?: string | null;
  altered_field?: string | null;
  total_entries_verified: number;
  message: string;
}

interface AuditAlertState {
  isTampered: boolean;
  tamperData: AuditIntegrityResult | null;
  isModalOpen: boolean;
  isFrozen: boolean;
  acknowledgedTimestamp: string | null;
  setTamperAlert: (data: AuditIntegrityResult) => void;
  closeModal: () => void;
  openModal: () => void;
  freezeAndDispatch: () => void;
  clearAlert: () => void;
}

export const useAuditAlertStore = create<AuditAlertState>((set) => ({
  isTampered: false,
  tamperData: null,
  isModalOpen: false,
  isFrozen: false,
  acknowledgedTimestamp: null,

  setTamperAlert: (data) => {
    if (!data.is_valid) {
      set({
        isTampered: true,
        tamperData: data,
        isModalOpen: true,
      });
    } else {
      set({
        isTampered: false,
        tamperData: data,
      });
    }
  },

  closeModal: () => set({ isModalOpen: false }),

  openModal: () => set({ isModalOpen: true }),

  freezeAndDispatch: () =>
    set({
      isFrozen: true,
      isModalOpen: false,
      acknowledgedTimestamp: new Date().toISOString(),
    }),

  clearAlert: () =>
    set({
      isTampered: false,
      tamperData: null,
      isModalOpen: false,
      isFrozen: false,
      acknowledgedTimestamp: null,
    }),
}));
