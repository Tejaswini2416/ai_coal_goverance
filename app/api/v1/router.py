"""V1 API Router — aggregates all sub-routers."""
from fastapi import APIRouter

from app.api.v1 import (
    attendance,
    audit,
    auth,
    compliance,
    dashboard,
    documents,
    inspections,
    notifications,
    reports,
    risk,
    schedules,
    sync,
    tenants,
    underground_stations,
    violations,
    worker,
    escalations,
    logs,
)

v1_router = APIRouter()

v1_router.include_router(logs.router)

v1_router.include_router(auth.router)
v1_router.include_router(dashboard.router, prefix="/dashboard")
v1_router.include_router(risk.router)
v1_router.include_router(tenants.router)
v1_router.include_router(inspections.router)
v1_router.include_router(violations.router)
v1_router.include_router(worker.router)
v1_router.include_router(escalations.router)
v1_router.include_router(audit.router)
v1_router.include_router(audit.router, prefix="/audit")
v1_router.include_router(compliance.router)
v1_router.include_router(documents.router)
v1_router.include_router(underground_stations.router)
v1_router.include_router(sync.router)
v1_router.include_router(schedules.router)
v1_router.include_router(notifications.router)
v1_router.include_router(attendance.router)
v1_router.include_router(reports.router)
