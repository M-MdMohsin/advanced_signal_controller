"""
/api/video  — Video upload and YOLOv8 processing endpoints.

POST /api/video/upload
    Accepts a multipart/form-data file field named "video".
    Saves the file to uploads/, spawns a background thread that runs
    YOLOv8 vehicle detection, and returns a job_id for polling.

GET /api/video/status/<job_id>
    Returns the current processing status + results (when complete).

GET /api/video/jobs
    Lists all known jobs (debug).

DELETE /api/video/jobs/<job_id>
    Removes a job entry and its uploaded file.
"""

import os
import uuid
import time
import threading
from flask import Blueprint, request, jsonify
from werkzeug.utils import secure_filename

video_bp = Blueprint("video", __name__)

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "..", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

IMAGE_EXTENSIONS = {"jpg", "jpeg", "png"}
VIDEO_EXTENSIONS = {"mp4", "mkv", "flv", "avi", "mov", "webm"}
ALLOWED_EXTENSIONS = IMAGE_EXTENSIONS | VIDEO_EXTENSIONS

# Shared in-memory job store  { job_id: { ...metadata + results... } }
_jobs: dict = {}


def _allowed_file(filename: str) -> bool:
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


def _run_detection(video_path: str, job_id: str, lane: str = None) -> None:
    """
    Background worker: imports and calls the YOLO detector.
    Isolated in its own function so import errors surface cleanly.
    """
    try:
        import sys
        # Ensure backend root is on sys.path (needed when Flask resolves modules)
        backend_root = os.path.dirname(os.path.dirname(__file__))
        if backend_root not in sys.path:
            sys.path.insert(0, backend_root)

        from yolo_detector import detect_vehicles
        detect_vehicles(video_path, _jobs, job_id, target_lane=lane)

    except Exception as exc:
        _jobs[job_id].update({
            "status":   "error",
            "error":    str(exc),
            "progress": 0,
        })


def _run_image_detection(image_path: str, job_id: str, lane: str = None) -> None:
    """
    Background worker: imports and calls the YOLO detector for images.
    """
    try:
        import sys
        backend_root = os.path.dirname(os.path.dirname(__file__))
        if backend_root not in sys.path:
            sys.path.insert(0, backend_root)

        from yolo_detector import detect_image
        detect_image(image_path, _jobs, job_id, target_lane=lane)

    except Exception as exc:
        _jobs[job_id].update({
            "status":   "error",
            "error":    str(exc),
            "progress": 0,
        })


def process_video(save_path: str, job_id: str, lane: str = None) -> None:
    """
    Background worker for video processing.
    """
    t = threading.Thread(
        target=_run_detection,
        args=(save_path, job_id, lane),
        daemon=True,
        name=f"yolo-video-{job_id[:8]}",
    )
    t.start()


def process_image(save_path: str, job_id: str, lane: str = None) -> None:
    """
    Background worker for image processing.
    Delegates to YOLO detector detect_image.
    """
    t = threading.Thread(
        target=_run_image_detection,
        args=(save_path, job_id, lane),
        daemon=True,
        name=f"yolo-image-{job_id[:8]}",
    )
    t.start()


@video_bp.route("/upload", methods=["POST"])
def upload_video():
    """
    Accepts a video file, stores it on disk, and kicks off YOLO analysis
    in a background daemon thread.
    """
    if "video" not in request.files:
        return jsonify({
            "success": False,
            "error": "No video file provided. Field name must be 'video'.",
        }), 400

    file = request.files["video"]

    if file.filename == "":
        return jsonify({"success": False, "error": "No file selected."}), 400

    if not _allowed_file(file.filename):
        return jsonify({
            "success": False,
            "error": f"Unsupported format. Allowed: {', '.join(ALLOWED_EXTENSIONS)}",
        }), 415

    ext = file.filename.rsplit(".", 1)[1].lower()
    mimetype = file.mimetype
    lane = request.form.get("lane")

    is_image = mimetype.startswith('image') or ext in IMAGE_EXTENSIONS
    is_video = mimetype.startswith('video') or ext in VIDEO_EXTENSIONS

    if not is_image and not is_video:
        return jsonify({
            "success": False,
            "error": f"Unsupported format. Allowed: {', '.join(ALLOWED_EXTENSIONS)}",
        }), 415

    filename    = secure_filename(file.filename)
    unique_name = f"{uuid.uuid4().hex}_{filename}"
    save_path   = os.path.join(UPLOAD_DIR, unique_name)
    file.save(save_path)

    file_size_mb = round(os.path.getsize(save_path) / (1024 * 1024), 2)
    job_id       = uuid.uuid4().hex

    _jobs[job_id] = {
        "status":      "processing",
        "filename":    unique_name,
        "original":    filename,
        "sizeMb":      file_size_mb,
        "uploadedAt":  time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "progress":    0,
        # Results (populated when detection completes)
        "laneCounts":      None,
        "laneDetails":     None,
        "totalVehicles":   None,
        "frameCount":      None,
        "processingTime":  None,
        "annotatedFrames": None,
        "error":           None,
    }

    # ── Launch YOLO in background thread based on type ────────────────────────
    if is_image:
        process_image(save_path, job_id, lane)
    else:  # is_video
        process_video(save_path, job_id, lane)

    file_type_str = "Image" if is_image else "Video"

    return jsonify({
        "success":      True,
        "jobId":        job_id,
        "filename":     unique_name,
        "originalName": filename,
        "sizeMb":       file_size_mb,
        "uploadedAt":   _jobs[job_id]["uploadedAt"],
        "message":      f"{file_type_str} uploaded. YOLOv8 detection started in background.",
        "statusUrl":    f"/api/video/status/{job_id}",
    }), 201


@video_bp.route("/status/<job_id>", methods=["GET"])
def video_status(job_id: str):
    """
    Poll this endpoint to check detection progress and retrieve results.

    Response fields:
      status          : "processing" | "completed" | "error"
      progress        : 0-100
      laneCounts      : {lane: count}          (when completed)
      laneDetails     : [{...density shape}]   (when completed)
      totalVehicles   : int                    (when completed)
      frameCount      : int                    (when completed)
      processingTime  : float seconds          (when completed)
      annotatedFrames : [base64 JPEG, ...]     (when completed, up to 5)
      error           : str                    (when errored)
    """
    job = _jobs.get(job_id)
    if not job:
        return jsonify({"success": False, "error": "Job not found."}), 404

    payload = {
        "success":    True,
        "jobId":      job_id,
        "status":     job["status"],
        "progress":   job["progress"],
        "filename":   job["filename"],
        "original":   job["original"],
        "sizeMb":     job["sizeMb"],
        "uploadedAt": job["uploadedAt"],
    }

    if job["status"] == "completed":
        payload.update({
            "type":            job.get("type"),
            "message":         job.get("message"),
            "output":          job.get("output"),
            "signal":          job.get("signal"),
            "laneCounts":      job.get("laneCounts"),
            "laneDetails":     job.get("laneDetails"),
            "totalVehicles":   job.get("totalVehicles"),
            "frameCount":      job.get("frameCount"),
            "processingTime":  job.get("processingTime"),
            "annotatedFrames": job.get("annotatedFrames"),
            "frameIndices":    job.get("frameIndices"),
            "videoMeta":       job.get("videoMeta"),
        })

    if job["status"] == "error":
        payload["error"] = job.get("error", "Unknown error.")

    return jsonify(payload)


@video_bp.route("/jobs", methods=["GET"])
def list_jobs():
    """List all upload jobs — useful for debugging / admin dashboards."""
    jobs_summary = [
        {
            "jobId":    jid,
            "status":   j["status"],
            "progress": j["progress"],
            "original": j["original"],
            "sizeMb":   j["sizeMb"],
            "uploadedAt": j["uploadedAt"],
        }
        for jid, j in _jobs.items()
    ]
    return jsonify({"success": True, "count": len(jobs_summary), "jobs": jobs_summary})


@video_bp.route("/jobs/<job_id>", methods=["DELETE"])
def delete_job(job_id: str):
    """Remove a job record and delete the uploaded video file."""
    job = _jobs.pop(job_id, None)
    if not job:
        return jsonify({"success": False, "error": "Job not found."}), 404

    file_path = os.path.join(UPLOAD_DIR, job["filename"])
    if os.path.exists(file_path):
        os.remove(file_path)

    return jsonify({"success": True, "message": f"Job {job_id} deleted."})
