import math
from typing import Dict, List, Tuple
from app.schemas import ObstacleInput, RangeKwh, TerraceInput, ArrayInput


class GeometryValidationError(ValueError):
    """Raised when geometric constraints are violated."""
    pass


def validate_roof_and_obstacles(terrace: TerraceInput) -> None:
    """
    Validates positive roof dimensions, setback validity, and that obstacles
    fall completely within the physical roof boundaries.
    """
    if terrace.length_m <= 0 or terrace.width_m <= 0:
        raise GeometryValidationError("Roof dimensions must be strictly positive (> 0).")

    if terrace.edge_setback_m < 0:
        raise GeometryValidationError("Edge setback must be non-negative (>= 0).")

    if terrace.edge_setback_m * 2 >= terrace.length_m or terrace.edge_setback_m * 2 >= terrace.width_m:
        raise GeometryValidationError(
            f"Edge setback ({terrace.edge_setback_m} m) leaves no usable roof area on a "
            f"{terrace.length_m} m × {terrace.width_m} m roof."
        )

    for i, obs in enumerate(terrace.obstacles):
        if obs.width_m <= 0 or obs.length_m <= 0:
            raise GeometryValidationError(
                f"Obstacle #{i+1} dimensions must be strictly positive (> 0)."
            )
        if obs.x_offset_m < 0 or obs.y_offset_m < 0:
            raise GeometryValidationError(
                f"Obstacle #{i+1} coordinates cannot be negative."
            )
        # Check if obstacle exceeds roof boundaries
        obs_max_x = obs.x_offset_m + obs.width_m
        obs_max_y = obs.y_offset_m + obs.length_m
        if obs_max_x > terrace.length_m or obs_max_y > terrace.width_m:
            raise GeometryValidationError(
                f"Obstacle #{i+1} (extent {obs_max_x:.2f}m × {obs_max_y:.2f}m) extends outside "
                f"the roof boundary ({terrace.length_m:.2f}m × {terrace.width_m:.2f}m)."
            )


def boxes_overlap(
    box1: Tuple[float, float, float, float],
    box2: Tuple[float, float, float, float],
) -> bool:
    """
    Checks if two axis-aligned bounding boxes overlap.
    Boxes are defined as (min_x, min_y, max_x, max_y).
    """
    min_x1, min_y1, max_x1, max_y1 = box1
    min_x2, min_y2, max_x2, max_y2 = box2

    if max_x1 <= min_x2 or min_x1 >= max_x2:
        return False
    if max_y1 <= min_y2 or min_y1 >= max_y2:
        return False
    return True


def calculate_obstacle_exclusions(
    terrace: TerraceInput,
    clearance_m: float = 0.3,
    min_sun_altitude_deg: float = 25.0,
) -> List[Tuple[float, float, float, float]]:
    """
    Computes conservative 2D exclusion bounding boxes for obstacles.
    Combines physical footprint, clearance buffer, and a bounded conservative
    representative shadow projection.
    
    Shadow buffer length is bounded by h / tan(min_sun_altitude_deg) to avoid
    unbounded lengths at low sun angles.
    """
    tan_alt = math.tan(math.radians(max(min_sun_altitude_deg, 15.0)))
    exclusions = []

    for obs in terrace.obstacles:
        # Conservative representative shadow length
        shadow_len = (obs.height_m / tan_alt) if obs.height_m > 0 else 0.0
        # In the northern hemisphere (India), obstacles cast shadows predominantly northward
        # We extend northward (y-direction) and apply a symmetric lateral clearance
        min_x = max(0.0, obs.x_offset_m - clearance_m)
        max_x = min(terrace.length_m, obs.x_offset_m + obs.width_m + clearance_m)
        min_y = max(0.0, obs.y_offset_m - clearance_m)
        # Extend in y by shadow_len (bounded to roof boundary)
        max_y = min(terrace.width_m, obs.y_offset_m + obs.length_m + clearance_m + shadow_len)

        exclusions.append((min_x, min_y, max_x, max_y))

    return exclusions


def pack_panels(
    terrace: TerraceInput,
    array: ArrayInput,
    clamp_gap_m: float = 0.03,
) -> Dict:
    """
    Packs panels deterministically inside the usable setback rectangle while
    avoiding all obstacle exclusion zones. Tests both portrait and landscape.
    """
    validate_roof_and_obstacles(terrace)

    setback = terrace.edge_setback_m
    usable_min_x = setback
    usable_max_x = terrace.length_m - setback
    usable_min_y = setback
    usable_max_y = terrace.width_m - setback

    gross_usable_area = max(0.0, (usable_max_x - usable_min_x) * (usable_max_y - usable_min_y))
    exclusions = calculate_obstacle_exclusions(terrace)

    # Compute the union area of exclusion rectangles so overlapping obstacles or
    # shadow zones are not subtracted twice from the usable roof area.
    clipped_exclusions = []
    for ex_min_x, ex_min_y, ex_max_x, ex_max_y in exclusions:
        c_min_x = max(usable_min_x, ex_min_x)
        c_max_x = min(usable_max_x, ex_max_x)
        c_min_y = max(usable_min_y, ex_min_y)
        c_max_y = min(usable_max_y, ex_max_y)
        if c_max_x > c_min_x and c_max_y > c_min_y:
            clipped_exclusions.append((c_min_x, c_min_y, c_max_x, c_max_y))

    x_edges = sorted({usable_min_x, usable_max_x, *(x for box in clipped_exclusions for x in (box[0], box[2]))})
    y_edges = sorted({usable_min_y, usable_max_y, *(y for box in clipped_exclusions for y in (box[1], box[3]))})
    excluded_area = 0.0
    for x0, x1 in zip(x_edges, x_edges[1:]):
        for y0, y1 in zip(y_edges, y_edges[1:]):
            mid_x, mid_y = (x0 + x1) / 2.0, (y0 + y1) / 2.0
            if any(a <= mid_x <= c and b <= mid_y <= d for a, b, c, d in clipped_exclusions):
                excluded_area += (x1 - x0) * (y1 - y0)

    net_usable_area = max(0.0, gross_usable_area - excluded_area)

    # Pack Portrait: panel length along X, panel width along Y
    p_len = array.panel_length_m
    p_wid = array.panel_width_m

    def test_orientation(dim_x: float, dim_y: float) -> int:
        count = 0
        current_x = usable_min_x
        while current_x + dim_x <= usable_max_x + 1e-6:
            current_y = usable_min_y
            while current_y + dim_y <= usable_max_y + 1e-6:
                panel_box = (current_x, current_y, current_x + dim_x, current_y + dim_y)
                # Check collision with exclusions
                collides = any(boxes_overlap(panel_box, ex) for ex in exclusions)
                if not collides:
                    count += 1
                current_y += dim_y + clamp_gap_m
            current_x += dim_x + clamp_gap_m
        return count

    count_portrait = test_orientation(p_len, p_wid)
    count_landscape = test_orientation(p_wid, p_len)

    chosen_count = max(count_portrait, count_landscape)
    orientation = "portrait" if chosen_count == count_portrait else "landscape"

    # Module nameplate capacity arithmetic: panel_count * panel_rated_power_w / 1000
    panel_capacity_kwp = round((chosen_count * array.panel_rated_power_w) / 1000.0, 3)

    feasible_min_kw = round(panel_capacity_kwp * 0.85, 2) if chosen_count > 0 else 0.0
    feasible_max_kw = round(panel_capacity_kwp, 2)

    assumptions = [
        f"Deterministic grid packing tested in both portrait ({p_len}m × {p_wid}m) and landscape orientations.",
        f"Selected layout: {chosen_count} modules in {orientation} orientation.",
        f"Edge setback: {setback} m applied to all roof perimeters.",
        f"Module nameplate rating: {array.panel_rated_power_w:.0f} Wp per panel.",
        f"Inter-module clamp/maintenance gap: {clamp_gap_m * 100:.0f} cm.",
    ]

    warnings = []
    if chosen_count == 0:
        warnings.append("Roof dimensions or obstacle exclusions leave insufficient space for even one solar panel.")

    return {
        "panel_count": chosen_count,
        "panel_capacity_kwp": panel_capacity_kwp,
        "feasible_system_kw": RangeKwh(min=feasible_min_kw, max=feasible_max_kw),
        "usable_roof_area_m2": round(net_usable_area, 2),
        "assumptions": assumptions,
        "warnings": warnings,
        "orientation": orientation,
    }
