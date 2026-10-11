import uuid
from typing import Optional
from app.config import settings
from app.schemas import PresignRequest, PresignResponse

# File validation constraints
ALLOWED_MIME_TYPES = {"application/pdf", "image/jpeg", "image/png"}
MAX_FILE_BYTES = 8 * 1024 * 1024  # 8 MB


def get_s3_client():
    """Returns a boto3 S3 client if AWS credentials are valid."""
    try:
        import boto3
        if settings.S3_UPLOAD_BUCKET:
            return boto3.client("s3", region_name=settings.AWS_REGION)
    except Exception:
        pass
    return None


def generate_presigned_upload(request: PresignRequest) -> PresignResponse:
    """
    Generates a secure, short-lived presigned upload URL for direct client upload
    to private S3 storage. If S3 is not configured, provides a safe local fallback.
    """
    if request.content_type not in ALLOWED_MIME_TYPES:
        raise ValueError(f"Content type '{request.content_type}' is not allowed. Use PDF, JPEG, or PNG.")

    if request.file_size_bytes <= 0:
        raise ValueError("File size must be greater than zero bytes.")

    if request.file_size_bytes > MAX_FILE_BYTES:
        raise ValueError(f"File size exceeds maximum allowed limit of {MAX_FILE_BYTES // (1024*1024)} MB.")

    # Do not retain the user's original filename in the object key; filenames can contain PII.
    extension = {
        "application/pdf": "pdf",
        "image/jpeg": "jpg",
        "image/png": "png",
    }[request.content_type]
    token_id = uuid.uuid4().hex
    object_key = f"temporary/{request.document_type.value}/{token_id}/document.{extension}"
    expires_in = 300

    s3 = get_s3_client()
    if s3 and settings.S3_UPLOAD_BUCKET:
        try:
            url = s3.generate_presigned_url(
                ClientMethod="put_object",
                Params={
                    "Bucket": settings.S3_UPLOAD_BUCKET,
                    "Key": object_key,
                    "ContentType": request.content_type,
                },
                ExpiresIn=expires_in,
            )
            return PresignResponse(
                upload_url=url,
                object_key=object_key,
                expires_in_seconds=expires_in,
            )
        except Exception as e:
            raise RuntimeError(f"Failed to generate AWS S3 presigned URL: {str(e)}")

    # Fallback when S3 is not configured in local development
    local_url = f"http://127.0.0.1:8001/api/v1/uploads/local/{object_key}"
    return PresignResponse(
        upload_url=local_url,
        object_key=object_key,
        expires_in_seconds=expires_in,
    )
