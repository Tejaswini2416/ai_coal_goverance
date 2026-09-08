import { OfficialEscalationRequest, OfficialEscalationResponse } from "@/lib/types/domain";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

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

export async function dispatchOfficialEscalation(
  data: OfficialEscalationRequest
): Promise<OfficialEscalationResponse> {
  const response = await fetch(`${BASE_URL}/escalations/dispatch`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ detail: "Escalation dispatch failed" }));
    throw new Error(err.detail || "Failed to dispatch official statutory escalation");
  }

  return response.json();
}

export async function fetchEscalationHistory(
  mineSiteId?: string | null
): Promise<any[]> {
  const url = mineSiteId
    ? `${BASE_URL}/escalations/history?mine_site_id=${mineSiteId}`
    : `${BASE_URL}/escalations/history`;

  const response = await fetch(url, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    return [];
  }

  return response.json();
}
