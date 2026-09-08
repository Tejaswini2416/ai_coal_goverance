import { LocationType, CAPAState, SyncStatus } from "./domain";

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  role: string;
  tenant_path: string;
}

export interface SyncInspectionItem {
  id: string;
  idempotency_key: string;
  mine_site_id: string;
  title: string;
  description: string;
  location_type: LocationType;
  gps_location?: string | null;
  station_id?: string | null;
  inspection_date: string;
  version: number;
  client_updated_at?: string | null;
}

export interface SyncCAPAItem {
  id: string;
  idempotency_key: string;
  inspection_id: string;
  rule_id: string;
  capa_state: CAPAState;
  description: string;
  evidence_urls: string[];
  version: number;
  client_updated_at?: string | null;
}

export interface BatchSyncRequest {
  inspections: SyncInspectionItem[];
  violation_capas: SyncCAPAItem[];
}

export interface SyncItemResult {
  id: string;
  status: SyncStatus;
  new_version?: number | null;
  conflict_id?: string | null;
  client_version?: number | null;
  server_version?: number | null;
  diff?: Record<string, [unknown, unknown]>;
}

export interface BatchSyncResponse {
  processed_at: string;
  results: SyncItemResult[];
  summary: Record<string, number>;
}

export interface ArbitrateRequest {
  conflict_id: string;
  resolution: "RESOLVED_CLIENT" | "RESOLVED_SERVER" | "AUTO_MERGED";
  merged_payload?: Record<string, unknown>;
}

export interface UploadUrlRequest {
  mine_site_id: string;
  document_type: "INSPECTION_PHOTO" | "RECTIFICATION_PHOTO" | "TEST_CERTIFICATE" | "PERMIT";
  filename: string;
  content_type?: string;
}

export interface UploadUrlResponse {
  upload_url: string;
  object_key: string;
  bucket: string;
  expires_in: number;
}
