"""Document Service — MinIO/S3 pre-signed URL generation."""
import uuid
from uuid import UUID

from app.config import settings
from app.infrastructure.storage.s3_client import (
    build_object_key,
    generate_download_presigned_url,
    generate_upload_presigned_url,
)


class DocumentService:
    def generate_upload_url(
        self,
        mine_site_id:  UUID,
        document_type: str,
        filename:      str,
        content_type:  str = "application/octet-stream",
    ) -> dict:
        """
        Issue a pre-signed S3 PUT URL for direct client upload.
        Returns the object_key (for later download reference) and upload URL.
        """
        bucket     = (
            settings.MINIO_BUCKET_EVIDENCE
            if document_type in ("INSPECTION_PHOTO", "RECTIFICATION_PHOTO")
            else settings.MINIO_BUCKET_DOCUMENTS
        )
        object_key = build_object_key(str(mine_site_id), document_type.lower(), filename)
        upload_url = generate_upload_presigned_url(
            bucket       = bucket,
            object_key   = object_key,
            content_type = content_type,
        )
        return {
            "upload_url":  upload_url,
            "object_key":  object_key,
            "bucket":      bucket,
            "expires_in":  settings.PRESIGNED_URL_EXPIRY_SECONDS,
        }

    def generate_download_url(self, bucket: str, object_key: str) -> dict:
        """Issue a pre-signed S3 GET URL for authenticated download."""
        download_url = generate_download_presigned_url(bucket=bucket, object_key=object_key)
        return {
            "download_url": download_url,
            "object_key":   object_key,
            "expires_in":   settings.PRESIGNED_URL_EXPIRY_SECONDS,
        }
