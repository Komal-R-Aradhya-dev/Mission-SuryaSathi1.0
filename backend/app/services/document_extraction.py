import re
from typing import Dict, List, Pattern

from app.config import settings
from app.schemas import DocumentType, ExtractResponse, ExtractedField


# This parser is deliberately conservative: it extracts only explicitly labelled
# values from Textract LINE blocks and leaves every extracted field for user review.
NUMBER = r"(\d[\d,]*(?:\.\d+)?)"


def validate_object_key(document_type: DocumentType, object_key: str) -> None:
    """Ensure an object key is confined to the expected temporary prefix."""
    expected_prefix = f"temporary/{document_type.value}/"
    if not object_key.startswith(expected_prefix) or ".." in object_key or "\\" in object_key:
        raise ValueError(f"Invalid object key. Must start with '{expected_prefix}'.")


def _empty_fields(document_type: DocumentType) -> Dict[str, ExtractedField]:
    keys = (
        ("annual_units_kwh", "sanctioned_load_kw")
        if document_type == DocumentType.BILL
        else (
            "vendor_name",
            "claimed_system_size_kw",
            "claimed_annual_generation_kwh",
            "panel_model",
            "panel_rated_power_w",
            "panel_count",
            "inverter_model",
            "inverter_capacity_kw",
            "quoted_price_inr",
            "claimed_subsidy_inr",
            "warranty_text",
        )
    )
    return {
        key: ExtractedField(
            value=None,
            source_text=None,
            page=None,
            confidence=None,
            needs_review=True,
        )
        for key in keys
    }


def _number(value: str):
    return float(value.replace(",", ""))


def _extract_labelled_fields(
    document_type: DocumentType, line_blocks: List[dict]
) -> Dict[str, ExtractedField]:
    fields = _empty_fields(document_type)
    if document_type == DocumentType.BILL:
        patterns: Dict[str, Pattern[str]] = {
            "annual_units_kwh": re.compile(
                rf"(?:annual\s+(?:consumption|units|usage)|yearly\s+consumption|consumption\s+per\s+year)"
                rf"[^\d]{{0,30}}{NUMBER}\s*(?:kwh|units)?\b",
                re.IGNORECASE,
            ),
            "sanctioned_load_kw": re.compile(
                rf"(?:sanctioned\s+load|connected\s+load|contract\s+demand)"
                rf"[^\d]{{0,30}}{NUMBER}\s*kw\b",
                re.IGNORECASE,
            ),
        }
    else:
        patterns = {
            "vendor_name": re.compile(r"(?:vendor|installer)\s*(?:name)?\s*[:\-]\s*(.+)$", re.IGNORECASE),
            "claimed_system_size_kw": re.compile(
                rf"(?:system\s+(?:size|capacity)|plant\s+capacity|solar\s+capacity|proposed\s+capacity)"
                rf"[^\d]{{0,30}}{NUMBER}\s*(?:kwp|kw)\b",
                re.IGNORECASE,
            ),
            "claimed_annual_generation_kwh": re.compile(
                rf"(?:annual\s+generation|annual\s+yield|expected\s+generation|generation\s+per\s+year|yearly\s+generation)"
                rf"[^\d]{{0,35}}{NUMBER}\s*(?:kwh|units)(?:\s*/\s*(?:year|yr))?\b",
                re.IGNORECASE,
            ),
            "panel_model": re.compile(r"(?:panel|module)\s+(?:model|make)\s*[:\-]\s*(.+)$", re.IGNORECASE),
            "panel_rated_power_w": re.compile(rf"{NUMBER}\s*wp\b", re.IGNORECASE),
            "panel_count": re.compile(
                rf"(?:panel\s+count|number\s+of\s+panels|module\s+count|number\s+of\s+modules)"
                rf"[^\d]{{0,20}}{NUMBER}\b",
                re.IGNORECASE,
            ),
            "inverter_model": re.compile(r"inverter\s+model\s*[:\-]\s*(.+)$", re.IGNORECASE),
            "inverter_capacity_kw": re.compile(
                rf"inverter\s+(?:capacity|rating|size)[^\d]{{0,25}}{NUMBER}\s*kw\b",
                re.IGNORECASE,
            ),
            "quoted_price_inr": re.compile(
                rf"(?:total\s+(?:price|cost|amount)|grand\s+total|quote\s+amount|net\s+payable)"
                rf"[^\d]{{0,25}}(?:₹|rs\.?|inr)?\s*{NUMBER}",
                re.IGNORECASE,
            ),
            "claimed_subsidy_inr": re.compile(
                rf"(?:subsidy|central\s+financial\s+assistance|cfa)"
                rf"[^\d]{{0,25}}(?:₹|rs\.?|inr)?\s*{NUMBER}",
                re.IGNORECASE,
            ),
            "warranty_text": re.compile(r"warranty\s*[:\-]\s*(.+)$", re.IGNORECASE),
        }

    for block in line_blocks:
        text = block.get("Text")
        if not isinstance(text, str) or not text.strip():
            continue
        for key, pattern in patterns.items():
            # First explicit labelled match wins; all values remain user-confirmable.
            if fields[key].value is not None:
                continue
            match = pattern.search(text)
            if not match:
                continue
            raw = match.group(1).strip()
            try:
                if key in {"vendor_name", "panel_model", "inverter_model", "warranty_text"}:
                    value = raw
                elif key == "panel_rated_power_w":
                    value = int(_number(raw))
                elif key == "panel_count":
                    value = int(_number(raw))
                else:
                    value = _number(raw)
            except (ValueError, OverflowError):
                continue

            confidence = block.get("Confidence")
            if isinstance(confidence, (int, float)):
                # Textract reports confidence in [0,100]; retain only its real metadata.
                confidence = max(0.0, min(100.0, float(confidence))) / 100.0
            else:
                confidence = None
            page = block.get("Page")
            fields[key] = ExtractedField(
                value=value,
                source_text=text,
                page=page if isinstance(page, int) else None,
                confidence=confidence,
                needs_review=True,
            )
    return fields


async def extract_document_fields(
    document_type: DocumentType,
    object_key: str,
) -> ExtractResponse:
    """Extract labelled fields from Textract text; otherwise ask for manual entry."""
    validate_object_key(document_type, object_key)
    fields = _empty_fields(document_type)
    warnings: List[str] = []

    if not settings.S3_UPLOAD_BUCKET:
        return ExtractResponse(
            document_type=document_type,
            fields=fields,
            warnings=[
                "Private S3/Textract is not configured in this environment. No automated extraction was run; enter and confirm fields manually."
            ],
        )

    try:
        import boto3

        textract_client = boto3.client("textract", region_name=settings.AWS_REGION)
        response = textract_client.detect_document_text(
            DocumentLocation={"S3Object": {"Bucket": settings.S3_UPLOAD_BUCKET, "Name": object_key}}
        )
        blocks = response.get("Blocks", [])
        line_blocks = [block for block in blocks if block.get("BlockType") == "LINE"]
        fields = _extract_labelled_fields(document_type, line_blocks)
        warnings.append(
            f"Textract read {len(line_blocks)} text lines. Fields were extracted only when a labelled pattern matched; review every value before use."
        )
        if not any(field.value is not None for field in fields.values()):
            warnings.append(
                "No supported labelled fields were confidently matched. No values were inferred; enter the fields manually."
            )
        return ExtractResponse(document_type=document_type, fields=fields, warnings=warnings)
    except Exception as exc:
        # Avoid returning provider exception strings, which can contain infrastructure details.
        warnings.append(
            f"Textract processing failed ({type(exc).__name__}). No document values were inferred; enter fields manually."
        )
        return ExtractResponse(document_type=document_type, fields=fields, warnings=warnings)
