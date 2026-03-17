import React, { useState, useRef, useCallback } from 'react';
import { uploadVideo, getVideoStatus } from '../api/index.js';

const LANES = [
    { id: 'north', label: 'North Lane', icon: '⬆️', color: '#3b82f6', bg: 'rgba(59,130,246,0.08)', border: 'rgba(59,130,246,0.25)', camera: 'CAM-01' },
    { id: 'south', label: 'South Lane', icon: '⬇️', color: '#10b981', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.25)', camera: 'CAM-02' },
    { id: 'east', label: 'East Lane', icon: '➡️', color: '#ef4444', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.25)', camera: 'CAM-03' },
    { id: 'west', label: 'West Lane', icon: '⬅️', color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.25)', camera: 'CAM-04' },
];

/* ── Poll a single job until completed / errored ─────────────────────────
   Returns { laneDetails, signalAllocation, laneCounts, totalVehicles }
   Throws on error or after 5 min timeout.                               */
async function pollJobUntilDone(jobId, onProgressTick) {
    const POLL_MS = 2000;   // poll every 2 s
    const TIMEOUT_MS = 300_000; // 5-minute hard cap
    const started = Date.now();

    while (true) {
        if (Date.now() - started > TIMEOUT_MS)
            throw new Error('YOLO analysis timed out after 5 minutes.');

        await new Promise((r) => setTimeout(r, POLL_MS));

        const status = await getVideoStatus(jobId);

        if (onProgressTick) onProgressTick(status.progress ?? 0);

        if (status.status === 'error')
            throw new Error(status.error || 'Detection failed on the server.');

        if (status.status === 'completed') {
            // Fetch richer data from /api/detection/results if available
            try {
                const det = await fetch(
                    `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/detection/results/${jobId}`
                ).then((r) => r.json());

                return {
                    laneDetails: det.laneDetails ?? status.laneDetails,
                    signalAllocation: det.signalAllocation ?? [],
                    laneCounts: det.laneCounts ?? status.laneCounts,
                    totalVehicles: det.totalVehicles ?? status.totalVehicles,
                    processingTime: det.processingTime ?? status.processingTime,
                    frameCount: det.frameCount ?? status.frameCount,
                };
            } catch {
                // Fallback to raw status fields if detection endpoint unavailable
                return {
                    laneDetails: status.laneDetails,
                    signalAllocation: [],
                    laneCounts: status.laneCounts,
                    totalVehicles: status.totalVehicles,
                    processingTime: status.processingTime,
                    frameCount: status.frameCount,
                };
            }
        }
        // status === 'processing' → keep looping
    }
}


/* ── Per-lane upload slot ──────────────────────────────────────────────── */
const LaneUploadSlot = ({ lane, file, onFile, onRemove }) => {
    const inputRef = useRef(null);
    const [drag, setDrag] = useState(false);

    const handleDrop = (e) => {
        e.preventDefault();
        setDrag(false);
        const f = e.dataTransfer.files[0];
        if (f && f.type.startsWith('video/')) onFile(f);
    };

    return (
        <div
            onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
            onDragLeave={() => setDrag(false)}
            onDrop={handleDrop}
            onClick={() => !file && inputRef.current?.click()}
            style={{
                borderRadius: '12px',
                border: `2px dashed ${drag ? lane.color : file ? lane.color + '80' : 'rgba(255,255,255,0.1)'}`,
                background: file ? lane.bg : drag ? lane.bg : 'rgba(255,255,255,0.02)',
                padding: '16px 12px',
                cursor: file ? 'default' : 'pointer',
                transition: 'all 0.3s ease',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
                minHeight: '130px',
                justifyContent: 'center',
                position: 'relative',
            }}
        >
            {/* Camera badge */}
            <div style={{
                position: 'absolute', top: '8px', left: '10px',
                fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.06em',
                color: lane.color, background: lane.bg, border: `1px solid ${lane.border}`,
                padding: '2px 7px', borderRadius: '5px',
            }}>
                {lane.camera}
            </div>

            {!file ? (
                <>
                    <div style={{ fontSize: '1.6rem' }}>{lane.icon}</div>
                    <div style={{ fontWeight: 700, fontSize: '0.82rem', color: '#e2e8f0', textAlign: 'center' }}>{lane.label}</div>
                    <div style={{ fontSize: '0.65rem', color: '#64748b', textAlign: 'center', lineHeight: 1.4 }}>
                        Drop video<br />or click to browse
                    </div>
                    <div style={{ fontSize: '0.6rem', color: '#475569', background: 'rgba(255,255,255,0.04)', padding: '3px 8px', borderRadius: '5px', border: '1px solid rgba(255,255,255,0.06)' }}>
                        MP4 · AVI · MOV
                    </div>
                </>
            ) : (
                <>
                    <div style={{ fontSize: '1.4rem' }}>🎥</div>
                    <div style={{ fontSize: '0.72rem', fontWeight: 700, color: lane.color, textAlign: 'center', wordBreak: 'break-word', maxWidth: '100%', padding: '0 6px' }}
                        title={file.name}>
                        {file.name.length > 20 ? file.name.slice(0, 18) + '…' : file.name}
                    </div>
                    <div style={{ fontSize: '0.62rem', color: '#64748b' }}>{(file.size / 1024 / 1024).toFixed(1)} MB</div>
                    <button
                        onClick={(e) => { e.stopPropagation(); onRemove(); }}
                        style={{
                            position: 'absolute', top: '7px', right: '8px',
                            background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)',
                            color: '#ef4444', borderRadius: '5px', fontSize: '0.6rem',
                            fontWeight: 700, padding: '2px 6px', cursor: 'pointer',
                        }}
                    >✕</button>
                </>
            )}

            <input
                ref={inputRef}
                type="file"
                accept="video/*"
                style={{ display: 'none' }}
                onChange={(e) => onFile(e.target.files[0])}
            />
        </div>
    );
};


/* ── Main component ────────────────────────────────────────────────────────
   Props:
     onDetectionComplete(results) – called when YOLO analysis finishes.
       results = { laneDetails, signalAllocation, laneCounts, totalVehicles }
*/
const VideoUpload = ({ onDetectionComplete }) => {
    const [files, setFiles] = useState({ north: null, south: null, east: null, west: null });
    const [phase, setPhase] = useState('idle');   // idle | uploading | analysing | done | error
    const [uploadProgress, setUploadProgress] = useState(0);
    const [yoloProgress, setYoloProgress] = useState(0);
    const [uploadResults, setUploadResults] = useState([]);
    const [detectionResult, setDetectionResult] = useState(null);
    const [errorMsg, setErrorMsg] = useState(null);
    const allInputRef = useRef(null);

    const setFile = (id, f) => setFiles((p) => ({ ...p, [id]: f }));
    const removeFile = (id) => setFiles((p) => ({ ...p, [id]: null }));

    const uploadedCount = Object.values(files).filter(Boolean).length;
    const canProcess = uploadedCount > 0 && phase === 'idle';

    /* ── Handle Analyse click ──────────────────────────────────────────── */
    const handleProcess = useCallback(async () => {
        setPhase('uploading');
        setErrorMsg(null);
        setUploadResults([]);
        setDetectionResult(null);
        setUploadProgress(0);
        setYoloProgress(0);

        const filesToUpload = LANES.filter((l) => files[l.id]);
        const perFileShare = 100 / filesToUpload.length;
        let cumulative = 0;
        const jobIds = [];
        const results = [];

        try {
            /* ── Step 1: Upload all selected files ─────────────────────── */
            for (const lane of filesToUpload) {
                const file = files[lane.id];
                const result = await uploadVideo(file, (pct) => {
                    setUploadProgress(Math.round(cumulative + pct * perFileShare / 100));
                });
                results.push({ lane: lane.label, ...result });
                jobIds.push(result.jobId);
                cumulative += perFileShare;
                setUploadProgress(Math.round(cumulative));
            }
            setUploadResults(results);

            /* ── Step 2: Poll YOLO analysis progress ───────────────────── */
            setPhase('analysing');

            // For simplicity: wait for ALL jobs sequentially then merge counts.
            // A parallel Promise.all is also fine for multi-lane.
            let mergedLaneDetails = [];
            let mergedSignalAlloc = [];
            let mergedLaneCounts = {};
            let totalVehicles = 0;
            let totalFrames = 0;
            let totalProcessingTime = 0;

            for (let i = 0; i < jobIds.length; i++) {
                const jobId = jobIds[i];
                const laneInfo = filesToUpload[i];

                const res = await pollJobUntilDone(jobId, (pct) => {
                    // Weight progress across jobs
                    const baseProgress = (i / jobIds.length) * 100;
                    setYoloProgress(Math.round(baseProgress + pct / jobIds.length));
                });

                // Merge per-lane data
                if (res.laneDetails?.length) {
                    mergedLaneDetails = [...mergedLaneDetails, ...res.laneDetails];
                }
                if (res.signalAllocation?.length) {
                    mergedSignalAlloc = res.signalAllocation; // use last (most complete)
                }
                if (res.laneCounts) {
                    mergedLaneCounts = { ...mergedLaneCounts, ...res.laneCounts };
                }
                totalVehicles += res.totalVehicles ?? 0;
                totalFrames += res.frameCount ?? 0;
                totalProcessingTime += res.processingTime ?? 0;
            }

            /* If only one video was uploaded for *two* real lanes,
               recompute signal allocation from the merged counts.       */
            const finalResult = {
                laneDetails: mergedLaneDetails,
                signalAllocation: mergedSignalAlloc,
                laneCounts: mergedLaneCounts,
                totalVehicles,
                totalFrames,
                processingTime: Math.round(totalProcessingTime * 10) / 10,
                fromVideo: true,
            };

            setDetectionResult(finalResult);
            setYoloProgress(100);
            setPhase('done');

            // ── Notify parent (App.jsx) ──────────────────────────────────
            if (onDetectionComplete) onDetectionComplete(finalResult);

        } catch (err) {
            setErrorMsg(err.message ?? 'Unknown error');
            setPhase('error');
        }
    }, [files, onDetectionComplete]);

    const handleReset = () => {
        setFiles({ north: null, south: null, east: null, west: null });
        setPhase('idle');
        setUploadProgress(0);
        setYoloProgress(0);
        setUploadResults([]);
        setDetectionResult(null);
        setErrorMsg(null);
    };

    const handleBulkInput = (fileList) => {
        const emptyLanes = LANES.filter((l) => !files[l.id]);
        const newFiles = { ...files };
        Array.from(fileList).slice(0, emptyLanes.length).forEach((f, i) => {
            newFiles[emptyLanes[i].id] = f;
        });
        setFiles(newFiles);
    };

    /* ── Render ────────────────────────────────────────────────────────── */
    return (
        <div className="glass-card animate-fade-in-up" style={{ padding: '24px' }}>

            {/* Header */}
            <div className="section-header">
                <div className="section-header-icon" style={{ background: 'linear-gradient(135deg, #3b82f620, #6366f130)' }}>📹</div>
                <div>
                    <div className="section-title">Camera Feed Upload</div>
                    <div className="section-subtitle">Upload video → YOLOv8 counts vehicles → updates dashboard</div>
                </div>
                <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px', alignItems: 'center' }}>
                    {phase === 'done' && (
                        <div className="status-badge status-green">
                            <span className="pulse-dot" style={{ background: '#10b981' }} />Analysis Complete
                        </div>
                    )}
                    {phase === 'analysing' && (
                        <div className="status-badge status-blue">
                            <span className="pulse-dot" style={{ background: '#3b82f6' }} />Running YOLOv8…
                        </div>
                    )}
                    {phase === 'uploading' && (
                        <div className="status-badge status-blue">
                            <span className="pulse-dot" style={{ background: '#6366f1' }} />Uploading…
                        </div>
                    )}
                    <div style={{ fontSize: '0.72rem', color: '#64748b', background: 'rgba(255,255,255,0.05)', padding: '4px 10px', borderRadius: '7px', border: '1px solid rgba(255,255,255,0.07)' }}>
                        <span style={{ color: uploadedCount > 0 ? '#10b981' : '#64748b', fontWeight: 700 }}>{uploadedCount}</span>/4 feeds loaded
                    </div>
                </div>
            </div>

            {/* Info callout */}
            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', padding: '12px 14px', borderRadius: '10px', background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.18)', marginBottom: '18px' }}>
                <span style={{ fontSize: '1rem', marginTop: '1px' }}>ℹ️</span>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', lineHeight: 1.6 }}>
                    <strong style={{ color: '#93c5fd' }}>How it works:</strong>{' '}
                    Upload 1–4 video feeds. YOLOv8 detects vehicles in each video, splits the frame into 4 lane ROIs,
                    counts vehicles per lane, and updates the <strong style={{ color: '#e2e8f0' }}>Lane Density</strong> and{' '}
                    <strong style={{ color: '#e2e8f0' }}>Signal Allocation</strong> panels with real data.
                    For a 2-lane video, the two active lanes will reflect real counts.
                </div>
            </div>

            {/* 4-Lane Upload Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '18px' }}>
                {LANES.map((lane) => (
                    <LaneUploadSlot
                        key={lane.id}
                        lane={lane}
                        file={files[lane.id]}
                        onFile={(f) => setFile(lane.id, f)}
                        onRemove={() => removeFile(lane.id)}
                    />
                ))}
            </div>

            {/* Intersection diagram */}
            <IntersectionDiagram files={files} />

            {/* ── Upload Progress ── */}
            {(phase === 'uploading') && (
                <ProgressSection
                    label={`Uploading ${uploadedCount} file${uploadedCount > 1 ? 's' : ''} to server…`}
                    pct={uploadProgress}
                    color="linear-gradient(90deg,#6366f1,#3b82f6)"
                />
            )}

            {/* ── YOLO Analysis Progress ── */}
            {(phase === 'analysing' || phase === 'done') && (
                <ProgressSection
                    label={
                        phase === 'done'
                            ? `✅ YOLOv8 analysis complete — ${detectionResult?.totalVehicles ?? 0} vehicles detected`
                            : `🧠 YOLOv8 analysing frames… (this may take 30–120s for a 45 MB video)`
                    }
                    pct={yoloProgress}
                    color={phase === 'done' ? 'linear-gradient(90deg,#10b981,#34d399)' : 'linear-gradient(90deg,#3b82f6,#6366f1)'}
                />
            )}

            {/* ── Error ── */}
            {phase === 'error' && errorMsg && (
                <div style={{ padding: '10px 14px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '10px', margin: '12px 0', fontSize: '0.78rem', color: '#fca5a5' }}>
                    ⚠️ {errorMsg}
                </div>
            )}

            {/* ── Detection Results Summary ── */}
            {phase === 'done' && detectionResult && (
                <DetectionSummary result={detectionResult} uploadResults={uploadResults} />
            )}

            {/* ── Action Buttons ── */}
            <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                {phase === 'idle' && (
                    <>
                        <button
                            className="btn-primary"
                            onClick={handleProcess}
                            disabled={!canProcess}
                            style={{ flex: 1, opacity: canProcess ? 1 : 0.4, cursor: canProcess ? 'pointer' : 'not-allowed' }}
                        >
                            <span>🧠</span> Analyse {uploadedCount > 0 ? `${uploadedCount} Feed${uploadedCount > 1 ? 's' : ''}` : 'Feeds'}
                        </button>
                        <button
                            onClick={() => allInputRef.current?.click()}
                            style={{ padding: '10px 18px', background: 'rgba(255,255,255,0.05)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600, whiteSpace: 'nowrap' }}
                        >
                            📤 Bulk Upload
                        </button>
                        <input ref={allInputRef} type="file" accept="video/*" multiple style={{ display: 'none' }} onChange={(e) => handleBulkInput(e.target.files)} />
                    </>
                )}
                {(phase === 'done' || phase === 'error') && (
                    <button
                        onClick={handleReset}
                        style={{ flex: 1, padding: '10px 20px', background: 'rgba(255,255,255,0.05)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600 }}
                    >
                        🔄 Reset & Upload New Video
                    </button>
                )}
                {(phase === 'uploading' || phase === 'analysing') && (
                    <div style={{ flex: 1, padding: '10px 20px', background: 'rgba(255,255,255,0.03)', color: '#475569', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', textAlign: 'center', fontSize: '0.82rem' }}>
                        ⏳ Please wait — processing in background…
                    </div>
                )}
            </div>
        </div>
    );
};


/* ── Helper sub-components ─────────────────────────────────────────────── */

const ProgressSection = ({ label, pct, color }) => (
    <div style={{ margin: '16px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>{label}</span>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#3b82f6' }}>{Math.min(100, Math.round(pct))}%</span>
        </div>
        <div className="progress-bar-track">
            <div className="progress-bar-fill" style={{ width: `${Math.min(100, pct)}%`, background: color, transition: 'width 0.4s ease' }} />
        </div>
    </div>
);

const DetectionSummary = ({ result, uploadResults }) => {
    const { laneDetails = [], totalVehicles, processingTime, totalFrames } = result;

    const LANE_COLORS = {
        'North Lane': '#3b82f6',
        'South Lane': '#10b981',
        'East Lane': '#ef4444',
        'West Lane': '#f59e0b',
    };

    return (
        <div style={{ margin: '12px 0', padding: '16px', background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: '12px' }}>
            <div style={{ fontSize: '0.7rem', color: '#10b981', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px' }}>
                ✅ YOLOv8 Detection Results
            </div>

            {/* Per-lane counts */}
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(laneDetails.length, 4)}, 1fr)`, gap: '8px', marginBottom: '12px' }}>
                {laneDetails.map((lane) => {
                    const colour = LANE_COLORS[lane.name] ?? '#64748b';
                    return (
                        <div key={lane.name} style={{ padding: '10px', background: `${colour}11`, border: `1px solid ${colour}30`, borderRadius: '10px', textAlign: 'center' }}>
                            <div style={{ fontSize: '1.3rem', fontWeight: 800, color: colour }}>{lane.vehicleCount}</div>
                            <div style={{ fontSize: '0.65rem', color: '#94a3b8', marginTop: '2px' }}>{lane.name}</div>
                            <div style={{ fontSize: '0.6rem', color: '#475569', marginTop: '2px' }}>{lane.density}% density</div>
                        </div>
                    );
                })}
            </div>

            {/* Summary stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                {[
                    { label: 'Total Vehicles', value: totalVehicles ?? '—' },
                    { label: 'Frames Analysed', value: totalFrames ?? '—' },
                    { label: 'Processing Time', value: processingTime ? `${processingTime}s` : '—' },
                ].map((item) => (
                    <div key={item.label} style={{ padding: '10px', background: 'rgba(16,185,129,0.04)', border: '1px solid rgba(16,185,129,0.1)', borderRadius: '10px', textAlign: 'center' }}>
                        <div style={{ fontSize: '1rem', fontWeight: 800, color: '#10b981' }}>{item.value}</div>
                        <div style={{ fontSize: '0.65rem', color: '#64748b', marginTop: '2px' }}>{item.label}</div>
                    </div>
                ))}
            </div>

            <div style={{ marginTop: '10px', fontSize: '0.68rem', color: '#475569' }}>
                📊 Lane Density Monitor and Signal Allocation Panel have been updated with these real counts.
            </div>
        </div>
    );
};

const IntersectionDiagram = ({ files }) => {
    const loaded = (id) => !!files[id];
    const laneMap = Object.fromEntries(LANES.map((l) => [l.id, l]));
    const cellStyle = (id) => ({
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '5px 10px', borderRadius: '6px', fontSize: '0.65rem', fontWeight: 700,
        background: loaded(id) ? laneMap[id].bg : 'rgba(255,255,255,0.03)',
        border: `1px solid ${loaded(id) ? laneMap[id].border : 'rgba(255,255,255,0.07)'}`,
        color: loaded(id) ? laneMap[id].color : '#475569',
        gap: '4px', whiteSpace: 'nowrap', transition: 'all 0.3s',
    });

    return (
        <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '0.65rem', color: '#475569', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Intersection View</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gridTemplateRows: 'auto auto auto', gap: '6px', alignItems: 'center' }}>
                <div />
                <div style={cellStyle('north')}>{loaded('north') ? '🎥' : '📷'} {laneMap.north.label}</div>
                <div />

                <div style={cellStyle('west')}>{loaded('west') ? '🎥' : '📷'} {laneMap.west.label}</div>
                <div style={{ width: '60px', height: '60px', borderRadius: '8px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem' }}>🚦</div>
                <div style={cellStyle('east')}>{loaded('east') ? '🎥' : '📷'} {laneMap.east.label}</div>

                <div />
                <div style={cellStyle('south')}>{loaded('south') ? '🎥' : '📷'} {laneMap.south.label}</div>
                <div />
            </div>
        </div>
    );
};

export default VideoUpload;
