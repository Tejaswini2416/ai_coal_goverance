"""
MinIO / S3-compatible storage client.
Issues pre-signed PUT (upload) and GET (download) URLs.
"""
import mimetypes
import uuid
from datetime import timedelta

import boto3
from botocore.client import Config
from botocore.exceptions import ClientError

from app.config import settings


def _get_s3_client():
    return boto3.client(
        "s3",
        endpoint_url=f"{'https' if settings.MINIO_USE_SSL else 'http'}://{settings.MINIO_ENDPOINT}",
        aws_access_key_id=settings.MINIO_ACCESS_KEY,
        aws_secret_access_key=settings.MINIO_SECRET_KEY,
        config=Config(signature_version="s3v4"),
        region_name="us-east-1",  # MinIO ignores region but boto3 requires it
    )


def generate_upload_presigned_url(
    bucket: str,
    object_key: str,
    content_type: str = "application/octet-stream",
    expiry_seconds: int | None = None,
) -> str:
    """
    Generate a pre-signed PUT URL for direct client-side upload.
    Returns a URL that expires in `expiry_seconds` seconds.
    """
    client = _get_s3_client()
    ttl = expiry_seconds or settings.PRESIGNED_URL_EXPIRY_SECONDS
    url = client.generate_presigned_url(
        ClientMethod="put_object",
        Params={
            "Bucket": bucket,
            "Key": object_key,
            "ContentType": content_type,
        },
        ExpiresIn=ttl,
    )
    return url


def generate_download_presigned_url(
    bucket: str,
    object_key: str,
    expiry_seconds: int | None = None,
) -> str:
    """
    Generate a pre-signed GET URL for authenticated document download.
    """
    client = _get_s3_client()
    ttl = expiry_seconds or settings.PRESIGNED_URL_EXPIRY_SECONDS
    url = client.generate_presigned_url(
        ClientMethod="get_object",
        Params={
            "Bucket": bucket,
            "Key": object_key,
        },
        ExpiresIn=ttl,
    )
    return url


def ensure_bucket_exists(bucket: str) -> None:
    """Create bucket if it doesn't already exist."""
    client = _get_s3_client()
    try:
        client.head_bucket(Bucket=bucket)
    except ClientError as e:
        if e.response["Error"]["Code"] == "404":
            client.create_bucket(Bucket=bucket)
        else:
            raise


def build_object_key(
    mine_site_id: str,
    document_type: str,
    filename: str,
) -> str:
    """Build a deterministic, namespaced S3 object key."""
    ext = filename.rsplit(".", 1)[-1] if "." in filename else "bin"
    unique_id = uuid.uuid4().hex
    return f"mines/{mine_site_id}/{document_type}/{unique_id}.{ext}"


def delete_object(bucket: str, object_key: str) -> None:
    client = _get_s3_client()
    client.delete_object(Bucket=bucket, Key=object_key)
