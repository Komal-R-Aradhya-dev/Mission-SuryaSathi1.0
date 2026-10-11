import uuid
from app.schemas import SimulateRequest, SimulationResponse
from app.services.panel_packing import pack_panels
from app.services.pvgis import fetch_pvgis_yield
from app.tokens import create_simulation_token


async def run_simulation(request: SimulateRequest, force_offline: bool = False) -> SimulationResponse:
    """
    Runs deterministic panel packing and server-side PVGIS generation modeling.
    Returns a validated SimulationResponse with a stateless signed simulation_id.
    """
    # 1. Deterministic panel packing
    packing_result = pack_panels(request.terrace, request.array)

    # 2. PVGIS generation calculation
    generation_range, gen_method, gen_warning = await fetch_pvgis_yield(
        latitude=request.location.latitude,
        longitude=request.location.longitude,
        peak_power_kwp=packing_result["panel_capacity_kwp"],
        tilt_deg=request.array.panel_tilt_deg,
        azimuth_deg=request.array.panel_azimuth_deg,
        force_offline=force_offline,
    )

    warnings = list(packing_result["warnings"])
    if gen_warning:
        warnings.append(gen_warning)

    assumptions = list(packing_result["assumptions"])
    assumptions.append(f"Location coordinates: {request.location.latitude:.4f}°N, {request.location.longitude:.4f}°E.")
    assumptions.append(f"Solar tilt: {request.array.panel_tilt_deg:.1f}°, Azimuth: {request.array.panel_azimuth_deg:.1f}°.")
    assumptions.append("Default 14.0% standard system losses modeled in PVGIS (cabling, inverter, thermal).")
    assumptions.append(
        "The lower end of the feasible system-size range is a 85% planning heuristic; it is not a certified electrical-design range."
    )

    shadow_method = (
        "representative-time conservative 2D exclusion (obstacle height × 2.14 buffer); "
        "not certified annual 3D ray tracing"
    )

    # Build response with temporary simulation id
    temp_sim_id = f"sim_{uuid.uuid4().hex[:12]}"
    sim_response = SimulationResponse(
        simulation_id=temp_sim_id,
        feasible_system_kw=packing_result["feasible_system_kw"],
        panel_count=packing_result["panel_count"],
        panel_capacity_kwp=packing_result["panel_capacity_kwp"],
        usable_roof_area_m2=packing_result["usable_roof_area_m2"],
        estimated_generation_kwh_year=generation_range,
        generation_method=gen_method,
        shadow_method=shadow_method,
        assumptions=assumptions,
        warnings=warnings,
    )

    # Encode into stateless cryptographically signed token
    token = create_simulation_token(sim_response)
    sim_response.simulation_id = token

    return sim_response
