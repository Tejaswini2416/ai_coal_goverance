import { apiClient } from "./client";
import { Inspection, LocationType } from "../types/domain";

export const MOCK_INSPECTIONS: Inspection[] = [
  {
    id: "f1a2b3c4-d5e6-4a7b-8c9d-0e1f2a3b4c01",
    mine_site_id: "a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d",
    inspector_id: "u111-222-333",
    title: "Quarterly Methane Level & Ventilation Check",
    description: "Inspection of main return airway intake. Measured CH4 concentration at 0.42%. Normal limit.",
    location_type: LocationType.UNDERGROUND_STATION,
    station_id: "LEVEL3-PANEL7-VENT",
    is_geofence_breached: false,
    version: 1,
    inspection_date: new Date(Date.now() - 3600000 * 4).toISOString(),
    risk_score: 18,
    created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
    evidence_urls: ["coal-evidence/pit1/vent-check-01.jpg"],
  },
  {
    id: "f1a2b3c4-d5e6-4a7b-8c9d-0e1f2a3b4c02",
    mine_site_id: "a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d",
    inspector_id: "u111-222-333",
    title: "Surface Haul Road Dust Suppression Audit",
    description: "Audit of chemical dust suppressant sprinklers along eastern overburden haulage ramp.",
    location_type: LocationType.SURFACE_GPS,
    gps_location: "POINT(79.5134 18.7562)",
    is_geofence_breached: false,
    version: 1,
    inspection_date: new Date(Date.now() - 3600000 * 24).toISOString(),
    risk_score: 25,
    created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
    evidence_urls: ["coal-evidence/pit1/haul-road.jpg"],
  },
  {
    id: "f1a2b3c4-d5e6-4a7b-8c9d-0e1f2a3b4c03",
    mine_site_id: "a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d",
    inspector_id: "u111-222-444",
    title: "Perimeter Boundary Pillar Verification",
    description: "GPS coordinate validation of boundary pillar BP-14. Coordinates recorded 140m outside statutory lease boundary!",
    location_type: LocationType.SURFACE_GPS,
    gps_location: "POINT(79.5450 18.7850)", // Geofence breach outside Ramagundam!
    is_geofence_breached: true,
    version: 2,
    inspection_date: new Date(Date.now() - 3600000 * 48).toISOString(),
    risk_score: 82,
    created_at: new Date(Date.now() - 3600000 * 48).toISOString(),
    evidence_urls: ["coal-evidence/pit1/breach-pillar.jpg"],
  },
];

export async function fetchInspections(mineSiteId?: string): Promise<Inspection[]> {
  try {
    const { data } = await apiClient.get<Inspection[]>("/inspections", {
      params: mineSiteId ? { mine_site_id: mineSiteId } : {},
    });
    return data;
  } catch {
    return MOCK_INSPECTIONS;
  }
}
