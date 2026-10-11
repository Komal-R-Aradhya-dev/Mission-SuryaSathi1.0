from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from mangum import Mangum
from app.api.router import api_router
from app.config import settings
from app.schemas import HealthResponse

app = FastAPI(
    title="SuryaSathi API",
    description="Consumer-side solar decision intelligence for Indian households.",
    version="0.1.0",
)

# Configure CORS for local development and deployed frontend origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Root health check endpoint (as specified in API_CONTRACTS.md)
@app.get("/health", response_model=HealthResponse)
def root_health() -> HealthResponse:
    return HealthResponse(status="ok", service="suryasathi-api", version="0.1.0")


# Include versioned API router under /api/v1
app.include_router(api_router, prefix=settings.API_PREFIX)


# Local mock upload endpoint for testing uploads when S3 is not configured
@app.put(f"{settings.API_PREFIX}/uploads/local/{{file_path:path}}")
async def local_mock_upload(file_path: str, request: Request):
    """Local simulation of presigned PUT upload destination."""
    body_bytes = await request.body()
    return Response(
        status_code=200,
        content=(
            f"Received {len(body_bytes)} bytes for a local upload connectivity check. "
            "The file was not persisted or processed; configure private S3 and Textract for extraction."
        ),
        media_type="text/plain",
    )


# Mangum handler for AWS Lambda deployment
handler = Mangum(app)
