"""
/api/density  — Lane density endpoints.

GET /api/density/current
    Returns live (simulated) density readings for all 4 lanes.

GET /api/density/history?points=10
    Returns time-series history for the density chart.

POST /api/density/set
    Accepts a JSON body of {lane: count} overrides to pin specific densities.
    Used for demo / manual testing via Postman etc.
"""

from flask import Blueprint, request, jsonify
from density_generator import generate_lane_density, generate_chart_history, DIRECTIONS

density_bp = Blueprint("density", __name__)

# Optional manual overrides: {lane: vehicle_count}
_manual_overrides: dict = {}


@density_bp.route("/current", methods=["GET"])
def current_density():
    """Return the current lane density for all four directions."""
    records = generate_lane_density()

    # Apply any manual overrides (vehicle count and derived density)
    if _manual_overrides:
        for record in records:
            lane = record["lane"]
            if lane in _manual_overrides:
                vc = _manual_overrides[lane]
                record["vehicleCount"] = vc
                # Back-calculate a reasonable density
                record["density"] = min(round(vc / 0.65, 1), 100.0)

    return jsonify({
        "success": True,
        "lanes":   records,
        "totalVehicles": sum(r["vehicleCount"] for r in records),
    })


@density_bp.route("/history", methods=["GET"])
def density_history():
    """Return chart-ready time-series density data."""
    try:
        points = int(request.args.get("points", 10))
        points = max(5, min(points, 60))   # clamp 5-60
    except ValueError:
        points = 10

    return jsonify({
        "success": True,
        "history": generate_chart_history(points),
    })


@density_bp.route("/set", methods=["POST"])
def set_density():
    """
    Manually pin vehicle counts for testing.
    Body: {"North": 50, "East": 80}  (any subset of the four lanes)
    """
    body = request.get_json(silent=True) or {}
    updated = {}

    for lane in DIRECTIONS:
        if lane in body:
            try:
                count = int(body[lane])
                if 0 <= count <= 99:
                    _manual_overrides[lane] = count
                    updated[lane] = count
            except (ValueError, TypeError):
                pass

    return jsonify({
        "success": True,
        "message": "Density overrides applied.",
        "updated": updated,
        "allOverrides": _manual_overrides,
    })


@density_bp.route("/reset", methods=["POST"])
def reset_density():
    """Clear all manual overrides — density returns to fully random mode."""
    _manual_overrides.clear()
    return jsonify({"success": True, "message": "All overrides cleared."})
