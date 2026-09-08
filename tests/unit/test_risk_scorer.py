"""
Unit Tests for Statutory Safety Risk Score Engine (CMR 2017)
"""
from datetime import datetime, timezone, timedelta
import pytest

from app.domain.risk_scorer import (
    RiskInputParameters,
    RiskScoreBreakdown,
    SafetyRiskCalculator,
)


def test_clean_safe_mine_returns_low_risk():
    """A shallow, degree-1 gassy mine with clean air and zero violations should have LOW risk."""
    params = RiskInputParameters(
        mine_id="MOCK-MINE-SAFE",
        depth_meters=100.0,
        gassy_seam_degree=1,
        ch4_percentage=0.05,
        co_ppm=2.0,
        co_rate_of_rise_ppm_hr=0.1,
        o2_percentage=20.9,
        active_violations=[],
        overdue_maintenance_count=0,
        overdue_inspections_count=0,
        last_telemetry_timestamp=datetime.now(timezone.utc),
    )

    breakdown = SafetyRiskCalculator.calculate(params)

    assert breakdown.total_score < 35.0
    assert breakdown.risk_level == "LOW"
    assert breakdown.sub_scores["staleness_penalty"] == 0.0
    assert len([t for t in breakdown.critical_triggers if "CRITICAL" in t]) == 0


def test_ch4_general_body_breach_triggers_critical():
    """CH4 exceeding 1.25% should severely penalize gas score and trigger statutory alarm."""
    params = RiskInputParameters(
        mine_id="MOCK-MINE-GAS",
        depth_meters=150.0,
        gassy_seam_degree=1,
        ch4_percentage=1.45,  # > 1.25%
        co_ppm=5.0,
        co_rate_of_rise_ppm_hr=0.2,
        o2_percentage=20.8,
        active_violations=[],
        last_telemetry_timestamp=datetime.now(timezone.utc),
    )

    breakdown = SafetyRiskCalculator.calculate(params)

    assert breakdown.sub_scores["gas_atmospheric_score"] >= 85.0
    assert any("CH4 concentration (1.45%) exceeds general body limit" in t for t in breakdown.critical_triggers)


def test_co_rate_of_rise_spontaneous_heating_penalty():
    """CO rate of rise > 3.0 ppm/hr should add +30 penalty and spontaneous heating trigger."""
    params = RiskInputParameters(
        mine_id="MOCK-MINE-HEATING",
        depth_meters=200.0,
        gassy_seam_degree=2,
        ch4_percentage=0.2,
        co_ppm=30.0,
        co_rate_of_rise_ppm_hr=4.5,  # > 3.0 ppm/hr
        o2_percentage=20.5,
        active_violations=[],
        last_telemetry_timestamp=datetime.now(timezone.utc),
    )

    breakdown = SafetyRiskCalculator.calculate(params)

    assert any("spontaneous heating" in t for t in breakdown.critical_triggers)
    assert breakdown.sub_scores["gas_atmospheric_score"] > 50.0


def test_oxygen_depletion_trigger():
    """Oxygen < 19.0% should trigger asphyxiation warning and boost gas score."""
    params = RiskInputParameters(
        mine_id="MOCK-MINE-O2-LOW",
        depth_meters=100.0,
        gassy_seam_degree=1,
        ch4_percentage=0.1,
        co_ppm=5.0,
        co_rate_of_rise_ppm_hr=0.0,
        o2_percentage=18.2,  # < 19.0%
        active_violations=[],
        last_telemetry_timestamp=datetime.now(timezone.utc),
    )

    breakdown = SafetyRiskCalculator.calculate(params)

    assert any("Oxygen depletion detected" in t for t in breakdown.critical_triggers)
    assert breakdown.sub_scores["gas_atmospheric_score"] >= 45.0


def test_capa_violations_weighting():
    """Active critical and major CAPA notices should properly scale CAPA score."""
    violations = [
        {"severity": "CRITICAL_DGMS", "capa_state": "REPORTED", "description": "Shaft winder defect"},
        {"severity": "MAJOR", "capa_state": "ASSIGNED", "description": "Haul road slope breach"},
        {"severity": "MINOR", "capa_state": "NOTICE_ISSUED", "description": "PPE signage faded"},
        {"severity": "MAJOR", "capa_state": "CLOSED", "description": "Resolved violation"},  # Should be ignored
    ]
    params = RiskInputParameters(
        mine_id="MOCK-MINE-CAPA",
        depth_meters=100.0,
        gassy_seam_degree=1,
        ch4_percentage=0.1,
        co_ppm=5.0,
        co_rate_of_rise_ppm_hr=0.0,
        o2_percentage=20.9,
        active_violations=violations,
        overdue_inspections_count=2,
        last_telemetry_timestamp=datetime.now(timezone.utc),
    )

    breakdown = SafetyRiskCalculator.calculate(params)

    # Critical (25) + Major (15) + Minor (5) + Overdue Inspections (2 * 10 = 20) = 65.0
    assert breakdown.sub_scores["capa_violations_score"] == 65.0
    assert any("active statutory/DGMS notice violations" in t for t in breakdown.critical_triggers)


def test_staleness_penalty_above_four_hours():
    """Telemetry older than 4 hours should incur an uncertainty penalty."""
    ref_time = datetime(2026, 9, 7, 12, 0, 0, tzinfo=timezone.utc)
    stale_ts = ref_time - timedelta(hours=6)

    params = RiskInputParameters(
        mine_id="MOCK-MINE-STALE",
        depth_meters=100.0,
        gassy_seam_degree=1,
        ch4_percentage=0.0,
        co_ppm=0.0,
        co_rate_of_rise_ppm_hr=0.0,
        o2_percentage=20.9,
        active_violations=[],
        last_telemetry_timestamp=stale_ts,
    )

    breakdown = SafetyRiskCalculator.calculate(params, reference_time=ref_time)

    # 6 hours stale: 5 + ((6-4)/4)*10 = 10.0 pts
    assert breakdown.sub_scores["staleness_penalty"] == 10.0
    assert any("Telemetry stale" in t for t in breakdown.critical_triggers)


def test_extreme_compound_hazard_caps_at_100():
    """Extreme compounding risk factors should clamp total score to exactly 100."""
    params = RiskInputParameters(
        mine_id="MOCK-MINE-CRITICAL",
        depth_meters=650.0,
        gassy_seam_degree=3,
        ch4_percentage=2.5,
        co_ppm=80.0,
        co_rate_of_rise_ppm_hr=5.0,
        o2_percentage=17.5,
        active_violations=[
            {"severity": "CRITICAL_DGMS", "capa_state": "REPORTED"} for _ in range(5)
        ],
        overdue_maintenance_count=5,
        overdue_inspections_count=3,
        slope_factor_of_safety=1.05,
        recent_rainfall_mm=85.0,
        last_telemetry_timestamp=datetime(2026, 9, 7, 0, 0, 0, tzinfo=timezone.utc),
    )

    breakdown = SafetyRiskCalculator.calculate(params, reference_time=datetime(2026, 9, 7, 12, 0, 0, tzinfo=timezone.utc))

    assert breakdown.total_score == 100.0
    assert breakdown.risk_level == "CRITICAL"
