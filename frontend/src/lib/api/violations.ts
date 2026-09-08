import { apiClient } from "./client";
import { ViolationCAPA, CAPAState } from "../types/domain";

export const MOCK_CAPAS: ViolationCAPA[] = [
  {
    id: "capa-001",
    inspection_id: "f1a2b3c4-d5e6-4a7b-8c9d-0e1f2a3b4c03",
    rule_id: "rule-dgms-sec22-01",
    capa_state: CAPAState.REPORTED,
    description: "Geofence boundary breach detected on East perimeter overburden dumping. Violation of CMR 2017 Reg 108.",
    evidence_urls: ["coal-evidence/pit1/breach-pillar.jpg"],
    version: 1,
    assigned_to: null,
    verified_by: null,
    closed_at: null,
    created_at: new Date(Date.now() - 3600000 * 36).toISOString(),
  },
  {
    id: "capa-002",
    inspection_id: "f1a2b3c4-d5e6-4a7b-8c9d-0e1f2a3b4c01",
    rule_id: "rule-dgms-vent-04",
    capa_state: CAPAState.NOTICE_ISSUED,
    description: "Auxiliary ventilation duct disconnected at Panel 7 header. Formal DGMS Form-IV statutory notice issued.",
    evidence_urls: ["coal-evidence/pit1/vent-flaw.jpg"],
    version: 2,
    assigned_to: null,
    verified_by: null,
    closed_at: null,
    created_at: new Date(Date.now() - 3600000 * 20).toISOString(),
  },
  {
    id: "capa-003",
    inspection_id: "f1a2b3c4-d5e6-4a7b-8c9d-0e1f2a3b4c02",
    rule_id: "rule-cpcb-air-02",
    capa_state: CAPAState.ASSIGNED,
    description: "Dust suppression water nozzle pressure drop on haul road #3. Assigned to Colliery Mechanical Division.",
    evidence_urls: ["coal-evidence/pit1/nozzle.jpg"],
    version: 3,
    assigned_to: "Colliery Mech Eng (Er. Manoj)",
    verified_by: null,
    closed_at: null,
    created_at: new Date(Date.now() - 3600000 * 12).toISOString(),
  },
  {
    id: "capa-004",
    inspection_id: "f1a2b3c4-d5e6-4a7b-8c9d-0e1f2a3b4c01",
    rule_id: "rule-dgms-flameproof-09",
    capa_state: CAPAState.RECTIFICATION_SUBMITTED,
    description: "Flameproof cable gland replaced on transformer room feeder. Compliance photo and test certificate uploaded.",
    evidence_urls: ["coal-evidence/pit1/rectified-gland.jpg"],
    version: 4,
    assigned_to: "Electrical Supv (S. Soren)",
    verified_by: null,
    closed_at: null,
    created_at: new Date(Date.now() - 3600000 * 6).toISOString(),
  },
  {
    id: "capa-005",
    inspection_id: "f1a2b3c4-d5e6-4a7b-8c9d-0e1f2a3b4c02",
    rule_id: "rule-dgms-haulage-11",
    capa_state: CAPAState.VERIFIED,
    description: "Emergency trip wire re-tensioned and certified by DGMS Inspector.",
    evidence_urls: ["coal-evidence/pit1/tripwire.jpg"],
    version: 5,
    assigned_to: "Safety Team",
    verified_by: "Er. A. K. Verma (DGMS)",
    closed_at: null,
    created_at: new Date(Date.now() - 3600000 * 48).toISOString(),
  },
  {
    id: "capa-006",
    inspection_id: "f1a2b3c4-d5e6-4a7b-8c9d-0e1f2a3b4c01",
    rule_id: "rule-cpcb-water-03",
    capa_state: CAPAState.CLOSED,
    description: "Sump discharge pH neutralizer dosing unit recalibrated and water laboratory certificate cleared.",
    evidence_urls: ["coal-evidence/pit1/ph-cleared.jpg"],
    version: 6,
    assigned_to: "Environmental Eng",
    verified_by: "Dr. R. K. Sharma (MOC)",
    closed_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    created_at: new Date(Date.now() - 3600000 * 72).toISOString(),
  },
];

export async function fetchCAPAs(mineSiteId?: string): Promise<ViolationCAPA[]> {
  try {
    const { data } = await apiClient.get<ViolationCAPA[]>("/violations", {
      params: mineSiteId ? { mine_site_id: mineSiteId } : {},
    });
    return data;
  } catch {
    return MOCK_CAPAS;
  }
}

export async function transitionCAPA(params: {
  capa_id: string;
  to_state: CAPAState;
  mine_site_id: string;
  evidence_urls?: string[];
  assigned_to?: string | null;
}): Promise<ViolationCAPA> {
  try {
    const { data } = await apiClient.post<ViolationCAPA>(
      `/violations/${params.capa_id}/transition`,
      {
        to_state: params.to_state,
        mine_site_id: params.mine_site_id,
        evidence_urls: params.evidence_urls,
        assigned_to: params.assigned_to,
      }
    );
    return data;
  } catch {
    // Fallback simulation in UI
    const found = MOCK_CAPAS.find((c) => c.id === params.capa_id);
    if (found) {
      found.capa_state = params.to_state;
      found.version += 1;
      if (params.evidence_urls) found.evidence_urls.push(...params.evidence_urls);
      return { ...found };
    }
    throw new Error("CAPA record not found");
  }
}
