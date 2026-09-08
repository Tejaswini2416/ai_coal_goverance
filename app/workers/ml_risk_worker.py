"""
Worker ML Module — Telemetry Anomaly Detection & Fraud/Rubber-Stamping Detector
Uses scikit-learn IsolationForest and statistical variance checks to detect hazardous spikes and forged logs.
"""
from typing import List, Dict, Any, Tuple, Optional
import numpy as np
from sklearn.ensemble import IsolationForest
import structlog

logger = structlog.get_logger(__name__)


class TelemetryAnomalyDetector:
    """
    Unsupervised ML Anomaly Detection pipeline for underground and surface mine telemetry.
    
    Features analyzed per sensor vector:
      [CH4 (%), CO (ppm), dCO/dt (ppm/hr), AirVelocity (m/s), OvertimeHours]
    """

    DEFAULT_FEATURE_NAMES = [
        "ch4_percentage",
        "co_ppm",
        "co_rate_of_rise",
        "air_velocity_ms",
        "overtime_hours",
    ]

    def __init__(self, contamination: float = 0.05, random_state: int = 42):
        self.contamination = contamination
        self.random_state = random_state
        self.model = IsolationForest(
            contamination=self.contamination,
            random_state=self.random_state,
            n_estimators=100,
        )
        self._is_fitted = False
        self._init_baseline_model()

    def _init_baseline_model(self) -> None:
        """
        Fits baseline normal operational distributions for Indian coal mines (CMR 2017 baseline).
        Normal ranges:
          - CH4: 0.01% - 0.40%
          - CO: 1.0 - 15.0 ppm
          - dCO/dt: -0.5 to +1.0 ppm/hr
          - AirVelocity: 0.5 - 3.5 m/s
          - OvertimeHours: 0.0 - 2.0 hrs
        """
        np.random.seed(self.random_state)
        n_samples = 300
        normal_data = np.column_stack([
            np.random.uniform(0.02, 0.40, n_samples),   # CH4 %
            np.random.uniform(1.0, 15.0, n_samples),    # CO ppm
            np.random.uniform(-0.5, 1.0, n_samples),    # dCO/dt ppm/hr
            np.random.uniform(1.0, 3.5, n_samples),     # Air velocity m/s
            np.random.uniform(0.0, 2.0, n_samples),     # Overtime hours
        ])
        self.model.fit(normal_data)
        self._is_fitted = True

    def detect_anomalies(
        self,
        sensor_records: List[List[float]],
    ) -> Dict[str, Any]:
        """
        Run anomaly detection on a sequence of sensor vectors.
        Each vector is [CH4, CO, dCO_dt, AirVelocity, OvertimeHours].
        """
        if not sensor_records:
            return {
                "is_anomalous": False,
                "anomaly_count": 0,
                "total_records": 0,
                "outlier_scores": [],
                "rubber_stamp_detected": False,
                "triggers": [],
            }

        data_array = np.array(sensor_records, dtype=float)
        triggers: List[str] = []

        # 1. Check for Rubber-Stamping / Forged Static Flatlines (Variance ~ 0 across >= 4 readings)
        rubber_stamp_detected = self._check_rubber_stamping(data_array)
        if rubber_stamp_detected:
            triggers.append(
                "CRITICAL_TRIGGER: AI Telemetry Audit flagged rubber-stamped sensor logs (zero-variance flatline across consecutive shifts)"
            )

        # 2. Isolation Forest Outlier Prediction
        predictions = self.model.predict(data_array)  # 1 for inlier, -1 for outlier
        decision_scores = self.model.decision_function(data_array)  # Lower = more abnormal

        anomaly_indices = np.where(predictions == -1)[0].tolist()
        has_anomalies = len(anomaly_indices) > 0

        if has_anomalies:
            worst_score = float(np.min(decision_scores))
            triggers.append(
                f"WARNING_TRIGGER: ML IsolationForest detected {len(anomaly_indices)} anomalous telemetry spikes (min anomaly score: {worst_score:.3f})"
            )

        return {
            "is_anomalous": has_anomalies or rubber_stamp_detected,
            "anomaly_count": len(anomaly_indices),
            "total_records": len(sensor_records),
            "anomaly_indices": anomaly_indices,
            "outlier_scores": [round(float(s), 4) for s in decision_scores],
            "rubber_stamp_detected": rubber_stamp_detected,
            "triggers": triggers,
        }

    def _check_rubber_stamping(self, data: np.ndarray, min_records: int = 4, eps: float = 1e-4) -> bool:
        """
        Detects if multiple consecutive telemetry records have identical numbers (rubber-stamped/forged).
        """
        if len(data) < min_records:
            return False

        # Calculate standard deviation across samples for gas columns (CH4, CO)
        stds = np.std(data[:, :2], axis=0)
        if np.all(stds < eps):
            return True

        return False
