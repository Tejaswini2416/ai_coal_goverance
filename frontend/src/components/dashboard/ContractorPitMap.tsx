"use client";

import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Polygon, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MOCK_TELANGANA_MINES, TelanganaMine } from "@/lib/api/tenants";
import { useAuthStore } from "@/lib/store/auth-store";
import {
  Truck,
  ShieldCheck,
  AlertTriangle,
  Flame,
  Gauge,
  Layers,
  MapPin,
  Satellite,
  Mountain,
  Compass,
  Radio,
  ChevronRight,
  Maximize2,
} from "lucide-react";

// Vehicle Types & State
interface FleetVehicle {
  id: string;
  code: string;
  type: "DUMPER" | "SHOVEL" | "EXCAVATOR" | "WATER_TANKER";
  operator: string;
  lat: number;
  lng: number;
  speed_kmh: number;
  speed_limit_kmh: number;
  fitness_valid_until: string;
  status: "ACTIVE" | "SPEEDING" | "MAINTENANCE_DUE";
  tonnage_carried_t: number;
}

// Custom Leaflet DivIcon for Mines
const createMineIcon = (mineType: string, isSelected: boolean) => {
  const isOpencast = mineType === "OPENCAST";
  const bgClass = isOpencast
    ? "bg-gradient-to-tr from-amber-600 to-yellow-400 text-slate-950 shadow-amber-950/80"
    : "bg-gradient-to-tr from-sky-600 to-indigo-500 text-white shadow-sky-950/80";

  const ringClass = isSelected
    ? "ring-4 ring-purple-400 ring-offset-2 ring-offset-slate-950 scale-125"
    : "ring-2 ring-white/80 hover:scale-110";

  const symbol = isOpencast ? "🚜" : "⛏️";

  return L.divIcon({
    className: "custom-telangana-mine-marker",
    html: `<div class="relative flex items-center justify-center cursor-pointer transition-transform duration-300">
             <div class="w-8 h-8 rounded-2xl ${bgClass} ${ringClass} shadow-2xl flex items-center justify-center text-xs font-black select-none">
               ${symbol}
             </div>
           </div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -18],
  });
};

// Custom Leaflet DivIcons for Fleet vehicles
const createVehicleIcon = (type: string, status: string) => {
  const isSpeeding = status === "SPEEDING";
  const isMaint = status === "MAINTENANCE_DUE";

  const colorClass = isSpeeding
    ? "bg-rose-600 text-white animate-bounce shadow-rose-900/80"
    : isMaint
    ? "bg-amber-500 text-slate-950 shadow-amber-900/80"
    : "bg-purple-600 text-white shadow-purple-900/80";

  const letter = type === "DUMPER" ? "D" : type === "SHOVEL" ? "S" : type === "EXCAVATOR" ? "E" : "T";

  return L.divIcon({
    className: "custom-fleet-marker",
    html: `<div class="relative flex items-center justify-center">
             ${isSpeeding ? '<div class="absolute w-8 h-8 rounded-full bg-rose-500/60 animate-ping"></div>' : ''}
             <div class="w-6 h-6 rounded-xl ${colorClass} border border-white shadow-2xl flex items-center justify-center font-black text-[11px] font-mono">
               ${letter}
             </div>
           </div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -14],
  });
};

// Active Bench Excavation Zone in RG-OCP 3
const ACTIVE_BENCH_ZONE: [number, number][] = [
  [18.7460, 79.5030],
  [18.7660, 79.5030],
  [18.7660, 79.5230],
  [18.7460, 79.5230],
  [18.7460, 79.5030],
];

// Restricted Blasting Safety Perimeter (Red)
const BLASTING_SAFETY_PERIMETER: [number, number][] = [
  [18.7620, 79.5100],
  [18.7720, 79.5100],
  [18.7720, 79.5280],
  [18.7620, 79.5280],
  [18.7620, 79.5100],
];

const SAMPLE_FLEET: FleetVehicle[] = [
  {
    id: "flt-1",
    code: "AP-36-DM-8812",
    type: "DUMPER",
    operator: "K. Ramesh Kumar (SCCL Badge #4021)",
    lat: 18.7540,
    lng: 79.5120,
    speed_kmh: 34,
    speed_limit_kmh: 30,
    fitness_valid_until: "2026-12-15",
    status: "SPEEDING",
    tonnage_carried_t: 85,
  },
  {
    id: "flt-2",
    code: "TS-09-SH-2201",
    type: "SHOVEL",
    operator: "M. Bhaskar Rao (Lead Operator)",
    lat: 18.7565,
    lng: 79.5080,
    speed_kmh: 0,
    speed_limit_kmh: 15,
    fitness_valid_until: "2026-11-20",
    status: "ACTIVE",
    tonnage_carried_t: 0,
  },
  {
    id: "flt-3",
    code: "TS-22-EX-0870",
    type: "EXCAVATOR",
    operator: "Ch. Srinivas",
    lat: 18.7510,
    lng: 79.5180,
    speed_kmh: 8,
    speed_limit_kmh: 15,
    fitness_valid_until: "2026-09-30",
    status: "ACTIVE",
    tonnage_carried_t: 45,
  },
  {
    id: "flt-4",
    code: "AP-36-DM-9104",
    type: "DUMPER",
    operator: "S. Anjaiah",
    lat: 18.7590,
    lng: 79.5210,
    speed_kmh: 22,
    speed_limit_kmh: 30,
    fitness_valid_until: "2026-08-10",
    status: "MAINTENANCE_DUE",
    tonnage_carried_t: 90,
  },
];

function MapBoundsController({
  mines,
  selectedMine,
}: {
  mines: TelanganaMine[];
  selectedMine: TelanganaMine | null;
}) {
  const map = useMap();

  useEffect(() => {
    if (selectedMine) {
      map.flyTo(selectedMine.center_lat_lng, 13, { duration: 1.2 });
    } else if (mines.length > 0) {
      const latLngs = mines.map((m) => m.center_lat_lng);
      const bounds = L.latLngBounds(latLngs);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 12 });
    }
  }, [selectedMine, mines, map]);

  return null;
}

export function ContractorPitMap() {
  const { activeMineSiteId, setActiveMine } = useAuthStore();
  const [mapView, setMapView] = useState<"satellite" | "dark" | "streets">("satellite");
  const [mines] = useState<TelanganaMine[]>(MOCK_TELANGANA_MINES);
  const [selectedMine, setSelectedMine] = useState<TelanganaMine | null>(
    mines.find((m) => m.id === activeMineSiteId) || mines[0]
  );
  const [selectedVehicle, setSelectedVehicle] = useState<FleetVehicle | null>(null);

  const godavariBounds: [[number, number], [number, number]] = [
    [17.0, 78.5],
    [19.8, 81.2],
  ];

  const handleSelectMine = (m: TelanganaMine) => {
    setSelectedMine(m);
    setActiveMine(m.id, m.name, m.area);
  };

  const handleResetView = () => {
    setSelectedMine(null);
  };

  return (
    <div className="relative w-full h-[540px] rounded-3xl overflow-hidden border border-slate-800 shadow-2xl bg-slate-950">
      {/* Top Left Switchers */}
      <div className="absolute top-4 left-4 z-[1000] bg-slate-950/90 backdrop-blur-md p-1.5 rounded-2xl border border-slate-800 shadow-xl flex items-center gap-1 text-xs">
        <button
          onClick={() => setMapView("satellite")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all ${
            mapView === "satellite"
              ? "bg-purple-600 text-white shadow-md shadow-purple-950"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
          }`}
        >
          <Satellite className="w-3.5 h-3.5" />
          <span>🛰️ Satellite</span>
        </button>

        <button
          onClick={() => setMapView("dark")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all ${
            mapView === "dark"
              ? "bg-purple-600 text-white shadow-md shadow-purple-950"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
          }`}
        >
          <Mountain className="w-3.5 h-3.5" />
          <span>🗺️ Dark Vector</span>
        </button>

        <button
          onClick={handleResetView}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl font-bold text-slate-300 hover:text-white hover:bg-slate-800 border-l border-slate-800 ml-1"
          title="Fit View across all 4 Telangana Mines"
        >
          <Maximize2 className="w-3.5 h-3.5" />
          <span>Fit All</span>
        </button>
      </div>

      {/* Top Right Quick Colliery Badges */}
      <div className="absolute top-4 right-4 z-[1000] bg-slate-950/90 backdrop-blur-md p-3 rounded-2xl border border-slate-800 shadow-2xl text-xs space-y-2 max-w-xs hidden sm:block">
        <div className="flex items-center justify-between text-slate-200 font-bold border-b border-slate-800 pb-1.5">
          <div className="flex items-center gap-1.5 text-purple-400">
            <Layers className="w-4 h-4" />
            <span>Telangana SCCL Collieries</span>
          </div>
          <span className="text-[10px] font-mono text-emerald-400">4 Active</span>
        </div>
        <div className="space-y-1">
          {mines.map((m) => (
            <button
              key={m.id}
              onClick={() => handleSelectMine(m)}
              className={`w-full text-left px-2.5 py-1.5 rounded-xl text-[11px] font-medium transition-all flex items-center justify-between ${
                selectedMine?.id === m.id
                  ? "bg-purple-600/30 text-purple-200 border border-purple-500/40"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
              }`}
            >
              <span className="truncate">{m.name.split("—")[0]}</span>
              <span className="text-[9px] font-mono uppercase text-slate-500 shrink-0 ml-1">
                {m.mine_type === "OPENCAST" ? "🚜 OCP" : "⛏️ UG"}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Leaflet Map */}
      <MapContainer
        center={[18.7562, 79.5134]}
        zoom={11}
        maxBounds={godavariBounds}
        minZoom={8}
        scrollWheelZoom={true}
        className="w-full h-full z-10"
      >
        <MapBoundsController mines={mines} selectedMine={selectedMine} />

        {/* Dynamic Tile Layer */}
        {mapView === "satellite" ? (
          <TileLayer
            attribution='&copy; <a href="https://www.esri.com/">Esri World Imagery</a>'
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            maxZoom={18}
          />
        ) : (
          <TileLayer
            attribution='&copy; <a href="https://carto.com/">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            maxZoom={19}
          />
        )}

        {/* Draw GeoJSON polygons for all 4 mines */}
        {mines.map((mine) => {
          if (!mine.geojson_boundary || !mine.geojson_boundary.coordinates?.[0]) return null;
          const polygonCoords = mine.geojson_boundary.coordinates[0].map(
            ([lng, lat]: [number, number]) => [lat, lng] as [number, number]
          );

          const isSelected = selectedMine?.id === mine.id;
          const isOpencast = mine.mine_type === "OPENCAST";

          return (
            <Polygon
              key={`poly-${mine.id}`}
              positions={polygonCoords}
              pathOptions={{
                color: isSelected ? "#a855f7" : isOpencast ? "#f59e0b" : "#38bdf8",
                fillColor: isOpencast ? "#d97706" : "#0284c7",
                fillOpacity: isSelected ? 0.25 : 0.12,
                weight: isSelected ? 3.5 : 2,
                dashArray: isOpencast ? "4, 4" : "6, 6",
              }}
              eventHandlers={{
                click: () => handleSelectMine(mine),
              }}
            />
          );
        })}

        {/* Special Pit Zones if viewing Ramagundam RG-OCP 3 */}
        {selectedMine?.name.includes("Ramagundam") && (
          <>
            {/* Active Extraction Bench */}
            <Polygon
              positions={ACTIVE_BENCH_ZONE}
              pathOptions={{
                color: "#10b981",
                fillColor: "#10b981",
                fillOpacity: mapView === "satellite" ? 0.25 : 0.18,
                weight: 2.5,
              }}
            >
              <Popup>
                <div className="text-xs font-mono p-1">
                  <strong className="text-emerald-600 block text-sm">Active Overburden &amp; Coal Bench</strong>
                  <span>Permitted Excavation Zone • Speed Limit: 30 km/h</span>
                </div>
              </Popup>
            </Polygon>

            {/* Restricted Blasting Safety Perimeter */}
            <Polygon
              positions={BLASTING_SAFETY_PERIMETER}
              pathOptions={{
                color: "#f43f5e",
                fillColor: "#f43f5e",
                fillOpacity: 0.35,
                weight: 3,
                dashArray: "6, 6",
              }}
            >
              <Popup>
                <div className="text-xs font-mono p-1 text-rose-600">
                  <strong className="block text-sm">🚨 Restricted Blasting Safety Perimeter</strong>
                  <span>CMR 2017 Reg 164 • Heavy Machinery Prohibited During Blasting Window</span>
                </div>
              </Popup>
            </Polygon>
          </>
        )}

        {/* 4 Telangana Mine Markers */}
        {mines.map((mine) => {
          const isSelected = selectedMine?.id === mine.id;
          const isOpencast = mine.mine_type === "OPENCAST";

          return (
            <Marker
              key={`mine-marker-${mine.id}`}
              position={mine.center_lat_lng}
              icon={createMineIcon(mine.mine_type, isSelected)}
              eventHandlers={{
                click: () => handleSelectMine(mine),
              }}
            >
              <Popup>
                <div className="p-2 space-y-2 text-xs font-mono max-w-[270px]">
                  <div className="flex items-center justify-between border-b pb-1.5 gap-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        isOpencast ? "bg-amber-100 text-amber-800" : "bg-sky-100 text-sky-800"
                      }`}
                    >
                      {mine.mine_type} MINING LEASE
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {mine.district}, TS
                    </span>
                  </div>

                  <div>
                    <h4 className="font-bold text-slate-900 text-sm leading-tight">
                      {mine.name}
                    </h4>
                    <p className="text-[11px] text-slate-600 mt-0.5 font-sans">
                      {mine.area}
                    </p>
                  </div>

                  <div className="bg-slate-100 p-2 rounded-xl text-[11px] space-y-1 text-slate-700">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Lease No:</span>
                      <strong className="font-mono text-slate-900">{mine.lease_number || "ML-SCCL-2024"}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Coordinates:</span>
                      <strong className="text-emerald-700">
                        {mine.center_lat_lng[0].toFixed(4)}°N, {mine.center_lat_lng[1].toFixed(4)}°E
                      </strong>
                    </div>
                  </div>

                  <button
                    onClick={() => handleSelectMine(mine)}
                    className="w-full py-1.5 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <span>Focus Pit Cast &amp; Fleet</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* Live Fleet Vehicle Markers (if viewing Ramagundam RG-OCP 3) */}
        {(!selectedMine || selectedMine.name.includes("Ramagundam")) &&
          SAMPLE_FLEET.map((veh) => (
            <Marker
              key={veh.id}
              position={[veh.lat, veh.lng]}
              icon={createVehicleIcon(veh.type, veh.status)}
              eventHandlers={{
                click: () => setSelectedVehicle(veh),
              }}
            >
              <Popup>
                <div className="p-2 space-y-2 text-xs font-mono max-w-[240px]">
                  <div className="flex items-center justify-between border-b pb-1">
                    <span className="font-bold text-slate-900">{veh.code}</span>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        veh.status === "SPEEDING"
                          ? "bg-rose-100 text-rose-700 font-black"
                          : veh.status === "MAINTENANCE_DUE"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-emerald-100 text-emerald-700"
                      }`}
                    >
                      {veh.status}
                    </span>
                  </div>

                  <div className="space-y-1 text-[11px] text-slate-700">
                    <div><strong>Operator:</strong> {veh.operator}</div>
                    <div>
                      <strong>Speed:</strong>{" "}
                      <span className={veh.speed_kmh > veh.speed_limit_kmh ? "text-rose-600 font-bold" : ""}>
                        {veh.speed_kmh} km/h (Limit: {veh.speed_limit_kmh})
                      </span>
                    </div>
                    <div><strong>Payload:</strong> {veh.tonnage_carried_t} Tonnes</div>
                    <div><strong>Fitness Valid:</strong> {veh.fitness_valid_until}</div>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
      </MapContainer>

      {/* Floating Bottom Status Bar */}
      <div className="absolute bottom-4 left-4 z-[1000] bg-slate-950/90 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-slate-800 shadow-xl flex items-center gap-4 text-xs font-mono">
        <div className="flex items-center gap-2">
          <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
          <span className="text-slate-300">
            Colliery: <strong className="text-purple-300">{selectedMine?.name || "All 4 Telangana Sites"}</strong>
          </span>
        </div>
        <div className="flex items-center gap-2 hidden sm:flex">
          <Gauge className="w-4 h-4 text-purple-400" />
          <span className="text-slate-300">
            Center: <strong className="text-purple-300">{selectedMine ? `${selectedMine.center_lat_lng[0]}° N, ${selectedMine.center_lat_lng[1]}° E` : "Godavari Valley"}</strong>
          </span>
        </div>
      </div>
    </div>
  );
}
