import { apiClient } from "./client";
import { MineUndergroundStation } from "../types/domain";

export const MOCK_STATIONS: MineUndergroundStation[] = [
  {
    id: "stn-001",
    mine_site_id: "a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d",
    station_code: "LEVEL1-SHAFT-MAIN",
    description: "Main Incline Shaft Bottom Intake (Depth 120m)",
    depth_meters: 120,
    is_active: true,
  },
  {
    id: "stn-002",
    mine_site_id: "a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d",
    station_code: "LEVEL2-SEAM4-PUMP",
    description: "Seam-4 Dewatering Sump Pump Room (Depth 185m)",
    depth_meters: 185,
    is_active: true,
  },
  {
    id: "stn-003",
    mine_site_id: "a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d",
    station_code: "LEVEL3-PANEL7-VENT",
    description: "Panel-7 Longwall Return Airway Ventilation Regulator",
    depth_meters: 240,
    is_active: true,
  },
  {
    id: "stn-004",
    mine_site_id: "a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d",
    station_code: "LEVEL3-SUBSTATION-SOUTH",
    description: "Underground Flameproof Electrical Transformer Room",
    depth_meters: 245,
    is_active: true,
  },
];

export async function fetchUndergroundStations(mineSiteId: string): Promise<MineUndergroundStation[]> {
  try {
    const { data } = await apiClient.get<MineUndergroundStation[]>(
      `/mine-sites/${mineSiteId}/stations`
    );
    return data;
  } catch {
    return MOCK_STATIONS;
  }
}
