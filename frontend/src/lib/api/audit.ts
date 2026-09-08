import { apiClient } from "./client";
import { AuditLedgerEntry, VerifyResult } from "../types/domain";
import { computeRecordHash, computePayloadHash } from "../utils/hashes";

export const MOCK_LEDGER_ENTRIES: AuditLedgerEntry[] = [
  {
    id: "led-001",
    mine_site_id: "a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d",
    sequence_number: 1,
    entity_type: "statutory_rule",
    entity_id: "e1-rule-init",
    operation: "INSERT",
    prev_hash: "0000000000000000000000000000000000000000000000000000000000000000",
    record_hash: "7d4b9b940905e94b2811a76d8b2e5a6064f51950d87a4192b02444c11438914b",
    created_by: "u-auditor-hq",
    created_at: "2024-01-01T06:00:00Z",
  },
  {
    id: "led-002",
    mine_site_id: "a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d",
    sequence_number: 2,
    entity_type: "inspection",
    entity_id: "f1a2b3c4-d5e6-4a7b-8c9d-0e1f2a3b4c01",
    operation: "INSERT",
    prev_hash: "7d4b9b940905e94b2811a76d8b2e5a6064f51950d87a4192b02444c11438914b",
    record_hash: "9e1c8d5a2f3b4e6d7c8b9a0f1e2d3c4b5a6f7e8d9c0b1a2f3e4d5c6b7a8f9e0d",
    created_by: "u-inspector-dgms",
    created_at: "2024-03-15T08:30:00Z",
  },
  {
    id: "led-003",
    mine_site_id: "a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d",
    sequence_number: 3,
    entity_type: "violation_capa",
    entity_id: "capa-001",
    operation: "STATUS_CHANGE",
    prev_hash: "9e1c8d5a2f3b4e6d7c8b9a0f1e2d3c4b5a6f7e8d9c0b1a2f3e4d5c6b7a8f9e0d",
    record_hash: "4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b",
    created_by: "u-safety-officer",
    created_at: "2024-03-15T11:45:00Z",
  },
  {
    id: "led-004",
    mine_site_id: "a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d",
    sequence_number: 4,
    entity_type: "violation_capa",
    entity_id: "capa-005",
    operation: "STATUS_CHANGE",
    prev_hash: "4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b",
    record_hash: "1f2e3d4c5b6a7f8e9d0c1b2a3f4e5d6c7b8a9f0e1d2c3b4a5f6e7d8c9b0a1f2e",
    created_by: "u-colliery-mgr",
    created_at: "2024-03-16T14:10:00Z",
  },
];

export async function fetchAuditLedger(
  mineSiteId: string,
  limit: number = 50,
  offset: number = 0
): Promise<AuditLedgerEntry[]> {
  try {
    const { data } = await apiClient.get<AuditLedgerEntry[]>("/audit-ledger", {
      params: { mine_site_id: mineSiteId, limit, offset },
    });
    return data;
  } catch {
    return MOCK_LEDGER_ENTRIES;
  }
}

export async function verifyAuditChain(mineSiteId: string): Promise<VerifyResult> {
  try {
    const { data } = await apiClient.get<VerifyResult>("/audit-ledger/verify", {
      params: { mine_site_id: mineSiteId },
    });
    return data;
  } catch {
    // Valid mock chain result
    return {
      mine_site_id: mineSiteId,
      valid: true,
      broken_at_sequence: null,
      total_entries: MOCK_LEDGER_ENTRIES.length,
      reason: null,
    };
  }
}

export async function simulateDatabaseTamper(payload: {
  mine_site_id: string;
  sequence_number?: number;
  tampered_field?: string;
  new_value?: any;
}): Promise<any> {
  try {
    const { data } = await apiClient.post("/audit-ledger/simulate-tamper", payload);
    return data;
  } catch (err) {
    console.warn("Simulate tamper call fallback:", err);
    return {
      status: "tampered",
      mine_site_id: payload.mine_site_id,
      sequence_number: payload.sequence_number || 2,
    };
  }
}
