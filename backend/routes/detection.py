"""
/api/detection  — Exposes YOLOv8 detection results for the dashboard.

GET /api/detection/results/<job_id>
    Returns the full detection payload for a completed job.
    Also feeds the result into signal_logic so green-times are computed
    from the actual vehicle counts, not random data.

GET /api/detection/lanes/<job_id>
    Returns only the per-lane breakdown (vehicle counts + density meta).

GET /api/detection/annotated/<job_id>/<frame_index>
    Returns a single annotated frame as a JPEG image (inline).
"""

import base64
import io
from flask import Blueprint, request, jsonify, send_file, abort

detection_bp = Blueprint("detection", __name__)

# Shared reference to the job store populated by routes/video.py
# We import it lazily on first request to avoid circular imports.
def _get_jobs():
    from routes.video import _jobs   # type: ignore
    return _jobs


@detection_bp.route("/results/<job_id>", methods=["GET"])
def detection_results(job_id: str):
    """
    Full detection result for a completed job.
    Also computes green-time allocation from real vehicle counts.
    """
    jobs = _get_jobs()
    job  = jobs.get(job_id)
    if not job:
        return jsonify({"success": False, "error": "Job not found."}), 404

    if job["status"] == "processing":
        return jsonify({
            "success":  False,
            "status":   "processing",
            "progress": job["progress"],
            "message":  "Detection still in progress. Poll /api/video/status for updates.",
        }), 202

    if job["status"] == "error":
        return jsonify({
            "success": False,
            "status":  "error",
            "error":   job.get("error"),
        }), 500

    # ── Compute signal allocation from real counts ────────────────────────────
    lane_counts = job.get("laneCounts", {})
    signal_data = []
    if lane_counts:
        from signal_logic import build_signal_payload   # type: ignore
        signal_data = build_signal_payload(lane_counts)

    return jsonify({
        "success":         True,
        "jobId":           job_id,
        "status":          job["status"],
        "totalVehicles":   job.get("totalVehicles"),
        "frameCount":      job.get("frameCount"),
        "processingTime":  job.get("processingTime"),
        "laneCounts":      lane_counts,
        "laneDetails":     job.get("laneDetails"),
        "signalAllocation": signal_data,
        "videoMeta":       job.get("videoMeta"),
        "snapshotCount":   len(job.get("annotatedFrames") or []),
    })


@detection_bp.route("/lanes/<job_id>", methods=["GET"])
def lane_breakdown(job_id: str):
    """Return per-lane vehicle counts + density metadata for a completed job."""
    jobs = _get_jobs()
    job  = jobs.get(job_id)
    if not job:
        return jsonify({"success": False, "error": "Job not found."}), 404

    if job["status"] != "completed":
        return jsonify({
            "success": False,
            "status":  job["status"],
            "error":   "Results not yet available.",
        }), 202

    return jsonify({
        "success":       True,
        "jobId":         job_id,
        "laneDetails":   job.get("laneDetails", []),
        "laneCounts":    job.get("laneCounts", {}),
        "totalVehicles": job.get("totalVehicles", 0),
    })


@detection_bp.route("/annotated/<job_id>/<int:frame_index>", methods=["GET"])
def annotated_frame(job_id: str, frame_index: int):
    """
    Return a specific annotated key-frame as an inline JPEG image.
    frame_index is 0-based into the stored snapshot list (max 5).
    """
    jobs = _get_jobs()
    job  = jobs.get(job_id)
    if not job:
        abort(404)

    frames = job.get("annotatedFrames") or []
    if frame_index < 0 or frame_index >= len(frames):
        return jsonify({
            "success": False,
            "error":   f"Frame index {frame_index} out of range (0–{len(frames)-1}).",
        }), 404

    jpeg_bytes = base64.b64decode(frames[frame_index])
    return send_file(
        io.BytesIO(jpeg_bytes),
        mimetype="image/jpeg",
        as_attachment=False,
    )


@detection_bp.route("/annotated/<job_id>", methods=["GET"])
def all_annotated_frames(job_id: str):
    """Return all annotated frame snapshots as base64 strings."""
    jobs = _get_jobs()
    job  = jobs.get(job_id)
    if not job:
        return jsonify({"success": False, "error": "Job not found."}), 404

    if job["status"] != "completed":
        return jsonify({"success": False, "status": job["status"]}), 202

    frames  = job.get("annotatedFrames") or []
    indices = job.get("frameIndices") or []

    return jsonify({
        "success":      True,
        "jobId":        job_id,
        "count":        len(frames),
        "frameIndices": indices,
        "frames":       [
            {
                "index":  idx,
                "base64": f"data:image/jpeg;base64,{b64}",
            }
            for idx, b64 in zip(indices, frames)
        ],
    })
