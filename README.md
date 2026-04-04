# AI Traffic Signal Management System (ATMS)

## Project Overview
The AI Traffic Signal Management System is a modern, real-time traffic control dashboard built to dynamically optimize traffic signal intersections using computer vision. Traditional traffic lights operate on fixed timers, leading to inefficient wait times and congestion. This project aims to solve that by using an AI-based workflow that looks at intersection lane images, detects the number of vehicles, and dynamically recalculates the exact green-light time needed for each lane based on density.

The project features a sleek, dark-mode React dashboard that displays real-time signal allocations, animated physical intersection signals, historical density charts, and logs for traffic violations or emergency vehicles.

## How It Works (Detailed Workflow)

1. **Traffic Monitoring & Image Ingestion**
   Cameras at the intersection simulate capturing images of different lanes (North, South, East, West). In our backend, these images are stored in `backend/images/<lane>/`.

2. **YOLOv8 Detection Trigger**
   On the frontend Overview page, the user clicks **Run YOLO Detection**. This calls the backend via the `/api/detection/auto-detect` endpoint. Asynchronous processing begins using background polling to get progress updates without blocking the UI.

3. **Backend Computer Vision**
   The Python Flask backend loads the `ultralytics` YOLOv8 model. It processes exactly one image per lane folder. The model counts the number of detected vehicles (cars, trucks, buses, motorcycles) in each lane and draws bounding boxes on a new annotated output image.

4. **Dynamic Signal Calculation**
   Once the vehicles are counted, the backend dynamically assigns green-light time using a proportional formula:
   `Green Time = MIN_GREEN + (Lane Vehicles / Total Vehicles) * (MAX_GREEN - MIN_GREEN)`
   This ensures that a lane with heavy traffic receives proportionally more time to clear, while an relatively empty lane is assigned less waiting priority.

5. **Frontend Synchronization**
   The processing results (annotated images, vehicle counts, and exact signal timers array) are returned to the frontend. The `App.jsx` state manager captures this and distributes the new data:
   - The **Auto Image Detection Panel** renders the live annotated previews matching the YOLO classifications.
   - The **Signal Allocation Panel** receives the exact green-times and immediately resets its cascade list.
   - The **Intersection Signals View** visualizes the physical 4-direction traffic lights. It mathematically aligns perfectly with the Signal Allocation logic to execute a continuous Green -> Yellow -> Red cascade based purely on the YOLO analysis.

6. **Continuous Polling & Fallback**
   The React dashboard continues to poll the `/api/dashboard/summary` endpoint every 15 seconds to fetch the latest analytics (chart data, violations, emergencies, external API data), gracefully overriding its static dummy data with the live YOLO calculations whenever a new cycle is computed.

## Tech Stack Used

### Frontend (Client)
* **React 18** (Vite bundler): Fast, modern component-based UI.
* **React Router DOM**: Used to handle multi-page routing (Home vs Dashboard tabs).
* **Chart.js & React-Chartjs-2**: Renders the lane density analytics history graph.
* **CSS Vanilla Styling**: No generic CSS frameworks; the platform uses carefully crafted modern CSS features, grid layouts, fluid typography, and premium glass-morphism effects tailored.

### Backend (Server)
* **Python 3.10+**: Core programming language for processing.
* **Flask**: Lightweight WSGI web application framework exposing RESTful APIs.
* **Flask-CORS**: Used to seamlessly manage resource sharing between the frontend Node layer and the backend Python layer.
* **Ultralytics YOLOv8**: State-of-the-art, real-time object detection model used to classify bounding boxes for various vehicles.
* **OpenCV (cv2) & PIL**: Image processing libraries used to parse, manipulate, annotate and save physical bounding boxes overlaid on the frontend interface over HTTP.

## Getting Started

1. **Run the Backend:**
   Navigate to `/backend`
   Ensure dependencies are installed: `pip install flask flask-cors ultralytics opencv-python pillow`
   Run: `python app.py` (Runs on `http://localhost:5000`)

2. **Run the Frontend:**
   Navigate into the main project directory.
   Install dependencies: `npm install`
   Run: `npm run dev` (Connects locally, usually on port `:5173`)
