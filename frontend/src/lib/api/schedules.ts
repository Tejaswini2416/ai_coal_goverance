import { apiClient } from "./client";
import { InspectionSchedule } from "../types/domain";

export async function fetchSchedules(mineSiteId?: string | null, status?: string): Promise<InspectionSchedule[]> {
  try {
    const params: Record<string, string> = {};
    if (mineSiteId) params.mine_site_id = mineSiteId;
    if (status) params.status = status;
    const res = await apiClient.get<InspectionSchedule[]>("/schedules", { params });
    return res.data;
  } catch (err) {
    console.warn("Using offline mock schedules fallback", err);
    return [
      {
        id: "sched-101",
        mine_site_id: mineSiteId || "mine-01",
        assigned_inspector_id: "insp-01",
        inspector_name: "DGMS Inspector R. Sharma",
        inspection_title: "Ventilation Shaft 3 & Methane Telemetry Audit",
        inspection_type: "VENTILATION_CHECK",
        scheduled_date: new Date().toISOString().split("T")[0],
        due_date: new Date(Date.now() + 86400000 * 2).toISOString().split("T")[0],
        status: "ASSIGNED",
        priority: "HIGH",
        notes: "Verify automatic methane cut-off sensors on continuous miner.",
        created_at: new Date().toISOString(),
      },
      {
        id: "sched-102",
        mine_site_id: mineSiteId || "mine-01",
        assigned_inspector_id: "insp-02",
        inspector_name: "DGMS Inspector A. Verma",
        inspection_title: "Haul Road Gradient & Berm Safety Audit",
        inspection_type: "HAUL_ROAD_AUDIT",
        scheduled_date: new Date(Date.now() - 86400000 * 4).toISOString().split("T")[0],
        due_date: new Date(Date.now() - 86400000 * 1).toISOString().split("T")[0],
        status: "OVERDUE",
        priority: "CRITICAL",
        notes: "Overdue statutory audit. Escalated to Colliery Manager.",
        created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
      },
      {
        id: "sched-103",
        mine_site_id: mineSiteId || "mine-01",
        assigned_inspector_id: "insp-01",
        inspector_name: "DGMS Inspector R. Sharma",
        inspection_title: "Underground Escape Route & Refuge Chamber Test",
        inspection_type: "SAFETY_AUDIT",
        scheduled_date: new Date(Date.now() + 86400000 * 5).toISOString().split("T")[0],
        due_date: new Date(Date.now() + 86400000 * 7).toISOString().split("T")[0],
        status: "SCHEDULED",
        priority: "HIGH",
        created_at: new Date().toISOString(),
      },
    ];
  }
}

export async function createSchedule(data: {
  mine_site_id: string;
  assigned_inspector_id: string;
  inspector_name: string;
  inspection_title: string;
  inspection_type: string;
  scheduled_date: string;
  due_date: string;
  priority: string;
  notes?: string;
}): Promise<InspectionSchedule> {
  const res = await apiClient.post<InspectionSchedule>("/schedules", data);
  return res.data;
}

export async function updateScheduleStatus(
  scheduleId: string,
  status: string,
  completedInspectionId?: string,
  notes?: string
): Promise<InspectionSchedule> {
  const res = await apiClient.patch<InspectionSchedule>(`/schedules/${scheduleId}/status`, {
    status,
    completed_inspection_id: completedInspectionId,
    notes,
  });
  return res.data;
}

export async function triggerCheckOverdue(): Promise<{ status: string; escalated_count: number }> {
  const res = await apiClient.post<{ status: string; escalated_count: number }>("/schedules/check-overdue", {});
  return res.data;
}
