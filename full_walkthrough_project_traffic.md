# Full System Walkthrough — ATMS with Real YOLOv8 Detection

## What Was Broken (and Why You Only Saw Dummy Data)

There were **4 separate bugs** forming a broken chain:

| # | File | Bug | Effect |
|---|---|---|---|
| 1 | [LaneDensityCards.jsx](file:///c:/Users/bingo/OneDrive/Desktop/new_major_project/src/components/LaneDensityCards.jsx) | Hardcoded `import laneDensityData from dummyData` — ignored the `liveData` prop | Always showed static fake numbers |
| 2 | [SignalAllocation.jsx](file:///c:/Users/bingo/OneDrive/Desktop/new_major_project/src/components/SignalAllocation.jsx) | Hardcoded `import signalAllocationData from dummyData` — ignored `liveData` prop | Always showed static fake timings |
| 3 | [VideoUpload.jsx](file:///c:/Users/bingo/OneDrive/Desktop/new_major_project/src/components/VideoUpload.jsx) | Marked `done=true` the moment upload HTTP 201 arrived — **never polled** the YOLO job | Progress bar reached 100% immediately; YOLO was still running in background unread |
| 4 | [dashboard.py](file:///c:/Users/bingo/OneDrive/Desktop/new_major_project/backend/routes/dashboard.py) | Always called [generate_lane_density()](file:///c:/Users/bingo/OneDrive/Desktop/new_major_project/backend/density_generator.py#46-69) (random) — never checked completed YOLO jobs | Even if YOLO finished, dashboard ignored it |

---

## Fixed Data Flow (How It Works Now)

```
User picks video file
        │
        ▼
VideoUpload.jsx ──POST /api/video/upload──► video.py saves file
                                                    │
                                                    └─► background thread → yolo_detector.py
                                                              │
                                                              ├─ OpenCV reads frames (every 5th)
                                                              ├─ YOLOv8 runs on each frame
                                                              ├─ 4 vertical ROI strips = 4 lanes
                                                              └─ peak vehicle count per lane saved
                                                                        │
VideoUpload.jsx ──polls every 2s──► GET /api/video/status/{jobId}      │
        │                                      (progress 0→100%)        │
        │  when status==="completed"                                     │
        ▼                                                                ▼
GET /api/detection/results/{jobId} ◄─────── _jobs[ jobId ] now has laneDetails
        │
        ▼
onDetectionComplete(results) callback ──► App.jsx sets detectionData state
        │
        ├──► LaneDensityCards  receives liveData = real YOLO lane counts
        └──► SignalAllocation  receives liveData = green-times from real counts

Dashboard /api/dashboard/summary also checks _get_latest_yolo_result()
and uses real counts if a completed job exists
```

---

## Step-by-Step: How to Use with a Video

### 1. Start Both Servers (if not already running)

**Terminal 1 — Backend:**
```powershell
cd c:\Users\bingo\OneDrive\Desktop\new_major_project\backend
python app.py
```

**Terminal 2 — Frontend:**
```powershell
cd c:\Users\bingo\OneDrive\Desktop\new_major_project
npm run dev
```

---

### 2. Open the Dashboard
Go to **http://localhost:5173** (or whatever port Vite shows).

Check the bottom-right badge — it should say **"API Connected"** with a green dot.

---

### 3. Upload Your Video

> [!IMPORTANT]
> Your 45 MB video is perfectly fine. YOLO will analyse it in the background.

1. On the **Overview** tab, find the **Camera Feed Upload** panel
2. Drop your video onto any lane slot (e.g. North Lane) — or click to browse
3. Since your video has 2 lanes, you can upload the **same video to 2 slots** (e.g. North + South) to simulate a 2-lane intersection
4. Click **"🧠 Analyse Feeds"**

---

### 4. Watch the Two-Stage Progress Bar

**Stage 1 — Upload** (fast, ~2-5 seconds for 45 MB on localhost):
```
Uploading 1 file to server…       [██████████] 100%
```

**Stage 2 — YOLOv8 Analysis** (takes time — see below):
```
🧠 YOLOv8 analysing frames… (this may take 30–120s for a 45 MB video)
                                   [████░░░░░░] 45%
```

> [!TIP]
> Processing speed depends on your CPU. For a 45 MB / ~1 min video at the default `FRAME_SAMPLE_RATE=5` setting, expect **30–90 seconds** on a typical laptop CPU. Set `YOLO_MODEL=yolov8n.pt` (nano) which is already the default — fastest model.

---

### 5. Results Appear Automatically

When analysis finishes:

- A green **"📹 Live Video Analysis Active"** banner appears at the top
- **Lane Density Monitor** cards update with real vehicle counts and density %
- **Signal Allocation Panel** shows green-times computed from the real counts
- The "Total Vehicles Today" top stat shows the real detected count
- A **detection results box** in the upload panel shows per-lane breakdown

---

### 6. Understanding the Lane Results

The frame is divided into **4 equal vertical strips** left→right:
```
| North  | South  | East   | West   |
|  0–25% | 25–50% | 50–75% | 75–100%|
```

For a **2-lane video** (e.g. a dashcam showing 2 lanes side by side):
- Left half of the video → counted in **North** lane
- Right half of the video → counted in **South** lane
- East and West will show 0 vehicles (no footage for them)

> [!NOTE]
> The system handles partial data gracefully — lanes with 0 vehicles get minimal green time, and the formula still works correctly.

---

### 7. To Clear and Go Back to Random Mode

Click the **"Clear & use live feed"** button in the green banner, or click **"🔄 Reset & Upload New Video"** in the upload panel.

---

## API Endpoints — Quick Reference

| Endpoint | What it returns |
|---|---|
| `GET /api/health` | `{ status:"ok", yoloReady: true }` |
| `POST /api/video/upload` | `{ jobId, statusUrl, ... }` |
| `GET /api/video/status/{jobId}` | `{ status, progress, laneDetails, ... }` |
| `GET /api/detection/results/{jobId}` | Full YOLO results + signal allocation |
| `GET /api/detection/annotated/{jobId}` | Up to 5 annotated frame snapshots |
| `GET /api/dashboard/summary` | Full dashboard (uses real data if video done) |

---

## Environment Variables (tune performance)

Set these in the terminal **before** `python app.py`:

```powershell
# Process every 3rd frame instead of 5th (more accurate, slower)
$env:FRAME_SAMPLE_RATE = "3"

# Use larger model for better accuracy (slower)
$env:YOLO_MODEL = "yolov8s.pt"

# Lower confidence threshold to catch more vehicles
$env:CONF_THRESHOLD = "0.25"

python app.py
```

---

## Files Changed in This Session

| File | What changed |
|---|---|
| [backend/yolo_detector.py](file:///c:/Users/bingo/OneDrive/Desktop/new_major_project/backend/yolo_detector.py) | NEW — YOLOv8 + OpenCV engine, 4-lane ROI |
| [backend/routes/video.py](file:///c:/Users/bingo/OneDrive/Desktop/new_major_project/backend/routes/video.py) | Background YOLO thread on upload |
| [backend/routes/detection.py](file:///c:/Users/bingo/OneDrive/Desktop/new_major_project/backend/routes/detection.py) | NEW — detection result endpoints |
| [backend/routes/dashboard.py](file:///c:/Users/bingo/OneDrive/Desktop/new_major_project/backend/routes/dashboard.py) | Uses real YOLO data when available |
| [backend/app.py](file:///c:/Users/bingo/OneDrive/Desktop/new_major_project/backend/app.py) | Registers detection blueprint |
| [backend/requirements.txt](file:///c:/Users/bingo/OneDrive/Desktop/new_major_project/backend/requirements.txt) | Added ultralytics, opencv-python, numpy |
| [src/api/index.js](file:///c:/Users/bingo/OneDrive/Desktop/new_major_project/src/api/index.js) | Added getDetectionResults, getAnnotatedFrames |
| [src/components/VideoUpload.jsx](file:///c:/Users/bingo/OneDrive/Desktop/new_major_project/src/components/VideoUpload.jsx) | Polls YOLO job, emits onDetectionComplete |
| [src/components/LaneDensityCards.jsx](file:///c:/Users/bingo/OneDrive/Desktop/new_major_project/src/components/LaneDensityCards.jsx) | Uses liveData prop (was hardcoded) |
| [src/components/SignalAllocation.jsx](file:///c:/Users/bingo/OneDrive/Desktop/new_major_project/src/components/SignalAllocation.jsx) | Uses liveData prop (was hardcoded) |
| [src/App.jsx](file:///c:/Users/bingo/OneDrive/Desktop/new_major_project/src/App.jsx) | Manages detectionData state, passes to panels |
