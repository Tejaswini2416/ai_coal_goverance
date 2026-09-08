import Dexie, { type Table } from "dexie";
import { LocationType, CAPAState } from "../types/domain";
import { MOCK_TELANGANA_MINES, TelanganaMine } from "../api/tenants";

export interface PendingInspection {
  id: string; // UUIDv4
  idempotency_key: string;
  mine_site_id: string;
  title: string;
  description: string;
  location_type: LocationType;
  gps_location?: string | null;
  station_id?: string | null;
  inspection_date: string;
  version: number;
  client_updated_at: string;
  is_synced: number; // 0 = pending, 1 = synced
}

export interface OfflineMediaAttachment {
  id: string; // UUIDv4
  inspection_id: string;
  blob: Blob; // Native IndexedDB Blob storage for underground photos
  filename: string;
  content_type: string;
  size_bytes: number;
  uploaded_object_key?: string;
  created_at: string;
}

export interface PendingCAPA {
  id: string; // UUIDv4
  idempotency_key: string;
  inspection_id: string;
  rule_id: string;
  capa_state: CAPAState;
  description: string;
  evidence_urls: string[];
  version: number;
  client_updated_at: string;
  is_synced: number;
}

export interface OfflineWorkerIssue {
  id: string;
  mine_site_id: string;
  issue_category: string;
  location_description: string;
  description: string;
  urgency: string;
  photo_evidence_url?: string;
  status: string;
  is_synced: number; // 0 = local/queued, 1 = synced
  created_at: string;
}

export interface SyncConflictItem {
  id: string; // conflict_id from server
  entity_type: "inspection" | "violation_capa";
  entity_id: string;
  client_version: number;
  server_version: number;
  diff: Record<string, [unknown, unknown]>; // { field: [client_val, server_val] }
  created_at: string;
}

export interface OfflineManagerAction {
  id: string; // UUIDv4
  action_type: "ALERT_ACK" | "OFFICIAL_MEMO" | "LOG_VIEW";
  mine_site_id: string;
  payload: any;
  is_synced: number; // 0 = pending, 1 = synced
  created_at: string;
}

export interface OfflineWorkerLeave {
  id: string; // UUIDv4 or offline-leave-{Date.now()}
  mine_site_id: string;
  worker_id: string;
  worker_name: string;
  leave_type: string; // CASUAL, SICK_MEDICAL, EARNED_STATUTORY, COMPENSATORY
  start_date: string;
  end_date: string;
  total_days: number;
  reason: string;
  relief_worker_id?: string;
  relief_worker_name?: string;
  status: string; // SUBMITTED, APPROVED, REJECTED, QUEUED_OFFLINE
  is_synced: number; // 0 = local/queued, 1 = synced
  created_at: string;
}

export interface CachedDataLog {
  id: string;
  log_type: "atmospheric" | "workers" | "mine_casts";
  mine_site_id: string;
  payload: any;
  cached_at: string;
}

export interface CachedMine extends TelanganaMine {
  code?: string;
}

export class OfflineInspectionDatabase extends Dexie {
  pending_inspections!: Table<PendingInspection, string>;
  offline_media!: Table<OfflineMediaAttachment, string>;
  pending_capas!: Table<PendingCAPA, string>;
  sync_conflicts!: Table<SyncConflictItem, string>;
  cached_mines!: Table<CachedMine, string>;
  worker_issues!: Table<OfflineWorkerIssue, string>;
  worker_leaves!: Table<OfflineWorkerLeave, string>;
  offline_manager_actions!: Table<OfflineManagerAction, string>;
  cached_data_logs!: Table<CachedDataLog, string>;

  // Convenience aliases for multi-role personas
  get offlineInspections(): Table<PendingInspection, string> {
    return this.pending_inspections;
  }
  get offlineWorkerReports(): Table<OfflineWorkerIssue, string> {
    return this.worker_issues;
  }
  get offlineWorkerLeaves(): Table<OfflineWorkerLeave, string> {
    return this.worker_leaves;
  }
  get offlineManagerActions(): Table<OfflineManagerAction, string> {
    return this.offline_manager_actions;
  }
  get cachedDataLogs(): Table<CachedDataLog, string> {
    return this.cached_data_logs;
  }

  constructor() {
    super("CoalGovOfflineDB");
    this.version(4).stores({
      pending_inspections: "id, idempotency_key, mine_site_id, is_synced, client_updated_at",
      offline_media: "id, inspection_id, uploaded_object_key, created_at",
      pending_capas: "id, idempotency_key, inspection_id, is_synced",
      sync_conflicts: "id, entity_type, entity_id",
      cached_mines: "id, area, district, mine_type",
      worker_issues: "id, mine_site_id, urgency, status, is_synced, created_at",
      offline_manager_actions: "id, action_type, mine_site_id, is_synced, created_at",
      cached_data_logs: "id, log_type, mine_site_id, cached_at",
    });
    this.version(5).stores({
      pending_inspections: "id, idempotency_key, mine_site_id, is_synced, client_updated_at",
      offline_media: "id, inspection_id, uploaded_object_key, created_at",
      pending_capas: "id, idempotency_key, inspection_id, is_synced",
      sync_conflicts: "id, entity_type, entity_id",
      cached_mines: "id, area, district, mine_type",
      worker_issues: "id, mine_site_id, urgency, status, is_synced, created_at",
      worker_leaves: "id, mine_site_id, leave_type, status, is_synced, created_at",
      offline_manager_actions: "id, action_type, mine_site_id, is_synced, created_at",
      cached_data_logs: "id, log_type, mine_site_id, cached_at",
    });
  }
}

export const offlineDb = new OfflineInspectionDatabase();

/**
 * Seeds or refreshes the 4 authentic Telangana SCCL mines in IndexedDB
 */
export async function seedOfflineTelanganaMines(customMines?: TelanganaMine[]): Promise<void> {
  try {
    const minesToSeed = customMines && customMines.length > 0 ? customMines : MOCK_TELANGANA_MINES;
    await offlineDb.cached_mines.bulkPut(minesToSeed as CachedMine[]);
  } catch (err) {
    console.warn("Failed to seed offline Telangana mines in Dexie:", err);
  }
}

/**
 * Point-in-polygon ray-casting test for offline GPS validation
 */
function isPointInPolygon(point: [number, number], polygon: number[][]): boolean {
  const [x, y] = point; // [lng, lat]
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0], yi = polygon[i][1];
    const xj = polygon[j][0], yj = polygon[j][1];
    const intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

/**
 * Offline location resolver validating against cached Telangana SCCL boundaries & underground beacons
 */
export async function validateOfflineLocation(
  mineSiteId: string,
  locationType: LocationType,
  gpsLocation?: string | null,
  stationId?: string | null
): Promise<{ isBreached: boolean; reason?: string }> {
  // Check if mine is cached
  let mine = await offlineDb.cached_mines.get(mineSiteId);
  if (!mine) {
    // Seed default if empty
    await seedOfflineTelanganaMines();
    mine = await offlineDb.cached_mines.get(mineSiteId);
  }

  if (!mine) {
    // Fallback search by ID among mock mines
    mine = MOCK_TELANGANA_MINES.find((m) => m.id === mineSiteId) as CachedMine | undefined;
  }

  if (locationType === LocationType.UNDERGROUND_STATION) {
    if (!stationId) {
      return { isBreached: true, reason: "Station beacon ID is required for underground location." };
    }
    if (mine && mine.stations && mine.stations.length > 0) {
      const match = mine.stations.find(
        (s) => s.station_code === stationId || s.rfid_tag === stationId
      );
      if (!match) {
        return {
          isBreached: true,
          reason: `Underground station '${stationId}' not registered for ${mine.name}.`,
        };
      }
    }
    return { isBreached: false };
  }

  // SURFACE_GPS validation
  if (!gpsLocation) {
    return { isBreached: true, reason: "GPS coordinate string is required for surface location." };
  }

  try {
    const clean = gpsLocation.replace(/POINT\((.*)\)/i, "$1").trim();
    const [lonStr, latStr] = clean.split(/\s+/);
    const lon = parseFloat(lonStr);
    const lat = parseFloat(latStr);

    if (isNaN(lon) || isNaN(lat)) {
      return { isBreached: true, reason: "Invalid GPS format. Expected POINT(lon lat)." };
    }

    if (mine && mine.geojson_boundary && mine.geojson_boundary.coordinates?.[0]) {
      const polygon = mine.geojson_boundary.coordinates[0];
      const isInside = isPointInPolygon([lon, lat], polygon);
      if (!isInside) {
        return {
          isBreached: true,
          reason: `Coordinates (${lat.toFixed(4)}, ${lon.toFixed(4)}) are outside ${mine.name} statutory boundary.`,
        };
      }
    }
    return { isBreached: false };
  } catch {
    return { isBreached: true, reason: "Failed to parse GPS coordinates." };
  }
}

/**
 * Cache operational shift data logs for offline viewing
 */
export async function cacheDataLogs(
  logType: "atmospheric" | "workers" | "mine_casts",
  mineSiteId: string,
  payload: any
): Promise<void> {
  try {
    const id = `${logType}-${mineSiteId}`;
    await offlineDb.cached_data_logs.put({
      id,
      log_type: logType,
      mine_site_id: mineSiteId,
      payload,
      cached_at: new Date().toISOString(),
    });
  } catch (err) {
    console.warn(`Failed to cache ${logType} logs in Dexie:`, err);
  }
}

/**
 * Retrieve cached operational shift data logs when offline
 */
export async function getCachedDataLogs(
  logType: "atmospheric" | "workers" | "mine_casts",
  mineSiteId?: string | null
): Promise<any[] | null> {
  try {
    if (mineSiteId) {
      const cached = await offlineDb.cached_data_logs.get(`${logType}-${mineSiteId}`);
      if (cached && cached.payload && Array.isArray(cached.payload)) {
        return cached.payload;
      }
    }
    const all = await offlineDb.cached_data_logs.where("log_type").equals(logType).toArray();
    if (all.length > 0 && all[0].payload && Array.isArray(all[0].payload)) {
      return all[0].payload;
    }
  } catch (err) {
    console.warn(`Failed to read ${logType} cache from Dexie:`, err);
  }
  return null;
}

/**
 * Save an offline worker leave application
 */
export async function saveOfflineWorkerLeave(leave: OfflineWorkerLeave): Promise<void> {
  await offlineDb.worker_leaves.put(leave);
}

/**
 * Fetch offline worker leaves
 */
export async function getOfflineWorkerLeaves(mineSiteId?: string | null): Promise<OfflineWorkerLeave[]> {
  try {
    if (mineSiteId) {
      return await offlineDb.worker_leaves.where("mine_site_id").equals(mineSiteId).toArray();
    }
    return await offlineDb.worker_leaves.toArray();
  } catch (err) {
    console.warn("Failed to get offline worker leaves from Dexie:", err);
    return [];
  }
}

