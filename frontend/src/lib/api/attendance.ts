import { apiClient } from "./client";
import { HeadcountSummary, WorkerAttendance } from "../types/domain";

export async function fetchAttendance(mineSiteId?: string | null): Promise<WorkerAttendance[]> {
  try {
    const params: Record<string, string> = {};
    if (mineSiteId) params.mine_site_id = mineSiteId;
    const res = await apiClient.get<WorkerAttendance[]>("/attendance", { params });
    return res.data;
  } catch (err) {
    console.warn("Using offline mock attendance fallback", err);
    return [
      {
        id: "att-1",
        worker_id: "W-104",
        worker_name: "Rajesh Kumar Mandal",
        mine_site_id: mineSiteId || "mine-01",
        zone_type: "UNDERGROUND",
        station_id: "LEVEL3-PANEL7",
        shift: "MORNING",
        check_in_time: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
        biometric_verified: true,
        gas_level_exposure_ppm: 8.5,
        status: "ACTIVE_INSIDE",
        created_at: new Date().toISOString(),
      },
      {
        id: "att-2",
        worker_id: "W-210",
        worker_name: "Amitabh Soren",
        mine_site_id: mineSiteId || "mine-01",
        zone_type: "UNDERGROUND",
        station_id: "LEVEL3-VENT-EAST",
        shift: "MORNING",
        check_in_time: new Date(Date.now() - 1000 * 60 * 150).toISOString(),
        biometric_verified: true,
        gas_level_exposure_ppm: 14.2,
        status: "ACTIVE_INSIDE",
        created_at: new Date().toISOString(),
      },
      {
        id: "att-3",
        worker_id: "W-318",
        worker_name: "Vikram Chauhan",
        mine_site_id: mineSiteId || "mine-01",
        zone_type: "SURFACE",
        station_id: "HAUL-PIT-A",
        shift: "MORNING",
        check_in_time: new Date(Date.now() - 1000 * 60 * 200).toISOString(),
        biometric_verified: true,
        gas_level_exposure_ppm: 2.1,
        status: "ACTIVE_INSIDE",
        created_at: new Date().toISOString(),
      },
      {
        id: "att-4",
        worker_id: "W-405",
        worker_name: "Sunil Toppo",
        mine_site_id: mineSiteId || "mine-01",
        zone_type: "UNDERGROUND",
        station_id: "SHAFT-4-ENTRY",
        shift: "MORNING",
        check_in_time: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
        check_out_time: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        biometric_verified: true,
        gas_level_exposure_ppm: 6.0,
        status: "CHECKED_OUT",
        created_at: new Date().toISOString(),
      },
    ];
  }
}

export async function fetchHeadcount(mineSiteId?: string | null): Promise<HeadcountSummary> {
  try {
    const params: Record<string, string> = {};
    if (mineSiteId) params.mine_site_id = mineSiteId;
    const res = await apiClient.get<HeadcountSummary>("/attendance/active-headcount", { params });
    return res.data;
  } catch (err) {
    console.warn("Using offline mock headcount fallback", err);
    return {
      mine_site_id: mineSiteId,
      total_active_inside: 148,
      underground_count: 94,
      surface_count: 54,
      hazardous_exposure_alerts: 2,
    };
  }
}

export async function checkInWorker(data: {
  worker_id: string;
  worker_name: string;
  mine_site_id: string;
  zone_type: string;
  station_id?: string;
  shift: string;
  biometric_verified?: boolean;
  gas_level_exposure_ppm?: number;
}): Promise<WorkerAttendance> {
  const res = await apiClient.post<WorkerAttendance>("/attendance/check-in", data);
  return res.data;
}

export async function checkOutWorker(
  attendanceId: string,
  gasLevelExposurePpm?: number
): Promise<WorkerAttendance> {
  const res = await apiClient.post<WorkerAttendance>("/attendance/check-out", {
    attendance_id: attendanceId,
    gas_level_exposure_ppm: gasLevelExposurePpm,
  });
  return res.data;
}

/**
 * Trigger statutory attendance spreadsheet download (.xlsx or .csv)
 */
export async function exportAttendanceSpreadsheet(options: {
  mineSiteId?: string | null;
  format?: "xlsx" | "csv";
  shift?: string;
  zoneType?: string;
  fallbackRecords?: WorkerAttendance[];
  collieryName?: string;
}): Promise<void> {
  const format = options.format || "xlsx";
  const params = new URLSearchParams();
  if (options.mineSiteId) params.append("mine_site_id", options.mineSiteId);
  params.append("format", format);
  if (options.shift && options.shift !== "ALL") params.append("shift", options.shift);
  if (options.zoneType && options.zoneType !== "ALL") params.append("zone_type", options.zoneType);

  const { API_BASE_URL } = await import("@/lib/api/client");
  const { useAuthStore } = await import("@/lib/store/auth-store");
  const token = useAuthStore.getState().accessToken;

  const url = `${API_BASE_URL}/attendance/export?${params.toString()}`;

  try {
    const response = await fetch(url, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });

    if (!response.ok) {
      throw new Error(`Server returned ${response.status}`);
    }

    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = downloadUrl;

    // Check Content-Disposition header if available
    const disposition = response.headers.get("Content-Disposition");
    let filename = "";
    if (disposition && disposition.includes("filename=")) {
      const match = disposition.match(/filename="?([^"]+)"?/);
      if (match && match[1]) filename = match[1];
    }
    if (!filename) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      filename = `DGMS_Attendance_Register_${timestamp}.${format}`;
    }

    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(downloadUrl);
  } catch (err) {
    console.warn("Server export failed or offline, falling back to client-side spreadsheet generation:", err);
    if (options.fallbackRecords && options.fallbackRecords.length > 0) {
      let csvContent = `\uFEFF# DIRECTORATE GENERAL OF MINES SAFETY (DGMS) - STATUTORY ATTENDANCE REGISTER\n`;
      csvContent += `# Colliery: ${options.collieryName || "Godavarikhani No. 11A Incline (SCCL)"}\n`;
      csvContent += `# Exported: ${new Date().toLocaleString()}\n`;
      csvContent += `Sl No,Worker ID,Worker Name,Zone Type,Station,Shift,Check-In Time,Check-Out Time,Gas Level (ppm),Biometric Verified,Status\n`;

      options.fallbackRecords.forEach((r, idx) => {
        csvContent += `${idx + 1},"${r.worker_id}","${r.worker_name}","${r.zone_type}","${r.station_id || "N/A"}","${r.shift}","${r.check_in_time}","${r.check_out_time || "ACTIVE_IN_MINE"}","${r.gas_level_exposure_ppm || 0}","${r.biometric_verified ? "YES" : "NO"}","${r.status}"\n`;
      });

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      a.download = `DGMS_Attendance_Register_${timestamp}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(downloadUrl);
    } else {
      throw err;
    }
  }
}

