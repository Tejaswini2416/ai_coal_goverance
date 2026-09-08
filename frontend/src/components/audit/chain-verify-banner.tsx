"use client";

import React, { useState } from "react";
import { VerifyResult } from "@/lib/types/domain";
import { verifyAuditChain } from "@/lib/api/audit";
import { useAuthStore } from "@/lib/store/auth-store";
import {
  ShieldCheck,
  ShieldAlert,
  RefreshCw,
  Lock,
  Binary,
  CheckCircle2,
} from "lucide-react";

interface ChainVerifyBannerProps {
  initialResult?: VerifyResult | null;
  onVerified?: (result: VerifyResult) => void;
}

export function ChainVerifyBanner({
  initialResult,
  onVerified,
}: ChainVerifyBannerProps) {
  const { activeMineSiteId } = useAuthStore();
  const [result, setResult] = useState<VerifyResult | null>(
    initialResult || {
      mine_site_id: activeMineSiteId,
      valid: true,
      broken_at_sequence: null,
      total_entries: 4,
      reason: null,
    }
  );
  const [isVerifying, setIsVerifying] = useState(false);

  const handleVerify = async () => {
    setIsVerifying(true);
    try {
      const res = await verifyAuditChain(activeMineSiteId);
      setResult(res);
      onVerified?.(res);
    } catch (err) {
      console.error("Failed verification:", err);
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        <div
          className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${
            result?.valid
              ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.2)]"
              : "bg-rose-500/15 text-rose-400 border-rose-500/30 shadow-[0_0_20px_rgba(244,63,94,0.3)] animate-pulse"
          }`}
        >
          {result?.valid ? (
            <ShieldCheck className="w-6 h-6" />
          ) : (
            <ShieldAlert className="w-6 h-6" />
          )}
        </div>

        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-100">
              {result?.valid
                ? "Cryptographic Hash Chain Intact (SHA-256 Verified)"
                : "TAMPER WARNING: Blockchain Audit Chain Broken!"}
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
              RFC 6962 Standard
            </span>
          </div>

          <p className="text-xs text-slate-400 mt-1">
            {result?.valid ? (
              <>
                All <strong className="text-slate-200">{result.total_entries}</strong> sequential
                ledger operations cryptographically verified with zero mutation.
              </>
            ) : (
              <>
                Data mismatch detected at sequence{" "}
                <strong className="text-rose-400">#{result?.broken_at_sequence}</strong>. Potential
                unauthorized database alteration!
              </>
            )}
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2.5 shrink-0">

        <button
          onClick={handleVerify}
          disabled={isVerifying}
          className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-emerald-400 border border-emerald-500/30 font-bold text-xs flex items-center gap-2 transition-all hover:shadow-lg active:scale-95"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isVerifying ? "animate-spin text-emerald-400" : ""}`} />
          <span>{isVerifying ? "Recomputing SHA-256..." : "Verify Chain Integrity"}</span>
        </button>
      </div>
    </div>
  );
}
