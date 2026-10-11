import base64
import hashlib
import hmac
import json
import zlib
from typing import Optional

from app.config import settings
from app.schemas import SimulationResponse


def create_simulation_token(response: SimulationResponse) -> str:
    """Return a compressed, HMAC-signed stateless token (not encrypted)."""
    payload_dict = response.model_dump()
    json_bytes = json.dumps(payload_dict, separators=(",", ":")).encode("utf-8")
    compressed = zlib.compress(json_bytes, level=9)
    b64_payload = base64.urlsafe_b64encode(compressed).decode("ascii")
    signature = hmac.new(
        settings.TOKEN_SECRET_KEY.encode("utf-8"),
        b64_payload.encode("ascii"),
        hashlib.sha256,
    ).hexdigest()
    return f"sim_{b64_payload}.{signature}"


def decode_simulation_token(token: str) -> Optional[SimulationResponse]:
    """Verify and decode a stateless simulation token, returning None if invalid."""
    if not token.startswith("sim_") or len(token) > 262_144:
        return None

    stripped = token[4:]
    if "." not in stripped:
        return None

    b64_payload, signature = stripped.rsplit(".", 1)
    try:
        payload_ascii = b64_payload.encode("ascii")
        signature.encode("ascii")
    except UnicodeEncodeError:
        return None
    expected_sig = hmac.new(
        settings.TOKEN_SECRET_KEY.encode("utf-8"),
        payload_ascii,
        hashlib.sha256,
    ).hexdigest()
    if not hmac.compare_digest(signature, expected_sig):
        return None

    try:
        compressed = base64.urlsafe_b64decode(b64_payload.encode("ascii"))
        decompressor = zlib.decompressobj()
        json_bytes = decompressor.decompress(compressed, 1_000_001)
        if len(json_bytes) > 1_000_000 or decompressor.unconsumed_tail:
            return None
        json_bytes += decompressor.flush()
        if len(json_bytes) > 1_000_000:
            return None
        data = json.loads(json_bytes.decode("utf-8"))
        return SimulationResponse.model_validate(data)
    except (ValueError, TypeError, UnicodeDecodeError, zlib.error, json.JSONDecodeError):
        return None
