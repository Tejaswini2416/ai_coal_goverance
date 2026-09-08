import { API_BASE_URL } from "./client";
import { useAuthStore } from "../store/auth-store";

export interface RiskAnalysisData {
  mine_site_id: string;
  mine_name: string;
  total_score: number;
  risk_level: "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
  sub_scores: {
    gas_atmospheric_score?: number;
    capa_violations_score?: number;
    mine_depth_gassiness_score?: number;
    equipment_slope_score?: number;
    staleness_uncertainty_penalty?: number;
  };
  critical_triggers: string[];
  input_parameters: {
    depth_meters: number;
    gassy_seam_degree: number;
    ch4_percentage: number;
    co_ppm: number;
    co_rate_of_rise_ppm_hr: number;
    o2_percentage: number;
    active_violations: Array<{ id: string; severity: string; capa_state: string; description: string }>;
    overdue_maintenance_count: number;
    overdue_inspections_count: number;
    last_telemetry_timestamp?: string;
    slope_factor_of_safety?: number;
    recent_rainfall_mm?: number;
  };
  historical_trend_72h: Array<{
    timestamp: string;
    label: string;
    is_forecast?: boolean;
    actual_risk_score: number | null;
    predicted_risk_score: number | null;
    ci_lower?: number | null;
    ci_upper?: number | null;
    ch4_pct: number;
    co_ppm: number;
    temperature_c?: number;
  }>;
  ml_anomalies: {
    is_anomaly: boolean;
    anomaly_score?: number;
    triggers?: string[];
    flatline_detected?: boolean;
    details?: string;
  };
  predictive_forecast_72h?: {
    forecast_generated_at: string;
    timeline_series: Array<any>;
    day_forecasts: Array<{
      day: number;
      target_hours: number;
      target_timestamp: string;
      predicted_risk_score: number;
      confidence_interval_95: [number, number];
      predicted_ch4_pct: number;
      ch4_breach_probability: number;
      predicted_co_ppm: number;
      predicted_co_heating_rate_ppm_hr: number;
      spontaneous_combustion_warning: boolean;
      status: string;
    }>;
    forecast_warnings: string[];
    trend_slopes?: {
      ch4_slope_per_hour: number;
      co_slope_per_hour: number;
    };
  };
  calculated_at: string;
}

export async function fetchPredictiveForecast(mineSiteId?: string | null): Promise<any> {
  const token = useAuthStore.getState().accessToken;
  const url = new URL(`${API_BASE_URL}/risk/forecast`);
  if (mineSiteId) url.searchParams.append("mine_site_id", mineSiteId);

  const res = await fetch(url.toString(), {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (!res.ok) throw new Error("Failed to fetch predictive forecast");
  return res.json();
}

export async function fetchRiskAnalysis(mineSiteId?: string | null): Promise<RiskAnalysisData> {
  const token = useAuthStore.getState().accessToken;
  const url = new URL(`${API_BASE_URL}/risk/current`);
  if (mineSiteId) {
    url.searchParams.append("mine_site_id", mineSiteId);
  }

  const res = await fetch(url.toString(), {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch risk analysis: ${res.statusText}`);
  }

  return await res.json();
}
