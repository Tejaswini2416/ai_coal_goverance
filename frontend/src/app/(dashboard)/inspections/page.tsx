"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { fetchInspections } from "@/lib/api/inspections";
import { downloadInspectionDossierPdf } from "@/lib/api/reports";
import { offlineDb, PendingInspection } from "@/lib/db/offline-db";
import { useAuthStore } from "@/lib/store/auth-store";
import { Inspection, LocationType } from "@/lib/types/domain";
import { formatDate } from "@/lib/utils/dates";
import {
  ClipboardCheck,
  Plus,
  Compass,
  HardHat,
  ShieldAlert,
  CheckCircle,
  CloudUpload,
  ArrowRight,
  FileDown,
} from "lucide-react";

export default function InspectionsPage() {
  const { activeMineSiteId, activeMineName, userRole } = useAuthStore();
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [pendingLocal, setPendingLocal] = useState<PendingInspection[]>([]);

  useEffect(() => {
    fetchInspections(activeMineSiteId).then(setInspections);
    offlineDb.pending_inspections
      .where("is_synced")
      .equals(0)
      .toArray()
      .then(setPendingLocal);
  }, [activeMineSiteId]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5 text-emerald-400" />
            <h1 className="text-xl font-bold text-slate-100">
              Statutory Field Inspections & Audit Logs
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Surface GPS & Underground Seam checkpoints for <strong className="text-emerald-300">{activeMineName}</strong>.
          </p>
        </div>

        {(!userRole || [
          "COLLIERY_MANAGER",
          "AREA_ADMIN",
          "DGMS_INSPECTOR",
          "MINISTRY_AUDITOR",
          "REGULATORY_OFFICER",
        ].includes(userRole)) && (
          <Link
            href="/inspections/new"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-950 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>New Field Inspection</span>
          </Link>
        )}
      </div>

      {/* Pending Offline Records Alert */}
      {pendingLocal.length > 0 && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-xs text-amber-300 shadow-md">
          <div className="flex items-center gap-2.5">
            <CloudUpload className="w-5 h-5 text-amber-400 shrink-0 animate-bounce" />
            <div>
              <strong className="font-bold text-amber-400">Offline Queue:</strong>{" "}
              {pendingLocal.length} inspection(s) stored locally in IndexedDB pending network sync.
            </div>
          </div>
          <span className="font-mono text-[11px] bg-amber-950 px-2.5 py-1 rounded border border-amber-800 font-semibold">
            Auto-Sync Ready
          </span>
        </div>
      )}

      {/* Inspections Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-800">
              <tr>
                <th className="px-5 py-3">Inspection Title</th>
                <th className="px-5 py-3">Location Mode</th>
                <th className="px-5 py-3">Check / Coordinates</th>
                <th className="px-5 py-3">Geofence Status</th>
                <th className="px-5 py-3">Inspection Date</th>
                <th className="px-5 py-3">Sync State</th>
                <th className="px-5 py-3 text-right">Dossier</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300 font-medium">
              {/* Local Pending First */}
              {pendingLocal.map((local) => (
                <tr key={local.id} className="bg-amber-500/5 hover:bg-amber-500/10 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="font-bold text-slate-100">{local.title}</div>
                    <div className="text-[11px] text-slate-400 line-clamp-1">{local.description}</div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                      {local.location_type === LocationType.SURFACE_GPS ? (
                        <><Compass className="w-3 h-3 text-emerald-400" /> Surface GPS</>
                      ) : (
                        <><HardHat className="w-3 h-3 text-amber-400" /> Underground</>
                      )}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 font-mono text-[11px] text-slate-400">
                    {local.gps_location || local.station_id || "-"}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                      Pending Geo Validation
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-slate-400 font-mono text-[11px]">
                    {formatDate(local.inspection_date)}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                      <CloudUpload className="w-3 h-3" /> Offline (Local)
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <span className="text-[10px] text-slate-500 italic">Sync First</span>
                  </td>
                </tr>
              ))}

              {/* Server Synced Records */}
              {inspections.map((insp) => (
                <tr key={insp.id} className="hover:bg-slate-850/60 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="font-bold text-slate-100">{insp.title}</div>
                    <div className="text-[11px] text-slate-400 line-clamp-1">{insp.description}</div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950 text-slate-300 border border-slate-800">
                      {insp.location_type === LocationType.SURFACE_GPS ? (
                        <><Compass className="w-3 h-3 text-emerald-400" /> Surface GPS</>
                      ) : (
                        <><HardHat className="w-3 h-3 text-amber-400" /> Underground</>
                      )}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 font-mono text-[11px] text-slate-300">
                    {insp.gps_location || insp.station_id || "-"}
                  </td>
                  <td className="px-5 py-3.5">
                    {insp.is_geofence_breached ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30">
                        <ShieldAlert className="w-3 h-3" /> BREACH DETECTED
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                        <CheckCircle className="w-3 h-3" /> VERIFIED IN LEASE
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-slate-400 font-mono text-[11px]">
                    {formatDate(insp.inspection_date)}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <CheckCircle className="w-3 h-3" /> Server Synced (v{insp.version})
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <button
                      onClick={() => downloadInspectionDossierPdf(insp.id, insp.title)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-emerald-500 hover:text-slate-950 text-slate-300 font-semibold text-[11px] border border-slate-700 transition-all shadow-sm active:scale-95"
                      title="Download Official Statutory PDF Dossier"
                    >
                      <FileDown className="w-3 h-3" />
                      <span>PDF</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
