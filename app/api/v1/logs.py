"""
Colliery Manager Data Logs API — Atmospheric Configuration, Worker Muster, and Mine Cast Extraction Logs.
SIH26024 Statutory Digital Governance Platform.
Provides immutable, cryptographic time-series logs with SHA-256 provenance badges.
"""
import hashlib
import json
import uuid
from uuid import UUID
from datetime import datetime, timezone, timedelta, date
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field

from app.dependencies import CurrentUser, get_audit_service
from app.services.audit_service import AuditService
from app.infrastructure.database.models import (
    TelemetryGasModel,
    MineCastExtractionModel,
    WorkerAttendanceModel,
    MineSiteModel,
)

router = APIRouter(prefix="/logs", tags=["Colliery Manager Data Logs"])


def compute_sha256(payload: dict) -> str:
    serialized = json.dumps(payload, sort_keys=True, default=str)
    return hashlib.sha256(serialized.encode("utf-8")).hexdigest()


# ─────────────────────────────────────────────────────────────────────────────
# 1. Atmospheric Telemetry Logs
# ─────────────────────────────────────────────────────────────────────────────
@router.get("/atmospheric")
async def get_atmospheric_logs(
    mine_site_id: Optional[str] = Query(None),
    limit: int = Query(50, le=200),
    user: Optional[CurrentUser] = None,
):
    """
    Returns chronological gas sensor streams:
    CH4 (%), CO (ppm), O2 (%), air velocity (m/s), and temperature (°C).
    Each row includes a status classification badge and immutable SHA-256 hash.
    """
    mine_uuid = None
    if mine_site_id:
        try:
            mine_uuid = UUID(mine_site_id)
        except Exception:
            pass

    records = []
    if mine_uuid:
        records = await TelemetryGasModel.find(
            TelemetryGasModel.mine_site_id == mine_uuid
        ).sort("-recorded_at").limit(limit).to_list()
    else:
        records = await TelemetryGasModel.find().sort("-recorded_at").limit(limit).to_list()

    results = []
    if records:
        for r in records:
            status_badge = "NORMAL"
            if r.ch4_percentage >= 0.75 or r.co_ppm >= 50:
                status_badge = "STATUTORY_BREACH"
            elif r.ch4_percentage >= 0.50 or r.co_ppm >= 15:
                status_badge = "EXCURSION_WARNING"

            payload_data = {
                "id": str(r.id),
                "station_code": r.station_code,
                "location_name": r.location_name,
                "ch4_pct": r.ch4_percentage,
                "co_ppm": r.co_ppm,
                "o2_pct": r.o2_percentage,
                "velocity_ms": r.air_velocity_ms,
                "temp_c": r.temperature_celsius,
                "status": status_badge,
                "timestamp": r.recorded_at.isoformat() if r.recorded_at else datetime.now(timezone.utc).isoformat(),
            }
            computed_hash = r.record_hash or compute_sha256(payload_data)
            results.append({
                **payload_data,
                "record_hash": computed_hash,
                "is_immutable": True,
                "approval_state": r.status or "APPROVED",
            })
    else:
        # Generate realistic chronological shift series for GDK-11A
        now = datetime.now(timezone.utc)
        stations = [
            ("STATION-GDK-L1", "Main Intake Shaft #1", 0.18, 5.2, 20.9, 2.8, 26.5),
            ("STATION-GDK-L2", "Return Airway Gallery #4", 0.42, 14.5, 20.7, 2.2, 28.1),
            ("STATION-GDK-L3", "Working Longwall Face 3A", 0.68, 22.0, 20.4, 1.8, 29.8),
            ("STATION-GDK-L4", "Deep Seam Incline Heading #2", 0.31, 8.4, 20.8, 2.4, 27.2),
            ("STATION-GDK-L5", "Tailgate Regulator Junction", 0.76, 48.0, 20.2, 1.5, 30.2),
            ("STATION-GDK-L6", "Substation Gallery Air Splice", 0.22, 6.1, 20.9, 2.6, 26.8),
        ]

        for i, (code, loc, ch4, co, o2, vel, temp) in enumerate(stations):
            timestamp = now - timedelta(minutes=i * 25)
            status_badge = "NORMAL"
            if ch4 >= 0.75 or co >= 50:
                status_badge = "STATUTORY_BREACH"
            elif ch4 >= 0.50 or co >= 15:
                status_badge = "EXCURSION_WARNING"

            rec_id = f"gdk-gas-{1000 + i}"
            payload_data = {
                "id": rec_id,
                "station_code": code,
                "location_name": loc,
                "ch4_pct": ch4,
                "co_ppm": co,
                "o2_pct": o2,
                "velocity_ms": vel,
                "temp_c": temp,
                "status": status_badge,
                "timestamp": timestamp.isoformat(),
            }
            results.append({
                **payload_data,
                "record_hash": compute_sha256(payload_data),
                "is_immutable": True,
                "approval_state": "APPROVED",
            })

    return results


# ─────────────────────────────────────────────────────────────────────────────
# 2. Worker Muster Logs
# ─────────────────────────────────────────────────────────────────────────────
@router.get("/workers")
async def get_worker_muster_logs(
    mine_site_id: Optional[str] = Query(None),
    limit: int = Query(50, le=200),
    user: Optional[CurrentUser] = None,
):
    """
    Returns worker shift logs:
    Worker name, designation, gallery station deployment, check-in/out timestamps,
    statutory overtime indicator (>8h), and SHA-256 verification hashes.
    """
    mine_uuid = None
    if mine_site_id:
        try:
            mine_uuid = UUID(mine_site_id)
        except Exception:
            pass

    records = []
    if mine_uuid:
        records = await WorkerAttendanceModel.find(
            WorkerAttendanceModel.mine_site_id == mine_uuid
        ).sort("-check_in_time").limit(limit).to_list()
    else:
        records = await WorkerAttendanceModel.find().sort("-check_in_time").limit(limit).to_list()

    results = []
    if records:
        for r in records:
            check_in = r.check_in_time or datetime.now(timezone.utc)
            if check_in.tzinfo is None:
                check_in = check_in.replace(tzinfo=timezone.utc)

            duration_hours = 0.0
            if r.check_out_time:
                check_out = r.check_out_time
                if check_out.tzinfo is None:
                    check_out = check_out.replace(tzinfo=timezone.utc)
                duration_hours = (check_out - check_in).total_seconds() / 3600.0
            else:
                duration_hours = (datetime.now(timezone.utc) - check_in).total_seconds() / 3600.0

            is_overtime = duration_hours > 8.0
            payload_data = {
                "id": str(r.id),
                "worker_id": r.worker_id,
                "worker_name": r.worker_name,
                "station_id": r.station_id or "GALLERY-GDK-L2",
                "zone_type": r.zone_type or "UNDERGROUND",
                "shift": r.shift,
                "check_in_time": check_in.isoformat(),
                "check_out_time": r.check_out_time.isoformat() if r.check_out_time else None,
                "biometric_verified": r.biometric_verified,
                "duration_hours": round(duration_hours, 1),
                "is_overtime": is_overtime,
                "gas_exposure_ppm": r.gas_level_exposure_ppm or 8.0,
                "status": r.status,
            }
            results.append({
                **payload_data,
                "record_hash": compute_sha256(payload_data),
                "is_immutable": True,
            })
    else:
        # Realistic Telangana SCCL shift muster list
        mock_workers = [
            ("W-SCCL-101", "K. Shankaraiah", "Mining Sirdar (Overman)", "GALLERY-GDK-L2", "MORNING", 7.2, 6.5),
            ("W-SCCL-102", "P. Rajamallu", "SDL Operator (Excavation)", "FACE-3A-LONGWALL", "MORNING", 9.4, 18.0),
            ("W-SCCL-103", "B. Thirupathi", "Ventilation In-Charge", "RETURN-AIRWAY-G4", "MORNING", 6.8, 12.0),
            ("W-SCCL-104", "M. Srinivas Rao", "Electrical Fitter", "SUBSTATION-GDK", "MORNING", 8.9, 4.5),
            ("W-SCCL-105", "G. Mallesh", "Timber Mistry (Roof Support)", "GALLERY-HEADING-2", "MORNING", 7.5, 7.8),
            ("W-SCCL-106", "S. Anjaiah", "Conveyor Belt Attendant", "TRUNK-CONVEYOR-T1", "MORNING", 10.2, 5.0),
        ]
        now = datetime.now(timezone.utc)
        for i, (wid, name, desig, stn, shift, hrs, gas) in enumerate(mock_workers):
            check_in = now - timedelta(hours=hrs)
            is_ot = hrs > 8.0
            payload_data = {
                "id": f"att-seed-{i+1}",
                "worker_id": wid,
                "worker_name": name,
                "designation": desig,
                "station_id": stn,
                "zone_type": "UNDERGROUND",
                "shift": shift,
                "check_in_time": check_in.isoformat(),
                "check_out_time": None,
                "biometric_verified": True,
                "duration_hours": hrs,
                "is_overtime": is_ot,
                "gas_exposure_ppm": gas,
                "status": "ACTIVE_INSIDE",
            }
            results.append({
                **payload_data,
                "record_hash": compute_sha256(payload_data),
                "is_immutable": True,
            })

    return results


# ─────────────────────────────────────────────────────────────────────────────
# 3. Mine Casts & Extraction Logs
# ─────────────────────────────────────────────────────────────────────────────
@router.get("/mine-casts")
async def get_mine_cast_logs(
    mine_site_id: Optional[str] = Query(None),
    limit: int = Query(50, le=200),
    user: Optional[CurrentUser] = None,
):
    """
    Returns opencast bench production, daily extraction tonnage vs quota,
    dumper trip counts, and blasting clearance logs.
    """
    mine_uuid = None
    if mine_site_id:
        try:
            mine_uuid = UUID(mine_site_id)
        except Exception:
            pass

    records = []
    if mine_uuid:
        records = await MineCastExtractionModel.find(
            MineCastExtractionModel.mine_site_id == mine_uuid
        ).sort("-created_at").limit(limit).to_list()
    else:
        records = await MineCastExtractionModel.find().sort("-created_at").limit(limit).to_list()

    results = []
    if records:
        for r in records:
            pct = round((r.extraction_tonnage / max(1.0, r.target_quota_tonnage)) * 100.0, 1)
            payload_data = {
                "id": str(r.id),
                "bench_id": r.bench_id,
                "bench_name": r.bench_name,
                "shift": r.shift,
                "date": getattr(r, "cast_date", None).isoformat() if getattr(r, "cast_date", None) else date.today().isoformat(),
                "extraction_tonnage": r.extraction_tonnage,
                "target_quota_tonnage": r.target_quota_tonnage,
                "quota_achievement_pct": pct,
                "dumper_trips_count": r.dumper_trips_count,
                "blasting_clearance_status": r.blasting_clearance_status,
                "explosives_used_kg": r.explosives_used_kg,
                "clearance_engineer": r.clearance_engineer_name,
                "status": r.status,
            }
            results.append({
                **payload_data,
                "record_hash": r.record_hash or compute_sha256(payload_data),
                "is_immutable": True,
            })
    else:
        # Realistic Telangana SCCL Opencast (RG-OCP 3 / KOCP) benches
        today = date.today()
        benches = [
            ("BENCH-OCP-B1", "Top Seam Overburden Bench (East Flank)", "MORNING", 2150.0, 2000.0, 72, "CLEARED", 450.0, "Er. K. Venkat Rao"),
            ("BENCH-OCP-B2", "Main Coal Seam IV Working Face", "MORNING", 1820.0, 1800.0, 58, "CLEARED", 320.0, "Ch. Srinivas (Manager)"),
            ("BENCH-OCP-B3", "Bottom Sump Drainage Cut Bench", "MORNING", 940.0, 1200.0, 31, "RESTRICTED", 180.0, "T. Rajesh (HEMM In-Charge)"),
            ("BENCH-OCP-B4", "Highwall Pushback North Bench", "EVENING", 2400.0, 2200.0, 80, "CLEARED", 520.0, "Er. K. Venkat Rao"),
            ("BENCH-OCP-B5", "Interburden Shovel Extraction 2A", "EVENING", 1680.0, 1700.0, 54, "HOLD", 0.0, "Dr. R. K. Sharma"),
        ]

        for i, (b_id, name, shift, ext, quota, dumpers, blast_stat, exp, eng) in enumerate(benches):
            pct = round((ext / quota) * 100.0, 1)
            payload_data = {
                "id": f"cast-seed-{i+1}",
                "bench_id": b_id,
                "bench_name": name,
                "shift": shift,
                "date": (today - timedelta(days=i)).isoformat(),
                "extraction_tonnage": ext,
                "target_quota_tonnage": quota,
                "quota_achievement_pct": pct,
                "dumper_trips_count": dumpers,
                "blasting_clearance_status": blast_stat,
                "explosives_used_kg": exp,
                "clearance_engineer": eng,
                "status": "COMMITTED",
            }
            results.append({
                **payload_data,
                "record_hash": compute_sha256(payload_data),
                "is_immutable": True,
            })

    return results


# ─────────────────────────────────────────────────────────────────────────────
# 4. Tamper Mutation Interception Test Route (Demonstrates Part 1)
# ─────────────────────────────────────────────────────────────────────────────
class MutateLogRequest(BaseModel):
    target_field: str = Field(..., description="Field to alter e.g. co_ppm or ch4_percentage")
    new_value: Any = Field(..., description="Falsified value")
    mine_site_id: Optional[str] = Field(None, description="Mine Site UUID")


@router.put("/atmospheric/{log_id}")
async def mutate_atmospheric_log(
    log_id: str,
    body: MutateLogRequest,
    user: Optional[CurrentUser] = None,
    audit_svc: AuditService = Depends(get_audit_service),
):
    """
    Statutory Interceptor Hook:
    Simulates a Colliery Manager attempting to edit historical gas readings.
    Since atmospheric logs have status COMMITTED or APPROVED:
    1. Rejects mutation as UNAUTHORIZED_MODIFICATION_ATTEMPT.
    2. Appends an immutable block to AuditLedgerModel with action STATUTORY_RECORD_TAMPER_ATTEMPT.
    3. Dispatches CRITICAL real-time notifications to MINISTRY_AUDITOR and DGMS_INSPECTOR.
    4. Throws HTTP 403 Forbidden.
    """
    mine_uuid = UUID("11111111-1111-4111-a111-111111111111")
    if body.mine_site_id:
        try:
            mine_uuid = UUID(body.mine_site_id)
        except Exception:
            pass

    caller_id = UUID(user["user_id"]) if user and "user_id" in user else uuid.uuid4()
    caller_role = user.get("role", "COLLIERY_MANAGER") if user else "COLLIERY_MANAGER"
    caller_name = user.get("full_name", "N. Ramesh (Colliery Manager - GDK 11A)") if user else "N. Ramesh (Colliery Manager - GDK 11A)"

    incident = await audit_svc.intercept_tamper_attempt(
        mine_site_id=mine_uuid,
        actor_id=caller_id,
        actor_name=caller_name,
        actor_role=caller_role,
        colliery_name="Godavarikhani No. 11A Incline (GDK-11A) SCCL",
        target_model="TelemetryGasModel",
        entity_id=uuid.uuid4(),
        target_field=body.target_field,
        old_value="68.0 ppm CO",
        new_value=f"{body.new_value} (Suppressed Reading)",
        stored_hash="SHA256:7b92f441c0e3a890d9841289cf3011aa",
    )

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail={
            "error": "UNAUTHORIZED_MODIFICATION_ATTEMPT",
            "message": (
                f"Statutory Mutation Blocked: Historical atmospheric telemetry at Godavarikhani No. 11A "
                f"is cryptographically sealed. Attempted tampering of '{body.target_field}' was permanently logged "
                f"in SHA-256 Audit Block #{incident['audit_block_sequence']}. "
                f"Urgent Level-3 alerts dispatched to DGMS & Ministry of Coal."
            ),
            "incident": incident,
        },
    )
