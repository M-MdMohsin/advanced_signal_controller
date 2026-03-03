"""
Signal allocation logic for the Traffic Signal Management System.

Formula:
    GreenTime = MIN_GREEN + (lane_count / total_count) × (MAX_GREEN − MIN_GREEN)
"""

MIN_GREEN = 10   # seconds
MAX_GREEN = 90   # seconds

DIRECTIONS = ["North", "South", "East", "West"]


def compute_green_times(lane_counts: dict) -> dict:
    """
    Given a dict of {lane_name: vehicle_count}, return a dict of
    {lane_name: green_time_seconds} using the proportional formula.
    """
    total_count = sum(lane_counts.values()) or 1  # guard div-by-zero

    green_times = {}
    for lane, count in lane_counts.items():
        ratio = count / total_count
        green_time = MIN_GREEN + ratio * (MAX_GREEN - MIN_GREEN)
        green_times[lane] = round(green_time, 1)

    return green_times


def determine_phase(green_times: dict) -> dict:
    """
    Simple round-robin phase assignment:
    The lane with the highest green time gets GREEN, rest get RED.
    In a real system this would track elapsed time across cycles.
    """
    if not green_times:
        return {}

    max_lane = max(green_times, key=lambda k: green_times[k])
    phases = {lane: ("GREEN" if lane == max_lane else "RED") for lane in green_times}
    return phases


def build_signal_payload(lane_counts: dict) -> list:
    """
    Build the full signal allocation list ready for JSON serialisation.
    Returns a list of dicts, one per lane.
    """
    green_times = compute_green_times(lane_counts)
    phases      = determine_phase(green_times)
    total_count = sum(lane_counts.values()) or 1

    result = []
    for lane in DIRECTIONS:
        count      = lane_counts.get(lane, 0)
        green_time = green_times.get(lane, MIN_GREEN)
        phase      = phases.get(lane, "RED")

        # Priority label based on density share
        ratio = count / total_count
        if ratio >= 0.40:
            priority = "Critical"
        elif ratio >= 0.28:
            priority = "High"
        elif ratio >= 0.16:
            priority = "Medium"
        else:
            priority = "Low"

        # next_change: rough estimate (half cycle when RED, full when GREEN)
        next_change = round(green_time / 2) if phase == "RED" else round(green_time)

        result.append({
            "lane":        lane,
            "vehicleCount": count,
            "greenTime":   green_time,
            "phase":       phase,
            "nextChange":  next_change,
            "priority":    priority,
        })

    return result
