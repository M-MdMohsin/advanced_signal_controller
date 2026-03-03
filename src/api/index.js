/**
 * src/api/index.js
 *
 * Centralised API service for the Flask backend.
 * All fetch calls go through here so the base URL is one config change.
 */

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

async function request(path, options = {}) {
    const res = await fetch(`${BASE_URL}${path}`, options);
    const data = await res.json();
    if (!res.ok) {
        throw new Error(data.error || `HTTP ${res.status}`);
    }
    return data;
}

// ── Health ─────────────────────────────────────────────────────────────────
export const checkHealth = () => request("/health");

// ── Dashboard aggregate ────────────────────────────────────────────────────
export const getDashboardSummary = () => request("/dashboard/summary");

// ── Lane Density ───────────────────────────────────────────────────────────
export const getCurrentDensity = () => request("/density/current");
export const getDensityHistory = (points = 10) =>
    request(`/density/history?points=${points}`);
export const setManualDensity = (counts) =>
    request("/density/set", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(counts),
    });
export const resetDensity = () =>
    request("/density/reset", { method: "POST" });

// ── Signal Allocation ──────────────────────────────────────────────────────
export const getAutoAllocation = () => request("/signals/allocate");
export const getManualAllocation = (laneCounts) =>
    request("/signals/allocate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(laneCounts),
    });
export const getSignalConfig = () => request("/signals/config");

// ── Video Upload ───────────────────────────────────────────────────────────
export const uploadVideo = (file, onProgress) => {
    return new Promise((resolve, reject) => {
        const formData = new FormData();
        formData.append("video", file);

        const xhr = new XMLHttpRequest();

        if (onProgress) {
            xhr.upload.addEventListener("progress", (e) => {
                if (e.lengthComputable) {
                    onProgress(Math.round((e.loaded / e.total) * 100));
                }
            });
        }

        xhr.addEventListener("load", () => {
            try {
                const data = JSON.parse(xhr.responseText);
                if (xhr.status >= 200 && xhr.status < 300) {
                    resolve(data);
                } else {
                    reject(new Error(data.error || `Upload failed: HTTP ${xhr.status}`));
                }
            } catch {
                reject(new Error("Invalid JSON response from server."));
            }
        });

        xhr.addEventListener("error", () =>
            reject(new Error("Network error during upload."))
        );
        xhr.addEventListener("abort", () =>
            reject(new Error("Upload aborted."))
        );

        xhr.open("POST", `${BASE_URL}/video/upload`);
        xhr.send(formData);
    });
};

export const getVideoStatus = (jobId) =>
    request(`/video/status/${jobId}`);
