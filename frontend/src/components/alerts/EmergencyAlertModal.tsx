"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertOctagon,
  ShieldAlert,
  Lock,
  Send,
  FileKey2,
  X,
  Binary,
  Volume2,
  VolumeX,
  Radio,
  Building2,
  AlertTriangle,
} from "lucide-react";
import { useAuditAlertStore } from "@/lib/store/audit-alert-store";
import { useAuthStore } from "@/lib/store/auth-store";
import { playEmergencySiren, stopEmergencySiren } from "@/lib/utils/audio";
import { UserRole } from "@/lib/types/domain";

export function EmergencyAlertModal() {
  const router = useRouter();
  const { userRole } = useAuthStore();
  const { isModalOpen, isTampered, tamperData, closeModal, freezeAndDispatch, isFrozen } =
    useAuditAlertStore();

  const [isMuted, setIsMuted] = useState(false);

  // Privileged statutory oversight roles: Ministry Auditor & DGMS Inspector (plus Colliery Manager)
  const isPrivilegedOfficial =
    !userRole ||
    userRole === UserRole.MINISTRY_AUDITOR ||
    userRole === UserRole.DGMS_INSPECTOR ||
    userRole === UserRole.COLLIERY_MANAGER;

  // Trigger dual-tone Web Audio siren upon modal open for statutory oversight officials
  useEffect(() => {
    if (isModalOpen && isTampered && isPrivilegedOfficial && !isMuted) {
      playEmergencySiren(10000); // 10s statutory dual-tone siren
    } else {
      stopEmergencySiren();
    }

    return () => {
      stopEmergencySiren();
    };
  }, [isModalOpen, isTampered, isPrivilegedOfficial, isMuted]);

  if (!isModalOpen || !isTampered || !tamperData) {
    return null;
  }

  const handleClose = () => {
    stopEmergencySiren();
    closeModal();
  };

  const handleToggleMute = () => {
    if (isMuted) {
      playEmergencySiren(8000);
      setIsMuted(false);
    } else {
      stopEmergencySiren();
      setIsMuted(true);
    }
  };

  const handleInspect = () => {
    stopEmergencySiren();
    closeModal();
    router.push("/audit-ledger");
  };

  const handleFreezeAndDispatch = () => {
    stopEmergencySiren();
    freezeAndDispatch();
  };

  const affectedMine =
    tamperData.mine_name || "Godavarikhani No. 11A Incline (GDK-11A) SCCL";
  const sequenceNum = tamperData.sequence_number ?? 2;
  const alteredField =
    tamperData.altered_field || "ch4_percentage / co_ppm (Gas Telemetry Stream)";
  const expectedHash =
    tamperData.expected_hash ||
    "7d4b9b940905e94b2811a76d8b2e5a6064f51950d87a4192b02444c11438914b";
  const calculatedHash =
    tamperData.calculated_hash ||
    "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-gradient-to-b from-slate-900 via-[#0c121e] to-black border-2 border-rose-500/80 rounded-3xl shadow-[0_0_80px_rgba(244,63,94,0.45)] overflow-hidden">
        {/* Pulsing Emergency Top Header Banner */}
        <div className="bg-gradient-to-r from-rose-700 via-red-600 to-rose-700 px-6 py-4 flex items-center justify-between text-white shadow-xl">
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center">
              <span className="animate-ping absolute inline-flex h-8 w-8 rounded-full bg-white opacity-40"></span>
              <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center shrink-0 border border-white/40">
                <AlertOctagon className="w-5 h-5 text-white animate-pulse" />
              </div>
            </div>
            <div>
              <div className="text-[11px] font-mono uppercase tracking-widest text-rose-100 font-bold flex items-center gap-2">
                <span>Directorate General of Mines Safety (DGMS) Enforcement Alert</span>
                <span className="bg-white/20 px-1.5 py-0.2 rounded text-[9px]">SIH26024</span>
              </div>
              <h2 className="text-base sm:text-lg font-black tracking-tight">
                CRITICAL STATUTORY TAMPERING DETECTED
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Audio Siren Mute/Unmute Button */}
            <button
              onClick={handleToggleMute}
              className="text-white/80 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-all"
              title={isMuted ? "Unmute Emergency Siren" : "Mute Siren"}
            >
              {isMuted ? <VolumeX className="w-5 h-5 text-rose-200" /> : <Volume2 className="w-5 h-5 animate-bounce" />}
            </button>

            {/* Close Button */}
            <button
              onClick={handleClose}
              className="text-white/70 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-all"
              title="Dismiss Alert"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Statutory Enforcement Diagnosis Banner */}
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3.5">
            <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5 animate-pulse" />
            <div className="text-xs text-rose-200 leading-relaxed">
              <strong className="text-rose-100 font-bold block mb-1">
                Cryptographic SHA-256 Merkle Provenance Broken:
              </strong>
              The append-only hash sequence at{" "}
              <span className="font-mono font-bold text-rose-300">
                Sequence #{sequenceNum}
              </span>{" "}
              for <strong className="text-white">{affectedMine}</strong> failed integrity recalculation.
              Direct unauthorized record alteration was intercepted.
            </div>
          </div>

          {/* Tamper Coordinates & Altered Field Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="bg-slate-950/90 p-3.5 rounded-xl border border-slate-800">
              <span className="text-slate-400 font-medium block text-[11px]">Affected Colliery</span>
              <span className="text-slate-100 font-semibold font-mono text-xs block mt-0.5 truncate" title={affectedMine}>
                {affectedMine}
              </span>
            </div>

            <div className="bg-slate-950/90 p-3.5 rounded-xl border border-slate-800">
              <span className="text-slate-400 font-medium block text-[11px]">Corrupted Sequence Block</span>
              <span className="text-rose-400 font-mono font-black text-xs block mt-0.5">
                Block #{sequenceNum}
              </span>
            </div>

            <div className="bg-slate-950/90 p-3.5 rounded-xl border border-slate-800">
              <span className="text-slate-400 font-medium block text-[11px]">Altered Field / Target</span>
              <span className="text-amber-400 font-mono font-semibold text-xs block mt-0.5 truncate" title={alteredField}>
                {alteredField}
              </span>
            </div>
          </div>

          {/* Cryptographic Hash Divergence Box */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 font-medium flex items-center gap-1.5 font-mono">
                <Binary className="w-3.5 h-3.5 text-amber-400" />
                Cryptographic Hash Divergence (Merkle Verification)
              </span>
              <span className="text-[11px] font-mono text-rose-400 font-bold bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                HASH_MISMATCH_DETECTED
              </span>
            </div>

            <div className="bg-slate-950 rounded-2xl p-4 border border-slate-800 font-mono text-[11px] space-y-2.5">
              <div>
                <span className="text-emerald-400 block text-[10px] uppercase tracking-wider font-bold">
                  ✓ Expected Stored Ledger Hash:
                </span>
                <div className="text-slate-300 break-all bg-emerald-950/30 p-2 rounded-lg border border-emerald-500/20 mt-0.5">
                  {expectedHash}
                </div>
              </div>

              <div>
                <span className="text-rose-400 block text-[10px] uppercase tracking-wider font-bold">
                  ✗ Calculated Hash Divergence:
                </span>
                <div className="text-rose-300 break-all bg-rose-950/40 p-2 rounded-lg border border-rose-500/30 mt-0.5 font-bold">
                  {calculatedHash}
                </div>
              </div>
            </div>
          </div>

          {/* Automated Statutory Protocols Triggered */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
            <h4 className="font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2 text-[11px]">
              <Lock className="w-3.5 h-3.5 text-rose-400" />
              Automated Statutory Protocols Dispatched:
            </h4>
            <ul className="text-slate-400 space-y-1.5 list-disc list-inside text-[11px]">
              <li>
                <strong className="text-slate-200">Regulatory SMS Alert:</strong> Dispatched immediately to Ministry (+917842295449) and DGMS Inspector (+918919912916).
              </li>
              <li>
                <strong className="text-slate-200">Mine Risk Escalation:</strong> Safety index locked to <span className="text-rose-400 font-bold">CRITICAL (100/100)</span> pending on-site inquiry.
              </li>
              <li>
                <strong className="text-slate-200">Statutory Form-IV Freeze:</strong> Audit certificate generation halted for this shift log.
              </li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
            <button
              onClick={handleInspect}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-bold flex items-center justify-center gap-2 transition-all border border-slate-700 hover:border-slate-600"
            >
              <FileKey2 className="w-4 h-4 text-emerald-400" />
              Inspect Audit Chain
            </button>

            <button
              onClick={handleFreezeAndDispatch}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-rose-950"
            >
              <Send className="w-4 h-4" />
              {isFrozen ? "Records Locked & Dispatched ✓" : "Freeze Records & Dispatch DGMS Alert"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Re-export for compatibility with previous naming
export const AuditTamperAlertModal = EmergencyAlertModal;
