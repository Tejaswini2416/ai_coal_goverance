import { apiClient } from "./client";
import { Tenant, TenantTier } from "../types/domain";

export interface TelanganaStation {
  station_code: string;
  description: string;
  depth_meters?: number | null;
  rfid_tag?: string | null;
}

export interface TelanganaMine {
  id: string;
  name: string;
  area: string;
  district: string;
  state: string;
  mine_type: "OPENCAST" | "UNDERGROUND";
  center_lat_lng: [number, number];
  geojson_boundary?: any;
  stations: TelanganaStation[];
  lease_number?: string | null;
}

export const MOCK_TELANGANA_MINES: TelanganaMine[] = [
  {
    id: "22222222-2222-4222-a222-222222222222",
    name: "Ramagundam Opencast Project-III (RG-OCP 3)",
    area: "Ramagundam Area-2 (Peddapalli)",
    district: "Peddapalli",
    state: "Telangana",
    mine_type: "OPENCAST",
    center_lat_lng: [18.7562, 79.5134],
    lease_number: "ML-SCCL-RG3-OCP-2018",
    geojson_boundary: {
      type: "Polygon",
      coordinates: [
        [
          [79.4934, 18.7362],
          [79.4934, 18.7762],
          [79.5334, 18.7762],
          [79.5334, 18.7362],
          [79.4934, 18.7362],
        ],
      ],
    },
    stations: [],
  },
  {
    id: "11111111-1111-4111-a111-111111111111",
    name: "Godavarikhani No. 11A Incline (GDK-11A)",
    area: "Ramagundam Area-1 (Peddapalli)",
    district: "Peddapalli",
    state: "Telangana",
    mine_type: "UNDERGROUND",
    center_lat_lng: [18.7610, 79.4985],
    lease_number: "ML-SCCL-GDK-11A-2015",
    geojson_boundary: {
      type: "Polygon",
      coordinates: [
        [
          [79.4885, 18.7510],
          [79.4885, 18.7710],
          [79.5085, 18.7710],
          [79.5085, 18.7510],
          [79.4885, 18.7510],
        ],
      ],
    },
    stations: [
      {
        station_code: "STATION-GDK-SHAFT-BOTTOM",
        description: "Level-1 Main Incline Haulage & Shaft Bottom Station",
        depth_meters: 380,
      },
      {
        station_code: "STATION-GDK-SEAM3-FACE",
        description: "Seam-3 Longwall Face & Telemetric Return Airway Station (RFID-TEL-GDK-01)",
        depth_meters: 340,
        rfid_tag: "RFID-TEL-GDK-01",
      },
    ],
  },
  {
    id: "33333333-3333-4333-a333-333333333333",
    name: "Kothagudem Opencast Project (KOCP)",
    area: "Kothagudem Corporate Area",
    district: "Bhadradri Kothagudem",
    state: "Telangana",
    mine_type: "OPENCAST",
    center_lat_lng: [17.5518, 80.6189],
    lease_number: "ML-SCCL-KOCP-2012",
    geojson_boundary: {
      type: "Polygon",
      coordinates: [
        [
          [80.5989, 17.5318],
          [80.5989, 17.5718],
          [80.6389, 17.5718],
          [80.6389, 17.5318],
          [80.5989, 17.5318],
        ],
      ],
    },
    stations: [],
  },
  {
    id: "44444444-4444-4444-a444-444444444444",
    name: "Kasipet Underground Mine",
    area: "Mandamarri Area (Mancherial)",
    district: "Mancherial",
    state: "Telangana",
    mine_type: "UNDERGROUND",
    center_lat_lng: [19.0321, 79.4412],
    lease_number: "ML-SCCL-KASIPET-UG-2016",
    geojson_boundary: {
      type: "Polygon",
      coordinates: [
        [
          [79.4212, 19.0121],
          [79.4212, 19.0521],
          [79.4612, 19.0521],
          [79.4612, 19.0121],
          [79.4212, 19.0121],
        ],
      ],
    },
    stations: [
      {
        station_code: "STATION-KASIPET-INCLINE-1",
        description: "Kasipet Incline No.1 Main Haulage Station (RFID-TEL-KAS-01)",
        depth_meters: 180,
        rfid_tag: "RFID-TEL-KAS-01",
      },
      {
        station_code: "STATION-KASIPET-RETURN-AIRWAY",
        description: "Kasipet Return Airway & Telemetric Monitoring (RFID-TEL-KAS-02)",
        depth_meters: 260,
        rfid_tag: "RFID-TEL-KAS-02",
      },
    ],
  },
];

export const MOCK_TENANTS: Tenant[] = [
  {
    id: "a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c01",
    name: "Ministry of Coal (Govt. of India)",
    tier: TenantTier.MINISTRY,
    path: "MOC",
    parent_id: null,
  },
  {
    id: "a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c02",
    name: "The Singareni Collieries Company Limited (SCCL)",
    tier: TenantTier.SUBSIDIARY,
    path: "MOC.SCCL",
    parent_id: "a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c01",
  },
  {
    id: "a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c03",
    name: "Ramagundam Area-1 (Peddapalli)",
    tier: TenantTier.AREA,
    path: "MOC.SCCL.RAMAGUNDAM_1",
    parent_id: "a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c02",
  },
  {
    id: "a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c04",
    name: "Ramagundam Area-2 (Peddapalli)",
    tier: TenantTier.AREA,
    path: "MOC.SCCL.RAMAGUNDAM_2",
    parent_id: "a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c02",
  },
  {
    id: "11111111-1111-4111-a111-111111111111",
    name: "Godavarikhani No. 11A Incline (GDK-11A)",
    tier: TenantTier.MINE_SITE,
    path: "MOC.SCCL.RAMAGUNDAM_1.GDK_11A",
    parent_id: "a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c03",
  },
  {
    id: "22222222-2222-4222-a222-222222222222",
    name: "Ramagundam Opencast Project-III (RG-OCP 3)",
    tier: TenantTier.MINE_SITE,
    path: "MOC.SCCL.RAMAGUNDAM_2.RG_OCP3",
    parent_id: "a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c04",
  },
];

export async function fetchTenants(subtree?: string): Promise<Tenant[]> {
  try {
    const params = subtree ? { subtree } : {};
    const { data } = await apiClient.get<Tenant[]>("/tenants", { params });
    return data;
  } catch {
    if (!subtree) return MOCK_TENANTS;
    return MOCK_TENANTS.filter((t) => t.path.startsWith(subtree));
  }
}

export async function fetchTelanganaMines(): Promise<TelanganaMine[]> {
  try {
    const { data } = await apiClient.get<TelanganaMine[]>("/tenants/mines/telangana");
    return data && data.length > 0 ? data : MOCK_TELANGANA_MINES;
  } catch {
    return MOCK_TELANGANA_MINES;
  }
}
