"""Documents router — pre-signed S3 URL generation."""
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel

from app.dependencies import CurrentUser, get_document_service
from app.services.document_service import DocumentService

router = APIRouter(prefix="/documents", tags=["Documents"])


class UploadUrlRequest(BaseModel):
    mine_site_id:  UUID
    document_type: str       # INSPECTION_PHOTO | RECTIFICATION_PHOTO | TEST_CERTIFICATE | PERMIT
    filename:      str
    content_type:  str = "application/octet-stream"


class UploadUrlResponse(BaseModel):
    upload_url:  str
    object_key:  str
    bucket:      str
    expires_in:  int


class DownloadUrlResponse(BaseModel):
    download_url: str
    object_key:   str
    expires_in:   int


@router.post("/upload-url", response_model=UploadUrlResponse)
async def get_upload_url(
    body:     UploadUrlRequest,
    user:     CurrentUser,
    doc_svc:  DocumentService = Depends(get_document_service),
):
    """Issue a pre-signed S3 PUT URL for direct client-side file upload."""
    result = doc_svc.generate_upload_url(
        mine_site_id  = body.mine_site_id,
        document_type = body.document_type,
        filename      = body.filename,
        content_type  = body.content_type,
    )
    return UploadUrlResponse(**result)


@router.get("/download-url", response_model=DownloadUrlResponse)
async def get_download_url(
    bucket:     str  = Query(...),
    object_key: str  = Query(...),
    user:       CurrentUser = ...,
    doc_svc:    DocumentService = Depends(get_document_service),
):
    """Issue a pre-signed S3 GET URL for authenticated document download."""
    result = doc_svc.generate_download_url(bucket=bucket, object_key=object_key)
    return DownloadUrlResponse(**result)
