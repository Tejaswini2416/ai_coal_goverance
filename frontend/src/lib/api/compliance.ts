import { apiClient } from "./client";
import { StatutorySchedule, ComplianceAlert } from "../types/domain";

export const MOCK_SCHEDULES: StatutorySchedule[] = [
  {
    id: "sch-01",
    mine_site_id: "a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d",
    rule_id: "rule-dgms-01",
    permit_number: "DGMS/WZ/2023/PERMIT-8841",
    permit_type: "Underground Mining Statutory Permission (Reg 106)",
    issued_date: "2024-01-15",
    expiry_date: new Date(Date.now() + 86400000 * 4).toISOString().split("T")[0], // 4 days remaining (CRITICAL / HIGH)
    status: "EXPIRING",
    last_alerted_days: 7,
  },
  {
    id: "sch-02",
    mine_site_id: "a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d",
    rule_id: "rule-moef-02",
    permit_number: "MoEFCC/EC/MINING/2022/SECL-77",
    permit_type: "Environmental Clearance (Air/Water Consent to Operate)",
    issued_date: "2022-06-10",
    expiry_date: new Date(Date.now() + 86400000 * 14).toISOString().split("T")[0], // 14 days remaining (MEDIUM)
    status: "EXPIRING",
    last_alerted_days: 15,
  },
  {
    id: "sch-03",
    mine_site_id: "a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d",
    rule_id: "rule-cpcb-03",
    permit_number: "CPCB/EFFLUENT/2024/09",
    permit_type: "Zero Liquid Discharge & Sump Treatment Authorization",
    issued_date: "2024-03-01",
    expiry_date: new Date(Date.now() + 86400000 * 28).toISOString().split("T")[0], // 28 days remaining
    status: "ACTIVE",
    last_alerted_days: 30,
  },
  {
    id: "sch-04",
    mine_site_id: "a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d",
    rule_id: "rule-explosives-04",
    permit_number: "PESO/MAG/WZ/2023/5112",
    permit_type: "PESO Bulk Emulsion Magazine & Detonator License",
    issued_date: "2023-11-20",
    expiry_date: new Date(Date.now() + 86400000 * 180).toISOString().split("T")[0], // 180 days remaining (safe)
    status: "ACTIVE",
  },
];

export const MOCK_ALERTS: ComplianceAlert[] = [
  {
    id: "alt-01",
    mine_site_id: "a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d",
    schedule_id: "sch-01",
    severity: "HIGH",
    days_until_expiry: 4,
    is_acknowledged: false,
    created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
  },
  {
    id: "alt-02",
    mine_site_id: "a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d",
    schedule_id: "sch-02",
    severity: "MEDIUM",
    days_until_expiry: 14,
    is_acknowledged: false,
    created_at: new Date(Date.now() - 3600000 * 18).toISOString(),
  },
];

export async function fetchComplianceSchedules(mineSiteId: string): Promise<StatutorySchedule[]> {
  try {
    const { data } = await apiClient.get<StatutorySchedule[]>("/compliance/schedules", {
      params: { mine_site_id: mineSiteId },
    });
    return data;
  } catch {
    return MOCK_SCHEDULES;
  }
}

export async function fetchComplianceAlerts(mineSiteId: string): Promise<ComplianceAlert[]> {
  try {
    const { data } = await apiClient.get<ComplianceAlert[]>("/compliance/alerts", {
      params: { mine_site_id: mineSiteId },
    });
    return data;
  } catch {
    return MOCK_ALERTS;
  }
}

export async function acknowledgeAlert(alertId: string): Promise<void> {
  try {
    await apiClient.post(`/compliance/alerts/${alertId}/acknowledge`);
  } catch {
    const found = MOCK_ALERTS.find((a) => a.id === alertId);
    if (found) found.is_acknowledged = true;
  }
}
