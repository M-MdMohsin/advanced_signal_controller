import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Routes, Route } from 'react-router-dom';

import Home from './pages/Home';
import Header from './components/Header';
import LaneDensityCards from './components/LaneDensityCards';
import SignalAllocation from './components/SignalAllocation';
import IntersectionSignals from './components/IntersectionSignals';
import DensityChart from './components/DensityChart';
import EmergencyVehicle from './components/EmergencyVehicle';
import LicensePlate from './components/LicensePlate';
import ViolationLogs from './components/ViolationLogs';
import { getDashboardSummary, triggerAutoDetect, getVideoStatus } from './api/index.js';

const BACKEND = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace('/api', '')
  : 'http://localhost:5000';

// ── Lane annotated image card ──────────────────────────────────────────────
const LaneImageCard = ({ lane, src, count, stamp }) => {
  const icons = { North: '⬆️', East: '➡️', South: '⬇️', West: '⬅️' };
  return (
    <div style={{
      borderRadius: '12px',
      overflow: 'hidden',
      border: '1px solid rgba(59,130,246,0.25)',
      background: 'rgba(15,23,42,0.8)',
      position: 'relative',
    }}>
      <img
        src={`${BACKEND}${src}?t=${stamp || ''}`}
        alt={`${lane} lane detection`}
        style={{ width: '100%', display: 'block', aspectRatio: '4/3', objectFit: 'cover' }}
        onError={e => { e.target.style.display = 'none'; }}
      />
      {/* overlay label */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        padding: '6px 10px',
        background: 'linear-gradient(transparent, rgba(0,0,0,0.80))',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#e2e8f0' }}>
          {icons[lane]} {lane}
        </span>
        {count != null && (
          <span style={{
            fontSize: '0.65rem', fontWeight: 700,
            padding: '2px 8px', borderRadius: '999px',
            background: 'rgba(59,130,246,0.35)', color: '#93c5fd',
          }}>
            🚗 {count}
          </span>
        )}
      </div>
    </div>
  );
};

// ── Auto-Detect Panel ─────────────────────────────────────────────────────────
const AutoDetectPanel = ({ onDetectionComplete, onRefresh, externalImages, externalCounts }) => {
  const [state, setState] = useState('idle');
  const [progress, setProgress] = useState(0);
  const [info, setInfo] = useState(null);
  const [error, setError] = useState(null);
  const pollRef = useRef(null);

  const stopPolling = () => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
  };

  const handleRun = async () => {
    if (state === 'running') return;
    setState('running');
    setProgress(0);
    setError(null);
    setInfo(null);

    try {
      const res = await triggerAutoDetect();
      if (!res.success) throw new Error(res.error || 'Auto-detect failed');

      setInfo({ lanesQueued: res.lanesQueued, imagesUsed: res.imagesUsed });

      const jobId = res.jobId;
      pollRef.current = setInterval(async () => {
        try {
          const status = await getVideoStatus(jobId);
          setProgress(status.progress ?? 0);

          if (status.status === 'completed') {
            stopPolling();
            setState('done');
            setProgress(100);
            onDetectionComplete?.({
              laneDetails:      status.laneDetails,
              signalAllocation: status.signal,
              totalVehicles:    status.totalVehicles,
              annotatedImages:  status.annotatedImages ?? null,
              laneCounts:       status.laneCounts ?? null,
              fromVideo:        true,
            });
            // immediately refresh dashboard so signal allocation panel gets real data
            onRefresh?.();
          } else if (status.status === 'error') {
            stopPolling();
            setState('error');
            setError(status.error || 'Detection failed.');
          }
        } catch {
          stopPolling();
          setState('error');
          setError('Lost connection while polling.');
        }
      }, 1200);

    } catch (err) {
      setState('error');
      setError(err.message);
    }
  };

  useEffect(() => () => stopPolling(), []);

  const theme = {
    idle:    { accent: '#3b82f6', glow: 'rgba(59,130,246,0.35)',  label: 'Run YOLO Detection',  icon: '🤖' },
    running: { accent: '#f59e0b', glow: 'rgba(245,158,11,0.35)',  label: 'Analysing…',           icon: '⚙️' },
    done:    { accent: '#10b981', glow: 'rgba(16,185,129,0.35)',  label: 'Run Again',            icon: '✅' },
    error:   { accent: '#ef4444', glow: 'rgba(239,68,68,0.35)',   label: 'Retry',                icon: '⚠️' },
  }[state];

  const activeImages = externalImages;
  const activeCounts = externalCounts;
  const hasImages = activeImages && Object.keys(activeImages).length > 0;

  // Use a stable timestamp that updates exactly when the images object changes
  // to bypass generic browser caches holding old prediction images of the same name.
  const [stamp, setStamp] = useState(Date.now());
  useEffect(() => {
    setStamp(Date.now());
  }, [activeImages]);

  return (
    <div style={{
      borderRadius: '18px',
      background: 'rgba(15,23,42,0.7)',
      border: `1px solid ${theme.accent}22`,
      padding: '24px',
      display: 'flex', flexDirection: 'column', gap: '18px',
      backdropFilter: 'blur(12px)',
      boxShadow: `0 8px 32px ${theme.glow}`,
      transition: 'box-shadow 0.4s, border-color 0.4s',
    }}>

      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: 34, height: 34, borderRadius: '10px',
            background: `linear-gradient(135deg, ${theme.accent}, #6366f1)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1rem', boxShadow: `0 4px 12px ${theme.glow}`,
          }}>🤖</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#e2e8f0' }}>
              Auto Image Detection
            </div>
            <div style={{ fontSize: '0.68rem', color: '#475569' }}>
              Reads from <code style={{ color: '#64748b', background: 'rgba(255,255,255,0.05)', padding: '1px 5px', borderRadius: '4px' }}>backend/images/&lt;lane&gt;/</code>
            </div>
          </div>
        </div>
        <div style={{
          padding: '4px 12px', borderRadius: '999px',
          background: `${theme.accent}18`, border: `1px solid ${theme.accent}44`,
          color: theme.accent, fontSize: '0.68rem', fontWeight: 700,
          letterSpacing: '0.06em', textTransform: 'uppercase',
          display: 'flex', alignItems: 'center', gap: '6px',
        }}>
          <span style={{
            width: 6, height: 6, borderRadius: '50%', background: theme.accent,
            animation: state === 'running' ? 'pulse 1s infinite' : 'none',
          }} />
          {state === 'idle' ? 'Ready' : state === 'running' ? 'Processing' : state === 'done' ? 'Done' : 'Error'}
        </div>
      </div>

      {/* ── Annotated Images Grid (shown after detection) ── */}
      {hasImages ? (
        <div>
          <div style={{ fontSize: '0.72rem', fontWeight: 600, color: '#475569', marginBottom: '10px', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            YOLO Detection Results
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {Object.entries(activeImages).map(([lane, url]) => (
              <LaneImageCard
                key={lane}
                lane={lane}
                src={url}
                count={activeCounts?.[lane]}
                stamp={stamp}
              />
            ))}
          </div>
        </div>
      ) : (
        /* Lane indicator pills — shown while idle / running */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '8px' }}>
          {['North', 'East', 'South', 'West'].map(lane => {
            const laneKey = lane.toLowerCase();
            const queued = info?.lanesQueued?.includes(laneKey);
            const used   = info?.imagesUsed?.[laneKey];
            return (
              <div key={lane} style={{
                padding: '10px 6px',
                background: queued ? `${theme.accent}12` : 'rgba(255,255,255,0.02)',
                border: `1px solid ${queued ? theme.accent + '40' : 'rgba(255,255,255,0.06)'}`,
                borderRadius: '10px', textAlign: 'center', transition: 'all 0.3s',
              }}>
                <div style={{ fontSize: '1.2rem', marginBottom: '3px' }}>
                  {{ North: '⬆️', East: '➡️', South: '⬇️', West: '⬅️' }[lane]}
                </div>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: queued ? theme.accent : '#475569' }}>
                  {lane}
                </div>
                {used && (
                  <div style={{ fontSize: '0.58rem', color: '#475569', marginTop: '2px',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={used}>
                    {used}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Progress bar */}
      {state === 'running' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#64748b' }}>
            <span>Running YOLO on lane images…</span>
            <span style={{ fontWeight: 700, color: theme.accent }}>{progress}%</span>
          </div>
          <div style={{ height: 5, borderRadius: 999, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: 999,
              background: `linear-gradient(90deg, ${theme.accent}, #6366f1)`,
              width: `${progress}%`, transition: 'width 0.4s ease',
              boxShadow: `0 0 8px ${theme.glow}`,
            }} />
          </div>
        </div>
      )}

      {/* Error */}
      {state === 'error' && error && (
        <div style={{
          padding: '10px 14px', borderRadius: '10px',
          background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
          fontSize: '0.75rem', color: '#ef4444', lineHeight: 1.5,
        }}>
          ⚠️ {error}
          {error.includes('No images') && (
            <div style={{ marginTop: '5px', color: '#64748b', fontSize: '0.67rem' }}>
              Add images to <code>backend/images/north/</code>, <code>east/</code>, <code>south/</code>, <code>west/</code>
            </div>
          )}
        </div>
      )}

      {/* Success summary (when no annotated images returned) */}
      {state === 'done' && !hasImages && (
        <div style={{
          padding: '10px 14px', borderRadius: '10px',
          background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)',
          fontSize: '0.75rem', color: '#10b981',
        }}>
          ✅ Detection complete for <strong>{info?.lanesQueued?.length ?? 0}</strong> lane(s). Dashboard updated.
        </div>
      )}

      {/* Run button */}
      <button
        id="run-auto-detect-btn"
        onClick={state !== 'running' ? handleRun : undefined}
        disabled={state === 'running'}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
          padding: '13px 24px',
          background: state === 'running'
            ? 'rgba(255,255,255,0.04)'
            : `linear-gradient(135deg, ${theme.accent}, #6366f1)`,
          color: state === 'running' ? '#64748b' : '#fff',
          border: state === 'running' ? '1px solid rgba(255,255,255,0.08)' : 'none',
          borderRadius: '12px',
          fontSize: '0.9rem', fontWeight: 700,
          cursor: state === 'running' ? 'default' : 'pointer',
          boxShadow: state === 'running' ? 'none' : `0 6px 22px ${theme.glow}`,
          transition: 'all 0.25s', letterSpacing: '0.01em',
        }}
        onMouseEnter={e => {
          if (state !== 'running') {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = `0 10px 30px ${theme.glow}`;
          }
        }}
        onMouseLeave={e => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = state !== 'running' ? `0 6px 22px ${theme.glow}` : 'none';
        }}
      >
        <span style={{ display: 'inline-block', animation: state === 'running' ? 'spin 1.2s linear infinite' : 'none' }}>
          {theme.icon}
        </span>
        {theme.label}
      </button>

      {(state === 'done' || state === 'error') && (
        <button
          onClick={() => { setState('idle'); setInfo(null); setError(null); setProgress(0); }}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#475569', fontSize: '0.7rem', textDecoration: 'underline', padding: 0, textAlign: 'center' }}
        >
          Reset
        </button>
      )}
    </div>
  );
};


// ── Top stat bar ──────────────────────────────────────────────────────────────
const TopStatBar = ({ stats, videoStats }) => {
  const defaultStats = [
    { label: 'Total Vehicles Today', value: '—', icon: '🚗', color: '#3b82f6' },
    { label: 'Violations Detected',  value: '—', icon: '⚠️', color: '#ef4444' },
    { label: 'Avg Wait Time',        value: '—', icon: '⏱️', color: '#f59e0b' },
    { label: 'Signal Cycles',        value: '—', icon: '🔄', color: '#10b981' },
    { label: 'Emergency Events',     value: '—', icon: '🚨', color: '#ef4444' },
    { label: 'AI Model Uptime',      value: '—', icon: '🤖', color: '#8b5cf6' },
  ];

  let display = (stats && stats.length) ? [...stats] : [...defaultStats];
  if (videoStats) {
    display = display.map(s =>
      s.label === 'Total Vehicles Today'
        ? { ...s, value: String(videoStats.totalVehicles ?? '—'), icon: '📹' }
        : s
    );
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '12px', marginBottom: '24px' }}>
      {display.map(s => (
        <div key={s.label} className="glass-card" style={{ padding: '16px', textAlign: 'center', borderColor: `${s.color}22` }}>
          <div style={{ fontSize: '1.3rem', marginBottom: '6px' }}>{s.icon}</div>
          <div style={{ fontSize: '1.35rem', fontWeight: 800, color: s.color, fontVariantNumeric: 'tabular-nums', lineHeight: 1.1 }}>{s.value}</div>
          <div style={{ fontSize: '0.65rem', color: '#64748b', marginTop: '4px', lineHeight: 1.3 }}>{s.label}</div>
        </div>
      ))}
    </div>
  );
};

// ── API status badge ──────────────────────────────────────────────────────────
const ApiStatusBadge = ({ status }) => {
  const cfg = {
    connected: { color: '#10b981', label: 'API Connected' },
    error:     { color: '#ef4444', label: 'API Offline — using local data' },
    loading:   { color: '#f59e0b', label: 'Connecting…' },
  }[status] || { color: '#64748b', label: 'Unknown' };

  return (
    <div style={{
      position: 'fixed', bottom: 20, right: 20,
      display: 'flex', alignItems: 'center', gap: '7px',
      padding: '8px 14px', background: 'rgba(15,23,42,0.85)',
      border: `1px solid ${cfg.color}44`, borderRadius: '999px',
      backdropFilter: 'blur(10px)', zIndex: 9999,
      fontSize: '0.72rem', fontWeight: 600, color: cfg.color,
    }}>
      <span style={{
        width: 8, height: 8, borderRadius: '50%', background: cfg.color,
        boxShadow: status === 'connected' ? `0 0 8px ${cfg.color}` : 'none',
        animation: status === 'connected' ? 'pulse 2s infinite' : 'none',
      }} />
      {cfg.label}
    </div>
  );
};

// ── Dashboard ─────────────────────────────────────────────────────────────────
const Dashboard = () => {
  const [activeTab, setActiveTab]     = useState('overview');
  const [apiStatus, setApiStatus]     = useState('loading');
  const [dashData, setDashData]       = useState(null);
  const [detectionData, setDetectionData] = useState(null);

  const tabs = [
    { id: 'overview',   label: '🗺 Overview'  },
    { id: 'analytics',  label: '📊 Analytics' },
    { id: 'emergency',  label: '🚨 Emergency' },
    { id: 'violations', label: '⚠️ Violations'},
  ];

  const fetchDashboard = useCallback(async () => {
    try {
      const data = await getDashboardSummary();
      setDashData(data);
      setApiStatus('connected');
    } catch {
      setApiStatus('error');
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
    const interval = setInterval(fetchDashboard, 15000);
    return () => clearInterval(interval);
  }, [fetchDashboard]);

  const handleDetectionComplete = useCallback((results) => {
    setDetectionData(results);
  }, []);

  // ── Stable signal data ─────────────────────────────────────────────────────
  // Memoised by JSON content so the reference only changes when actual values
  // differ — prevents SignalAllocation / IntersectionSignals from restarting
  // their countdown cycle on every 15-second dashboard poll.
  const rawSignalData    = detectionData?.signalAllocation ?? dashData?.signalAllocation;
  const rawLaneDensity   = detectionData?.laneDetails      ?? dashData?.laneDensity;
  const signalDataKey    = JSON.stringify(rawSignalData);
  const laneDensityKey   = JSON.stringify(rawLaneDensity);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const signalData     = useMemo(() => rawSignalData,  [signalDataKey]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const laneDensityData = useMemo(() => rawLaneDensity, [laneDensityKey]);

  const fromVideo = !!detectionData?.fromVideo;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg-primary)' }}>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />

      <Header />

      <main style={{ maxWidth: '1600px', margin: '0 auto', padding: '28px 24px 48px' }}>

        {/* Active detection banner */}
        {fromVideo && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '12px',
            padding: '12px 18px', marginBottom: '20px',
            background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: '12px',
          }}>
            <span style={{ fontSize: '1.1rem' }}>🤖</span>
            <div style={{ flex: 1 }}>
              <span style={{ fontWeight: 700, color: '#10b981', fontSize: '0.85rem' }}>YOLO Auto-Detection Active</span>
              <span style={{ fontSize: '0.78rem', color: '#64748b', marginLeft: '10px' }}>
                Showing real YOLOv8 results from folder images.
                {detectionData?.totalVehicles != null && ` ${detectionData.totalVehicles} vehicles detected.`}
              </span>
            </div>
            <button
              onClick={() => setDetectionData(null)}
              style={{
                padding: '5px 12px', background: 'rgba(255,255,255,0.05)',
                color: '#64748b', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 600,
              }}
            >Clear &amp; use live feed</button>
          </div>
        )}

        {/* Tab nav */}
        <div style={{ display: 'flex', gap: '4px', marginBottom: '28px', padding: '4px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', width: 'fit-content', border: '1px solid rgba(255,255,255,0.06)' }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '8px 20px', borderRadius: '9px', border: 'none', cursor: 'pointer',
                fontSize: '0.82rem', fontWeight: 700, transition: 'all 0.2s',
                background: activeTab === tab.id ? 'linear-gradient(135deg, #3b82f6, #6366f1)' : 'transparent',
                color: activeTab === tab.id ? '#fff' : '#64748b',
                boxShadow: activeTab === tab.id ? '0 4px 14px rgba(99,102,241,0.45)' : 'none',
              }}
            >{tab.label}</button>
          ))}
        </div>

        {/* Top stats */}
        <TopStatBar stats={dashData?.topStats} videoStats={detectionData} />

        {/* ── OVERVIEW TAB ── */}
        {activeTab === 'overview' && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1.15fr 0.85fr', gap: '20px', marginBottom: '20px' }}>
              <AutoDetectPanel
                onDetectionComplete={handleDetectionComplete}
                onRefresh={fetchDashboard}
                externalImages={detectionData?.annotatedImages}
                externalCounts={detectionData?.laneCounts}
              />
              <SignalAllocation liveData={signalData} fromVideo={fromVideo} />
            </div>
            <div style={{ marginBottom: '20px' }}>
              <IntersectionSignals liveData={signalData} fromVideo={fromVideo} onNewDetectionResult={handleDetectionComplete} />
            </div>
            <div style={{ marginBottom: '20px' }}>
              <LaneDensityCards liveData={laneDensityData} fromVideo={fromVideo} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '20px' }}>
              <DensityChart liveData={dashData?.chartHistory} />
              <EmergencyVehicle liveData={dashData?.emergencyEvents} />
            </div>
          </>
        )}

        {/* ── ANALYTICS TAB ── */}
        {activeTab === 'analytics' && (
          <>
            <div style={{ marginBottom: '20px' }}>
              <IntersectionSignals liveData={signalData} fromVideo={fromVideo} onNewDetectionResult={handleDetectionComplete} />
            </div>
            <div style={{ marginBottom: '20px' }}>
              <LaneDensityCards liveData={laneDensityData} fromVideo={fromVideo} />
            </div>
            <DensityChart liveData={dashData?.chartHistory} />
          </>
        )}

        {/* ── EMERGENCY TAB ── */}
        {activeTab === 'emergency' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <EmergencyVehicle liveData={dashData?.emergencyEvents} />
            <SignalAllocation liveData={signalData} fromVideo={fromVideo} />
          </div>
        )}

        {/* ── VIOLATIONS TAB ── */}
        {activeTab === 'violations' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: '20px' }}>
            <ViolationLogs liveData={dashData?.violationLogs} />
            <LicensePlate liveData={dashData?.detectedPlates} />
          </div>
        )}
      </main>

      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.05)', padding: '20px 24px', textAlign: 'center' }}>
        <p style={{ margin: 0, color: '#334155', fontSize: '0.75rem' }}>
          AI Traffic Signal Management System · ATMS v2.4 · Backend: Flask + YOLOv8 · Formula: GreenTime = MIN + (count/total) × (MAX − MIN)
        </p>
      </footer>

      <ApiStatusBadge status={apiStatus} />

      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        @keyframes spin   { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

// ── Root App ──────────────────────────────────────────────────────────────────
const App = () => (
  <Routes>
    <Route path="/"          element={<Home />} />
    <Route path="/dashboard" element={<Dashboard />} />
  </Routes>
);

export default App;
