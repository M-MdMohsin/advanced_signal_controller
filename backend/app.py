"""
AI Traffic Signal Management System — Flask Backend
Entry point: runs the dev server on port 5000
"""

from flask import Flask
from flask_cors import CORS
from routes.video import video_bp
from routes.density import density_bp
from routes.signals import signals_bp
from routes.dashboard import dashboard_bp
from routes.detection import detection_bp


def create_app():
    app = Flask(__name__)
    app.config["MAX_CONTENT_LENGTH"] = 500 * 1024 * 1024  # 500 MB upload limit

    # Allow all origins in dev – lock down in production
    CORS(app, resources={r"/api/*": {"origins": "*"}})

    # Register blueprints
    app.register_blueprint(video_bp,     url_prefix="/api/video")
    app.register_blueprint(density_bp,   url_prefix="/api/density")
    app.register_blueprint(signals_bp,   url_prefix="/api/signals")
    app.register_blueprint(dashboard_bp, url_prefix="/api/dashboard")
    app.register_blueprint(detection_bp, url_prefix="/api/detection")

    @app.route("/api/health")
    def health():
        # Report whether YOLO is available
        try:
            from ultralytics import YOLO   # noqa: F401
            yolo_ready = True
        except ImportError:
            yolo_ready = False

        return {
            "status":    "ok",
            "service":   "ATMS Backend",
            "version":   "2.0.0",
            "yoloReady": yolo_ready,
        }

    return app


if __name__ == "__main__":
    app = create_app()
    app.run(debug=True, host="0.0.0.0", port=5000)
