import React, { useState, useRef } from 'react';

const LANES = [
    { id: 'north', label: 'North Lane', icon: '⬆️', color: '#3b82f6', bg: 'rgba(59,130,246,0.08)', border: 'rgba(59,130,246,0.25)', camera: 'CAM-01' },
    { id: 'south', label: 'South Lane', icon: '⬇️', color: '#10b981', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.25)', camera: 'CAM-02' },
    { id: 'east', label: 'East Lane', icon: '➡️', color: '#ef4444', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.25)', camera: 'CAM-03' },
    { id: 'west', label: 'West Lane', icon: '⬅️', color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.25)', camera: 'CAM-04' },
];

// Per-lane upload slot
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

const VideoUpload = () => {
    const [files, setFiles] = useState({ north: null, south: null, east: null, west: null });
    const [processing, setProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [done, setDone] = useState(false);
    const allInputRef = useRef(null);

    const setFile = (laneId, file) => setFiles((prev) => ({ ...prev, [laneId]: file }));
    const removeFile = (laneId) => setFiles((prev) => ({ ...prev, [laneId]: null }));

    const uploadedCount = Object.values(files).filter(Boolean).length;
    const canProcess = uploadedCount > 0;

    const handleProcess = () => {
        setProcessing(true);
        setDone(false);
        setProgress(0);
        const interval = setInterval(() => {
            setProgress((p) => {
                if (p >= 100) { clearInterval(interval); setProcessing(false); setDone(true); return 100; }
                return p + Math.random() * 10;
            });
        }, 180);
    };

    const handleReset = () => {
        setFiles({ north: null, south: null, east: null, west: null });
        setDone(false); setProgress(0); setProcessing(false);
    };

    // Bulk upload – assign files to first empty lanes in order
    const handleBulkInput = (fileList) => {
        const emptyLanes = LANES.filter((l) => !files[l.id]);
        const newFiles = { ...files };
        Array.from(fileList).slice(0, emptyLanes.length).forEach((f, i) => {
            newFiles[emptyLanes[i].id] = f;
        });
        setFiles(newFiles);
    };

    return (
        <div className="glass-card animate-fade-in-up" style={{ padding: '24px' }}>
            {/* ── Header ── */}
            <div className="section-header">
                <div className="section-header-icon" style={{ background: 'linear-gradient(135deg, #3b82f620, #6366f130)' }}>📹</div>
                <div>
                    <div className="section-title">Camera Feed Upload</div>
                    <div className="section-subtitle">One dedicated feed per lane · 4-way intersection</div>
                </div>
                <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px', alignItems: 'center' }}>
                    {done && (
                        <div className="status-badge status-green">
                            <span className="pulse-dot" style={{ background: '#10b981' }} />Analysis Ready
                        </div>
                    )}
                    {processing && (
                        <div className="status-badge status-blue">
                            <span className="pulse-dot" style={{ background: '#3b82f6' }} />Processing…
                        </div>
                    )}
                    <div style={{ fontSize: '0.72rem', color: '#64748b', background: 'rgba(255,255,255,0.05)', padding: '4px 10px', borderRadius: '7px', border: '1px solid rgba(255,255,255,0.07)' }}>
                        <span style={{ color: uploadedCount > 0 ? '#10b981' : '#64748b', fontWeight: 700 }}>{uploadedCount}</span>/4 feeds loaded
                    </div>
                </div>
            </div>

            {/* ── How it works callout ── */}
            <div style={{
                display: 'flex', gap: '10px', alignItems: 'flex-start',
                padding: '12px 14px', borderRadius: '10px',
                background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.18)',
                marginBottom: '18px',
            }}>
                <span style={{ fontSize: '1rem', marginTop: '1px' }}>ℹ️</span>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', lineHeight: 1.6 }}>
                    <strong style={{ color: '#93c5fd' }}>How it works:</strong>{' '}
                    Each lane has its <strong style={{ color: '#e2e8f0' }}>own dedicated camera</strong> mounted at the intersection.
                    Upload footage from each camera separately. The AI model analyses all feeds{' '}
                    <strong style={{ color: '#e2e8f0' }}>simultaneously</strong> to compute per-lane vehicle density and optimise signal timing.
                    You can upload feed for <strong style={{ color: '#e2e8f0' }}>one or all four lanes</strong> — unloaded lanes will use live camera data.
                </div>
            </div>

            {/* ── 4-Lane Grid ── */}
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

            {/* ── Intersection diagram ── */}
            <IntersectionDiagram files={files} />

            {/* ── Progress Bar ── */}
            {(processing || done) && (
                <div style={{ margin: '16px 0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                            {done ? `Analysed ${uploadedCount} camera feed${uploadedCount > 1 ? 's' : ''}` : `Analysing ${uploadedCount} feed${uploadedCount > 1 ? 's' : ''} in parallel…`}
                        </span>
                        <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#3b82f6' }}>{Math.min(100, Math.round(progress))}%</span>
                    </div>
                    <div className="progress-bar-track">
                        <div className="progress-bar-fill" style={{ width: `${Math.min(100, progress)}%`, background: done ? 'linear-gradient(90deg, #10b981, #34d399)' : 'linear-gradient(90deg, #3b82f6, #6366f1)' }} />
                    </div>
                </div>
            )}

            {/* ── Results ── */}
            {done && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', margin: '12px 0' }}>
                    {[
                        { label: 'Vehicles Detected', value: `${uploadedCount * 46}` },
                        { label: 'Feeds Processed', value: `${uploadedCount}/4` },
                        { label: 'Violations Found', value: `${uploadedCount * 2}` },
                    ].map((item) => (
                        <div key={item.label} style={{ padding: '12px', background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: '10px', textAlign: 'center' }}>
                            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#10b981' }}>{item.value}</div>
                            <div style={{ fontSize: '0.68rem', color: '#64748b', marginTop: '2px' }}>{item.label}</div>
                        </div>
                    ))}
                </div>
            )}

            {/* ── Action Buttons ── */}
            <div style={{ display: 'flex', gap: '10px' }}>
                {!processing && !done && (
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
                            title="Upload all feeds at once"
                        >
                            📤 Bulk Upload
                        </button>
                        <input
                            ref={allInputRef}
                            type="file"
                            accept="video/*"
                            multiple
                            style={{ display: 'none' }}
                            onChange={(e) => handleBulkInput(e.target.files)}
                        />
                    </>
                )}
                {(done || processing) && (
                    <button
                        onClick={handleReset}
                        style={{ flex: 1, padding: '10px 20px', background: 'rgba(255,255,255,0.05)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600 }}
                    >
                        🔄 Reset All Feeds
                    </button>
                )}
            </div>
        </div>
    );
};

// Mini intersection visual showing which cams are loaded
const IntersectionDiagram = ({ files }) => {
    const loaded = (id) => !!files[id];
    const cellStyle = (id, lane) => ({
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '5px 10px',
        borderRadius: '6px',
        fontSize: '0.65rem',
        fontWeight: 700,
        background: loaded(id) ? lane.bg : 'rgba(255,255,255,0.03)',
        border: `1px solid ${loaded(id) ? lane.border : 'rgba(255,255,255,0.07)'}`,
        color: loaded(id) ? lane.color : '#475569',
        gap: '4px',
        whiteSpace: 'nowrap',
        transition: 'all 0.3s',
    });
    const laneMap = Object.fromEntries(LANES.map((l) => [l.id, l]));

    return (
        <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '0.65rem', color: '#475569', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Intersection View</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gridTemplateRows: 'auto auto auto', gap: '6px', alignItems: 'center' }}>
                {/* Top - North */}
                <div />
                <div style={cellStyle('north', laneMap.north)}>
                    {loaded('north') ? '🎥' : '📷'} {laneMap.north.label}
                </div>
                <div />

                {/* Middle row: West | Center | East */}
                <div style={cellStyle('west', laneMap.west)}>
                    {loaded('west') ? '🎥' : '📷'} {laneMap.west.label}
                </div>
                <div style={{
                    width: '60px', height: '60px', borderRadius: '8px',
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1.4rem',
                }}>
                    🚦
                </div>
                <div style={cellStyle('east', laneMap.east)}>
                    {loaded('east') ? '🎥' : '📷'} {laneMap.east.label}
                </div>

                {/* Bottom - South */}
                <div />
                <div style={cellStyle('south', laneMap.south)}>
                    {loaded('south') ? '🎥' : '📷'} {laneMap.south.label}
                </div>
                <div />
            </div>
        </div>
    );
};

export default VideoUpload;
