"use client";

import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/lib/store/auth-store";
import { useTenantStore } from "@/lib/store/tenant-store";
import { fetchTelanganaMines, TelanganaMine } from "@/lib/api/tenants";
import { MapPin, ChevronDown, Check, Building2, Layers, HardHat } from "lucide-react";

export function MineSelector() {
  const [mounted, setMounted] = useState(false);
  const { setActiveTenant, activeMineName } = useAuthStore();
  const { selectedMine, selectedMineId, selectMine, setMinesList } = useTenantStore();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { data: mines = [], isLoading } = useQuery({
    queryKey: ["telangana-mines-list"],
    queryFn: async () => {
      const data = await fetchTelanganaMines();
      if (data && data.length > 0) {
        setMinesList(data);
      }
      return data;
    },
    staleTime: 60000,
  });

  const handleSelect = (mine: TelanganaMine) => {
    let path = "MOC.SCCL.RAMAGUNDAM_2.RG_OCP3";
    if (mine.id === "11111111-1111-4111-a111-111111111111") {
      path = "MOC.SCCL.RAMAGUNDAM_1.GDK_11A";
    } else if (mine.id === "22222222-2222-4222-a222-222222222222") {
      path = "MOC.SCCL.RAMAGUNDAM_2.RG_OCP3";
    } else if (mine.id === "33333333-3333-4333-a333-333333333333") {
      path = "MOC.SCCL.KOTHAGUDEM.KOCP";
    } else if (mine.id === "44444444-4444-4444-a444-444444444444") {
      path = "MOC.SCCL.MANDAMARRI.KASIPET_UG";
    }

    selectMine(mine);
    setActiveTenant(path, mine.id, mine.name);
    setIsOpen(false);
  };

  const currentMine = selectedMine || mines.find((m) => m.id === selectedMineId) || mines[0];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-700/80 bg-slate-900/90 hover:bg-slate-800 transition-all text-xs shadow-sm text-left"
      >
        <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
        <div className="min-w-0">
          <div className="text-[10px] uppercase font-mono text-emerald-400 font-bold tracking-wider">
            {currentMine?.district || "Telangana"} • SCCL
          </div>
          <div className="text-xs font-bold text-slate-100 truncate max-w-[200px]">
            {mounted
              ? (activeMineName || currentMine?.name || "Godavarikhani No. 11A Incline (SCCL)")
              : "Godavarikhani No. 11A Incline (SCCL)"}
          </div>
        </div>
        <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-1" />
      </button>

      {isOpen && (
        <div className="absolute top-full mt-2 left-0 w-80 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-2 z-50 text-xs animate-in fade-in duration-150">
          <div className="px-3 py-2 border-b border-slate-800 flex items-center justify-between">
            <span className="font-bold text-slate-300 uppercase tracking-wider text-[10px]">
              Telangana Coal Mines (SCCL)
            </span>
            <span className="text-[10px] font-mono text-emerald-400 font-bold">4 Active Sites</span>
          </div>

          <div className="mt-1 space-y-1 max-h-64 overflow-y-auto pr-1">
            {mines.map((m) => {
              const isSelected = m.id === selectedMineId || (selectedMine && m.id === selectedMine.id);

              return (
                <button
                  key={m.id}
                  onClick={() => handleSelect(m)}
                  className={`w-full text-left p-2.5 rounded-xl transition-all flex items-start justify-between gap-2 ${
                    isSelected
                      ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-300"
                      : "hover:bg-slate-800/80 text-slate-300"
                  }`}
                >
                  <div className="space-y-0.5">
                    <div className="font-bold text-xs flex items-center gap-1.5">
                      {m.mine_type === "UNDERGROUND" ? (
                        <Layers className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                      ) : (
                        <Building2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      )}
                      <span>{m.name}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      {m.district}, Telangana • {m.mine_type}
                    </div>
                  </div>

                  {isSelected && <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
