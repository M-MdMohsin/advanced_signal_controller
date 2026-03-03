"""
/api/video  — Video upload endpoint.

POST /api/video/upload
    Accepts a multipart/form-data file field named "video".
    Saves the file to uploads/ and returns metadata + simulated analysis trigger.

GET /api/video/status/<filename>
    Returns the processing status of an uploaded video.
"""

import os
import uuid
import time
from flask import Blueprint, request, jsonify
from werkzeug.utils import secure_filename

video_bp = Blueprint("video", __name__)

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "..", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

ALLOWED_EXTENSIONS = {"mp4", "avi", "mov", "mkv", "webm", "flv"}

# In-memory job tracker  {job_id: {...}}
_jobs: dict = {}


def _allowed_file(filename: str) -> bool:
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


@video_bp.route("/upload", methods=["POST"])
def upload_video():
    """
    Accepts a video file and stores it on disk.
    Simulates async CV processing by returning a job_id.
    """
    if "video" not in request.files:
        return jsonify({"success": False, "error": "No video file provided. Field name must be 'video'."}), 400

    file = request.files["video"]

    if file.filename == "":
        return jsonify({"success": False, "error": "No file selected."}), 400

    if not _allowed_file(file.filename):
        return jsonify({
            "success": False,
            "error": f"Unsupported format. Allowed: {', '.join(ALLOWED_EXTENSIONS)}",
        }), 415

    filename   = secure_filename(file.filename)
    unique_name = f"{uuid.uuid4().hex}_{filename}"
    save_path  = os.path.join(UPLOAD_DIR, unique_name)
    file.save(save_path)

    file_size_mb = round(os.path.getsize(save_path) / (1024 * 1024), 2)
    job_id = uuid.uuid4().hex

    _jobs[job_id] = {
        "status":     "processing",
        "filename":   unique_name,
        "original":   filename,
        "sizeMb":     file_size_mb,
        "uploadedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "progress":   0,
    }

    return jsonify({
        "success":    True,
        "jobId":      job_id,
        "filename":   unique_name,
        "originalName": filename,
        "sizeMb":     file_size_mb,
        "uploadedAt": _jobs[job_id]["uploadedAt"],
        "message":    "Video uploaded successfully. Processing started.",
        "statusUrl":  f"/api/video/status/{job_id}",
    }), 201


@video_bp.route("/status/<job_id>", methods=["GET"])
def video_status(job_id: str):
    """
    Returns current processing status for a given job.
    Simulates incremental progress on each poll.
    """
    job = _jobs.get(job_id)
    if not job:
        return jsonify({"success": False, "error": "Job not found."}), 404

    # Simulate progress advancement on each poll (demo only)
    if job["status"] == "processing":
        job["progress"] = min(job["progress"] + 25, 100)
        if job["progress"] >= 100:
            job["status"] = "completed"

    return jsonify({
        "success":  True,
        "jobId":    job_id,
        "status":   job["status"],
        "progress": job["progress"],
        "filename": job["filename"],
        "original": job["original"],
        "sizeMb":   job["sizeMb"],
    })


@video_bp.route("/jobs", methods=["GET"])
def list_jobs():
    """List all upload jobs (useful for debugging)."""
    return jsonify({"success": True, "jobs": list(_jobs.values())})
