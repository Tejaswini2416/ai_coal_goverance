"use client";

import React from "react";
import { ScheduleBoard } from "@/lib/../components/schedules/schedule-board";
import { CalendarDays } from "lucide-react";
import { useAuthStore } from "@/lib/store/auth-store";

export default function SchedulesPage() {
  const { activeMineName } = useAuthStore();

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-emerald-400" />
            <h1 className="text-xl font-bold text-slate-100">
              Inspector Scheduling & Mandatory Audit Board
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Automated statutory inspection assignments, due date tracking & Level-1 ministry escalation for{" "}
            <strong className="text-emerald-300">{activeMineName}</strong>.
          </p>
        </div>
      </div>

      {/* Main Schedule Board */}
      <ScheduleBoard />
    </div>
  );
}
