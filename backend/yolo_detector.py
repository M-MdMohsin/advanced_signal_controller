"""
yolo_detector.py — Core YOLOv8 + OpenCV vehicle detection engine.

Workflow:
  1. Open the uploaded video with OpenCV.
  2. Divide every sampled frame into 4 equal vertical lanes (ROIs):
       Lane 1 (North) | Lane 2 (South) | Lane 3 (East) | Lane 4 (West)
     (The 4-lane mapping assumes the camera is overhead / top-down;
      adjust ROI coordinates via the LANE_CONFIG dict if your footage differs.)
  3. Run YOLOv8 on the full frame and filter detections to VEHICLE_CLASSES.
  4. Assign each detected bounding-box to whichever ROI its centre falls in.
  5. Accumulate per-lane counts across every sampled frame, then return the
     **peak** vehicle count observed in any single frame per lane (a reliable
     proxy for congestion; swap to "average" if preferred).

Public API
----------
  detect_vehicles(video_path, job_store, job_id)
      Blocking call — meant to run in a background thread.
      Writes progress + results back into job_store[job_id].
"""

import os
import cv2
import time
import threading
import numpy as np

# ── YOLOv8 import (ultralytics) ──────────────────────────────────────────────
try:
    from ultralytics import YOLO
    YOLO_AVAILABLE = True
except ImportError:
    YOLO_AVAILABLE = False

# ── Configuration ─────────────────────────────────────────────────────────────

# YOLO model weights – 'yolov8n.pt' is the nano (fastest) variant.
# On first run it is downloaded automatically by ultralytics.
MODEL_NAME = os.environ.get("YOLO_MODEL", "yolov8n.pt")

# COCO class IDs that correspond to vehicles
VEHICLE_CLASSES = {
    2:  "car",
    3:  "motorcycle",
    5:  "bus",
    7:  "truck",
}

# Sample every Nth frame to speed up processing (1 = every frame)
FRAME_SAMPLE_RATE = int(os.environ.get("FRAME_SAMPLE_RATE", "5"))

# Minimum confidence threshold for a detection to be counted
CONFIDENCE_THRESHOLD = float(os.environ.get("CONF_THRESHOLD", "0.35"))

# Lane names in the order they are laid out left-to-right in the ROI split
LANE_NAMES = ["North", "South", "East", "West"]

# ── Lazy model loader (thread-safe singleton) ─────────────────────────────────
_model = None
_model_lock = threading.Lock()


def _get_model():
    """Load (or reuse) the YOLO model. Thread-safe singleton."""
    global _model
    if not YOLO_AVAILABLE:
        raise RuntimeError(
            "ultralytics is not installed. Run: pip install ultralytics"
        )
    with _model_lock:
        if _model is None:
            _model = YOLO(MODEL_NAME)
    return _model


# ── ROI helpers ───────────────────────────────────────────────────────────────

def _build_lane_rois(frame_width: int, frame_height: int) -> list[dict]:
    """
    Divide the frame into 4 equal vertical strips (left → right).
    Each strip represents one lane (North / South / East / West).

    Returns a list of dicts:
      { "name": str, "x1": int, "y1": int, "x2": int, "y2": int }
    """
    strip_w = frame_width // 4
    rois = []
    for i, name in enumerate(LANE_NAMES):
        x1 = i * strip_w
        x2 = (i + 1) * strip_w if i < 3 else frame_width  # last gets remainder
        rois.append({"name": name, "x1": x1, "y1": 0, "x2": x2, "y2": frame_height})
    return rois


def _assign_to_lane(cx: int, rois: list[dict]) -> str | None:
    """Return the lane name whose ROI contains horizontal centre cx."""
    for roi in rois:
        if roi["x1"] <= cx < roi["x2"]:
            return roi["name"]
    return None


# ── Annotated frame writer ────────────────────────────────────────────────────

# Colours per lane (BGR)
_LANE_COLOURS = {
    "North": (255, 100, 100),
    "South": (100, 255, 100),
    "East":  (100, 100, 255),
    "West":  (255, 255,   0),
}


def _annotate_frame(frame: np.ndarray, detections: list, rois: list[dict]) -> np.ndarray:
    """Draw ROI dividers, lane labels, and bounding boxes onto a copy of frame."""
    out = frame.copy()
    h, w = out.shape[:2]

    # Draw ROI dividing lines
    strip_w = w // 4
    for i in range(1, 4):
        x = i * strip_w
        cv2.line(out, (x, 0), (x, h), (200, 200, 200), 2)

    # Lane name labels at top of each strip
    for roi in rois:
        label_x = roi["x1"] + 10
        colour = _LANE_COLOURS.get(roi["name"], (255, 255, 255))
        cv2.putText(out, roi["name"], (label_x, 30),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.8, colour, 2, cv2.LINE_AA)

    # Bounding boxes
    for det in detections:
        x1, y1, x2, y2, cls_name, lane = (
            det["x1"], det["y1"], det["x2"], det["y2"],
            det["class"], det.get("lane", "Unknown"),
        )
        colour = _LANE_COLOURS.get(lane, (255, 255, 255))
        cv2.rectangle(out, (x1, y1), (x2, y2), colour, 2)
        cv2.putText(out, f"{cls_name}", (x1, max(y1 - 6, 0)),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.55, colour, 1, cv2.LINE_AA)
    return out


# ── Main detection function ───────────────────────────────────────────────────

def detect_vehicles(video_path: str, job_store: dict, job_id: str) -> None:
    """
    Analyse *video_path* with YOLOv8, populate *job_store[job_id]* with:

      status          : "completed" | "error"
      progress        : 0-100 (updated during processing)
      laneCounts      : { lane: peak_vehicle_count }
      laneDetails     : full per-lane metadata list (same shape as density API)
      totalVehicles   : int
      frameCount      : int   (total frames processed)
      processingTime  : float (seconds)
      annotatedFrames : list of base64-encoded JPEG strings (key frames)
      error           : str   (only on failure)
    """
    start_ts = time.time()

    # ── Guard: YOLO not installed ─────────────────────────────────────────────
    if not YOLO_AVAILABLE:
        _fail(job_store, job_id, "ultralytics package not installed.")
        return

    # ── Open video ────────────────────────────────────────────────────────────
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        _fail(job_store, job_id, f"Cannot open video: {video_path}")
        return

    total_frames   = int(cap.get(cv2.CAP_PROP_FRAME_COUNT)) or 1
    frame_w        = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    frame_h        = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    fps            = cap.get(cv2.CAP_PROP_FPS) or 30

    rois = _build_lane_rois(frame_w, frame_h)

    # ── Accumulators ─────────────────────────────────────────────────────────
    # peak count per lane across all sampled frames
    peak_counts:  dict[str, int] = {n: 0 for n in LANE_NAMES}
    # running sum + sample count for average (kept for future use)
    sum_counts:   dict[str, int] = {n: 0 for n in LANE_NAMES}
    frames_sampled = 0

    # Store up to 5 annotated "key frame" snapshots (as base64 JPEG)
    key_frame_indices: list[int] = []
    key_frames_b64:    list[str] = []
    total_sampled = max(1, total_frames // FRAME_SAMPLE_RATE)
    snapshot_every = max(1, total_sampled // 5)

    model = _get_model()

    frame_idx = 0
    sample_idx = 0

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        frame_idx += 1
        if frame_idx % FRAME_SAMPLE_RATE != 0:
            continue

        # ── Run YOLO inference ────────────────────────────────────────────────
        results = model(frame, verbose=False, conf=CONFIDENCE_THRESHOLD)
        detections = []
        frame_lane_counts: dict[str, int] = {n: 0 for n in LANE_NAMES}

        for result in results:
            boxes = result.boxes
            if boxes is None:
                continue
            for box in boxes:
                cls_id = int(box.cls[0].item())
                if cls_id not in VEHICLE_CLASSES:
                    continue

                x1, y1, x2, y2 = map(int, box.xyxy[0].tolist())
                cx = (x1 + x2) // 2
                lane = _assign_to_lane(cx, rois)

                if lane:
                    frame_lane_counts[lane] += 1
                    detections.append({
                        "x1": x1, "y1": y1, "x2": x2, "y2": y2,
                        "class": VEHICLE_CLASSES[cls_id],
                        "conf":  round(float(box.conf[0].item()), 3),
                        "lane":  lane,
                    })

        # Update peak + sum
        for name in LANE_NAMES:
            c = frame_lane_counts[name]
            peak_counts[name] = max(peak_counts[name], c)
            sum_counts[name]  += c

        frames_sampled += 1
        sample_idx     += 1

        # ── Progress update ───────────────────────────────────────────────────
        progress = min(int((frame_idx / total_frames) * 95), 95)
        job_store[job_id]["progress"] = progress

        # ── Capture key frames ────────────────────────────────────────────────
        if sample_idx % snapshot_every == 0 and len(key_frames_b64) < 5:
            annotated = _annotate_frame(frame, detections, rois)
            _, buf = cv2.imencode(".jpg", annotated, [cv2.IMWRITE_JPEG_QUALITY, 75])
            import base64
            b64 = base64.b64encode(buf).decode("utf-8")
            key_frames_b64.append(b64)
            key_frame_indices.append(frame_idx)

    cap.release()

    if frames_sampled == 0:
        _fail(job_store, job_id, "No frames could be sampled from the video.")
        return

    # ── Build lane detail records (matches density API shape) ─────────────────
    from density_generator import _classify, _trend, _prev_densities  # type: ignore
    total_vehicles  = sum(peak_counts.values()) or 1
    lane_details    = []

    for i, name in enumerate(LANE_NAMES, start=1):
        count   = peak_counts[name]
        density = min(round(count / 0.65, 1), 100.0)
        meta    = _classify(density)
        trend   = _trend(_prev_densities.get(name), density)
        _prev_densities[name] = density

        lane_details.append({
            "id":           i,
            "name":         f"{name} Lane",
            "lane":         name,
            "vehicleCount": count,
            "density":      density,
            "trend":        trend,
            **meta,
        })

    elapsed = round(time.time() - start_ts, 2)

    # ── Write results back into job_store ─────────────────────────────────────
    job_store[job_id].update({
        "status":          "completed",
        "progress":        100,
        "laneCounts":      peak_counts,
        "laneDetails":     lane_details,
        "totalVehicles":   sum(peak_counts.values()),
        "frameCount":      frames_sampled,
        "processingTime":  elapsed,
        "annotatedFrames": key_frames_b64,
        "frameIndices":    key_frame_indices,
        "videoMeta": {
            "width":  frame_w,
            "height": frame_h,
            "fps":    round(fps, 2),
            "totalFrames": total_frames,
        },
    })


# ── Internal helpers ──────────────────────────────────────────────────────────

def _fail(job_store: dict, job_id: str, msg: str) -> None:
    """Mark a job as failed with an error message."""
    job_store[job_id].update({
        "status":   "error",
        "error":    msg,
        "progress": 0,
    })
