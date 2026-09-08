import { API_BASE_URL } from "./client";
import { WorkerIssueReport, WorkerIssueOut } from "../types/domain";
import { offlineDb } from "../db/offline-db";

/**
 * Submit an on-ground worker grievance / hazard issue.
 * Supports transparent offline storage via IndexedDB Dexie.
 */
export async function reportWorkerIssue(payload: WorkerIssueReport): Promise<WorkerIssueOut> {
  const isOnline = typeof navigator !== "undefined" ? navigator.onLine : true;

  if (isOnline) {
    try {
      const res = await fetch(`${API_BASE_URL}/worker/report-issue`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const data: WorkerIssueOut = await res.json();
        // Also save to offlineDb for offline review
        try {
          await offlineDb.worker_issues.put({
            id: data.id,
            mine_site_id: data.mine_site_id,
            issue_category: data.issue_category,
            location_description: data.location_description,
            description: data.description,
            urgency: data.urgency,
            photo_evidence_url: data.photo_evidence_url,
            status: data.status,
            is_synced: 1,
            created_at: data.created_at,
          });
        } catch {}
        return data;
      }
    } catch (err) {
      console.warn("Network request failed, queueing worker issue offline:", err);
    }
  }

  // Offline fallback: store locally
  const offlineId = `offline-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();
  const offlineIssue: WorkerIssueOut = {
    id: offlineId,
    mine_site_id: payload.mine_site_id,
    issue_category: payload.issue_category,
    location_description: payload.location_description,
    description: payload.description,
    urgency: payload.urgency,
    photo_evidence_url: payload.photo_evidence_url,
    status: "PENDING_REVIEW",
    reported_by_name: "Logged Offline (Mining Sirdar)",
    created_at: now,
    is_emergency_stop: payload.urgency === "EMERGENCY_STOP",
  };

  try {
    await offlineDb.worker_issues.put({
      id: offlineId,
      mine_site_id: payload.mine_site_id,
      issue_category: payload.issue_category,
      location_description: payload.location_description,
      description: payload.description,
      urgency: payload.urgency,
      photo_evidence_url: payload.photo_evidence_url,
      status: "PENDING_REVIEW",
      is_synced: 0,
      created_at: now,
    });
  } catch (dbErr) {
    console.warn("Could not save to Dexie, fallback to localStorage:", dbErr);
    try {
      const existing = JSON.parse(localStorage.getItem("offline_worker_issues") || "[]");
      existing.unshift(offlineIssue);
      localStorage.setItem("offline_worker_issues", JSON.stringify(existing));
    } catch {}
  }

  return offlineIssue;
}

/**
 * Fetch reported issues for the current worker / mine site.
 */
export async function fetchMyWorkerIssues(mineSiteId?: string): Promise<WorkerIssueOut[]> {
  try {
    const url = mineSiteId
      ? `${API_BASE_URL}/worker/my-issues?mine_site_id=${encodeURIComponent(mineSiteId)}`
      : `${API_BASE_URL}/worker/my-issues`;

    const res = await fetch(url);
    if (res.ok) {
      const serverIssues: WorkerIssueOut[] = await res.json();
      
      // Merge with any un-synced offline issues
      try {
        const localIssues = await offlineDb.worker_issues.where("is_synced").equals(0).toArray();
        if (localIssues.length > 0) {
          const mappedLocal: WorkerIssueOut[] = localIssues.map((li) => ({
            id: li.id,
            mine_site_id: li.mine_site_id,
            issue_category: li.issue_category,
            location_description: li.location_description,
            description: li.description,
            urgency: li.urgency,
            photo_evidence_url: li.photo_evidence_url,
            status: "PENDING_REVIEW",
            reported_by_name: "Offline Local Queue",
            created_at: li.created_at,
            is_emergency_stop: li.urgency === "EMERGENCY_STOP",
          }));
          return [...mappedLocal, ...serverIssues];
        }
      } catch {}

      return serverIssues;
    }
  } catch (err) {
    console.warn("Failed to fetch worker issues from server, reading local cache:", err);
  }

  // Fallback to local Dexie issues
  try {
    const localIssues = await offlineDb.worker_issues.toArray();
    if (localIssues.length > 0) {
      return localIssues.map((li) => ({
        id: li.id,
        mine_site_id: li.mine_site_id,
        issue_category: li.issue_category,
        location_description: li.location_description,
        description: li.description,
        urgency: li.urgency,
        photo_evidence_url: li.photo_evidence_url,
        status: (li.status as any) || "PENDING_REVIEW",
        reported_by_name: "Local Cache (Offline)",
        created_at: li.created_at,
        is_emergency_stop: li.urgency === "EMERGENCY_STOP",
      }));
    }
  } catch {}

  // Sample fallback
  return [
    {
      id: "demo-issue-01",
      mine_site_id: mineSiteId || "11111111-1111-4111-a111-111111111111",
      issue_category: "VENTILATION_GAS",
      location_description: "Level 3 Gallery 4, 380m near Return Airway",
      description: "Methane sensor flashing intermittent warning; airflow velocity dropped below 0.8 m/s during shift.",
      urgency: "HIGH",
      status: "INVESTIGATING",
      reported_by_name: "K. Shankaraiah (Mining Sirdar)",
      created_at: new Date(Date.now() - 3600000).toISOString(),
      is_emergency_stop: false,
    },
    {
      id: "demo-issue-02",
      mine_site_id: mineSiteId || "11111111-1111-4111-a111-111111111111",
      issue_category: "ROOF_SUPPORT",
      location_description: "Panel 7 Working Face Junction 2",
      description: "Loose shale spalling detected on left rib; SSR roof bolt anchor plate requires retightening.",
      urgency: "EMERGENCY_STOP",
      status: "PENDING_REVIEW",
      reported_by_name: "Rajesh Kumar Mandal (Overman)",
      created_at: new Date(Date.now() - 7200000).toISOString(),
      is_emergency_stop: true,
    },
    {
      id: "demo-issue-03",
      mine_site_id: mineSiteId || "11111111-1111-4111-a111-111111111111",
      issue_category: "EQUIPMENT_DEFECT",
      location_description: "Haulage Incline No. 1 Winch Room",
      description: "Winch brake shoe lining worn out; emergency trip switch tested and lubricated.",
      urgency: "MEDIUM",
      status: "RECTIFIED",
      reported_by_name: "Dilip Hembram",
      created_at: new Date(Date.now() - 86400000).toISOString(),
      is_emergency_stop: false,
    },
  ];
}

import { WorkerLeave, WorkerLeaveRequest } from "../types/domain";

function getAuthHeaders(): HeadersInit {
  if (typeof window === "undefined") return { "Content-Type": "application/json" };
  const authStorage = localStorage.getItem("auth-storage");
  if (authStorage) {
    try {
      const parsed = JSON.parse(authStorage);
      const token = parsed?.state?.accessToken;
      if (token) {
        return {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        };
      }
    } catch (e) {
      console.error("Failed to parse auth token", e);
    }
  }
  return { "Content-Type": "application/json" };
}

/**
 * Submit a statutory leave application (Mines Rules 1955 Chapter VII).
 * Supports transparent offline storage via IndexedDB Dexie.
 */
export async function submitWorkerLeave(payload: WorkerLeaveRequest): Promise<WorkerLeave> {
  const isOnline = typeof navigator !== "undefined" ? navigator.onLine : true;

  if (isOnline) {
    try {
      const res = await fetch(`${API_BASE_URL}/worker/leave-applications`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data: WorkerLeave = await res.json();
        try {
          await offlineDb.worker_leaves.put({
            id: data.id,
            mine_site_id: data.mine_site_id,
            worker_id: data.worker_id,
            worker_name: data.worker_name,
            leave_type: data.leave_type,
            start_date: data.start_date,
            end_date: data.end_date,
            total_days: data.total_days,
            reason: data.reason,
            relief_worker_id: data.relief_worker_id || undefined,
            relief_worker_name: data.relief_worker_name || undefined,
            status: data.status,
            is_synced: 1,
            created_at: data.created_at,
          });
        } catch {}
        return data;
      }
    } catch (err) {
      console.warn("Network request failed, queueing worker leave offline:", err);
    }
  }

  // Offline fallback
  const offlineId = `offline-leave-${Date.now()}`;
  const now = new Date().toISOString();
  const offlineLeave: WorkerLeave = {
    id: offlineId,
    worker_id: payload.worker_id || "W-104",
    worker_name: payload.worker_name || "K. Shankaraiah (Worker)",
    mine_site_id: payload.mine_site_id,
    leave_type: payload.leave_type,
    start_date: payload.start_date,
    end_date: payload.end_date,
    total_days: payload.total_days,
    reason: payload.reason,
    relief_worker_id: payload.relief_worker_id,
    relief_worker_name: payload.relief_worker_name,
    status: "QUEUED_OFFLINE",
    created_at: now,
  };

  try {
    await offlineDb.worker_leaves.put({
      id: offlineId,
      mine_site_id: payload.mine_site_id,
      worker_id: offlineLeave.worker_id,
      worker_name: offlineLeave.worker_name,
      leave_type: payload.leave_type,
      start_date: payload.start_date,
      end_date: payload.end_date,
      total_days: payload.total_days,
      reason: payload.reason,
      relief_worker_id: payload.relief_worker_id || undefined,
      relief_worker_name: payload.relief_worker_name || undefined,
      status: "QUEUED_OFFLINE",
      is_synced: 0,
      created_at: now,
    });
  } catch (dexErr) {
    console.warn("Could not save worker leave to Dexie:", dexErr);
  }

  return offlineLeave;
}

/**
 * Fetch statutory leave applications for the mine site / worker.
 */
export async function fetchWorkerLeaves(mineSiteId?: string | null, workerId?: string | null): Promise<WorkerLeave[]> {
  try {
    const params = new URLSearchParams();
    if (mineSiteId) params.append("mine_site_id", mineSiteId);
    if (workerId) params.append("worker_id", workerId);

    const url = params.toString()
      ? `${API_BASE_URL}/worker/leave-applications?${params.toString()}`
      : `${API_BASE_URL}/worker/leave-applications`;

    const res = await fetch(url, { headers: getAuthHeaders() });
    if (res.ok) {
      const serverLeaves: WorkerLeave[] = await res.json();
      // Merge with unsynced local offline leaves
      try {
        const localLeaves = await offlineDb.worker_leaves.where("is_synced").equals(0).toArray();
        if (localLeaves.length > 0) {
          const mappedLocal: WorkerLeave[] = localLeaves.map((l) => ({
            id: l.id,
            worker_id: l.worker_id,
            worker_name: l.worker_name,
            mine_site_id: l.mine_site_id,
            leave_type: l.leave_type,
            start_date: l.start_date,
            end_date: l.end_date,
            total_days: l.total_days,
            reason: l.reason,
            relief_worker_id: l.relief_worker_id || null,
            relief_worker_name: l.relief_worker_name || null,
            status: l.status,
            created_at: l.created_at,
          }));
          return [...mappedLocal, ...serverLeaves];
        }
      } catch {}

      return serverLeaves;
    }
  } catch (err) {
    console.warn("Failed to fetch worker leaves from server, reading local cache:", err);
  }

  // Fallback to local Dexie leaves
  try {
    const localLeaves = await offlineDb.worker_leaves.toArray();
    if (localLeaves.length > 0) {
      return localLeaves.map((l) => ({
        id: l.id,
        worker_id: l.worker_id,
        worker_name: l.worker_name,
        mine_site_id: l.mine_site_id,
        leave_type: l.leave_type,
        start_date: l.start_date,
        end_date: l.end_date,
        total_days: l.total_days,
        reason: l.reason,
        relief_worker_id: l.relief_worker_id || null,
        relief_worker_name: l.relief_worker_name || null,
        status: l.status,
        created_at: l.created_at,
      }));
    }
  } catch {}

  return [
    {
      id: "leave-demo-1",
      worker_id: "W-104",
      worker_name: "Rajesh Kumar Mandal",
      mine_site_id: mineSiteId || "11111111-1111-4111-a111-111111111111",
      leave_type: "EARNED_STATUTORY",
      start_date: "2026-09-12",
      end_date: "2026-09-14",
      total_days: 3,
      reason: "Annual statutory leave entitlement under Mines Rules 1955 Chapter VII.",
      relief_worker_id: "W-108",
      relief_worker_name: "K. Shankaraiah (Mining Sirdar)",
      status: "APPROVED",
      reviewed_by: "Colliery Manager (Er. Ramesh Rao)",
      reviewed_at: new Date().toISOString(),
      review_notes: "Shift relief allocated to Sirdar Shankaraiah.",
      created_at: new Date().toISOString(),
    },
    {
      id: "leave-demo-2",
      worker_id: "W-104",
      worker_name: "Rajesh Kumar Mandal",
      mine_site_id: mineSiteId || "11111111-1111-4111-a111-111111111111",
      leave_type: "CASUAL",
      start_date: "2026-09-20",
      end_date: "2026-09-21",
      total_days: 2,
      reason: "Family medical appointment in Hyderabad.",
      relief_worker_id: "W-112",
      relief_worker_name: "G. Venkatesh",
      status: "SUBMITTED",
      created_at: new Date().toISOString(),
    },
  ];
}

/**
 * Colliery Manager reviews (Approve/Reject) a worker leave application.
 */
export async function reviewWorkerLeave(
  leaveId: string,
  status: "APPROVED" | "REJECTED",
  reviewNotes?: string
): Promise<WorkerLeave> {
  const res = await fetch(`${API_BASE_URL}/worker/leave-applications/${leaveId}/review`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({
      status,
      review_notes: reviewNotes,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Review action failed" }));
    throw new Error(err.detail || "Failed to update leave status");
  }

  return res.json();
}

