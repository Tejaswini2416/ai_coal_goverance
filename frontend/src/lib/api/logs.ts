import { API_BASE_URL } from "./client";
import { useAuthStore } from "../store/auth-store";

export interface AtmosphericLogItem {
  id: string;
  station_code: string;
  location_name: string;
  ch4_pct: number;
  co_ppm: number;
  o2_pct: number;
  velocity_ms: number;
  temp_c: number;
  status: "NORMAL" | "EXCURSION_WARNING" | "STATUTORY_BREACH";
  timestamp: string;
  record_hash: string;
  is_immutable: boolean;
  approval_state?: string;
}

export interface WorkerMusterLogItem {
  id: string;
  worker_id: string;
  worker_name: string;
  designation?: string;
  station_id: string;
  zone_type: string;
  shift: string;
  check_in_time: string;
  check_out_time: string | null;
  biometric_verified: boolean;
  duration_hours: number;
  is_overtime: boolean;
  gas_exposure_ppm: number;
  status: string;
  record_hash: string;
  is_immutable: boolean;
}

export interface MineCastLogItem {
  id: string;
  bench_id: string;
  bench_name: string;
  shift: string;
  date: string;
  extraction_tonnage: number;
  target_quota_tonnage: number;
  quota_achievement_pct: number;
  dumper_trips_count: number;
  blasting_clearance_status: "CLEARED" | "RESTRICTED" | "HOLD";
  explosives_used_kg: number;
  clearance_engineer: string;
  status: string;
  record_hash: string;
  is_immutable: boolean;
}

function getAuthHeaders(): HeadersInit {
  const token = useAuthStore.getState().accessToken;
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

import { cacheDataLogs, getCachedDataLogs } from "../db/offline-db";

const FALLBACK_ATMOSPHERIC_LOGS: AtmosphericLogItem[] = [
  {
    id: "gdk-gas-1001",
    station_code: "STATION-GDK-SEAM3-FACE",
    location_name: "Seam-3 Longwall Working Face & Return Airway (RFID-TEL-GDK-01)",
    ch4_pct: 0.42,
    co_ppm: 8.5,
    o2_pct: 20.8,
    velocity_ms: 2.1,
    temp_c: 28.4,
    status: "NORMAL",
    timestamp: new Date().toISOString(),
    record_hash: "7d4b9b940905e94b2811a76d8b2e5a6064f51950d87a4192b02444c11438914b",
    is_immutable: true,
    approval_state: "APPROVED",
  },
  {
    id: "gdk-gas-1002",
    station_code: "STATION-GDK-SEAM3-TAILGATE",
    location_name: "Seam-3 Tailgate Return Airway Interlocking Sensor",
    ch4_pct: 0.68,
    co_ppm: 22.0,
    o2_pct: 20.4,
    velocity_ms: 1.4,
    temp_c: 30.1,
    status: "EXCURSION_WARNING",
    timestamp: new Date().toISOString(),
    record_hash: "a495991b7852b855e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934c",
    is_immutable: true,
    approval_state: "APPROVED",
  },
  {
    id: "gdk-gas-1003",
    station_code: "STATION-GDK-SHAFT-BOTTOM",
    location_name: "Level-1 Main Incline Haulage & Shaft Bottom Pit Telemetry",
    ch4_pct: 0.15,
    co_ppm: 4.2,
    o2_pct: 20.9,
    velocity_ms: 3.2,
    temp_c: 26.5,
    status: "NORMAL",
    timestamp: new Date().toISOString(),
    record_hash: "2811a76d8b2e5a6064f51950d87a4192b02444c11438914b7d4b9b940905e94b",
    is_immutable: true,
    approval_state: "APPROVED",
  },
];

const FALLBACK_WORKER_LOGS: WorkerMusterLogItem[] = [
  {
    id: "muster-seed-1",
    worker_id: "W-101",
    worker_name: "K. Shankaraiah",
    designation: "Mining Sirdar (Kasipet UG)",
    station_id: "STATION-KASIPET-INCLINE-1",
    zone_type: "Underground Incline Gallery Face",
    shift: "MORNING",
    check_in_time: new Date(Date.now() - 25200000).toISOString(),
    check_out_time: null,
    biometric_verified: true,
    duration_hours: 7.0,
    is_overtime: false,
    gas_exposure_ppm: 6.2,
    status: "ON_DUTY",
    record_hash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    is_immutable: true,
  },
  {
    id: "muster-seed-2",
    worker_id: "W-104",
    worker_name: "Rajesh Kumar Mandal",
    designation: "Overman (Seam-3 Longwall)",
    station_id: "STATION-GDK-SEAM3-FACE",
    zone_type: "Continuous Miner Extraction Gallery",
    shift: "MORNING",
    check_in_time: new Date(Date.now() - 32400000).toISOString(),
    check_out_time: null,
    biometric_verified: true,
    duration_hours: 9.0,
    is_overtime: true,
    gas_exposure_ppm: 18.5,
    status: "OVERTIME_FLAGGED",
    record_hash: "7d4b9b940905e94b2811a76d8b2e5a6064f51950d87a4192b02444c11438914b",
    is_immutable: true,
  },
];

const FALLBACK_MINE_CASTS: MineCastLogItem[] = [
  {
    id: "cast-seed-1",
    bench_id: "BENCH-OCP-B1",
    bench_name: "Top Seam Overburden Bench (East Flank)",
    shift: "MORNING",
    date: new Date().toISOString().slice(0, 10),
    extraction_tonnage: 2150.0,
    target_quota_tonnage: 2000.0,
    quota_achievement_pct: 107.5,
    dumper_trips_count: 72,
    blasting_clearance_status: "CLEARED",
    explosives_used_kg: 450.0,
    clearance_engineer: "Er. K. Venkat Rao",
    status: "COMMITTED",
    record_hash: "a495991b7852b855e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934c",
    is_immutable: true,
  },
  {
    id: "cast-seed-2",
    bench_id: "BENCH-OCP-B2",
    bench_name: "Main Coal Seam IV Working Face",
    shift: "MORNING",
    date: new Date().toISOString().slice(0, 10),
    extraction_tonnage: 1820.0,
    target_quota_tonnage: 1800.0,
    quota_achievement_pct: 101.1,
    dumper_trips_count: 58,
    blasting_clearance_status: "CLEARED",
    explosives_used_kg: 320.0,
    clearance_engineer: "Ch. Srinivas (Manager)",
    status: "COMMITTED",
    record_hash: "2811a76d8b2e5a6064f51950d87a4192b02444c11438914b7d4b9b940905e94b",
    is_immutable: true,
  },
];

export async function fetchAtmosphericLogs(mineSiteId?: string | null): Promise<AtmosphericLogItem[]> {
  const effectiveMineId = mineSiteId || "11111111-1111-4111-a111-111111111111";
  const isOnline = typeof navigator !== "undefined" ? navigator.onLine : true;

  if (isOnline) {
    try {
      const url = new URL(`${API_BASE_URL}/logs/atmospheric`);
      if (mineSiteId) url.searchParams.append("mine_site_id", mineSiteId);

      const res = await fetch(url.toString(), { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        await cacheDataLogs("atmospheric", effectiveMineId, data);
        return data;
      }
    } catch (err) {
      console.warn("Atmospheric log fetch failed, checking Dexie cache:", err);
    }
  }

  // Fallback to local Dexie cache
  const cached = await getCachedDataLogs("atmospheric", effectiveMineId);
  if (cached && cached.length > 0) {
    return cached;
  }

  return FALLBACK_ATMOSPHERIC_LOGS;
}

export async function fetchWorkerMusterLogs(mineSiteId?: string | null): Promise<WorkerMusterLogItem[]> {
  const effectiveMineId = mineSiteId || "11111111-1111-4111-a111-111111111111";
  const isOnline = typeof navigator !== "undefined" ? navigator.onLine : true;

  if (isOnline) {
    try {
      const url = new URL(`${API_BASE_URL}/logs/workers`);
      if (mineSiteId) url.searchParams.append("mine_site_id", mineSiteId);

      const res = await fetch(url.toString(), { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        await cacheDataLogs("workers", effectiveMineId, data);
        return data;
      }
    } catch (err) {
      console.warn("Worker muster log fetch failed, checking Dexie cache:", err);
    }
  }

  // Fallback to local Dexie cache
  const cached = await getCachedDataLogs("workers", effectiveMineId);
  if (cached && cached.length > 0) {
    return cached;
  }

  return FALLBACK_WORKER_LOGS;
}

export async function fetchMineCastLogs(mineSiteId?: string | null): Promise<MineCastLogItem[]> {
  const effectiveMineId = mineSiteId || "11111111-1111-4111-a111-111111111111";
  const isOnline = typeof navigator !== "undefined" ? navigator.onLine : true;

  if (isOnline) {
    try {
      const url = new URL(`${API_BASE_URL}/logs/mine-casts`);
      if (mineSiteId) url.searchParams.append("mine_site_id", mineSiteId);

      const res = await fetch(url.toString(), { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        await cacheDataLogs("mine_casts", effectiveMineId, data);
        return data;
      }
    } catch (err) {
      console.warn("Mine cast log fetch failed, checking Dexie cache:", err);
    }
  }

  // Fallback to local Dexie cache
  const cached = await getCachedDataLogs("mine_casts", effectiveMineId);
  if (cached && cached.length > 0) {
    return cached;
  }

  return FALLBACK_MINE_CASTS;
}

export async function attemptAtmosphericMutation(
  logId: string,
  targetField: string,
  newValue: any,
  mineSiteId?: string | null
): Promise<{ success: boolean; data?: any; error?: any }> {
  const res = await fetch(`${API_BASE_URL}/logs/atmospheric/${logId}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify({
      target_field: targetField,
      new_value: newValue,
      mine_site_id: mineSiteId,
    }),
  });

  const body = await res.json().catch(() => ({}));
  if (res.status === 403) {
    return { success: false, error: body.detail || body };
  }
  if (!res.ok) {
    throw new Error(body.detail?.message || "Mutation failed");
  }
  return { success: true, data: body };
}
