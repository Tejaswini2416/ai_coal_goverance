"""
Worker 2 — AI Risk Scorer
Computes a dynamic Risk Severity Score (0-100) for a mine site
based on: violation count, mine depth, gas-seam degree, equipment telemetry.
Designed as a mock/pipeline stub extensible with an ML model call.
"""
import asyncio

import structlog

from app.workers.celery_app import celery_app

logger = structlog.get_logger(__name__)


@celery_app.task(
    name="app.workers.risk_scorer.compute_risk_score",
    bind=True,
    max_retries=3,
    default_retry_delay=60,
    queue="scoring",
)
def compute_risk_score(
    self,
    inspection_id: str,
    mine_site_id:  str,
    violation_count: int  = 0,
    mine_depth_meters: float = 0.0,
    gas_seam_degree: float   = 0.0,
    equipment_fault_count: int = 0,
):
    """
    Compute a 0-100 risk score and persist it to the inspection record.
    """
    score = asyncio.run(
        _compute(inspection_id, mine_site_id, violation_count,
                 mine_depth_meters, gas_seam_degree, equipment_fault_count)
    )
    return {"inspection_id": inspection_id, "risk_score": score}


async def _compute(
    inspection_id: str,
    mine_site_id:  str,
    violation_count: int,
    mine_depth_meters: float,
    gas_seam_degree: float,
    equipment_fault_count: int,
) -> int:
    """
    Mock risk scoring algorithm.
    In production, replace body with an ML model inference call (e.g. Vertex AI endpoint).

    Score weights:
      - Violations:          each adds 8 points (cap 40)
      - Mine depth:          per 100m adds 5 points (cap 25)
      - Gas seam degree:     per degree adds 3 points (cap 20)
      - Equipment faults:    each adds 5 points (cap 15)
    """
    violation_score = min(violation_count * 8, 40)
    depth_score     = min(int(mine_depth_meters / 100) * 5, 25)
    gas_score       = min(int(gas_seam_degree) * 3, 20)
    equipment_score = min(equipment_fault_count * 5, 15)

    total_score = violation_score + depth_score + gas_score + equipment_score
    total_score = max(0, min(total_score, 100))   # Clamp to [0, 100]

    from app.domain.enums import RiskLevel
    risk_level = RiskLevel.from_score(total_score)

    logger.info(
        "risk_score_computed",
        inspection_id=inspection_id,
        score=total_score,
        risk_level=risk_level.value,
        components={
            "violations": violation_score,
            "depth":      depth_score,
            "gas_seam":   gas_score,
            "equipment":  equipment_score,
        },
    )

    # Persist score to inspection record
    from app.infrastructure.database.base import AsyncSessionLocal
    from app.infrastructure.database.models import InspectionModel
    from uuid import UUID
    async with AsyncSessionLocal() as session:
        inspection = await session.get(InspectionModel, UUID(inspection_id))
        if inspection:
            inspection.risk_score = total_score
            await session.commit()

    return total_score
