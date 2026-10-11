import logging
from typing import Dict, Optional
from fastapi import APIRouter, HTTPException, status
from app.schemas import (
    AuditRequest,
    AuditResponse,
    DocumentType,
    ExtractRequest,
    ExtractResponse,
    HealthResponse,
    PresignRequest,
    PresignResponse,
    SimulateRequest,
    SimulationResponse,
)
from app.services.audit import run_audit
from app.services.document_extraction import extract_document_fields
from app.services.panel_packing import GeometryValidationError
from app.services.simulation import run_simulation
from app.services.storage import generate_presigned_upload

logger = logging.getLogger("suryasathi.api")
api_router = APIRouter()


@api_router.get("/health", response_model=HealthResponse)
def api_health() -> HealthResponse:
    """Returns service health status."""
    return HealthResponse(status="ok", service="suryasathi-api", version="0.1.0")


@api_router.post("/uploads/presign", response_model=PresignResponse)
def presign(request: PresignRequest) -> PresignResponse:
    """Generates a short-lived presigned upload URL for direct client upload."""
    try:
        return generate_presigned_upload(request)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        logger.error(f"Presign failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate upload URL.",
        )


@api_router.post("/documents/extract", response_model=ExtractResponse)
async def extract(request: ExtractRequest) -> ExtractResponse:
    """Extracts structured fields from uploaded document using Textract/Bedrock or fallback."""
    try:
        return await extract_document_fields(request.document_type, request.object_key)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        logger.error(f"Extraction failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Document extraction failed.",
        )


# Compatibility aliases for CURSOR_FRONTEND_GUIDE.md
@api_router.post("/bill/extract", response_model=ExtractResponse)
async def extract_bill_alias(body: Dict[str, str]) -> ExtractResponse:
    object_key = body.get("object_key", "")
    return await extract(ExtractRequest(document_type=DocumentType.BILL, object_key=object_key))


@api_router.post("/quote/extract", response_model=ExtractResponse)
async def extract_quote_alias(body: Dict[str, str]) -> ExtractResponse:
    object_key = body.get("object_key", "")
    return await extract(ExtractRequest(document_type=DocumentType.QUOTE, object_key=object_key))


@api_router.post("/simulate", response_model=SimulationResponse)
async def simulate(request: SimulateRequest) -> SimulationResponse:
    """
    Simulates roof panel packing and queries PVGIS solar yield server-side.
    Returns a stateless signed simulation_id.
    """
    try:
        return await run_simulation(request)
    except GeometryValidationError as e:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(e))
    except Exception as e:
        logger.error(f"Simulation failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Solar simulation calculation failed.",
        )


@api_router.post("/audit", response_model=AuditResponse)
async def audit(request: AuditRequest) -> AuditResponse:
    """
    Executes deterministic audit comparing vendor quote claims against
    simulation model and policy snapshots.
    """
    try:
        # If simulation was not passed and cannot be decoded from token, check if input was provided
        simulation_obj = request.simulation
        if simulation_obj is None and request.simulate_input is not None:
            simulation_obj = await run_simulation(request.simulate_input)

        return run_audit(request, resolved_simulation=simulation_obj)
    except Exception as e:
        logger.error(f"Audit failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Audit execution failed.",
        )


# Report retrieval aliases
@api_router.get("/reports/{audit_id}")
@api_router.get("/report/{audit_id}")
def get_report(audit_id: str):
    """
    Optional report metadata endpoint.
    Frontend generates print report locally; this endpoint provides basic confirmation.
    """
    return {
        "audit_id": audit_id,
        "status": "ready",
        "message": "Report data rendered client-side from audit response.",
    }
