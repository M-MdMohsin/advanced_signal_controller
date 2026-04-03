"""
image_feeder.py — Automatic per-lane image selector.

Scans backend/images/<lane>/ for supported image files and cycles
through them in order, looping back to the first image when the
end of the list is reached.

Usage:
    from image_feeder import get_next_image_for_lane, LANE_FOLDERS

    path = get_next_image_for_lane("north")   # returns absolute path or None

This module is intentionally side-effect-free: it only reads the
filesystem and advances an in-memory counter — no existing routes or
detection logic is touched.
"""

import os
import threading

# ── Configuration ──────────────────────────────────────────────────────────────

# Root folder that contains north/ east/ south/ west/ sub-folders
_BASE_DIR = os.path.join(os.path.dirname(__file__), "images")

# Lane names exactly as used by the YOLO detector (case matches target_lane arg)
LANE_NAMES = ["north", "east", "south", "west"]

# Supported image extensions (lower-case, without dot)
_SUPPORTED_EXT = {"jpg", "jpeg", "png", "bmp", "webp"}

# ── State (one index counter per lane, protected by a lock) ───────────────────

_lock    = threading.Lock()
_indices: dict[str, int] = {lane: 0 for lane in LANE_NAMES}


# ── Public helpers ─────────────────────────────────────────────────────────────

def images_dir_for_lane(lane: str) -> str:
    """Return the absolute path to the images folder for *lane*."""
    return os.path.join(_BASE_DIR, lane.lower())


def list_images_for_lane(lane: str) -> list[str]:
    """
    Return a sorted list of absolute image paths inside the lane folder.
    Returns an empty list if the folder is missing or contains no images.
    """
    folder = images_dir_for_lane(lane)
    if not os.path.isdir(folder):
        return []

    files = sorted(
        os.path.join(folder, f)
        for f in os.listdir(folder)
        if f.rsplit(".", 1)[-1].lower() in _SUPPORTED_EXT
    )
    return files


def get_next_image_for_lane(lane: str) -> str | None:
    """
    Return the path to the *next* image for the given lane and advance
    the internal pointer (cycling back to 0 when the end is reached).

    Returns None if the folder is empty or doesn't exist.
    """
    lane_key = lane.lower()
    images   = list_images_for_lane(lane_key)
    if not images:
        return None

    with _lock:
        idx = _indices.get(lane_key, 0) % len(images)
        path = images[idx]
        _indices[lane_key] = (idx + 1) % len(images)

    return path


def has_images(lane: str) -> bool:
    """Return True if the lane folder contains at least one image."""
    return bool(list_images_for_lane(lane))


def feeder_status() -> dict:
    """
    Return a summary dict of each lane's folder, image count, and
    current cycle index — useful for the health / debug endpoint.
    """
    status = {}
    with _lock:
        indices_snapshot = dict(_indices)

    for lane in LANE_NAMES:
        imgs = list_images_for_lane(lane)
        status[lane] = {
            "folder":     images_dir_for_lane(lane),
            "imageCount": len(imgs),
            "nextIndex":  indices_snapshot.get(lane, 0) % max(len(imgs), 1),
            "images":     [os.path.basename(p) for p in imgs],
        }
    return status
