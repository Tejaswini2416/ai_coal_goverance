"""
Unit Tests for Machine Learning Anomaly Detection Worker
"""
import pytest
from app.workers.ml_risk_worker import TelemetryAnomalyDetector


def test_normal_telemetry_no_anomalies():
    """Normal operational gas telemetry should not trigger any outlier flags."""
    detector = TelemetryAnomalyDetector(random_state=42)
    # [CH4, CO, dCO/dt, AirVelocity, OvertimeHours]
    normal_records = [
        [0.10, 5.2, 0.1, 2.1, 0.0],
        [0.12, 6.0, 0.2, 2.0, 0.5],
        [0.11, 5.8, -0.1, 2.2, 0.0],
        [0.14, 6.5, 0.3, 2.1, 0.0],
        [0.09, 4.9, 0.0, 2.3, 0.0],
    ]

    results = detector.detect_anomalies(normal_records)

    assert results["rubber_stamp_detected"] is False
    assert results["anomaly_count"] == 0
    assert results["is_anomalous"] is False


def test_extreme_telemetry_spike_detected():
    """Severe gas spike (CH4 2.8%, CO 95 ppm) should be flagged by Isolation Forest."""
    detector = TelemetryAnomalyDetector(random_state=42)
    spike_records = [
        [0.10, 5.0, 0.1, 2.0, 0.0],
        [0.12, 5.5, 0.2, 2.1, 0.0],
        [2.80, 95.0, 12.0, 0.2, 4.0],  # Major hazard excursion
    ]

    results = detector.detect_anomalies(spike_records)

    assert results["is_anomalous"] is True
    assert results["anomaly_count"] >= 1
    assert any("ML IsolationForest detected" in t for t in results["triggers"])


def test_rubber_stamped_forged_records_detected():
    """Identical flatline readings across shifts should trigger fraud/rubber-stamping alert."""
    detector = TelemetryAnomalyDetector(random_state=42)
    # Constant values simulating forged/manual copy-paste log
    rubber_stamped_records = [
        [0.15, 5.0, 0.0, 2.0, 0.0],
        [0.15, 5.0, 0.0, 2.0, 0.0],
        [0.15, 5.0, 0.0, 2.0, 0.0],
        [0.15, 5.0, 0.0, 2.0, 0.0],
    ]

    results = detector.detect_anomalies(rubber_stamped_records)

    assert results["rubber_stamp_detected"] is True
    assert results["is_anomalous"] is True
    assert any("rubber-stamped sensor logs" in t for t in results["triggers"])


def test_empty_telemetry_graceful_handling():
    """Empty sensor list should handle gracefully without errors."""
    detector = TelemetryAnomalyDetector()
    results = detector.detect_anomalies([])

    assert results["is_anomalous"] is False
    assert results["anomaly_count"] == 0
    assert results["total_records"] == 0
