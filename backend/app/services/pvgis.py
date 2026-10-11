import logging
from typing import Dict, Optional, Tuple
import httpx
from app.config import settings
from app.schemas import RangeKwh

logger = logging.getLogger("suryasathi.pvgis")

# In-memory cache for PVGIS responses: key -> (min_kwh, max_kwh, details_str)
_PVGIS_CACHE: Dict[Tuple[float, float, float, float, float], Tuple[RangeKwh, str]] = {}


def convert_azimuth_to_pvgis_aspect(azimuth_deg: float) -> float:
    """
    Converts 0° North, 90° East, 180° South, 270° West convention
    to PVGIS aspect convention: 0° South, -90° East, 90° West, 180° North.
    """
    # Normalized azimuth [0, 360)
    norm = azimuth_deg % 360.0
    aspect = norm - 180.0
    return round(aspect, 1)


async def fetch_pvgis_yield(
    latitude: float,
    longitude: float,
    peak_power_kwp: float,
    tilt_deg: float = 15.0,
    azimuth_deg: float = 180.0,
    system_loss_pct: float = 14.0,
    force_offline: bool = False,
) -> Tuple[RangeKwh, str, Optional[str]]:
    """
    Queries the official European Commission JRC PVGIS API server-side.
    Returns (generation_range, generation_method_label, warning_or_error_message).
    
    If PVGIS is unreachable or fails:
    Never invents or fabricates production. Returns (min=0.0, max=0.0) with an
    explicit unavailable label and warning.
    """
    if peak_power_kwp <= 0:
        return (
            RangeKwh(min=0.0, max=0.0),
            "No solar array capacity to model (0 kWp).",
            None,
        )

    cache_key = (
        round(latitude, 4),
        round(longitude, 4),
        round(peak_power_kwp, 3),
        round(tilt_deg, 1),
        round(azimuth_deg, 1),
    )

    if cache_key in _PVGIS_CACHE:
        range_kwh, method = _PVGIS_CACHE[cache_key]
        return range_kwh, f"{method} (cached)", None

    if force_offline:
        return (
            RangeKwh(min=0.0, max=0.0),
            "PVGIS calculation unavailable (offline mode).",
            "PVGIS network access is offline. No annual yield was fabricated.",
        )

    pvgis_aspect = convert_azimuth_to_pvgis_aspect(azimuth_deg)
    url = "https://re.jrc.ec.europa.eu/api/v5_3/PVcalc"
    params = {
        "lat": f"{latitude:.4f}",
        "lon": f"{longitude:.4f}",
        "peakpower": f"{peak_power_kwp:.3f}",
        "loss": f"{system_loss_pct:.1f}",
        "angle": f"{tilt_deg:.1f}",
        "aspect": f"{pvgis_aspect:.1f}",
        "outputformat": "json",
    }

    try:
        async with httpx.AsyncClient(timeout=settings.PVGIS_TIMEOUT_SECONDS) as client:
            response = await client.get(url, params=params)
            
        if response.status_code == 200:
            data = response.json()
            totals = data.get("outputs", {}).get("totals", {}).get("fixed", {})
            e_y = totals.get("E_y")
            if e_y is not None and isinstance(e_y, (int, float)) and e_y > 0:
                e_annual = float(e_y)
                # Model range: +/- 5% uncertainty band around PVGIS central reference
                min_kwh = round(e_annual * 0.95, 1)
                max_kwh = round(e_annual * 1.05, 1)
                generation_range = RangeKwh(min=min_kwh, max=max_kwh)
                method_label = (
                    f"Official PVGIS v5.3 reference yield ({e_annual:.0f} kWh/year base) "
                    f"with ±5% model uncertainty band"
                )
                _PVGIS_CACHE[cache_key] = (generation_range, method_label)
                return generation_range, method_label, None

        logger.warning(f"PVGIS returned non-200 or unexpected payload: {response.status_code}")
        return (
            RangeKwh(min=0.0, max=0.0),
            f"PVGIS service unavailable (HTTP {response.status_code})",
            f"PVGIS returned HTTP status {response.status_code}. No substitute yield was fabricated.",
        )

    except (httpx.TimeoutException, httpx.RequestError) as ex:
        logger.warning(f"PVGIS request error: {str(ex)}")
        return (
            RangeKwh(min=0.0, max=0.0),
            "PVGIS service unavailable: connection timeout or network failure",
            f"External PVGIS service could not be reached ({type(ex).__name__}). Annual yield marked unverified.",
        )
    except Exception as ex:
        logger.error(f"Unexpected error in PVGIS query: {str(ex)}")
        return (
            RangeKwh(min=0.0, max=0.0),
            "PVGIS service query error",
            f"Unexpected error evaluating solar yield: {str(ex)}. No yield was fabricated.",
        )
