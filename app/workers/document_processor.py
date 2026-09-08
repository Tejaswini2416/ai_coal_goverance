"""
Worker 3 — Document Processor
Issues pre-signed S3 URLs and provides OCR stub for uploaded PDFs/images.
"""
import structlog

from app.workers.celery_app import celery_app

logger = structlog.get_logger(__name__)


@celery_app.task(
    name="app.workers.document_processor.issue_upload_url",
    bind=True,
    queue="documents",
)
def issue_upload_url(
    self,
    mine_site_id:  str,
    document_type: str,
    filename:      str,
    content_type:  str = "application/octet-stream",
) -> dict:
    """Issue a pre-signed S3 PUT URL asynchronously."""
    from app.infrastructure.storage.s3_client import (
        build_object_key,
        generate_upload_presigned_url,
    )
    from app.config import settings

    bucket     = (
        settings.MINIO_BUCKET_EVIDENCE
        if document_type in ("INSPECTION_PHOTO", "RECTIFICATION_PHOTO")
        else settings.MINIO_BUCKET_DOCUMENTS
    )
    object_key = build_object_key(mine_site_id, document_type.lower(), filename)
    upload_url = generate_upload_presigned_url(bucket, object_key, content_type)

    logger.info("presigned_url_issued", bucket=bucket, object_key=object_key)
    return {"upload_url": upload_url, "object_key": object_key, "bucket": bucket}


@celery_app.task(
    name="app.workers.document_processor.process_uploaded_document",
    bind=True,
    queue="documents",
    max_retries=2,
)
def process_uploaded_document(
    self,
    bucket:     str,
    object_key: str,
    entity_type: str,   # 'inspection' | 'compliance_schedule'
    entity_id:  str,
) -> dict:
    """
    OCR processing stub.
    In production: download from S3, call Tesseract/AWS Textract/Google Vision,
    extract permit number / expiry date / inspection summary, update the DB record.
    """
    logger.info(
        "document_processing_stub",
        bucket=bucket,
        object_key=object_key,
        entity_type=entity_type,
        entity_id=entity_id,
    )
    # TODO: Implement full OCR pipeline
    # 1. s3_client.download_object(bucket, object_key) -> bytes
    # 2. ocr_engine.extract_text(bytes) -> str
    # 3. parser.extract_fields(text) -> dict
    # 4. db.update_entity(entity_type, entity_id, fields)
    return {
        "status":      "OCR_QUEUED",
        "bucket":      bucket,
        "object_key":  object_key,
        "entity_id":   entity_id,
    }
