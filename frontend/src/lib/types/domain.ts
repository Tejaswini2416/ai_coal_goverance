/**
 * Domain types matching backend models exactly (SIH26024 Coal Mines Governance)
 */

export enum TenantTier {
  MINISTRY = "MINISTRY",
  SUBSIDIARY = "SUBSIDIARY",
  AREA = "AREA",
  MINE_SITE = "MINE_SITE",
}

export enum UserRole {
  MINISTRY_AUDITOR = "MINISTRY_AUDITOR",
  REGULATORY_OFFICER = "REGULATORY_OFFICER",
  AREA_ADMIN = "AREA_ADMIN",
  COLLIERY_MANAGER = "COLLIERY_MANAGER",
  DGMS_INSPECTOR = "DGMS_INSPECTOR",
  FIELD_WORKER = "FIELD_WORKER",
  MINING_SIRDAR = "MINING_SIRDAR",
  CONTRACTOR_ADMIN = "CONTRACTOR_ADMIN",
}

export interface WorkerIssueReport {
  mine_site_id: string;
  issue_category: "VENTILATION_GAS" | "ROOF_SUPPORT" | "EQUIPMENT_DEFECT" | "WATER_LOGGING" | "WELFARE" | string;
  location_description: string;
  description: string;
  urgency: "LOW" | "MEDIUM" | "HIGH" | "EMERGENCY_STOP";
  photo_evidence_url?: string;
}

export interface WorkerIssueOut {
  id: string;
  mine_site_id: string;
  issue_category: string;
  location_description: string;
  description: string;
  urgency: "LOW" | "MEDIUM" | "HIGH" | "EMERGENCY_STOP" | string;
  photo_evidence_url?: string;
  status: "PENDING_REVIEW" | "INVESTIGATING" | "RECTIFIED";
  reported_by_id?: string;
  reported_by_name?: string;
  created_at: string;
  updated_at?: string;
  is_emergency_stop?: boolean;
  capa_id?: string;
}

export interface DashboardSummaryData {
  role: string;
  user_name: string;
  user_email: string;
  tenant_path: string;
  mine_site_id?: string | null;
  mine_site_name?: string | null;
  metrics: Record<string, any>;
  timestamp: string;
}

export enum CAPAState {
  REPORTED = "REPORTED",
  NOTICE_ISSUED = "NOTICE_ISSUED",
  ASSIGNED = "ASSIGNED",
  RECTIFICATION_SUBMITTED = "RECTIFICATION_SUBMITTED",
  VERIFIED = "VERIFIED",
  CLOSED = "CLOSED",
}

export const CAPA_STATE_LABELS: Record<CAPAState, string> = {
  [CAPAState.REPORTED]: "1. Reported",
  [CAPAState.NOTICE_ISSUED]: "2. Notice Issued",
  [CAPAState.ASSIGNED]: "3. Assigned",
  [CAPAState.RECTIFICATION_SUBMITTED]: "4. Rectification Submitted",
  [CAPAState.VERIFIED]: "5. Verified (DGMS/Safety)",
  [CAPAState.CLOSED]: "6. Closed",
};

export const CAPA_STATE_COLORS: Record<CAPAState, string> = {
  [CAPAState.REPORTED]: "border-rose-500/30 bg-rose-500/10 text-rose-400",
  [CAPAState.NOTICE_ISSUED]: "border-amber-500/30 bg-amber-500/10 text-amber-400",
  [CAPAState.ASSIGNED]: "border-blue-500/30 bg-blue-500/10 text-blue-400",
  [CAPAState.RECTIFICATION_SUBMITTED]: "border-purple-500/30 bg-purple-500/10 text-purple-400",
  [CAPAState.VERIFIED]: "border-teal-500/30 bg-teal-500/10 text-teal-400",
  [CAPAState.CLOSED]: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
};

export enum LocationType {
  SURFACE_GPS = "SURFACE_GPS",
  UNDERGROUND_STATION = "UNDERGROUND_STATION",
}

export enum SyncStatus {
  CREATED = "CREATED",
  UPDATED = "UPDATED",
  CONFLICT = "CONFLICT",
  DUPLICATE = "DUPLICATE",
  SKIPPED = "SKIPPED",
}

export enum ConflictStatus {
  PENDING_ARBITRATION = "PENDING_ARBITRATION",
  RESOLVED_CLIENT = "RESOLVED_CLIENT",
  RESOLVED_SERVER = "RESOLVED_SERVER",
  AUTO_MERGED = "AUTO_MERGED",
}

export interface Tenant {
  id: string;
  name: string;
  tier: TenantTier;
  path: string; // e.g., "MOC.SECL.KORBA.PIT1"
  parent_id: string | null;
}

export interface MineUndergroundStation {
  id: string;
  mine_site_id: string;
  station_code: string; // e.g. "LEVEL3-PANEL7-VENT"
  description: string | null;
  depth_meters: number | null;
  is_active: boolean;
}

export interface Inspection {
  id: string;
  mine_site_id: string;
  inspector_id: string;
  title: string;
  description: string;
  location_type: LocationType;
  gps_location?: string | null; // e.g. "POINT(79.5134 18.7562)"
  station_id?: string | null;
  is_geofence_breached: boolean;
  version: number;
  inspection_date: string;
  risk_score?: number | null;
  created_at: string;
  evidence_urls?: string[];
}

export interface ViolationCAPA {
  id: string;
  inspection_id: string;
  rule_id: string;
  capa_state: CAPAState;
  description: string;
  evidence_urls: string[];
  version: number;
  assigned_to: string | null;
  verified_by: string | null;
  closed_at: string | null;
  created_at: string;
}

export interface StatutorySchedule {
  id: string;
  mine_site_id: string;
  rule_id: string;
  permit_number: string;
  permit_type: string;
  issued_date: string;
  expiry_date: string;
  status: string; // ACTIVE, EXPIRING, EXPIRED
  last_alerted_days?: number | null;
}

export interface ComplianceAlert {
  id: string;
  mine_site_id: string;
  schedule_id: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  days_until_expiry: number;
  is_acknowledged: boolean;
  created_at: string;
}

export interface AuditLedgerEntry {
  id: string;
  mine_site_id: string;
  sequence_number: number;
  entity_type: string;
  entity_id?: string;
  operation: "INSERT" | "UPDATE" | "STATUS_CHANGE" | "DELETE" | string;
  prev_hash: string;
  previous_hash?: string;
  record_hash: string;
  current_hash?: string;
  created_by?: string;
  actor_id?: string;
  actor_role?: string;
  action_type?: string;
  mine_name?: string;
  payload?: Record<string, any>;
  payload_json?: Record<string, any>;
  created_at: string;
  timestamp?: string;
}

export interface VerifyResult {
  mine_site_id: string;
  valid: boolean;
  broken_at_sequence: number | null;
  total_entries: number;
  reason?: string | null;
}

export interface WorkerAttendance {
  id: string;
  worker_id: string;
  worker_name: string;
  mine_site_id: string;
  zone_type: string;
  station_id?: string | null;
  shift: string;
  check_in_time: string;
  check_out_time?: string | null;
  biometric_verified: boolean;
  gas_level_exposure_ppm?: number | null;
  status: "ACTIVE_INSIDE" | "CHECKED_OUT" | "EMERGENCY_EVACUATED";
  created_at: string;
}

export interface HeadcountSummary {
  mine_site_id?: string | null;
  total_active_inside: number;
  underground_count: number;
  surface_count: number;
  hazardous_exposure_alerts: number;
}

export interface InspectionSchedule {
  id: string;
  mine_site_id: string;
  assigned_inspector_id: string;
  inspector_name: string;
  inspection_title: string;
  inspection_type: string;
  scheduled_date: string;
  due_date: string;
  status: "SCHEDULED" | "ASSIGNED" | "IN_PROGRESS" | "COMPLETED" | "OVERDUE";
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  completed_inspection_id?: string | null;
  completed_at?: string | null;
  notes?: string | null;
  created_at: string;
}

export interface AppNotification {
  id: string;
  recipient_user_id?: string | null;
  recipient_role?: string | null;
  mine_site_id: string;
  title: string;
  message: string;
  category: string;
  severity: "INFO" | "WARNING" | "URGENT" | "CRITICAL";
  channel: "IN_APP" | "EMAIL" | "SMS_PUSH";
  is_read: boolean;
  is_acknowledged: boolean;
  acknowledged_by?: string | null;
  acknowledged_by_name?: string | null;
  acknowledged_at?: string | null;
  acknowledgement_note?: string | null;
  escalation_level: number;
  escalated_to_role?: string | null;
  created_at: string;
}

export interface WorkerLeave {
  id: string;
  worker_id: string;
  worker_name: string;
  mine_site_id: string;
  leave_type: "CASUAL" | "SICK_MEDICAL" | "EARNED_STATUTORY" | "COMPENSATORY" | string;
  start_date: string;
  end_date: string;
  total_days: number;
  reason: string;
  relief_worker_id?: string | null;
  relief_worker_name?: string | null;
  status: "SUBMITTED" | "APPROVED" | "REJECTED" | "CANCELLED" | "QUEUED_OFFLINE" | string;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  review_notes?: string | null;
  created_at: string;
  updated_at?: string | null;
}

export interface WorkerLeaveRequest {
  mine_site_id: string;
  worker_id?: string;
  worker_name?: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  total_days: number;
  reason: string;
  relief_worker_id?: string;
  relief_worker_name?: string;
}

export interface OfficialEscalationRequest {
  mine_site_id: string;
  recipient_roles: string[];
  subject: string;
  priority: "NORMAL" | "URGENT" | "STATUTORY_EMERGENCY";
  category: "SAFETY_BREACH" | "PRODUCTION_HALT" | "VENTILATION_CRISIS" | "GENERAL_COMPLIANCE";
  message_body: string;
  include_risk_snapshot?: boolean;
}

export interface OfficialEscalationResponse {
  escalation_id: string;
  status: string;
  dispatched_at: string;
  sender_email: string;
  sender_role: string;
  mine_site_id: string;
  mine_name: string;
  recipient_roles: string[];
  target_emails: string[];
  audit_block_hash?: string | null;
  delivery_summary: string;
  notifications_created: number;
}

