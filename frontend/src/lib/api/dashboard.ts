import { apiClient } from "./client";
import { DashboardSummaryData } from "../types/domain";

export async function fetchDashboardSummary(
  mineSiteId?: string,
  roleOverride?: string
): Promise<DashboardSummaryData> {
  try {
    const { data } = await apiClient.get<DashboardSummaryData>("/dashboard/summary", {
      params: {
        mine_site_id: mineSiteId,
        role_override: roleOverride,
      },
    });
    return data;
  } catch (err) {
    console.warn("Failed to fetch dashboard summary from backend, using fallback mock data:", err);
    return getFallbackDashboardSummary(roleOverride || "MINISTRY_AUDITOR");
  }
}

export function getFallbackDashboardSummary(role: string): DashboardSummaryData {
  const roleUpper = (role || "MINISTRY_AUDITOR").toUpperCase();

  let userName = "Dr. R. K. Sharma (MOC Auditor)";
  let metrics: Record<string, any> = {};

  if (roleUpper.includes("INSPECTOR")) {
    userName = "Er. A. K. Verma (DGMS Inspector)";
    metrics = {
      kpi: {
        assigned_sites_count: 3,
        inspections_completed_month: 16,
        pending_verifications: 2,
        compliance_pass_rate: 94.8,
      },
      assigned_sites: [
        {
          id: "sch-001",
          mine_site_id: "a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d",
          title: "Quarterly Ventilation & Gas Telemetry Audit",
          type: "VENTILATION_CHECK",
          due_date: new Date().toISOString().split("T")[0],
          status: "ASSIGNED",
          priority: "HIGH",
          is_geofence_verified: true,
          location_target: "Level 3 Panel 7 Underground",
        },
        {
          id: "sch-002",
          mine_site_id: "a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d",
          title: "Haul Road Berm & Gradient Verification",
          type: "HAUL_ROAD_AUDIT",
          due_date: new Date(Date.now() + 86400000 * 2).toISOString().split("T")[0],
          status: "SCHEDULED",
          priority: "MEDIUM",
          is_geofence_verified: true,
          location_target: "Sector 4 Surface Pit",
        },
        {
          id: "sch-003",
          mine_site_id: "a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d",
          title: "Continuous Miner Flameproof Electrical Seal Audit",
          type: "ELECTRICAL_SAFETY",
          due_date: new Date(Date.now() + 86400000 * 5).toISOString().split("T")[0],
          status: "SCHEDULED",
          priority: "CRITICAL",
          is_geofence_verified: true,
          location_target: "Sub-station Section B",
        },
      ],
      inspected_history: [
        {
          id: "insp-01",
          title: "DGMS Monthly Safety & Dust Suppression Audit",
          date: "2026-09-04 11:30",
          location_type: "UNDERGROUND_STATION",
          risk_score: 18,
          is_geofence_breached: false,
          capa_status: "VERIFIED",
          form_iv_available: true,
        },
        {
          id: "insp-02",
          title: "Surface Overburden Slope Stability Check",
          date: "2026-09-01 14:15",
          location_type: "SURFACE_GPS",
          risk_score: 45,
          is_geofence_breached: false,
          capa_status: "PENDING_VERIFICATION",
          form_iv_available: true,
        },
      ],
      statutory_alerts: [
        { rule: "CMR Reg 108", desc: "Methane monitor calibration due within 48h", severity: "HIGH" },
        { rule: "CMR Reg 162", desc: "Primary intake airway velocity 1.8 m/s (Normal)", severity: "INFO" },
      ],
    };
  } else if (roleUpper.includes("MANAGER") || roleUpper.includes("SAFETY")) {
    userName = "Suresh Patel (Colliery Manager)";
    metrics = {
      safety_risk_score: 32,
      risk_level: "LOW",
      risk_breakdown: {
        violations_score: 12,
        depth_score: 10,
        gas_seam_score: 6,
        equipment_score: 4,
        mine_depth_meters: 280.0,
        gas_seam_degree: "Degree II (Gassy Seam)",
        active_violations_count: 3,
      },
      hazard_alerts: [
        {
          id: "alert-01",
          title: "CO Rate-of-Rise Warning (>3.2 ppm/hr)",
          message: "Continuous gas detector detected CO buildup in Return Gallery #4.",
          severity: "CRITICAL",
          category: "GAS_HAZARD",
          created_at: "10:14 AM",
          is_acknowledged: false,
        },
        {
          id: "alert-02",
          title: "Haul Road Dust Excursion (>2.5 mg/m3)",
          message: "Particulate matter PM10 threshold exceeded at Loading Point C.",
          severity: "HIGH",
          category: "ENVIRONMENTAL",
          created_at: "09:30 AM",
          is_acknowledged: false,
        },
      ],
      inspection_feed: [
        { id: "f1", title: "Shift Ventilation Check", location: "LEVEL3-PANEL7", risk_score: 18, passed: true, date: "Sep 07" },
        { id: "f2", title: "Haul Road Gradient Audit", location: "SURFACE_GPS", risk_score: 25, passed: true, date: "Sep 06" },
        { id: "f3", title: "Transformer Sub-station Audit", location: "LEVEL2-ELEC", risk_score: 65, passed: false, date: "Sep 05" },
      ],
      muster_summary: {
        total_inside: 148,
        underground_count: 112,
        surface_count: 36,
        overtime_flagged: 4,
      },
      muster_list: [
        { id: "w1", worker_id: "W-104", worker_name: "Rajesh Kumar Mandal", zone_type: "UNDERGROUND", station_id: "LEVEL3-PANEL7", shift: "MORNING", check_in_time: "06:00", gas_level_ppm: 8.5, overtime_warning: false },
        { id: "w2", worker_id: "W-210", worker_name: "Amitabh Soren", zone_type: "UNDERGROUND", station_id: "LEVEL3-VENT-EAST", shift: "MORNING", check_in_time: "06:02", gas_level_ppm: 14.2, overtime_warning: false },
        { id: "w3", worker_id: "W-318", worker_name: "Vikram Chauhan", zone_type: "SURFACE", station_id: "HAUL-PIT-A", shift: "MORNING", check_in_time: "05:45", gas_level_ppm: 2.1, overtime_warning: true },
        { id: "w4", worker_id: "W-405", worker_name: "Dilip Hembram", zone_type: "UNDERGROUND", station_id: "DRIFT-NORTH-2", shift: "MORNING", check_in_time: "06:15", gas_level_ppm: 6.8, overtime_warning: false },
      ],
    };
  } else if (roleUpper.includes("WORKER") || roleUpper.includes("SIRDAR")) {
    userName = "Rajesh Kumar Mandal (Mining Sirdar)";
    metrics = {
      worker_profile: {
        worker_id: "W-104",
        worker_name: "Rajesh Kumar Mandal",
        designation: "Certified Mining Sirdar / Gas Testing Overman",
        active_mine: "Godavarikhani No. 11A Incline (GDK-11A) SCCL",
        assigned_zone: "Level 3 Return Airway (Panel 7)",
        shift: "Morning Shift (06:00 AM - 02:00 PM)",
        biometric_status: "VERIFIED_PRESENT",
        check_in_time: "06:00 AM",
        hours_logged_today: "5.5 hrs",
        overtime_hours_this_week: "1.5 hrs (Within statutory 8h limit)",
      },
      gas_telemetry_live: {
        ch4_methane_pct: 0.42,
        ch4_status: "SAFE",
        ch4_limit_pct: 1.25,
        co_carbon_monoxide_ppm: 8.5,
        co_status: "NORMAL",
        co_limit_ppm: 50.0,
        airflow_velocity_mps: 2.4,
        airflow_status: "ADEQUATE",
        ambient_temp_c: 27.8,
      },
      statutory_safety_rules: [
        {
          rule_code: "CMR 2017 Reg 108",
          title: "Methane Check Before Machine Startup",
          directive: "Inspect with approved methanometer within 100m of working face prior to continuous miner energization.",
          importance: "MANDATORY",
        },
        {
          rule_code: "CMR 2017 Reg 162",
          title: "Face Airflow & Auxiliary Ventilation",
          directive: "Ensure brattice ventilation curtain is within 4.5m of the working coal face at all times.",
          importance: "CRITICAL",
        },
        {
          rule_code: "CMR 2017 Reg 144",
          title: "Support Rule Compliance (Roof Bolting)",
          directive: "Sound roof and test roof bolts every 1.2m intervals before workers enter newly exposed cuts.",
          importance: "HIGH",
        },
      ],
      sos_protocol: {
        emergency_hotline: "Pit-Bottom Dial #101 / Control Room 07752-240101",
        refuge_chamber_location: "Refuge Chamber 3B (180m West of Panel 7 Intake)",
        evacuation_route: "Intake Airway (Green Beacon Marked Route) ➔ Shaft #2 Cage",
      },
    };
  } else if (roleUpper.includes("CONTRACTOR")) {
    userName = "Vikram Chauhan (Contractor In-charge)";
    metrics = {
      assigned_working_zones: [
        { zone_id: "ZN-EAST-01", name: "Eastern Overburden Haul Ramp", type: "OPENCAST_HAULAGE", allocated_manpower: 42, present_today: 38, status: "OPERATIONAL" },
        { zone_id: "ZN-CRUSH-02", name: "CHPP Feeder Hopper & Screening Shed", type: "PROCESSING", allocated_manpower: 24, present_today: 24, status: "OPERATIONAL" },
        { zone_id: "ZN-PIT-04", name: "Overburden Shovel Bench #4", type: "HEAVY_EXCAVATION", allocated_manpower: 30, present_today: 28, status: "SAFETY_RESTRICTED" },
      ],
      production_overview: {
        shift_target_tonnes: 4800,
        shift_actual_tonnes: 4550,
        completion_pct: 94.8,
        dispatch_trips_completed: 142,
        trips_pending: 18,
        production_loss_hours: 1.2,
        loss_reason: "Dust suppression tanker sprinkler replenishment stop",
      },
      fleet_telemetry: [
        { vehicle_id: "DUMP-84", type: "100-Tonne Dumper", operator: "Mohan Lal", speed_kmh: 22.4, speed_limit_kmh: 25.0, fitness_expiry: "2026-11-20", status: "ACTIVE_HAULING", compliance: "PASS" },
        { vehicle_id: "DUMP-89", type: "100-Tonne Dumper", operator: "Santosh Roy", speed_kmh: 24.1, speed_limit_kmh: 25.0, fitness_expiry: "2026-10-15", status: "ACTIVE_HAULING", compliance: "PASS" },
        { vehicle_id: "SHOV-12", type: "12-CuM Electric Shovel", operator: "Kailash Giri", speed_kmh: 0.0, speed_limit_kmh: 5.0, fitness_expiry: "2026-09-14", status: "LOADING_PIT_B", compliance: "EXPIRING_SOON" },
        { vehicle_id: "DOZ-06", type: "Wheel Dozer", operator: "Ramesh Das", speed_kmh: 12.0, speed_limit_kmh: 15.0, fitness_expiry: "2027-01-10", status: "BENCH_LEVELING", compliance: "PASS" },
      ],
      contractor_kpis: {
        active_fleet_count: 28,
        fleet_fitness_compliance_pct: 96.4,
        contractor_safety_score: 92.0,
        zero_accident_days: 184,
      },
    };
  } else {
    // Government Officials / Ministry
    userName = "Dr. R. K. Sharma (MOC Auditor)";
    metrics = {
      macro_kpis: {
        national_compliance_rate: 92.4,
        total_mines_monitored: 348,
        active_subsidiaries_count: 8,
        critical_hazard_sites_count: 4,
        pending_form_iv_returns: 12,
        unresolved_level3_escalations: 3,
        monthly_coal_dispatch_mt: "68.4 MT",
        compliance_downtime_hours: "14.2 hrs (Low)",
      },
      subsidiary_risk_heatmap: [
        { code: "SECL", name: "South Eastern Coalfields", mines_count: 68, avg_risk_score: 34, compliance_rate: 93.8, status: "SATISFACTORY" },
        { code: "BCCL", name: "Bharat Coking Coal", mines_count: 52, avg_risk_score: 58, compliance_rate: 86.4, status: "ATTENTION_REQUIRED" },
        { code: "ECL", name: "Eastern Coalfields", mines_count: 74, avg_risk_score: 46, compliance_rate: 89.1, status: "SATISFACTORY" },
        { code: "CCL", name: "Central Coalfields", mines_count: 58, avg_risk_score: 38, compliance_rate: 92.5, status: "SATISFACTORY" },
        { code: "MCL", name: "Mahanadi Coalfields", mines_count: 36, avg_risk_score: 28, compliance_rate: 96.2, status: "EXCELLENT" },
        { code: "WCL", name: "Western Coalfields", mines_count: 42, avg_risk_score: 41, compliance_rate: 91.0, status: "SATISFACTORY" },
        { code: "NCL", name: "Northern Coalfields", mines_count: 18, avg_risk_score: 22, compliance_rate: 97.4, status: "EXCELLENT" },
      ],
      statutory_audit_log: [
        { id: "aud-101", subsidiary: "SCCL", mine: "Ramagundam RG-OCP 3", inspector: "Er. A. K. Verma (DGMS)", date: "2026-09-06", type: "Statutory DGMS Form-IV", status: "COMPLETED", score: 24 },
        { id: "aud-102", subsidiary: "BCCL", mine: "Jharia Pit-9 Deep Seam", inspector: "Er. S. N. Mukherjee", date: "2026-09-05", type: "DGMS Injunction Review", status: "ESCALATED_L3", score: 82 },
        { id: "aud-103", subsidiary: "ECL", mine: "Sankarpur Colliery", inspector: "Er. M. Das", date: "2026-09-03", type: "MoEF Environmental Audit", status: "COMPLETED", score: 35 },
        { id: "aud-104", subsidiary: "WCL", mine: "Pench Valley Mine #4", inspector: "Er. P. K. Rao", date: "2026-09-01", type: "Annual Electrical Standard", status: "COMPLETED", score: 29 },
      ],
      high_risk_issues_matrix: [
        { rule: "CMR Reg 108", body: "DGMS", category: "Methane Telemetry Excursion", violations_count: 19, trend: "+12%", impact: "High Risk" },
        { rule: "CPCB Water Act", body: "CPCB", category: "Mine Sump Effluent Discharge BOD/COD", violations_count: 14, trend: "-8%", impact: "Medium Risk" },
        { rule: "CMR Reg 144", body: "DGMS", category: "Roof Bolting Anchor Load Test", violations_count: 11, trend: "+4%", impact: "Critical Hazard" },
        { rule: "MoEF EC Cond 4", body: "MoEF", category: "Greenbelt Plantation Density Deficit", violations_count: 8, trend: "0%", impact: "Statutory Hold" },
      ],
      economic_indicators: {
        quarterly_output_achieved_pct: 96.8,
        environmental_cess_collected_cr: "₹ 1,420 Cr",
        safety_capex_utilization_pct: 88.5,
        downtime_hours_by_cause: [
          { cause: "Statutory Inspection Hold", hours: 14.2 },
          { cause: "Equipment Preventive Maintenance", hours: 42.0 },
          { cause: "Weather / Monsoon Inundation", hours: 18.5 },
        ],
      },
    };
  }

  return {
    role: roleUpper,
    user_name: userName,
    user_email: "user@coal.gov.in",
    tenant_path: "/MOC/SCCL/RAMAGUNDAM_2/RG_OCP3",
    mine_site_id: "a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d",
    mine_site_name: "Ramagundam OC-3 (RG-OCP 3) SCCL",
    metrics,
    timestamp: new Date().toISOString(),
  };
}
