"""
Celery App Factory + Beat Schedule
Three queues: compliance, scoring, documents
"""
from celery import Celery
from celery.schedules import crontab

from app.config import settings

celery_app = Celery(
    "coal_governance",
    broker        = settings.CELERY_BROKER_URL,
    backend       = settings.CELERY_RESULT_BACKEND,
    include       = [
        "app.workers.compliance_monitor",
        "app.workers.risk_scorer",
        "app.workers.document_processor",
    ],
)

celery_app.conf.update(
    task_serializer        = "json",
    accept_content         = ["json"],
    result_serializer      = "json",
    timezone               = "Asia/Kolkata",
    enable_utc             = True,
    task_track_started     = True,
    task_acks_late         = True,
    worker_prefetch_multiplier = 1,
    task_routes            = {
        "app.workers.compliance_monitor.*": {"queue": "compliance"},
        "app.workers.risk_scorer.*":        {"queue": "scoring"},
        "app.workers.document_processor.*": {"queue": "documents"},
    },
)

# ── Beat Schedule ─────────────────────────────────────────────────────────────
celery_app.conf.beat_schedule = {
    "compliance-monitor-daily": {
        "task":     "app.workers.compliance_monitor.scan_permit_expirations",
        "schedule": crontab(hour=0, minute=30),   # 00:30 IST daily
        "options":  {"queue": "compliance"},
    },
}
