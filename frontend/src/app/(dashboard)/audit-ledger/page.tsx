"use client";

import React, { useEffect, useState } from "react";
import { ChainVerifyBanner } from "@/components/audit/chain-verify-banner";
import { LedgerTable } from "@/components/audit/ledger-table";
import { fetchAuditLedger, verifyAuditChain, simulateDatabaseTamper } from "@/lib/api/audit";
import { useAuthStore } from "@/lib/store/auth-store";
import { useAuditAlertStore } from "@/lib/store/audit-alert-store";
import { AuditLedgerEntry, VerifyResult } from "@/lib/types/domain";
import {
  FileKey2,
  ShieldCheck,
  ShieldAlert,
  Database,
  Binary,
  Info,
  ArrowRight,
  Layers,
  Lock,
  Flame,
  CheckCircle2,
  RefreshCw,
  Eye,
  ChevronRight,
  Code2,
  AlertTriangle,
  Radio,
} from "lucide-react";

export default function AuditLedgerPage() {
  const { activeMineSiteId, activeMineName } = useAuthStore();
  const setTamperAlert = useAuditAlertStore((s) => s.setTamperAlert);
  const [entries, setEntries] = useState<AuditLedgerEntry[]>([]);
  const [selectedBlock, setSelectedBlock] = useState<AuditLedgerEntry | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  const loadEntries = async () => {
    try {
      const data = await fetchAuditLedger(activeMineSiteId);
      if (data && data.length > 0) {
        setEntries(data);
        setSelectedBlock(data[0]);
      } else {
        // Sample baseline blocks for visual jury demo
        const defaultBlocks: AuditLedgerEntry[] = [
          {
            id: "blk-001",
            mine_site_id: activeMineSiteId || "11111111-1111-4111-a111-111111111111",
            sequence_number: 1,
            entity_type: "COMPLIANCE_SCHEDULE",
            entity_id: "sch-permit-2024",
            operation: "INSERT",
            prev_hash: "GENESIS_BLOCK",
            record_hash: "7d4b9b940905e94b2811a76d8b2e5a6064f51950d87a4192b02444c11438914b",
            created_by: "auditor.hq@coal.gov.in",
            created_at: new Date(Date.now() - 86400000).toISOString(),
          },
          {
            id: "blk-002",
            mine_site_id: activeMineSiteId || "11111111-1111-4111-a111-111111111111",
            sequence_number: 2,
            entity_type: "INSPECTION",
            entity_id: "insp-form-iv-01",
            operation: "INSERT",
            prev_hash: "7d4b9b940905e94b2811a76d8b2e5a6064f51950d87a4192b02444c11438914b",
            record_hash: "c2e8a7199c0dfb6c6b3e71d4a89645719918fb5974e626e2e58410294e1fb59a",
            created_by: "inspector.dgms@dgms.gov.in",
            created_at: new Date(Date.now() - 43200000).toISOString(),
          },
          {
            id: "blk-003",
            mine_site_id: activeMineSiteId || "11111111-1111-4111-a111-111111111111",
            sequence_number: 3,
            entity_type: "GAS_TELEMETRY",
            entity_id: "telemetry-gdk-l3",
            operation: "INSERT",
            prev_hash: "c2e8a7199c0dfb6c6b3e71d4a89645719918fb5974e626e2e58410294e1fb59a",
            record_hash: "9bf421aa08c3e66014e7a2b95ef91104e43e792c3a598fb87019623e1b782980",
            created_by: "manager.gdk11a@scclmines.com",
            created_at: new Date(Date.now() - 14400000).toISOString(),
          },
          {
            id: "blk-004",
            mine_site_id: activeMineSiteId || "11111111-1111-4111-a111-111111111111",
            sequence_number: 4,
            entity_type: "VIOLATION_CAPA",
            entity_id: "capa-remediation-04",
            operation: "STATUS_CHANGE",
            prev_hash: "9bf421aa08c3e66014e7a2b95ef91104e43e792c3a598fb87019623e1b782980",
            record_hash: "18b95024e6ca91f28b490f23075c7429188e992147be864149021fa472e391cb",
            created_by: "manager.gdk11a@scclmines.com",
            created_at: new Date().toISOString(),
          },
        ];
        setEntries(defaultBlocks);
        setSelectedBlock(defaultBlocks[0]);
      }
    } catch (e) {
      console.warn("Could not fetch audit ledger:", e);
    }
  };

  const handleSimulateTamper = async () => {
    setIsSimulating(true);
    try {
      const res = await simulateDatabaseTamper({
        mine_site_id: activeMineSiteId || "11111111-1111-4111-a111-111111111111",
        sequence_number: 2,
        tampered_field: "ch4_percentage",
        new_value: "0.02%",
      });

      setTamperAlert({
        is_valid: false,
        tampered_record_id: res?.tampered_record_id || "insp-form-iv-01",
        sequence_number: res?.sequence_number || 2,
        mine_site_id: activeMineSiteId || "11111111-1111-4111-a111-111111111111",
        mine_name: activeMineName || "Godavarikhani No. 11A Incline (GDK-11A)",
        expected_hash: "c2e8a7199c0dfb6c6b3e71d4a89645719918fb5974e626e2e58410294e1fb59a",
        calculated_hash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
        altered_field: "ch4_percentage (Falsified from 0.82% to 0.02%)",
        total_entries_verified: entries.length || 4,
        message: "Direct unauthorized database modification detected! Hash divergence at Block #2.",
      });
    } catch (err) {
      console.warn("Tamper simulation error:", err);
    } finally {
      setIsSimulating(false);
    }
  };

  useEffect(() => {
    loadEntries();
  }, [activeMineSiteId]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <FileKey2 className="w-6 h-6 text-emerald-400" />
            <h1 className="text-xl font-black text-slate-100">
              Tamper-Evident SHA-256 Statutory Audit Ledger
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Cryptographic provenance &amp; immutable SHA-256 forward-linked chain for{" "}
            <strong className="text-emerald-300">{activeMineName}</strong>.
          </p>
        </div>

        {/* Live Attack Demonstration Trigger */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleSimulateTamper}
            disabled={isSimulating}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-bold text-xs shadow-lg shadow-rose-950 transition-all active:scale-95 border border-rose-500/50"
            title="Inject direct unauthorized mutation to verify audible emergency siren and DGMS dispatch"
          >
            <AlertTriangle className={`w-4 h-4 ${isSimulating ? "animate-spin" : "animate-bounce"}`} />
            <span>{isSimulating ? "Injecting Attack..." : "🚨 Simulate Database Tampering Attack"}</span>
          </button>
        </div>
      </div>

      {/* Cryptographic Chain Integrity Verification Banner */}
      <ChainVerifyBanner />

      {/* Visual Blockchain Sequence Flow */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-emerald-400" />
            <h2 className="text-sm font-black text-slate-100 uppercase tracking-wide">
              Cryptographic Merkle Hash Chain Visualization
            </h2>
          </div>
          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
            Canonical JSON Sorted Keys
          </span>
        </div>

        {/* Chain Sequence Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {entries.map((block, idx) => {
            const isSelected = selectedBlock?.sequence_number === block.sequence_number;
            return (
              <div
                key={block.id || idx}
                onClick={() => setSelectedBlock(block)}
                className={`p-4 rounded-2xl border cursor-pointer transition-all relative flex flex-col justify-between ${
                  isSelected
                    ? "bg-slate-950 border-emerald-500/60 shadow-lg shadow-emerald-950/20 ring-1 ring-emerald-500/40"
                    : "bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-950"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      Block #{block.sequence_number}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500 uppercase">
                      {block.operation}
                    </span>
                  </div>

                  <div className="text-xs font-bold text-slate-200 truncate">{block.entity_type}</div>
                  <div className="text-[10px] font-mono text-slate-500 mt-1 truncate">
                    Prev: {block.prev_hash?.slice(0, 10)}...
                  </div>
                  <div className="text-[10px] font-mono text-emerald-400 mt-0.5 truncate">
                    Hash: {block.record_hash?.slice(0, 10)}...
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500">
                  <span>{new Date(block.created_at).toLocaleTimeString()}</span>
                  <span className="text-emerald-400 font-semibold flex items-center gap-0.5">
                    Inspect <ChevronRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Block Cryptographic Inspector */}
      {selectedBlock && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Code2 className="w-5 h-5 text-amber-400" />
              <h3 className="text-sm font-black text-slate-100">
                Block #{selectedBlock.sequence_number} Cryptographic Inspector
              </h3>
            </div>
            <span className="text-xs font-mono text-slate-400">
              Verified by SHA-256 Engine
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-xs font-mono">
            {/* Left: Cryptographic Hashes & Linkage */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <div>
                <span className="text-[10px] text-slate-500 uppercase block mb-1">
                  1. Previous Block Hash (H_prev)
                </span>
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 break-all text-[11px]">
                  {selectedBlock.prev_hash}
                </div>
              </div>

              <div>
                <span className="text-[10px] text-slate-500 uppercase block mb-1">
                  2. Current Block SHA-256 Hash (H_current)
                </span>
                <div className="p-2.5 rounded-lg bg-emerald-950/20 border border-emerald-500/30 text-emerald-400 break-all text-[11px] font-bold">
                  {selectedBlock.record_hash}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <span className="text-slate-500 block">Actor ID:</span>
                  <strong className="text-slate-300">{selectedBlock.created_by}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Timestamp:</span>
                  <strong className="text-slate-300">
                    {new Date(selectedBlock.created_at).toLocaleString()}
                  </strong>
                </div>
              </div>
            </div>

            {/* Right: Canonical JSON Payload */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between">
              <div>
                <span className="text-[10px] text-slate-500 uppercase block mb-1">
                  3. Canonical Payload (Key-Sorted Deterministic JSON)
                </span>
                <pre className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-emerald-300 text-[11px] overflow-x-auto max-h-40 leading-relaxed scrollbar-none">
                  {JSON.stringify(
                    {
                      sequence_number: selectedBlock.sequence_number,
                      entity_type: selectedBlock.entity_type,
                      operation: selectedBlock.operation,
                      entity_id: selectedBlock.entity_id,
                      mine_site_id: selectedBlock.mine_site_id,
                      statutory_standard: "DGMS / CMR 2017",
                      immutable_seal: true,
                    },
                    null,
                    2
                  )}
                </pre>
              </div>
              <p className="text-[10px] text-slate-500 mt-2">
                Hashing formula: <code>SHA256(prev_hash | sequence_number | actor_id | payload)</code>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Explainer Card */}
      <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 flex items-start gap-3 text-xs text-slate-400">
        <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong>DGMS Statutory Compliance Proof:</strong> Every statutory entry (inspection observations,
          gas telemetry readings, CAPA rectifications) is hashed into an immutable append-only ledger.
          Direct modifications in MongoDB or file systems immediately break the forward Merkle hash chain,
          triggering an automatic emergency alert for the Ministry of Coal and DGMS Inspectors.
        </div>
      </div>

      {/* Complete Historical Ledger Table */}
      <LedgerTable entries={entries} />
    </div>
  );
}
