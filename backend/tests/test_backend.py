import asyncio

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.schemas import (
    ArrayInput,
    AuditRequest,
    AuditStatus,
    LocationInput,
    ObstacleInput,
    QuoteClaims,
    RangeKwh,
    SimulateRequest,
    SimulationResponse,
    TerraceInput,
)
from app.api import router as router_module
from app.services.audit import run_audit
from app.services.document_extraction import _extract_labelled_fields, validate_object_key
from app.services.panel_packing import GeometryValidationError, pack_panels
from app.services.pvgis import fetch_pvgis_yield
from app.services.storage import generate_presigned_upload
from app.schemas import PresignRequest, DocumentType
from app.tokens import create_simulation_token, decode_simulation_token


client = TestClient(app)


def sample_simulation() -> SimulationResponse:
    return SimulationResponse(
        simulation_id="sim_test",
        feasible_system_kw=RangeKwh(min=3.2, max=4.32),
        panel_count=8,
        panel_capacity_kwp=4.32,
        usable_roof_area_m2=55.0,
        estimated_generation_kwh_year=RangeKwh(min=4300, max=5000),
        generation_method="Test fixture only",
        shadow_method="Test fixture only",
        assumptions=["Test fixture, not a real solar estimate"],
        warnings=[],
    )


def test_health_endpoint() -> None:
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {
        "status": "ok",
        "service": "suryasathi-api",
        "version": "0.1.0",
    }



def test_simulate_endpoint_contract_without_external_pvgis(monkeypatch) -> None:
    async def fake_run_simulation(request):
        return sample_simulation()

    monkeypatch.setattr(router_module, "run_simulation", fake_run_simulation)
    payload = {
        "location": {"latitude": 13.3409, "longitude": 77.1010, "pincode": "572106"},
        "terrace": {
            "length_m": 12.0, "width_m": 8.0, "roof_slope_deg": 0.0,
            "roof_azimuth_deg": 180.0, "edge_setback_m": 0.5, "obstacles": [],
        },
        "array": {
            "panel_model": "user-confirmed generic assumption",
            "panel_rated_power_w": 540, "panel_length_m": 2.28, "panel_width_m": 1.13,
            "panel_tilt_deg": 15.0, "panel_azimuth_deg": 180.0,
        },
        "consumption": {"annual_units_kwh": 4800, "sanctioned_load_kw": 5.0},
    }
    response = client.post("/api/v1/simulate", json=payload)
    assert response.status_code == 200
    assert response.json()["panel_capacity_kwp"] == 4.32
    assert response.json()["estimated_generation_kwh_year"]["max"] == 5000


def test_audit_endpoint_accepts_frontend_stateless_token_contract() -> None:
    token = create_simulation_token(sample_simulation())
    response = client.post(
        "/api/v1/audit",
        json={
            "simulation_id": token,
            "quote_claims": {
                "claimed_system_size_kw": 4.0,
                "claimed_annual_generation_kwh": 7000,
                "panel_rated_power_w": 540,
                "panel_count": 8,
                "inverter_capacity_kw": 3.0,
                "quoted_price_inr": 230000,
            },
            "confirmed_fields": ["claimed_system_size_kw", "claimed_annual_generation_kwh"],
        },
    )
    assert response.status_code == 200
    checks = {item["id"]: item["status"] for item in response.json()["checks"]}
    assert checks["module_capacity_arithmetic"] == "INCONSISTENT"
    assert checks["annual_generation_claim"] == "HIGH_DISCREPANCY"


def test_presign_endpoint_returns_frontend_compatible_shape(monkeypatch) -> None:
    from app.services import storage as storage_module

    monkeypatch.setattr(storage_module, "get_s3_client", lambda: None)
    response = client.post(
        "/api/v1/uploads/presign",
        json={
            "document_type": "quote",
            "file_name": "customer-name-quote.pdf",
            "content_type": "application/pdf",
            "file_size_bytes": 1024,
        },
    )
    assert response.status_code == 200
    body = response.json()
    assert body["upload_url"].startswith("http://127.0.0.1:8000/api/v1/uploads/local/")
    assert body["object_key"].startswith("temporary/quote/")
    assert "customer-name" not in body["object_key"]
    assert body["expires_in_seconds"] == 300

def test_panel_capacity_arithmetic_is_deterministic() -> None:
    terrace = TerraceInput(length_m=12, width_m=8, edge_setback_m=0.5, obstacles=[])
    array = ArrayInput(
        panel_model="User-confirmed generic module",
        panel_rated_power_w=540,
        panel_length_m=2.28,
        panel_width_m=1.13,
        panel_tilt_deg=15,
        panel_azimuth_deg=180,
    )
    result = pack_panels(terrace, array)
    assert result["panel_count"] > 0
    assert result["panel_capacity_kwp"] == round(result["panel_count"] * 540 / 1000, 3)


def test_obstacle_outside_roof_is_rejected() -> None:
    terrace = TerraceInput(
        length_m=5,
        width_m=5,
        edge_setback_m=0.5,
        obstacles=[ObstacleInput(x_offset_m=4.5, y_offset_m=1, width_m=1, length_m=1, height_m=1)],
    )
    array = ArrayInput(panel_rated_power_w=540, panel_length_m=2.28, panel_width_m=1.13)
    with pytest.raises(GeometryValidationError):
        pack_panels(terrace, array)


def test_invalid_angles_are_rejected() -> None:
    with pytest.raises(ValueError):
        TerraceInput(length_m=10, width_m=8, roof_slope_deg=91)
    with pytest.raises(ValueError):
        ArrayInput(panel_tilt_deg=-1)


def test_signed_simulation_token_round_trip_and_tamper_rejection() -> None:
    result = sample_simulation()
    token = create_simulation_token(result)
    decoded = decode_simulation_token(token)
    assert decoded is not None
    assert decoded.panel_capacity_kwp == 4.32
    bad_token = token[:-1] + ("0" if token[-1] != "0" else "1")
    assert decode_simulation_token(bad_token) is None


def test_audit_flags_panel_arithmetic_and_unverified_policy() -> None:
    simulation = sample_simulation()
    request = AuditRequest(
        simulation_id="ignored-when-simulation-is-provided",
        simulation=simulation,
        quote_claims=QuoteClaims(
            claimed_system_size_kw=4.0,
            claimed_annual_generation_kwh=7000,
            panel_rated_power_w=540,
            panel_count=8,
            inverter_capacity_kw=3.0,
            quoted_price_inr=230000,
        ),
        confirmed_fields=["claimed_system_size_kw", "claimed_annual_generation_kwh"],
    )
    result = run_audit(request, resolved_simulation=simulation)
    statuses = {check.id: check.status for check in result.checks}
    assert statuses["module_capacity_arithmetic"] == AuditStatus.INCONSISTENT
    assert statuses["annual_generation_claim"] == AuditStatus.HIGH_DISCREPANCY
    assert statuses["quoted_price_and_scope"] == AuditStatus.NEEDS_REVIEW
    assert any(check.status == AuditStatus.UNVERIFIED for check in result.policy_checks)


def test_pvgis_offline_mode_does_not_invent_yield() -> None:
    generation, method, warning = asyncio.run(
        fetch_pvgis_yield(
            latitude=13.3409,
            longitude=77.1010,
            peak_power_kwp=3.0,
            force_offline=True,
        )
    )
    assert generation.min == 0 and generation.max == 0
    assert "unavailable" in method.lower()
    assert warning and "fabricated" in warning.lower()



def test_textract_parser_extracts_only_labelled_fields_and_marks_review() -> None:
    blocks = [
        {"BlockType": "LINE", "Text": "System Size: 4.0 kW", "Page": 1, "Confidence": 98},
        {"BlockType": "LINE", "Text": "Annual Generation: 6,200 kWh/year", "Page": 1, "Confidence": 96},
        {"BlockType": "LINE", "Text": "Panel count: 8", "Page": 1, "Confidence": 95},
        {"BlockType": "LINE", "Text": "Panel rated power: 540 Wp", "Page": 1, "Confidence": 95},
        {"BlockType": "LINE", "Text": "Total price: INR 230,000", "Page": 2, "Confidence": 90},
    ]
    fields = _extract_labelled_fields(DocumentType.QUOTE, blocks)
    assert fields["claimed_system_size_kw"].value == 4.0
    assert fields["claimed_annual_generation_kwh"].value == 6200.0
    assert fields["panel_count"].value == 8
    assert fields["panel_rated_power_w"].value == 540
    assert fields["quoted_price_inr"].value == 230000.0
    assert fields["quoted_price_inr"].page == 2
    assert fields["quoted_price_inr"].confidence == pytest.approx(0.90)
    assert fields["quoted_price_inr"].needs_review is True


def test_document_object_key_must_be_under_expected_prefix() -> None:
    validate_object_key(DocumentType.BILL, "temporary/bill/abc/document.pdf")
    with pytest.raises(ValueError):
        validate_object_key(DocumentType.BILL, "temporary/quote/abc/document.pdf")
    with pytest.raises(ValueError):
        validate_object_key(DocumentType.BILL, "temporary/bill/../private.pdf")

def test_upload_request_rejects_bad_mime_and_nonpositive_size() -> None:
    with pytest.raises(ValueError):
        generate_presigned_upload(
            PresignRequest(
                document_type=DocumentType.QUOTE,
                file_name="quote.exe",
                content_type="application/octet-stream",
                file_size_bytes=200,
            )
        )
    with pytest.raises(ValueError):
        generate_presigned_upload(
            PresignRequest(
                document_type=DocumentType.BILL,
                file_name="bill.pdf",
                content_type="application/pdf",
                file_size_bytes=0,
            )
        )


def test_production_settings_reject_development_secret() -> None:
    from pydantic import ValidationError
    from app.config import Settings

    with pytest.raises(ValidationError):
        Settings(
            ENVIRONMENT="production",
            TOKEN_SECRET_KEY="local-development-secret-key-please-change-32bytes",
        )
