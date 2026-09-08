"""
Domain Module — Statutory Safety Risk Score Engine (CMR 2017)
Pure Python calculation engine for explainable, composite safety risk assessment.
"""
from datetime import datetime, timezone
from typing import Dict, List, Optional, Any
from pydantic import BaseModel, Field


class RiskInputParameters(BaseModel):
    """
    Standardized statutory input parameters for dynamic mine risk scoring.
    Adheres strictly to Coal Mines Regulations, 2017 (CMR 2017).
    """
    mine_id: str
    depth_meters: float = Field(default=0.0, ge=0.0, description="Working mine depth in meters")
    gassy_seam_degree: int = Field(default=1, ge=1, le=3, description="Gassy Seam Degree (1, 2, or 3 per CMR 2017)")
    ch4_percentage: float = Field(default=0.0, ge=0.0, le=100.0, description="Methane concentration %")
    co_ppm: float = Field(default=0.0, ge=0.0, description="Carbon monoxide concentration in PPM")
    co_rate_of_rise_ppm_hr: float = Field(default=0.0, description="Rate of CO rise in PPM/hour (dCO/dt)")
    o2_percentage: float = Field(default=20.9, ge=0.0, le=100.0, description="Atmospheric oxygen concentration %")
    active_violations: List[Dict[str, Any]] = Field(default_factory=list, description="Active unrectified CAPA violations")
    overdue_maintenance_count: int = Field(default=0, ge=0, description="Number of HEMM equipment past statutory maintenance")
    overdue_inspections_count: int = Field(default=0, ge=0, description="Number of overdue statutory safety inspections")
    last_telemetry_timestamp: Optional[datetime] = Field(default=None, description="Timestamp of latest sensor or shift log sync")
    slope_factor_of_safety: Optional[float] = Field(default=None, ge=0.0, description="Opencast bench slope Factor of Safety (FoS)")
    recent_rainfall_mm: Optional[float] = Field(default=None, ge=0.0, description="24-hour cumulative rainfall in mm")


class RiskScoreBreakdown(BaseModel):
    """
    Structured breakdown and explainability report of the computed Safety Risk Score.
    """
    total_score: float = Field(..., ge=0.0, le=100.0, description="Composite Safety Risk Score (0-100)")
    risk_level: str = Field(..., description="Risk Level: LOW, MODERATE, HIGH, or CRITICAL")
    sub_scores: Dict[str, float] = Field(..., description="Weighted component sub-scores (G, C, M, E, staleness)")
    critical_triggers: List[str] = Field(default_factory=list, description="Statutory safety tripwires & anomaly alarms")


class SafetyRiskCalculator:
    """
    Explainable statutory composite risk calculator.
    
    Formula:
      S = min(100, w_g * G + w_c * C + w_m * M + w_e * E + P_stale)
      Where:
        w_g = 0.35 (Gas & Atmospheric Risk)
        w_c = 0.25 (Statutory & CAPA Violations)
        w_m = 0.20 (Mine Depth & Seam Gassiness)
        w_e = 0.20 (Equipment & Overburden / Slope Status)
        P_stale in [0, 15] (Data Staleness Uncertainty Penalty)
    """

    WEIGHT_GAS: float = 0.35
    WEIGHT_CAPA: float = 0.25
    WEIGHT_MINE: float = 0.20
    WEIGHT_EQUIPMENT: float = 0.20

    @classmethod
    def calculate(
        cls,
        params: RiskInputParameters,
        reference_time: Optional[datetime] = None,
    ) -> RiskScoreBreakdown:
        triggers: List[str] = []

        # 1. Pillar G: Gas & Atmospheric Risk (0-100)
        gas_score, gas_triggers = cls._compute_gas_risk(params)
        triggers.extend(gas_triggers)

        # 2. Pillar C: Statutory & CAPA Violations (0-100)
        capa_score, capa_triggers = cls._compute_capa_risk(params)
        triggers.extend(capa_triggers)

        # 3. Pillar M: Mine Depth & Seam Gassiness (0-100)
        mine_score, mine_triggers = cls._compute_mine_depth_gassiness(params)
        triggers.extend(mine_triggers)

        # 4. Pillar E: Equipment & Overburden/Slope Status (0-100)
        equip_score, equip_triggers = cls._compute_equipment_slope_risk(params)
        triggers.extend(equip_triggers)

        # 5. Data Staleness / Uncertainty Penalty (0-15)
        stale_penalty, stale_triggers = cls._compute_staleness_penalty(params, reference_time)
        triggers.extend(stale_triggers)

        # Composite Score Calculation
        weighted_sum = (
            cls.WEIGHT_GAS * gas_score
            + cls.WEIGHT_CAPA * capa_score
            + cls.WEIGHT_MINE * mine_score
            + cls.WEIGHT_EQUIPMENT * equip_score
            + stale_penalty
        )

        total_score = round(max(0.0, min(100.0, weighted_sum)), 2)
        risk_level = cls.get_risk_level(total_score)

        sub_scores = {
            "gas_atmospheric_score": round(gas_score, 2),
            "capa_violations_score": round(capa_score, 2),
            "mine_depth_gassiness_score": round(mine_score, 2),
            "equipment_slope_score": round(equip_score, 2),
            "staleness_penalty": round(stale_penalty, 2),
        }

        return RiskScoreBreakdown(
            total_score=total_score,
            risk_level=risk_level,
            sub_scores=sub_scores,
            critical_triggers=triggers,
        )

    @classmethod
    def get_risk_level(cls, score: float) -> str:
        if score < 35.0:
            return "LOW"
        elif score < 65.0:
            return "MODERATE"
        elif score < 85.0:
            return "HIGH"
        else:
            return "CRITICAL"

    @classmethod
    def _compute_gas_risk(cls, params: RiskInputParameters) -> tuple[float, List[str]]:
        triggers: List[str] = []
        score: float = 0.0

        # Methane (CH4) evaluation:
        # Statutory: 0.75% warning limit (return airway), 1.25% general body maximum limit
        if params.ch4_percentage >= 1.25:
            score += 85.0
            triggers.append(
                f"CRITICAL_TRIGGER: CH4 concentration ({params.ch4_percentage:.2f}%) exceeds general body limit (1.25%)"
            )
        elif params.ch4_percentage >= 0.75:
            score += 50.0 + ((params.ch4_percentage - 0.75) / 0.50) * 35.0
            triggers.append(
                f"WARNING_TRIGGER: CH4 concentration ({params.ch4_percentage:.2f}%) exceeds return airway threshold (0.75%)"
            )
        else:
            score += (params.ch4_percentage / 0.75) * 30.0

        # Carbon Monoxide (CO) evaluation:
        # Statutory: 50 PPM limit
        if params.co_ppm >= 50.0:
            score += 40.0
            triggers.append(f"CRITICAL_TRIGGER: CO level ({params.co_ppm:.1f} PPM) exceeds statutory limit (50 PPM)")
        elif params.co_ppm > 25.0:
            score += 20.0 + ((params.co_ppm - 25.0) / 25.0) * 20.0
        else:
            score += (params.co_ppm / 25.0) * 15.0

        # CO Rate of Rise (dCO/dt): > 3.0 ppm/hr triggers spontaneous combustion warning
        if params.co_rate_of_rise_ppm_hr > 3.0:
            score += 30.0
            triggers.append(
                f"CRITICAL_TRIGGER: Rapid CO rate of rise ({params.co_rate_of_rise_ppm_hr:.2f} ppm/hr > 3.0 ppm/hr) indicates spontaneous heating"
            )

        # Oxygen (O2) Depletion: normal ~20.9%, under 19.0% is hazardous
        if params.o2_percentage < 19.0:
            score += 45.0
            triggers.append(
                f"CRITICAL_TRIGGER: Oxygen depletion detected ({params.o2_percentage:.1f}% < 19.0% statutory minimum)"
            )
        elif params.o2_percentage < 20.0:
            score += 15.0

        return min(100.0, score), triggers

    @classmethod
    def _compute_capa_risk(cls, params: RiskInputParameters) -> tuple[float, List[str]]:
        triggers: List[str] = []
        score: float = 0.0

        critical_count = 0
        major_count = 0
        minor_count = 0

        for v in params.active_violations:
            sev = str(v.get("severity", "")).upper()
            state = str(v.get("capa_state", "")).upper()
            if state in ["CLOSED", "VERIFIED"]:
                continue

            if "CRITICAL" in sev or "DGMS" in sev:
                critical_count += 1
                score += 25.0
            elif "MAJOR" in sev or "HIGH" in sev:
                major_count += 1
                score += 15.0
            else:
                minor_count += 1
                score += 5.0

        if critical_count > 0:
            triggers.append(f"CRITICAL_TRIGGER: {critical_count} active statutory/DGMS notice violations unrectified")
        if major_count > 2:
            triggers.append(f"WARNING_TRIGGER: Multiple major safety violations active ({major_count})")

        # Overdue statutory inspections
        if params.overdue_inspections_count > 0:
            score += min(30.0, params.overdue_inspections_count * 10.0)
            triggers.append(
                f"WARNING_TRIGGER: {params.overdue_inspections_count} overdue statutory inspections (CMR Reg 47/48)"
            )

        return min(100.0, score), triggers

    @classmethod
    def _compute_mine_depth_gassiness(cls, params: RiskInputParameters) -> tuple[float, List[str]]:
        triggers: List[str] = []

        # Depth contribution (0-50 pts)
        depth_score = min(50.0, (params.depth_meters / 600.0) * 50.0)
        if params.depth_meters > 400.0:
            triggers.append(f"NOTICE_TRIGGER: Deep underground workings ({params.depth_meters:.0f}m)")

        # Gassiness contribution (Degree I = 10, Degree II = 40, Degree III = 80 -> scaled to 50 max)
        gassiness_raw = 10.0 if params.gassy_seam_degree == 1 else (40.0 if params.gassy_seam_degree == 2 else 80.0)
        gas_seam_score = (gassiness_raw / 80.0) * 50.0

        if params.gassy_seam_degree == 3:
            triggers.append("CRITICAL_TRIGGER: Degree III Gassy Seam operating status")

        total_mine = min(100.0, depth_score + gas_seam_score)
        return total_mine, triggers

    @classmethod
    def _compute_equipment_slope_risk(cls, params: RiskInputParameters) -> tuple[float, List[str]]:
        triggers: List[str] = []
        score: float = 0.0

        # Overdue HEMM maintenance (15 pts per unit, up to 60)
        if params.overdue_maintenance_count > 0:
            score += min(60.0, params.overdue_maintenance_count * 15.0)
            triggers.append(
                f"WARNING_TRIGGER: {params.overdue_maintenance_count} heavy equipment past statutory maintenance interval"
            )

        # Opencast Slope Factor of Safety (FoS < 1.2 is critical)
        if params.slope_factor_of_safety is not None:
            if params.slope_factor_of_safety < 1.2:
                score += 35.0
                triggers.append(
                    f"CRITICAL_TRIGGER: Opencast slope Factor of Safety ({params.slope_factor_of_safety:.2f}) below critical stability threshold (<1.20)"
                )
            elif params.slope_factor_of_safety < 1.5:
                score += 15.0

        # Rainfall hazard (> 50mm)
        if params.recent_rainfall_mm is not None and params.recent_rainfall_mm > 50.0:
            score += 25.0
            triggers.append(
                f"WARNING_TRIGGER: High 24h rainfall ({params.recent_rainfall_mm:.1f}mm > 50mm) causing water accumulation & bench instability risk"
            )

        return min(100.0, score), triggers

    @classmethod
    def _compute_staleness_penalty(
        cls,
        params: RiskInputParameters,
        reference_time: Optional[datetime] = None,
    ) -> tuple[float, List[str]]:
        if not params.last_telemetry_timestamp:
            return 10.0, ["WARNING_TRIGGER: No recent telemetry timestamp available; default uncertainty penalty applied (+10 pts)"]

        now = reference_time or datetime.now(timezone.utc)
        ts = params.last_telemetry_timestamp
        if ts.tzinfo is None:
            ts = ts.replace(tzinfo=timezone.utc)
        if now.tzinfo is None:
            now = now.replace(tzinfo=timezone.utc)

        elapsed_seconds = max(0.0, (now - ts).total_seconds())
        elapsed_hours = elapsed_seconds / 3600.0

        if elapsed_hours > 4.0:
            # Scale from 5 pts at 4h up to 15 pts at 8h+
            penalty = min(15.0, 5.0 + ((elapsed_hours - 4.0) / 4.0) * 10.0)
            trigger = f"WARNING_TRIGGER: Telemetry stale for {elapsed_hours:.1f} hours (>4h threshold; uncertainty penalty +{penalty:.1f} pts)"
            return penalty, [trigger]

        return 0.0, []
