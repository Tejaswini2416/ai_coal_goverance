"use client";

import React, { useState } from "react";
import { ViolationCAPA, CAPAState, CAPA_STATE_LABELS, UserRole } from "@/lib/types/domain";
import { useAuthStore } from "@/lib/store/auth-store";
import { transitionCAPA } from "@/lib/api/violations";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  FileText,
  Paperclip,
  UploadCloud,
  ShieldCheck,
  UserCheck,
  RotateCcw,
} from "lucide-react";

interface CAPAKanbanBoardProps {
  initialCapas: ViolationCAPA[];
}

const COLUMNS: CAPAState[] = [
  CAPAState.REPORTED,
  CAPAState.NOTICE_ISSUED,
  CAPAState.ASSIGNED,
  CAPAState.RECTIFICATION_SUBMITTED,
  CAPAState.VERIFIED,
  CAPAState.CLOSED,
];

export function CAPAKanbanBoard({ initialCapas }: CAPAKanbanBoardProps) {
  const [capas, setCapas] = useState<ViolationCAPA[]>(initialCapas);
  const { userRole, activeMineSiteId } = useAuthStore();
  const [isTransitioning, setIsTransitioning] = useState<string | null>(null);

  // RBAC checks for state transitions
  const canVerify =
    userRole === UserRole.DGMS_INSPECTOR ||
    userRole === UserRole.COLLIERY_MANAGER ||
    userRole === UserRole.MINISTRY_AUDITOR;

  const canReopen = userRole === UserRole.MINISTRY_AUDITOR;

  const getNextState = (current: CAPAState): CAPAState | null => {
    switch (current) {
      case CAPAState.REPORTED:
        return CAPAState.NOTICE_ISSUED;
      case CAPAState.NOTICE_ISSUED:
        return CAPAState.ASSIGNED;
      case CAPAState.ASSIGNED:
        return CAPAState.RECTIFICATION_SUBMITTED;
      case CAPAState.RECTIFICATION_SUBMITTED:
        return CAPAState.VERIFIED;
      case CAPAState.VERIFIED:
        return CAPAState.CLOSED;
      default:
        return null;
    }
  };

  const handleAdvance = async (capa: ViolationCAPA) => {
    const next = getNextState(capa.capa_state);
    if (!next) return;

    if (next === CAPAState.VERIFIED && !canVerify) {
      alert("Role Restriction: Only DGMS Inspector, Colliery Manager, or Ministry Auditor may verify CAPAs.");
      return;
    }

    setIsTransitioning(capa.id);
    try {
      const updated = await transitionCAPA({
        capa_id: capa.id,
        to_state: next,
        mine_site_id: activeMineSiteId,
      });

      setCapas((prev) => prev.map((c) => (c.id === capa.id ? updated : c)));
    } catch (err) {
      console.error("Transition error:", err);
      alert("Failed to advance CAPA status.");
    } finally {
      setIsTransitioning(null);
    }
  };

  const handleReopen = async (capa: ViolationCAPA) => {
    if (!canReopen) {
      alert("Role Restriction: Only Ministry Auditor may reopen closed CAPAs.");
      return;
    }
    setIsTransitioning(capa.id);
    try {
      const updated = await transitionCAPA({
        capa_id: capa.id,
        to_state: CAPAState.REPORTED,
        mine_site_id: activeMineSiteId,
      });
      setCapas((prev) => prev.map((c) => (c.id === capa.id ? updated : c)));
    } catch (err) {
      console.error("Reopen error:", err);
    } finally {
      setIsTransitioning(null);
    }
  };

  return (
    <div className="w-full overflow-x-auto pb-6">
      <div className="grid grid-cols-6 gap-3.5 min-w-[1380px]">
        {COLUMNS.map((columnState) => {
          const items = capas.filter((c) => c.capa_state === columnState);

          return (
            <div
              key={columnState}
              className="flex flex-col bg-slate-900/80 border border-slate-800 rounded-2xl p-3 shadow-xl h-[720px]"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between px-2 py-2 border-b border-slate-800 mb-3">
                <span className="text-xs font-bold text-slate-200 tracking-wide">
                  {CAPA_STATE_LABELS[columnState]}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                  {items.length}
                </span>
              </div>

              {/* Column Cards */}
              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {items.map((capa) => {
                  const nextState = getNextState(capa.capa_state);

                  return (
                    <div
                      key={capa.id}
                      className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/90 hover:border-slate-700 transition-all shadow-md space-y-3"
                    >
                      <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                        <span className="text-emerald-400 font-semibold">{capa.rule_id}</span>
                        <span>v{capa.version}</span>
                      </div>

                      <p className="text-xs font-medium text-slate-200 line-clamp-3 leading-snug">
                        {capa.description}
                      </p>

                      {/* Evidence Attachment Badges */}
                      {capa.evidence_urls && capa.evidence_urls.length > 0 && (
                        <div className="flex items-center gap-1.5 text-[10px] font-mono text-cyan-400 bg-cyan-950/40 px-2 py-1 rounded border border-cyan-900/60">
                          <Paperclip className="w-3 h-3" />
                          <span>{capa.evidence_urls.length} S3 Evidence Photo(s)</span>
                        </div>
                      )}

                      {/* Metadata Details */}
                      <div className="pt-2 border-t border-slate-800/80 text-[10px] text-slate-400 space-y-1">
                        {capa.assigned_to && (
                          <div className="flex items-center gap-1">
                            <UserCheck className="w-3 h-3 text-blue-400" />
                            <span>Assigned: {capa.assigned_to}</span>
                          </div>
                        )}
                        {capa.verified_by && (
                          <div className="flex items-center gap-1 text-teal-300">
                            <ShieldCheck className="w-3 h-3 text-teal-400" />
                            <span>Verified: {capa.verified_by}</span>
                          </div>
                        )}
                      </div>

                      {/* Transition Button */}
                      <div className="pt-1">
                        {nextState && (
                          <button
                            onClick={() => handleAdvance(capa)}
                            disabled={isTransitioning === capa.id}
                            className={`w-full py-1.5 px-2 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm ${
                              nextState === CAPAState.VERIFIED
                                ? "bg-teal-500/20 text-teal-300 hover:bg-teal-500/30 border border-teal-500/30"
                                : "bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/30"
                            }`}
                          >
                            <span>Move to {CAPA_STATE_LABELS[nextState].split(". ")[1]}</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        )}

                        {capa.capa_state === CAPAState.CLOSED && canReopen && (
                          <button
                            onClick={() => handleReopen(capa)}
                            className="w-full py-1.5 px-2 rounded-lg text-[11px] font-semibold text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 flex items-center justify-center gap-1"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>Re-open to Reported</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}

                {items.length === 0 && (
                  <div className="h-32 flex items-center justify-center text-[11px] text-slate-600 font-mono italic">
                    No violations in this stage
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
