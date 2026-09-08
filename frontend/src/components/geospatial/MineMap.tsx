"use client";

import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Polygon, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MOCK_TELANGANA_MINES, TelanganaMine } from "@/lib/api/tenants";
import { useAuthStore } from "@/lib/store/auth-store";
import {
  Layers,
  Satellite,
  Mountain,
  Compass,
  MapPin,
  Flame,
  ShieldCheck,
  AlertTriangle,
  HardHat,
  Truck,
  ExternalLink,
  ChevronRight,
  Radio,
} from "lucide-react";

// Custom Leaflet Icons for Opencast 🚜 and Underground ⛏️
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
             <div class="w-9 h-9 rounded-2xl ${bgClass} ${ringClass} shadow-2xl flex items-center justify-center text-sm font-black select-none">
               ${symbol}
             </div>
           </div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -20],
  });
};

// Component to dynamically fit bounds across all Telangana coalfields
function MapBoundsManager({
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
      map.fitBounds(bounds, { padding: [60, 60], maxZoom: 13 });
    }
  }, [selectedMine, mines, map]);

  return null;
}

interface MineMapProps {
  mines?: TelanganaMine[];
  onSelectMine?: (mine: TelanganaMine) => void;
  className?: string;
}

export function MineMap({
  mines = MOCK_TELANGANA_MINES,
  onSelectMine,
  className = "w-full h-[540px]",
}: MineMapProps) {
  const { activeMineSiteId, setActiveMine } = useAuthStore();
  const [mapView, setMapView] = useState<"satellite" | "dark" | "streets">("satellite");
  const [selectedMine, setSelectedMine] = useState<TelanganaMine | null>(
    mines.find((m) => m.id === activeMineSiteId) || mines[0] || null
  );

  // Godavari Valley Coalfield maximum bounding box
  const godavariBounds: [[number, number], [number, number]] = [
    [17.0, 78.5],
    [19.8, 81.2],
  ];

  const handleMineClick = (mine: TelanganaMine) => {
    setSelectedMine(mine);
    setActiveMine(mine.id, mine.name, mine.area);
    if (onSelectMine) {
      onSelectMine(mine);
    }
  };

  return (
    <div className={`relative rounded-3xl overflow-hidden border border-slate-800 shadow-2xl bg-slate-950 ${className}`}>
      {/* Top Controls: Tile Layer Switcher */}
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
          onClick={() => setMapView("streets")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all ${
            mapView === "streets"
              ? "bg-purple-600 text-white shadow-md shadow-purple-950"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
          }`}
        >
          <Compass className="w-3.5 h-3.5" />
          <span>🧭 Streets</span>
        </button>
      </div>

      {/* Top Right: Multi-Site Telangana Quick Selector */}
      <div className="absolute top-4 right-4 z-[1000] bg-slate-950/90 backdrop-blur-md p-3 rounded-2xl border border-slate-800 shadow-2xl text-xs space-y-2 max-w-xs hidden sm:block">
        <div className="flex items-center justify-between text-slate-200 font-bold border-b border-slate-800 pb-1.5">
          <div className="flex items-center gap-1.5 text-purple-400">
            <Layers className="w-4 h-4" />
            <span>Telangana SCCL Mines ({mines.length})</span>
          </div>
          <span className="text-[10px] font-mono text-emerald-400">Godavari Valley</span>
        </div>
        <div className="space-y-1">
          {mines.map((m) => (
            <button
              key={m.id}
              onClick={() => handleMineClick(m)}
              className={`w-full text-left px-2.5 py-1.5 rounded-xl text-[11px] font-medium transition-all flex items-center justify-between ${
                selectedMine?.id === m.id
                  ? "bg-purple-600/30 text-purple-200 border border-purple-500/40"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
              }`}
            >
              <span className="truncate">{m.name.split("—")[0]}</span>
              <span className="text-[9px] font-mono uppercase text-slate-500 shrink-0 ml-1">
                {m.mine_type === "OPENCAST" ? "OCP" : "UG"}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Map Container */}
      <MapContainer
        center={[18.7562, 79.5134]}
        zoom={10}
        maxBounds={godavariBounds}
        minZoom={8}
        scrollWheelZoom={true}
        className="w-full h-full z-10"
      >
        <MapBoundsManager mines={mines} selectedMine={selectedMine} />

        {/* Dynamic Tile Layer */}
        {mapView === "satellite" && (
          <TileLayer
            attribution='&copy; <a href="https://www.esri.com/">Esri World Imagery</a>'
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            maxZoom={18}
          />
        )}
        {mapView === "dark" && (
          <TileLayer
            attribution='&copy; <a href="https://carto.com/">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            maxZoom={19}
          />
        )}
        {mapView === "streets" && (
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
            maxZoom={19}
          />
        )}

        {/* Render GeoJSON boundary polygons for all 4 mines */}
        {mines.map((mine) => {
          if (!mine.geojson_boundary || !mine.geojson_boundary.coordinates?.[0]) return null;
          // Leaflet Polygon expects [lat, lng]
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
                click: () => handleMineClick(mine),
              }}
            />
          );
        })}

        {/* Render 4 Colliery Markers */}
        {mines.map((mine) => {
          const isSelected = selectedMine?.id === mine.id;
          const isOpencast = mine.mine_type === "OPENCAST";

          return (
            <Marker
              key={`marker-${mine.id}`}
              position={mine.center_lat_lng}
              icon={createMineIcon(mine.mine_type, isSelected)}
              eventHandlers={{
                click: () => handleMineClick(mine),
              }}
            >
              <Popup>
                <div className="p-2 space-y-2 text-xs font-mono max-w-[270px]">
                  {/* Header Badge */}
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

                  {/* Title & Info */}
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm leading-tight">
                      {mine.name}
                    </h4>
                    <p className="text-[11px] text-slate-600 mt-0.5 font-sans">
                      {mine.area}
                    </p>
                  </div>

                  {/* Specs Grid */}
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
                    {mine.stations && mine.stations.length > 0 && (
                      <div className="flex justify-between">
                        <span className="text-slate-500">Stations:</span>
                        <strong className="text-purple-700 font-mono">{mine.stations.length} Registered</strong>
                      </div>
                    )}
                  </div>

                  {/* Action Button */}
                  <button
                    onClick={() => handleMineClick(mine)}
                    className="w-full py-1.5 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <span>Select &amp; Focus Colliery</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Floating Bottom Status Bar */}
      <div className="absolute bottom-4 left-4 z-[1000] bg-slate-950/90 backdrop-blur-md px-4 py-2 rounded-2xl border border-slate-800 shadow-xl flex items-center gap-4 text-xs font-mono">
        <div className="flex items-center gap-2">
          <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
          <span className="text-slate-300">
            Active: <strong className="text-purple-300">{selectedMine?.name || "All Telangana Sites"}</strong>
          </span>
        </div>
      </div>
    </div>
  );
}
