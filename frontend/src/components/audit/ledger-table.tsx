"use client";

import React, { useState } from "react";
import { AuditLedgerEntry } from "@/lib/types/domain";
import { formatDate } from "@/lib/utils/dates";
import { Copy, Check, Hash, ArrowDown, ExternalLink } from "lucide-react";

interface LedgerTableProps {
  entries: AuditLedgerEntry[];
}

export function LedgerTable({ entries }: LedgerTableProps) {
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  const handleCopy = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden shadow-2xl">
      <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
        <div>
          <h4 className="font-bold text-slate-100 text-sm">
            Statutory Cryptographic Audit Chain Log
          </h4>
          <p className="text-xs text-slate-400">
            Immutable SHA-256 forward-linked chain. Each block references preceding record hash.
          </p>
        </div>
        <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/30">
          {entries.length} Ledger Blocks
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-950 text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-800">
            <tr>
              <th className="px-5 py-3">Seq #</th>
              <th className="px-5 py-3">Operation</th>
              <th className="px-5 py-3">Entity Scope</th>
              <th className="px-5 py-3">Previous Hash (H_prev)</th>
              <th className="px-5 py-3">Record Hash (H_rec)</th>
              <th className="px-5 py-3">Timestamp</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
            {entries.map((entry) => (
              <tr key={entry.id} className="hover:bg-slate-850/60 transition-colors">
                <td className="px-5 py-3.5 font-bold text-emerald-400">
                  #{entry.sequence_number}
                </td>
                <td className="px-5 py-3.5">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      entry.operation === "INSERT"
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                        : entry.operation === "STATUS_CHANGE"
                        ? "bg-purple-500/10 text-purple-400 border border-purple-500/30"
                        : "bg-blue-500/10 text-blue-400 border border-blue-500/30"
                    }`}
                  >
                    {entry.operation}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-slate-300">
                  <div className="text-[11px] font-semibold text-slate-200">
                    {entry.entity_type}
                  </div>
                  <div className="text-[9px] text-slate-500">{entry.entity_id}</div>
                </td>
                <td className="px-5 py-3.5">
                  <button
                    onClick={() => handleCopy(entry.prev_hash)}
                    className="group flex items-center gap-1.5 text-[11px] text-slate-400 hover:text-slate-200 bg-slate-950 px-2 py-1 rounded border border-slate-800"
                    title="Click to copy SHA-256 hash"
                  >
                    <span>{entry.prev_hash.slice(0, 14)}...</span>
                    {copiedHash === entry.prev_hash ? (
                      <Check className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <Copy className="w-3 h-3 text-slate-600 group-hover:text-slate-400" />
                    )}
                  </button>
                </td>
                <td className="px-5 py-3.5">
                  <button
                    onClick={() => handleCopy(entry.record_hash)}
                    className="group flex items-center gap-1.5 text-[11px] text-emerald-400 hover:text-emerald-300 bg-emerald-950/20 px-2 py-1 rounded border border-emerald-900/40"
                    title="Click to copy SHA-256 hash"
                  >
                    <span>{entry.record_hash.slice(0, 14)}...</span>
                    {copiedHash === entry.record_hash ? (
                      <Check className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <Copy className="w-3 h-3 text-emerald-600 group-hover:text-emerald-400" />
                    )}
                  </button>
                </td>
                <td className="px-5 py-3.5 text-[11px] text-slate-400 whitespace-nowrap">
                  {formatDate(entry.created_at)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
