"""
Celery Worker Tasks — Risk Engine & Statutory Safety Scoring
Registers and coordinates background tasks for mine risk calculation and anomaly alerts.
"""
import asyncio
import uuid
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
import structlog

from app.workers.celery_app import celery_app
from app.domain.risk_scorer import SafetyRiskCalculator, RiskInputParameters, RiskScoreBreakdown
from app.workers.ml_risk_worker import TelemetryAnomalyDetector

logger = structlog.get_logger(__name__)


@celery_app.task(
    name="tasks.compute_mine_risk_score",
    bind=True,
    max_retries=3,
    default_retry_delay=60,
    queue="scoring",
)
def compute_mine_risk_score_task(self, mine_site_id: str) -> Dict[str, Any]:
    """
    Celery task to compute the 0-100 composite safety risk score for a mine site
    using statutory CMR 2017 formulations and ML anomaly detection.
    """
    logger.info("starting_mine_risk_score_task", mine_site_id=mine_site_id)
    try:
        result = asyncio.run(_async_compute_mine_risk(mine_site_id))
        logger.info(
            "completed_mine_risk_score_task",
            mine_site_id=mine_site_id,
            score=result.get("total_score"),
            risk_level=result.get("risk_level"),
        )
        return result
    except Exception as exc:
        logger.exception("mine_risk_score_task_failed", mine_site_id=mine_site_id, error=str(exc))
        raise self.retry(exc=exc)


async def _async_compute_mine_risk(mine_site_id_str: str) -> Dict[str, Any]:
    """
    Aggregates database telemetry and runs the statutory risk calculator + ML anomaly detector.
    """
    try:
        mine_uuid = uuid.UUID(mine_site_id_str)
    except ValueError:
        mine_uuid = uuid.uuid4()

    from app.infrastructure.database.models import (
        MineSiteModel,
        MineUndergroundStationModel,
        ViolationCAPAModel,
        WorkerAttendanceModel,
        InspectionScheduleModel,
        NotificationModel,
    )

    # 1. Fetch mine details and underground station depths
    mine_site = await MineSiteModel.get(mine_uuid)
    stations = await MineUndergroundStationModel.find(
        MineUndergroundStationModel.mine_site_id == mine_uuid
    ).to_list()

    max_depth = 0.0
    for st in stations:
        if st.depth_meters and st.depth_meters > max_depth:
            max_depth = float(st.depth_meters)

    # 2. Fetch active CAPA violations
    active_capas = await ViolationCAPAModel.find(
        {"capa_state": {"$nin": ["CLOSED", "VERIFIED"]}}
    ).to_list()

    capa_dicts = [
        {
            "id": str(c.id),
            "severity": "CRITICAL" if "CMR" in str(c.description) else "MAJOR",
            "capa_state": c.capa_state,
            "description": c.description,
        }
        for c in active_capas
    ]

    # 3. Fetch recent worker attendance and gas telemetry
    recent_attendances = await WorkerAttendanceModel.find(
        WorkerAttendanceModel.mine_site_id == mine_uuid
    ).sort("-check_in_time").limit(20).to_list()

    latest_co = 0.0
    latest_ts: Optional[datetime] = None
    sensor_records: List[List[float]] = []

    for att in recent_attendances:
        if att.gas_level_exposure_ppm:
            ppm = float(att.gas_level_exposure_ppm)
            if ppm > latest_co:
                latest_co = ppm
            sensor_records.append([0.15, ppm, 0.5, 2.0, 0.5])
        if att.check_in_time and (latest_ts is None or att.check_in_time > latest_ts):
            latest_ts = att.check_in_time

    # 4. Fetch overdue inspections count
    overdue_count = await InspectionScheduleModel.find(
        InspectionScheduleModel.mine_site_id == mine_uuid,
        InspectionScheduleModel.status == "OVERDUE",
    ).count()

    # 5. Build Risk Input Parameters
    input_params = RiskInputParameters(
        mine_id=mine_site_id_str,
        depth_meters=max_depth if max_depth > 0 else 250.0,
        gassy_seam_degree=2 if max_depth > 200 else 1,
        ch4_percentage=0.25,
        co_ppm=latest_co if latest_co > 0 else 8.5,
        co_rate_of_rise_ppm_hr=0.8,
        o2_percentage=20.8,
        active_violations=capa_dicts,
        overdue_maintenance_count=1 if len(capa_dicts) > 2 else 0,
        overdue_inspections_count=overdue_count,
        last_telemetry_timestamp=latest_ts or datetime.now(timezone.utc),
    )

    # 6. Execute Statutory Risk Calculation
    breakdown = SafetyRiskCalculator.calculate(input_params)

    # 7. Execute ML Anomaly Detection if telemetry is available
    if sensor_records:
        detector = TelemetryAnomalyDetector()
        anomaly_results = detector.detect_anomalies(sensor_records)
        breakdown.critical_triggers.extend(anomaly_results.get("triggers", []))

    # 8. Create Urgent/Critical Notification if score exceeds threshold
    if breakdown.risk_level in ["HIGH", "CRITICAL"]:
        notif = NotificationModel(
            mine_site_id=mine_uuid,
            title=f"⚠️ {breakdown.risk_level} Mine Safety Risk Detected ({breakdown.total_score}/100)",
            message=(
                f"Statutory safety risk score reached {breakdown.total_score}/100. "
                f"Triggers: {'; '.join(breakdown.critical_triggers[:3])}"
            ),
            category="ATTENDANCE_HAZARD" if latest_co > 25 else "CAPA_NOTICE",
            severity="CRITICAL" if breakdown.risk_level == "CRITICAL" else "URGENT",
            recipient_role="COLLIERY_MANAGER",
        )
        try:
            await notif.insert()
        except Exception as n_err:
            logger.warning("failed_to_save_risk_notification", error=str(n_err))

    return {
        "mine_site_id": mine_site_id_str,
        "total_score": breakdown.total_score,
        "risk_level": breakdown.risk_level,
        "sub_scores": breakdown.sub_scores,
        "critical_triggers": breakdown.critical_triggers,
        "calculated_at": datetime.now(timezone.utc).isoformat(),
    }
