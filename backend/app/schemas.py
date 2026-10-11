from enum import Enum
from typing import Dict, List, Literal, Optional, Union
from pydantic import BaseModel, Field, field_validator


class DocumentType(str, Enum):
    BILL = "bill"
    QUOTE = "quote"


class AuditStatus(str, Enum):
    CONSISTENT = "CONSISTENT"
    INCONSISTENT = "INCONSISTENT"
    ABOVE_MODEL = "ABOVE_MODEL"
    HIGH_DISCREPANCY = "HIGH_DISCREPANCY"
    UNVERIFIED = "UNVERIFIED"
    INFORMATION_MISSING = "INFORMATION_MISSING"
    NEEDS_REVIEW = "NEEDS_REVIEW"


class HealthResponse(BaseModel):
    status: str = "ok"
    service: str = "suryasathi-api"
    version: str = "0.1.0"


# Presign Upload
class PresignRequest(BaseModel):
    document_type: DocumentType
    file_name: str
    content_type: str
    file_size_bytes: int


class PresignResponse(BaseModel):
    upload_url: str
    object_key: str
    expires_in_seconds: int = 300


# Document Extraction
class ExtractedField(BaseModel):
    value: Optional[Union[str, float, int, bool]] = None
    source_text: Optional[str] = None
    page: Optional[int] = None
    confidence: Optional[float] = None
    needs_review: bool = False


class ExtractRequest(BaseModel):
    document_type: DocumentType
    object_key: str


class ExtractResponse(BaseModel):
    document_type: DocumentType
    fields: Dict[str, ExtractedField] = Field(default_factory=dict)
    warnings: List[str] = Field(default_factory=list)


# Simulation
class ObstacleInput(BaseModel):
    type: Literal["rectangular_block"] = "rectangular_block"
    x_offset_m: float
    y_offset_m: float
    width_m: float
    length_m: float
    height_m: float

    @field_validator("width_m", "length_m")
    @classmethod
    def validate_positive_dimensions(cls, v: float) -> float:
        if v <= 0:
            raise ValueError("Obstacle dimensions must be strictly positive (> 0)")
        return v

    @field_validator("x_offset_m", "y_offset_m", "height_m")
    @classmethod
    def validate_non_negative_offsets(cls, v: float) -> float:
        if v < 0:
            raise ValueError("Obstacle offsets and height must be non-negative (>= 0)")
        return v


class LocationInput(BaseModel):
    latitude: float
    longitude: float
    pincode: str = ""

    @field_validator("latitude")
    @classmethod
    def validate_lat(cls, v: float) -> float:
        if not (-90.0 <= v <= 90.0):
            raise ValueError("Latitude must be between -90 and 90")
        return v

    @field_validator("longitude")
    @classmethod
    def validate_lon(cls, v: float) -> float:
        if not (-180.0 <= v <= 180.0):
            raise ValueError("Longitude must be between -180 and 180")
        return v


class TerraceInput(BaseModel):
    length_m: float
    width_m: float
    roof_slope_deg: float = 0.0
    roof_azimuth_deg: float = 180.0
    edge_setback_m: float = 0.5
    obstacles: List[ObstacleInput] = Field(default_factory=list)

    @field_validator("length_m", "width_m")
    @classmethod
    def validate_positive_terrace(cls, v: float) -> float:
        if v <= 0:
            raise ValueError("Roof dimensions must be strictly positive (> 0)")
        return v

    @field_validator("edge_setback_m")
    @classmethod
    def validate_setback(cls, v: float) -> float:
        if v < 0:
            raise ValueError("Edge setback must be non-negative (>= 0)")
        return v

    @field_validator("roof_slope_deg")
    @classmethod
    def validate_roof_slope(cls, v: float) -> float:
        if not (0.0 <= v <= 90.0):
            raise ValueError("Roof slope must be between 0 and 90 degrees")
        return v

    @field_validator("roof_azimuth_deg")
    @classmethod
    def validate_roof_azimuth(cls, v: float) -> float:
        if not (0.0 <= v <= 360.0):
            raise ValueError("Roof azimuth must be between 0 and 360 degrees")
        return v


class ArrayInput(BaseModel):
    panel_model: str = "Generic Monocrystalline"
    panel_rated_power_w: float = 540.0
    panel_length_m: float = 2.28
    panel_width_m: float = 1.13
    panel_tilt_deg: float = 15.0
    panel_azimuth_deg: float = 180.0

    @field_validator("panel_rated_power_w", "panel_length_m", "panel_width_m")
    @classmethod
    def validate_positive_array(cls, v: float) -> float:
        if v <= 0:
            raise ValueError("Panel power and dimensions must be strictly positive (> 0)")
        return v

    @field_validator("panel_tilt_deg")
    @classmethod
    def validate_panel_tilt(cls, v: float) -> float:
        if not (0.0 <= v <= 90.0):
            raise ValueError("Panel tilt must be between 0 and 90 degrees")
        return v

    @field_validator("panel_azimuth_deg")
    @classmethod
    def validate_panel_azimuth(cls, v: float) -> float:
        if not (0.0 <= v <= 360.0):
            raise ValueError("Panel azimuth must be between 0 and 360 degrees")
        return v


class ConsumptionInput(BaseModel):
    annual_units_kwh: float = 0.0
    sanctioned_load_kw: float = 0.0

    @field_validator("annual_units_kwh", "sanctioned_load_kw")
    @classmethod
    def validate_non_negative_consumption(cls, v: float) -> float:
        if v < 0:
            raise ValueError("Consumption and sanctioned load must be non-negative")
        return v


class SimulateRequest(BaseModel):
    location: LocationInput
    terrace: TerraceInput
    array: ArrayInput
    consumption: ConsumptionInput = Field(default_factory=ConsumptionInput)


class RangeKwh(BaseModel):
    min: float
    max: float


class SimulationResponse(BaseModel):
    simulation_id: str
    feasible_system_kw: RangeKwh
    panel_count: int
    panel_capacity_kwp: float
    usable_roof_area_m2: float
    estimated_generation_kwh_year: RangeKwh
    generation_method: str
    shadow_method: str
    assumptions: List[str] = Field(default_factory=list)
    warnings: List[str] = Field(default_factory=list)


# Audit
class QuoteClaims(BaseModel):
    vendor_name: Optional[str] = None
    claimed_system_size_kw: Optional[float] = None
    claimed_annual_generation_kwh: Optional[float] = None
    panel_model: Optional[str] = None
    panel_rated_power_w: Optional[float] = None
    panel_count: Optional[int] = None
    inverter_model: Optional[str] = None
    inverter_capacity_kw: Optional[float] = None
    quoted_price_inr: Optional[float] = None
    claimed_subsidy_inr: Optional[float] = None
    warranty_text: Optional[str] = None
    net_metering_included: Optional[bool] = None

    @field_validator(
        "claimed_system_size_kw",
        "claimed_annual_generation_kwh",
        "panel_rated_power_w",
        "inverter_capacity_kw",
        "quoted_price_inr",
        mode="before",
    )
    @classmethod
    def validate_positive_optional_numbers(cls, value):
        if value is None:
            return value
        if float(value) <= 0:
            raise ValueError("Value must be greater than zero when supplied")
        return value

    @field_validator("panel_count", mode="before")
    @classmethod
    def validate_panel_count(cls, value):
        if value is not None and int(value) < 1:
            raise ValueError("panel_count must be at least 1 when supplied")
        return value

    @field_validator("claimed_subsidy_inr", mode="before")
    @classmethod
    def validate_nonnegative_subsidy(cls, value):
        if value is not None and float(value) < 0:
            raise ValueError("claimed_subsidy_inr cannot be negative")
        return value


class AuditRequest(BaseModel):
    simulation_id: str
    quote_claims: QuoteClaims
    confirmed_fields: List[str] = Field(default_factory=list)
    simulation: Optional[SimulationResponse] = None
    simulate_input: Optional[SimulateRequest] = None


class AuditEvidence(BaseModel):
    type: str
    field: Optional[str] = None
    note: Optional[str] = None


class AuditCheck(BaseModel):
    id: str
    status: AuditStatus
    title: str
    claim: str
    calculation: str
    reason: str
    evidence: List[AuditEvidence] = Field(default_factory=list)
    recommended_question: str = ""


class AuditResponse(BaseModel):
    audit_id: str
    summary: str
    checks: List[AuditCheck] = Field(default_factory=list)
    policy_checks: List[AuditCheck] = Field(default_factory=list)
    recommended_questions: List[str] = Field(default_factory=list)
    limitations: List[str] = Field(default_factory=list)
