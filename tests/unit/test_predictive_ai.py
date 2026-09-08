"""
Unit Tests for 3-Day Predictive AI Safety & Hazard Forecaster (CMR 2017)
"""
import pytest
from datetime import datetime, timezone, timedelta
from app.domain.predictive_ai import PredictiveSafetyForecaster, TelemetryVector


def test_predictive_forecaster_72h_sequence_output():
    """Validates that the 72h forecaster generates timeline points, day milestones, and confidence intervals."""
    forecaster = PredictiveSafetyForecaster(base_risk_score=42.0)
    now = datetime.now(timezone.utc)
    
    # 12 historical vectors (past 72h, step 6h)
    vectors = [
        TelemetryVector(
            timestamp=now - timedelta(hours=72 - (i * 6)),
            ch4_pct=0.25 + (i * 0.01),
            co_ppm=8.0 + (i * 0.4),
            dco_dt=0.4,
            airflow_ms=2.2,
            temperature_c=27.0 + (i * 0.1),
        )
        for i in range(12)
    ]
    
    res = forecaster.forecast_72h(
        historical_vectors=vectors,
        current_depth_meters=380.0,
        gassy_seam_degree=3,
        active_violations_count=2,
    )

    assert "timeline_series" in res
    assert len(res["timeline_series"]) > 12  # Contains historical + future points
    assert len(res["day_forecasts"]) == 3    # Day 1 (+24h), Day 2 (+48h), Day 3 (+72h)
    assert "forecast_warnings" in res
    
    # Verify Day Milestones structure
    day1 = res["day_forecasts"][0]
    assert day1["day"] == 1
    assert day1["target_hours"] == 24
    assert "predicted_risk_score" in day1
    assert len(day1["confidence_interval_95"]) == 2
    assert day1["confidence_interval_95"][0] <= day1["confidence_interval_95"][1]


def test_predictive_forecaster_flags_methane_tripwire():
    """Predicting elevated methane slope must trigger CMR 2017 statutory warning."""
    forecaster = PredictiveSafetyForecaster(base_risk_score=65.0)
    now = datetime.now(timezone.utc)
    
    # Rapidly rising methane: 0.45% -> 0.70% in 72 hours
    vectors = [
        TelemetryVector(
            timestamp=now - timedelta(hours=72 - (i * 6)),
            ch4_pct=0.45 + (i * 0.025),
            co_ppm=10.0,
            dco_dt=0.2,
            airflow_ms=1.9,
            temperature_c=28.0,
        )
        for i in range(12)
    ]
    
    res = forecaster.forecast_72h(
        historical_vectors=vectors,
        current_depth_meters=420.0,
        gassy_seam_degree=3,
        active_violations_count=3,
    )

    warnings = " ".join(res["forecast_warnings"])
    assert "STATUTORY ALERT" in warnings or "excursion predicted" in warnings
