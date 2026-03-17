"""
/api/dashboard  — Aggregated dashboard endpoint.

GET /api/dashboard/summary
    Returns a single JSON payload containing everything the frontend needs:
      - topStats
      - laneDensity      → REAL YOLO data if a completed job exists, else random
      - signalAllocation → computed from real counts when YOLO job available
      - chartHistory
      - emergencyEvents
      - violationLogs
      - detectedPlates
"""

import random
import time
from flask import Blueprint, jsonify
from density_generator import generate_lane_density, generate_chart_history
from signal_logic import build_signal_payload

dashboard_bp = Blueprint("dashboard", __name__)

# ── helpers ──────────────────────────────────────────────────────────────────

VIOLATION_TYPES = ["Red Light Jump", "Over Speeding", "Wrong Way", "No Helmet", "Lane Change"]
EMERGENCY_TYPES = ["Ambulance", "Fire Truck", "Police Car"]
VEHICLE_TYPES   = ["Car", "Bike", "Truck", "Bus", "Auto"]
STATES          = ["MH", "DL", "KA", "TN", "UP", "GJ", "RJ", "AP", "TS", "PB"]
SEVERITIES      = ["Low", "Medium", "High"]
DIRECTIONS      = ["North", "South", "East", "West"]


def _random_plate() -> str:
    state  = random.choice(STATES)
    num    = str(random.randint(1, 39)).zfill(2)
    alpha  = "".join(random.choices("ABCDEFGHJKLMNPRSTUVWXYZ", k=2))
    serial = str(random.randint(1000, 9999))
    return f"{state}{num}-{alpha}-{serial}"


def _now_minus(seconds: int) -> str:
    ts = int(time.time()) - seconds
    return time.strftime("%H:%M:%S", time.localtime(ts))


def _generate_violations(n: int = 5) -> list:
    violations = []
    for i in range(1, n + 1):
        violations.append({
            "id":       f"V-{i:03d}",
            "type":     random.choice(VIOLATION_TYPES),
            "lane":     f"{random.choice(DIRECTIONS)} Lane",
            "time":     _now_minus(random.randint(30, 1200)),
            "plate":    _random_plate(),
            "severity": random.choice(SEVERITIES),
        })
    return violations


def _generate_emergency(n: int = 2) -> list:
    events   = []
    statuses = [("Approaching", "~30s"), ("Approaching", "~60s"), ("Cleared", "Passed")]
    for i in range(1, n + 1):
        status, eta = random.choice(statuses)
        events.append({
            "id":     f"E-{i:03d}",
            "type":   random.choice(EMERGENCY_TYPES),
            "lane":   f"{random.choice(DIRECTIONS)} Lane",
            "status": status,
            "time":   _now_minus(random.randint(10, 600)),
            "eta":    eta,
        })
    return events


def _generate_plates(n: int = 5) -> list:
    plates = []
    for _ in range(n):
        plates.append({
            "plate":   _random_plate(),
            "lane":    random.choice(DIRECTIONS),
            "time":    _now_minus(random.randint(5, 300)),
            "type":    random.choice(VEHICLE_TYPES),
            "flagged": random.random() < 0.25,
        })
    return plates


def _compute_top_stats(lanes: list, from_video: bool = False) -> list:
    total_vehicles = sum(r["vehicleCount"] for r in lanes)
    return [
        {"label": "Total Vehicles Today", "value": f"{total_vehicles if from_video else random.randint(12000,18000):,}", "icon": "🚗",  "color": "#3b82f6"},
        {"label": "Violations Detected",  "value": str(random.randint(25, 55)),         "icon": "⚠️",  "color": "#ef4444"},
        {"label": "Avg Wait Time",        "value": f"{random.randint(50,150)//60}m {random.randint(0,59)}s", "icon": "⏱️", "color": "#f59e0b"},
        {"label": "Signal Cycles",        "value": f"{random.randint(900,1500):,}",     "icon": "🔄",  "color": "#10b981"},
        {"label": "Emergency Events",     "value": str(random.randint(1, 4)),           "icon": "🚨",  "color": "#ef4444"},
        {"label": "AI Model Uptime",      "value": f"{round(random.uniform(98.5,99.9),1)}%", "icon": "🤖", "color": "#8b5cf6"},
    ]


# ── Get latest completed YOLO job (if any) ────────────────────────────────────

def _get_latest_yolo_result():
    """
    Checks the video job store for the most-recently-completed YOLO job.
    Returns the job dict or None if no completed job exists.
    """
    try:
        from routes.video import _jobs  # type: ignore
        completed = [
            j for j in _jobs.values()
            if j.get("status") == "completed" and j.get("laneDetails")
        ]
        if not completed:
            return None
        # Return most recently uploaded (last key in insertion order)
        return completed[-1]
    except Exception:
        return None


# ── routes ───────────────────────────────────────────────────────────────────

@dashboard_bp.route("/summary", methods=["GET"])
def summary():
    """
    Single aggregated payload for the full dashboard.
    Uses real YOLOv8 lane counts when a completed detection job exists.
    """
    yolo_job   = _get_latest_yolo_result()
    from_video = yolo_job is not None

    if from_video:
        # ── Use real YOLO lane data ───────────────────────────────────────────
        lanes      = yolo_job["laneDetails"]
        counts     = {r["lane"]: r["vehicleCount"] for r in lanes}
        allocation = build_signal_payload(counts)
    else:
        # ── Fall back to random density generator ─────────────────────────────
        lanes      = generate_lane_density()
        counts     = {r["lane"]: r["vehicleCount"] for r in lanes}
        allocation = build_signal_payload(counts)

    history    = generate_chart_history(10)
    top_stats  = _compute_top_stats(lanes, from_video=from_video)
    violations = _generate_violations(5)
    emergency  = _generate_emergency(2)
    plates     = _generate_plates(5)

    active_green = next((s["lane"] for s in allocation if s["phase"] == "GREEN"), None)

    return jsonify({
        "success":          True,
        "timestamp":        time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "dataSource":       "yolo_video" if from_video else "random_generator",
        "topStats":         top_stats,
        "laneDensity":      lanes,
        "signalAllocation": allocation,
        "activeGreenLane":  active_green,
        "chartHistory":     history,
        "emergencyEvents":  emergency,
        "violationLogs":    violations,
        "detectedPlates":   plates,
        "formulaInfo": {
            "description": "GreenTime = MIN_GREEN + (lane_count / total_count) × (MAX_GREEN − MIN_GREEN)",
            "MIN_GREEN": 10,
            "MAX_GREEN": 90,
        },
    })
