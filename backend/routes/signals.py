"""
/api/signals  — Signal allocation endpoints.

GET /api/signals/allocate
    Generates fresh lane densities and computes green times using:
        GreenTime = MIN + (lane_count / total_count) × (MAX − MIN)
    Returns full allocation data ready for the frontend SignalAllocation panel.

POST /api/signals/allocate
    Accepts a JSON body with explicit vehicle counts per lane:
        {"North": 45, "South": 20, "East": 62, "West": 11}
    Computes and returns the allocation from those exact counts.
"""

from flask import Blueprint, request, jsonify
from density_generator import generate_lane_density, DIRECTIONS
from signal_logic import build_signal_payload, MIN_GREEN, MAX_GREEN

signals_bp = Blueprint("signals", __name__)


def _density_to_counts(density_records: list) -> dict:
    """Extract {lane: vehicleCount} from a density record list."""
    return {r["lane"]: r["vehicleCount"] for r in density_records}


@signals_bp.route("/allocate", methods=["GET"])
def allocate_auto():
    """
    Auto-mode: generate random density then compute signal allocation.
    Returns both the density data and the allocation side-by-side.
    """
    density_records = generate_lane_density()
    lane_counts     = _density_to_counts(density_records)
    allocation      = build_signal_payload(lane_counts)

    total_count  = sum(lane_counts.values())
    active_green = next((s["lane"] for s in allocation if s["phase"] == "GREEN"), None)

    return jsonify({
        "success":    True,
        "mode":       "auto",
        "totalVehicles": total_count,
        "activeGreenLane": active_green,
        "formula": {
            "description": "GreenTime = MIN + (lane_count / total_count) × (MAX − MIN)",
            "MIN_GREEN": MIN_GREEN,
            "MAX_GREEN": MAX_GREEN,
        },
        "lanes":      density_records,
        "allocation": allocation,
    })


@signals_bp.route("/allocate", methods=["POST"])
def allocate_manual():
    """
    Manual mode: caller supplies lane vehicle counts explicitly.
    Body: {"North": 45, "South": 20, "East": 62, "West": 11}
    Any missing lane defaults to 0.
    """
    body = request.get_json(silent=True) or {}

    lane_counts = {}
    errors = []
    for lane in DIRECTIONS:
        raw = body.get(lane, 0)
        try:
            count = int(raw)
            if count < 0:
                raise ValueError
            lane_counts[lane] = count
        except (ValueError, TypeError):
            errors.append(f"Invalid count for {lane}: {raw!r}. Must be a non-negative integer.")
            lane_counts[lane] = 0

    if errors:
        return jsonify({"success": False, "errors": errors}), 400

    allocation   = build_signal_payload(lane_counts)
    total_count  = sum(lane_counts.values())
    active_green = next((s["lane"] for s in allocation if s["phase"] == "GREEN"), None)

    return jsonify({
        "success":    True,
        "mode":       "manual",
        "totalVehicles": total_count,
        "activeGreenLane": active_green,
        "formula": {
            "description": "GreenTime = MIN + (lane_count / total_count) × (MAX − MIN)",
            "MIN_GREEN": MIN_GREEN,
            "MAX_GREEN": MAX_GREEN,
        },
        "inputCounts": lane_counts,
        "allocation":  allocation,
    })


@signals_bp.route("/config", methods=["GET"])
def config():
    """Return current MIN/MAX green time configuration."""
    return jsonify({
        "success":   True,
        "MIN_GREEN": MIN_GREEN,
        "MAX_GREEN": MAX_GREEN,
        "directions": DIRECTIONS,
    })
