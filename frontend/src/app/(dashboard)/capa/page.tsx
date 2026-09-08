"use client";

import React, { useEffect, useState } from "react";
import { CAPAKanbanBoard } from "@/components/capa/capa-kanban-board";
import { fetchCAPAs } from "@/lib/api/violations";
import { useAuthStore } from "@/lib/store/auth-store";
import { ViolationCAPA } from "@/lib/types/domain";
import { KanbanSquare, ShieldAlert, CheckCircle2, Filter } from "lucide-react";

export default function CAPAPage() {
  const { activeMineSiteId, activeMineName } = useAuthStore();
  const [capas, setCapas] = useState<ViolationCAPA[]>([]);

  useEffect(() => {
    fetchCAPAs(activeMineSiteId).then(setCapas);
  }, [activeMineSiteId]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <KanbanSquare className="w-5 h-5 text-emerald-400" />
            <h1 className="text-xl font-bold text-slate-100">
              Closed-Loop CAPA Statutory Workflow Board
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Hazard mitigation pipeline: <strong className="text-slate-300">Reported → Notice Issued → Assigned → Rectification → Verified → Closed</strong> for <strong className="text-emerald-300">{activeMineName}</strong>.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
          <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
          <span>DGMS Verification Role-Gated</span>
        </div>
      </div>

      {/* Kanban Board Component */}
      <CAPAKanbanBoard initialCapas={capas} />
    </div>
  );
}
