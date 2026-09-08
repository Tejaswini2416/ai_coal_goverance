"use client";

import React, { useEffect, useState, useMemo } from "react";
import { MapContainer, TileLayer, Polygon, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Inspection, LocationType } from "@/lib/types/domain";
import { parsePoint } from "@/lib/utils/coords";
import { TelanganaMine, MOCK_TELANGANA_MINES } from "@/lib/api/tenants";
import { useTenantStore } from "@/lib/store/tenant-store";
import { AlertTriangle, CheckCircle, ShieldAlert, Layers, Satellite, Map as MapIcon, Mountain, Compass, HardHat } from "lucide-react";

// Fix Leaflet's default marker icons in webpack/Next.js
const createCustomIcon = (isBreach: boolean) => {
  return L.divIcon({
    className: "custom-leaflet-marker",
    html: isBreach
      ? `<div class="relative flex items-center justify-center">
           <div class="absolute w-8 h-8 rounded-full bg-rose-500/40 animate-ping"></div>
           <div class="w-4 h-4 rounded-full bg-rose-600 border-2 border-white shadow-lg flex items-center justify-center">
             <div class="w-1.5 h-1.5 rounded-full bg-white"></div>
           </div>
         </div>`
      : `<div class="relative flex items-center justify-center">
           <div class="w-4 h-4 rounded-full bg-emerald-500 border-2 border-white shadow-md flex items-center justify-center">
             <div class="w-1.5 h-1.5 rounded-full bg-white"></div>
           </div>
         </div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
};

const createStationIcon = () => {
  return L.divIcon({
    className: "custom-station-marker",
    html: `<div class="relative flex items-center justify-center">
             <div class="w-6 h-6 rounded-lg bg-purple-600 border-2 border-white shadow-lg flex items-center justify-center text-white text-[9px] font-mono font-bold">
               UG
             </div>
           </div>`,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
  });
};

// Fallback inspections if DB/API is empty
const DEFAULT_MAP_INSPECTIONS: Inspection[] = [
  {
    id: "map-insp-1",
    mine_site_id: "00000000-0000-0000-0000-000000000000",
    inspector_id: "insp-01",
    title: "Haul Road Sector 4 Slope Stability Check",
    description: "Verified berm height and haul road gradient along pit entry.",
    location_type: LocationType.SURFACE_GPS,
    gps_location: "POINT(79.5134 18.7562)",
    is_geofence_breached: false,
    version: 1,
    inspection_date: new Date().toISOString(),
    created_at: new Date().toISOString(),
  },
  {
    id: "map-insp-2",
    mine_site_id: "00000000-0000-0000-0000-000000000000",
    inspector_id: "insp-02",
    title: "Overburden Dumping Perimeter Audit",
    description: "Critical breach detected: Waste dumping observed 140m outside statutory lease boundary!",
    location_type: LocationType.SURFACE_GPS,
    gps_location: "POINT(79.5450 18.7850)",
    is_geofence_breached: true,
    version: 1,
    inspection_date: new Date().toISOString(),
    created_at: new Date().toISOString(),
  },
  {
    id: "map-insp-3",
    mine_site_id: "00000000-0000-0000-0000-000000000000",
    inspector_id: "insp-01",
    title: "Excavation Pit Bench 3 Inspection",
    description: "Face stability and water drainage channels inspected.",
    location_type: LocationType.SURFACE_GPS,
    gps_location: "POINT(79.5180 18.7520)",
    is_geofence_breached: false,
    version: 1,
    inspection_date: new Date().toISOString(),
    created_at: new Date().toISOString(),
  },
];

interface LeaseholdMapProps {
  inspections: Inspection[];
  selectedInspectionId?: string | null;
  onSelectInspection?: (id: string) => void;
  activeMine?: TelanganaMine | null;
}

function MapRecenter({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom(), { animate: true });
  }, [center, map]);
  return null;
}

type MapLayerType = "satellite" | "vector_dark" | "vector_streets" | "terrain";

export function LeaseholdMap({
  inspections,
  selectedInspectionId,
  onSelectInspection,
  activeMine,
}: LeaseholdMapProps) {
  const selectedMineFromStore = useTenantStore((s) => s.selectedMine);
  const currentMine = activeMine || selectedMineFromStore || MOCK_TELANGANA_MINES[0];
  const center: [number, number] = currentMine.center_lat_lng;
  const [activeLayer, setActiveLayer] = useState<MapLayerType>("vector_dark");

  const leaseholdCoords: [number, number][] = useMemo(() => {
    if (currentMine.geojson_boundary?.coordinates?.[0]) {
      return currentMine.geojson_boundary.coordinates[0].map(
        ([lng, lat]: [number, number]) => [lat, lng] as [number, number]
      );
    }
    const [cLat, cLng] = currentMine.center_lat_lng;
    return [
      [cLat - 0.015, cLng - 0.015],
      [cLat + 0.015, cLng - 0.015],
      [cLat + 0.015, cLng + 0.015],
      [cLat - 0.015, cLng + 0.015],
      [cLat - 0.015, cLng - 0.015],
    ];
  }, [currentMine]);

  const pitZoneCoords: [number, number][] = useMemo(() => {
    const [cLat, cLng] = currentMine.center_lat_lng;
    const offset = 0.007;
    return [
      [cLat - offset * 0.8, cLng - offset],
      [cLat + offset, cLng - offset * 0.6],
      [cLat + offset * 0.8, cLng + offset],
      [cLat - offset, cLng + offset * 0.8],
      [cLat - offset * 0.8, cLng - offset],
    ];
  }, [currentMine]);

  const displayInspections =
    inspections && inspections.length > 0 ? inspections : DEFAULT_MAP_INSPECTIONS;

  return (
    <div className="relative w-full h-[560px] rounded-2xl overflow-hidden border border-slate-800 shadow-2xl bg-slate-950">
      {/* Top Map Header & Stats Overlay */}
      <div className="absolute top-3 left-3 z-[1000] bg-slate-900/95 backdrop-blur-md px-4 py-2.5 rounded-xl border border-slate-700 shadow-xl flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-bold tracking-wider text-slate-100 uppercase">
            {currentMine.name} • {currentMine.mine_type}
          </span>
        </div>
        <div className="h-4 w-px bg-slate-700" />
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs text-slate-300 font-medium font-mono">
            {currentMine.lease_number || "Statutory Geofence Active"}
          </span>
        </div>
      </div>

      {/* Layer Switcher Controls */}
      <div className="absolute top-3 right-3 z-[1000] bg-slate-900/95 backdrop-blur-md p-1.5 rounded-xl border border-slate-700 shadow-xl flex items-center gap-1">
        <button
          onClick={() => setActiveLayer("vector_dark")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeLayer === "vector_dark"
              ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-950 font-bold"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
          }`}
          title="Dark Vector Map"
        >
          <MapIcon className="w-3.5 h-3.5" />
          <span>Vector Dark</span>
        </button>

        <button
          onClick={() => setActiveLayer("vector_streets")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeLayer === "vector_streets"
              ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-950 font-bold"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
          }`}
          title="OpenStreetMap Streets Vector Map"
        >
          <Compass className="w-3.5 h-3.5" />
          <span>Vector Streets</span>
        </button>

        <button
          onClick={() => setActiveLayer("satellite")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeLayer === "satellite"
              ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-950 font-bold"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
          }`}
          title="ESRI World Imagery Satellite View"
        >
          <Satellite className="w-3.5 h-3.5" />
          <span>Satellite</span>
        </button>

        <button
          onClick={() => setActiveLayer("terrain")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeLayer === "terrain"
              ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-950 font-bold"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
          }`}
          title="Topographic Elevation Relief"
        >
          <Mountain className="w-3.5 h-3.5" />
          <span>Terrain</span>
        </button>
      </div>

      {/* Map Legend Overlay */}
      <div className="absolute bottom-3 left-3 z-[1000] bg-slate-900/95 backdrop-blur-md px-4 py-3 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-2 shadow-2xl">
        <div className="font-bold text-slate-400 text-[10px] uppercase tracking-wider mb-1">
          Geospatial Layers & Boundary Legend
        </div>
        <div className="flex items-center gap-2.5">
          <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-sm" />
          <span className="font-medium">Valid Statutory Inspection Point</span>
        </div>
        <div className="flex items-center gap-2.5">
          <div className="w-3 h-3 rounded-full bg-rose-500 animate-pulse" />
          <span className="text-rose-300 font-bold">Geofence Breach Detected!</span>
        </div>
        <div className="flex items-center gap-2.5">
          <div className="w-4 h-2.5 border-2 border-emerald-400 bg-emerald-500/20 rounded-sm" />
          <span className="font-medium text-emerald-300">Statutory Mining Lease Boundary</span>
        </div>
        <div className="flex items-center gap-2.5">
          <div className="w-4 h-2.5 border border-amber-400 bg-amber-500/20 rounded-sm border-dashed" />
          <span className="font-medium text-amber-300">Active Excavation Pit Perimeter</span>
        </div>
      </div>

      <MapContainer
        center={center}
        zoom={13}
        scrollWheelZoom={true}
        maxBounds={[
          [17.0, 78.5],
          [19.8, 81.2],
        ]}
        className="w-full h-full"
      >
        <MapRecenter center={center} />

        {/* Dynamic Vector / Satellite Tile Layers */}
        {activeLayer === "vector_dark" && (
          <TileLayer
            attribution="Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ"
            url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}"
            maxZoom={16}
          />
        )}

        {activeLayer === "vector_streets" && (
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
            maxZoom={19}
          />
        )}

        {activeLayer === "satellite" && (
          <TileLayer
            attribution="Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community"
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            maxZoom={18}
          />
        )}

        {activeLayer === "terrain" && (
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
            subdomains="abc"
            maxZoom={17}
          />
        )}

        {/* Approved Mine Leasehold Boundary Polygon */}
        <Polygon
          positions={leaseholdCoords}
          pathOptions={{
            color: "#10b981", // Emerald statutory border
            weight: 3,
            fillColor: "#059669",
            fillOpacity: activeLayer === "satellite" ? 0.15 : 0.08,
            dashArray: "6, 6",
          }}
        />

        {/* Active Open Cast Excavation Pit / Working Face Zone */}
        <Polygon
          positions={pitZoneCoords}
          pathOptions={{
            color: "#f59e0b",
            weight: 2,
            fillColor: "#d97706",
            fillOpacity: 0.12,
            dashArray: "4, 4",
          }}
        />

        {/* Underground Stations Markers */}
        {currentMine.stations?.map((st, idx) => {
          const offsetLat = idx === 0 ? 0.003 : idx === 1 ? -0.003 : (idx % 2 === 0 ? 0.004 : -0.004);
          const offsetLng = idx === 0 ? -0.003 : idx === 1 ? 0.003 : (idx % 2 === 0 ? -0.004 : 0.004);
          const stPosition: [number, number] = [
            center[0] + offsetLat,
            center[1] + offsetLng,
          ];

          return (
            <Marker
              key={st.station_code}
              position={stPosition}
              icon={createStationIcon()}
            >
              <Popup>
                <div className="p-1.5 space-y-1.5 min-w-[220px]">
                  <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    UNDERGROUND TELEMETRY STATION
                  </span>
                  <h4 className="font-bold text-slate-100 text-xs font-mono">
                    {st.station_code}
                  </h4>
                  <p className="text-xs text-slate-300">{st.description}</p>
                  {st.depth_meters && (
                    <div className="text-[11px] text-slate-400 font-mono">
                      Depth: <span className="text-purple-400 font-bold">{st.depth_meters}m</span> Below Surface
                    </div>
                  )}
                  {st.rfid_tag && (
                    <div className="text-[10px] text-emerald-400 font-mono">
                      RFID Tag: {st.rfid_tag}
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* Plot GPS Surface Inspections */}
        {displayInspections
          .filter((i) => i.location_type === LocationType.SURFACE_GPS && i.gps_location)
          .map((insp) => {
            const coords = parsePoint(insp.gps_location);
            if (!coords) return null;

            const isBreach = insp.is_geofence_breached;
            const icon = createCustomIcon(isBreach);

            return (
              <Marker
                key={insp.id}
                position={coords}
                icon={icon}
                eventHandlers={{
                  click: () => onSelectInspection?.(insp.id),
                }}
              >
                <Popup>
                  <div className="p-1.5 space-y-2 min-w-[240px]">
                    <div className="flex items-center justify-between gap-2">
                      {isBreach ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30">
                          <ShieldAlert className="w-3 h-3" /> GEOFENCE BREACH
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          <CheckCircle className="w-3 h-3" /> VERIFIED IN LEASE
                        </span>
                      )}
                      <span className="text-[10px] text-slate-400 font-mono">
                        v{insp.version}
                      </span>
                    </div>

                    <h4 className="font-bold text-slate-100 text-sm leading-tight">
                      {insp.title}
                    </h4>
                    <p className="text-xs text-slate-300 line-clamp-2">
                      {insp.description}
                    </p>

                    <div className="pt-1.5 border-t border-slate-800 text-[11px] text-slate-400 font-mono flex justify-between">
                      <span>Coordinates:</span>
                      <span className="text-emerald-400 font-bold">
                        {coords[0].toFixed(4)}, {coords[1].toFixed(4)}
                      </span>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
      </MapContainer>
    </div>
  );
}
