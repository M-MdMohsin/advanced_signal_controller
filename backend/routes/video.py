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
            "annotatedImages": job.get("annotatedImages"),   # per-lane URLs from auto-detect
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


# ── Auto-detect from lane image folders ──────────────────────────────────────
#
# GET /api/video/auto-detect
#   Reads backend/images/{north,east,south,west}/ and runs YOLO on the
#   next image in each folder (cycles automatically).  Results are merged
#   into a single combined job entry identical in shape to a manual upload.
#
# GET /api/video/feeder-status
#   Returns the current state of every lane folder (image list, next index).

@video_bp.route("/auto-detect", methods=["GET"])
def auto_detect():
    """
    Pick the next image from each lane folder and run YOLO detection.
    Only lane folders that contain at least one image are processed.
    The results are merged and stored as a single job in _jobs so that
    /api/dashboard/summary picks them up automatically via _get_latest_yolo_result().
    """
    import sys
    backend_root = os.path.dirname(os.path.dirname(__file__))
    if backend_root not in sys.path:
        sys.path.insert(0, backend_root)

    from image_feeder import get_next_image_for_lane, LANE_NAMES, feeder_status
    from yolo_detector import detect_image

    # Collect one image path per lane (skip lanes with no images)
    lane_images: dict[str, str] = {}
    for lane in LANE_NAMES:
        path = get_next_image_for_lane(lane)
        if path:
            lane_images[lane] = path

    if not lane_images:
        return jsonify({
            "success": False,
            "error":   (
                "No images found in any lane folder. "
                "Place images inside backend/images/north/, east/, south/, west/."
            ),
            "feederStatus": feeder_status(),
        }), 404

    # Create one combined job entry
    job_id = uuid.uuid4().hex
    _jobs[job_id] = {
        "status":      "processing",
        "filename":    "auto_detect",
        "original":    "auto_detect",
        "sizeMb":      0,
        "uploadedAt":  time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "progress":    0,
        "laneCounts":      None,
        "laneDetails":     None,
        "totalVehicles":   None,
        "frameCount":      None,
        "processingTime":  None,
        "annotatedFrames": None,
        "error":           None,
    }

    def _run_all_lanes():
        """
        Process every lane image sequentially in a background thread.
        Each image is run through detect_image with its lane as target_lane
        so the whole frame is treated as that single lane.
        After all lanes finish, merge their laneDetails into one job record.
        """
        collected_details: list = []
        collected_counts:  dict = {}
        annotated_images:  dict = {}   # { "North": "/static/images/detected_xxx.jpg", ... }
        start_ts = time.time()

        for lane_key, img_path in lane_images.items():
            lane_job_id = uuid.uuid4().hex
            _jobs[lane_job_id] = {
                "status":      "processing",
                "filename":    os.path.basename(img_path),
                "original":    os.path.basename(img_path),
                "sizeMb":      round(os.path.getsize(img_path) / (1024 * 1024), 3),
                "uploadedAt":  time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                "progress":    0,
                "laneCounts":      None,
                "laneDetails":     None,
                "totalVehicles":   None,
                "frameCount":      None,
                "processingTime":  None,
                "annotatedFrames": None,
                "error":           None,
            }
            # target_lane = capitalised lane name so YOLO treats the whole frame as one lane
            detect_image(img_path, _jobs, lane_job_id, target_lane=lane_key.capitalize())

            sub_job = _jobs.get(lane_job_id, {})
            if sub_job.get("status") == "completed" and sub_job.get("laneDetails"):
                for detail in sub_job["laneDetails"]:
                    collected_details.append(detail)
                    collected_counts[detail["lane"]] = detail["vehicleCount"]
                # Collect the annotated image URL saved by detect_image
                if sub_job.get("output"):
                    annotated_images[lane_key.capitalize()] = sub_job["output"]

            # Clean up the temporary sub-job to keep _jobs tidy
            _jobs.pop(lane_job_id, None)

            # Update combined job progress proportionally
            done = list(lane_images.keys()).index(lane_key) + 1
            _jobs[job_id]["progress"] = int((done / len(lane_images)) * 95)

        elapsed = round(time.time() - start_ts, 2)

        if not collected_details:
            _jobs[job_id].update({
                "status":   "error",
                "error":    "YOLO detection produced no results for any lane.",
                "progress": 0,
            })
            return

        _jobs[job_id].update({
            "status":          "completed",
            "progress":        100,
            "type":            "auto_image",
            "message":         f"Auto-detected {len(lane_images)} lane(s) from folder images.",
            "laneCounts":      collected_counts,
            "laneDetails":     collected_details,
            "totalVehicles":   sum(collected_counts.values()),
            "frameCount":      len(lane_images),
            "processingTime":  elapsed,
            "annotatedFrames": None,
            "annotatedImages": annotated_images,  # { "North": "/static/images/...", ... }
        })

    # Run all lanes in a single daemon thread
    t = threading.Thread(target=_run_all_lanes, daemon=True, name=f"auto-detect-{job_id[:8]}")
    t.start()

    return jsonify({
        "success":      True,
        "jobId":        job_id,
        "lanesQueued":  list(lane_images.keys()),
        "imagesUsed":   {k: os.path.basename(v) for k, v in lane_images.items()},
        "message":      "Auto-detection started. Poll /api/video/status/<jobId> for results.",
        "statusUrl":    f"/api/video/status/{job_id}",
        "feederStatus": feeder_status(),
    }), 202


@video_bp.route("/feeder-status", methods=["GET"])
def get_feeder_status():
    """Return the current state of every lane image folder (for debugging / UI)."""
    import sys
    backend_root = os.path.dirname(os.path.dirname(__file__))
    if backend_root not in sys.path:
        sys.path.insert(0, backend_root)

    from image_feeder import feeder_status
    return jsonify({"success": True, "feeder": feeder_status()})
