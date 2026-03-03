"""
Dummy lane density generator.

In a real system this module would call the computer-vision model that
analyses the uploaded video frame-by-frame.  For now it generates
plausible, randomised data so the frontend dashboard can be fully exercised.
"""

import random
import time

DIRECTIONS = ["North", "South", "East", "West"]

CONGESTION_LEVELS = [
    (0,  20,  "Light",    "low",      (40, 70)),    # (min_density, max_density, label, status, speed_range)
    (20, 50,  "Moderate", "moderate", (25, 45)),
    (50, 80,  "Heavy",    "high",     (10, 28)),
    (80, 100, "Critical", "critical", (3,  14)),
]


def _classify(density: float) -> dict:
    """Return congestion meta for a given density value (0-100)."""
    for lo, hi, label, status, speed_range in CONGESTION_LEVELS:
        if lo <= density < hi or (density >= 80 and hi == 100):
            avg_speed = random.randint(*speed_range)
            return {"congestionLevel": label, "status": status, "avgSpeed": avg_speed}
    return {"congestionLevel": "Light", "status": "low", "avgSpeed": 60}


def _trend(old_density: float | None, new_density: float) -> str:
    if old_density is None:
        return random.choice(["up", "down", "stable"])
    diff = new_density - old_density
    if diff > 3:
        return "up"
    elif diff < -3:
        return "down"
    return "stable"


# Simple in-memory "previous" densities for trend computation
_prev_densities: dict[str, float] = {}


def generate_lane_density() -> list:
    """
    Generate a list of lane-density records, one per direction.
    Vehicle counts are derived from density: count ≈ density * 0.65 (capped at 99).
    """
    records = []
    for i, lane in enumerate(DIRECTIONS, start=1):
        density = round(random.uniform(5, 98), 1)
        vehicle_count = min(int(density * 0.65), 99)
        meta = _classify(density)
        trend = _trend(_prev_densities.get(lane), density)
        _prev_densities[lane] = density

        records.append({
            "id":           i,
            "name":         f"{lane} Lane",
            "lane":         lane,
            "density":      density,
            "vehicleCount": vehicle_count,
            "trend":        trend,
            **meta,
        })
    return records


def generate_chart_history(points: int = 10) -> dict:
    """
    Generate a rolling time-series suitable for the density chart.
    Each lane gets `points` synthetic readings over the last ~20 minutes.
    """
    now = int(time.time())
    interval = 120  # 2-minute intervals

    labels = []
    series = {lane: [] for lane in DIRECTIONS}

    for i in range(points - 1, -1, -1):
        ts = now - i * interval
        labels.append(time.strftime("%H:%M", time.localtime(ts)))

    for lane in DIRECTIONS:
        base = random.randint(20, 75)
        for _ in range(points):
            base = max(5, min(98, base + random.randint(-8, 8)))
            series[lane].append(base)

    return {
        "labels": labels,
        "north":  series["North"],
        "south":  series["South"],
        "east":   series["East"],
        "west":   series["West"],
    }
