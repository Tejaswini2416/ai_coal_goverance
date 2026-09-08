import { apiClient } from "./client";
import { AppNotification } from "../types/domain";

export async function fetchNotifications(mineSiteId?: string | null): Promise<AppNotification[]> {
  try {
    const params: Record<string, string> = {};
    if (mineSiteId) params.mine_site_id = mineSiteId;
    const res = await apiClient.get<AppNotification[]>("/notifications", { params });
    return res.data;
  } catch (err) {
    console.warn("Using offline mock notifications fallback", err);
    return [
      {
        id: "notif-1",
        mine_site_id: mineSiteId || "mine-01",
        title: "CRITICAL: Haul Road Geofence Breach Detected",
        message: "Surface Dumper #84 entered unapproved overburden perimeter at Sector 4.",
        category: "GEOFENCE_BREACH",
        severity: "CRITICAL",
        channel: "IN_APP",
        is_read: false,
        is_acknowledged: false,
        escalation_level: 1,
        escalated_to_role: "COLLIERY_MANAGER",
        created_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
      },
      {
        id: "notif-2",
        mine_site_id: mineSiteId || "mine-01",
        title: "Statutory Inspection Overdue: Slope Stability Audit",
        message: "Mandatory DGMS slope stability audit was due on yesterday and is unfulfilled.",
        category: "INSPECTION_OVERDUE",
        severity: "URGENT",
        channel: "EMAIL",
        is_read: false,
        is_acknowledged: false,
        escalation_level: 1,
        escalated_to_role: "MINISTRY_AUDITOR",
        created_at: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
      },
      {
        id: "notif-3",
        mine_site_id: mineSiteId || "mine-01",
        title: "Elevated CO Gas Exposure Alert (38 ppm)",
        message: "Worker Ramesh Kumar (W-901) logged check-in at Level-3 Seam with elevated CO gas reading.",
        category: "ATTENDANCE_HAZARD",
        severity: "WARNING",
        channel: "SMS_PUSH",
        is_read: true,
        is_acknowledged: true,
        acknowledged_by_name: "Safety Officer",
        acknowledgement_note: "Ventilation auxiliary fan #2 started. Seam cleared.",
        acknowledged_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
        escalation_level: 0,
        created_at: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
      },
    ];
  }
}

export async function acknowledgeNotification(
  notificationId: string,
  acknowledgementNote: string
): Promise<AppNotification> {
  const res = await apiClient.post<AppNotification>(`/notifications/${notificationId}/acknowledge`, {
    acknowledgement_note: acknowledgementNote,
  });
  return res.data;
}

export async function markNotificationRead(notificationId: string): Promise<AppNotification> {
  const res = await apiClient.post<AppNotification>(`/notifications/${notificationId}/read`);
  return res.data;
}

export async function fetchEscalations(): Promise<AppNotification[]> {
  try {
    const res = await apiClient.get<AppNotification[]>("/notifications/escalations");
    return res.data;
  } catch (err) {
    console.warn("Using offline mock escalations fallback", err);
    return [];
  }
}
