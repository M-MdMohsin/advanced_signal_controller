import React, { useState, useEffect, useRef, useCallback } from 'react';
import { triggerAutoDetect, getVideoStatus } from '../api/index.js';
import { signalAllocationData } from '../data/dummyData';

// ── Config ─────────────────────────────────────────────────────────────────────
const DIRECTIONS = ['North', 'South', 'East', 'West'];

const PHASE_CFG = {
  GREEN:  { color: '#10b981', glow: 'rgba(16,185,129,0.45)',  bg: 'rgba(16,185,129,0.08)',  border: 'rgba(16,185,129,0.28)',  dot: '#10b981', label: 'Green'  },
  YELLOW: { color: '#f59e0b', glow: 'rgba(245,158,11,0.45)',  bg: 'rgba(245,158,11,0.08)',  border: 'rgba(245,158,11,0.28)',  dot: '#f59e0b', label: 'Yellow' },
  RED:    { color: '#ef4444', glow: 'rgba(239,68,68,0.45)',   bg: 'rgba(239,68,68,0.08)',   border: 'rgba(239,68,68,0.28)',   dot: '#ef4444', label: 'Red'    },
};

const DENSITY_CFG = {
  High:   { color: '#ef4444', bg: 'rgba(239,68,68,0.12)'   },
  Medium: { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)'  },
  Low:    { color: '#10b981', bg: 'rgba(16,185,129,0.12)'  },
};

// Yellow phase duration in seconds (shown just before RED)
const YELLOW_SECS = 3;

// Map vehicle-count → density label
const countToDensity = (count) => {
  if (count == null) return 'Medium';
  if (count >= 15) return 'High';
  if (count >= 7)  return 'Medium';
  return 'Low';
};

// ── Realistic 3-bulb traffic light SVG ────────────────────────────────────────
const MiniLight = ({ phase }) => {
  const isGreen  = phase === 'GREEN';
  const isYellow = phase === 'YELLOW';
  const isRed    = phase === 'RED';
  return (
    <svg width="28" height="68" viewBox="0 0 28 68">
      <rect x="2" y="2" width="24" height="64" rx="8" fill="#111827" stroke="rgba(255,255,255,0.07)" strokeWidth="1" />
      {/* Red bulb */}
      <circle cx="14" cy="15" r="7" fill={isRed    ? '#ef4444' : '#1a1a2e'}
        style={{ filter: isRed    ? 'drop-shadow(0 0 6px #ef4444)' : 'none',
                 transition: 'fill 0.3s ease, filter 0.3s ease' }} />
      {/* Yellow bulb */}
      <circle cx="14" cy="34" r="7" fill={isYellow ? '#f59e0b' : '#1a1a2e'}
        style={{ filter: isYellow ? 'drop-shadow(0 0 6px #f59e0b)' : 'none',
                 transition: 'fill 0.3s ease, filter 0.3s ease' }} />
      {/* Green bulb */}
      <circle cx="14" cy="53" r="7" fill={isGreen  ? '#10b981' : '#1a1a2e'}
        style={{ filter: isGreen  ? 'drop-shadow(0 0 8px #10b981)' : 'none',
                 transition: 'fill 0.3s ease, filter 0.3s ease' }} />
    </svg>
  );
};

// ── Single direction card ───────────────────────────────────────────────────────
const SignalCard = ({ direction, phase, timer, density, vehicleCount }) => {
  const ph = PHASE_CFG[phase]  ?? PHASE_CFG.RED;
  const dn = DENSITY_CFG[density] ?? DENSITY_CFG.Medium;

  const dirIcons = { North: '↑', South: '↓', East: '→', West: '←' };

  // Pulse animation on yellow
  const yellowPulse = phase === 'YELLOW'
    ? { animation: 'yellowBlink 0.6s ease-in-out infinite' }
    : {};

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', gap: '14px',
      padding: '20px',
      background: ph.bg,
      border: `1px solid ${ph.border}`,
      borderRadius: '16px',
      transition: 'all 0.4s ease',
      boxShadow: `0 0 0 1px ${ph.border}, 0 4px 20px rgba(0,0,0,0.3)`,
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* glow accent top-right */}
      <div style={{
        position: 'absolute', top: -30, right: -30,
        width: 80, height: 80,
        background: `radial-gradient(circle, ${ph.glow} 0%, transparent 70%)`,
        borderRadius: '50%', pointerEvents: 'none',
        ...yellowPulse,
      }} />

      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{
            width: 32, height: 32, borderRadius: '8px', background: 'rgba(255,255,255,0.05)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1rem', fontWeight: 700, color: '#94a3b8',
          }}>
            {dirIcons[direction]}
          </span>
          <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#e2e8f0' }}>
            {direction}
          </span>
        </div>

        {/* Phase badge */}
        <span style={{
          padding: '3px 10px', borderRadius: '999px',
          fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.08em',
          background: ph.bg, color: ph.color,
          border: `1px solid ${ph.border}`,
          textTransform: 'uppercase',
          transition: 'all 0.3s ease',
        }}>
          {ph.label}
        </span>
      </div>

      {/* Light + timer row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <MiniLight phase={phase} />

        <div style={{ flex: 1 }}>
          {/* Timer */}
          <div style={{
            fontSize: '2.4rem', fontWeight: 900, lineHeight: 1,
            color: ph.color,
            fontVariantNumeric: 'tabular-nums',
            textShadow: `0 0 20px ${ph.glow}`,
            transition: 'color 0.3s ease',
          }}>
            {String(timer).padStart(2, '0')}
            <span style={{ fontSize: '1rem', fontWeight: 500, color: '#64748b', marginLeft: '4px' }}>s</span>
          </div>
          <div style={{ fontSize: '0.68rem', color: '#475569', marginTop: '4px' }}>
            {phase === 'GREEN'
              ? 'Time remaining'
              : phase === 'YELLOW'
                ? '⚠️ Clearing — Stop now'
                : 'Wait time'}
          </div>
        </div>
      </div>

      {/* Density + vehicle count */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{
          padding: '3px 12px', borderRadius: '999px',
          fontSize: '0.72rem', fontWeight: 700,
          background: dn.bg, color: dn.color,
        }}>
          {density} Density
        </span>
        {vehicleCount != null && (
          <span style={{ fontSize: '0.72rem', color: '#475569', fontWeight: 600 }}>
            🚗 {vehicleCount} vehicles
          </span>
        )}
      </div>
    </div>
  );
};

// ── Main component ─────────────────────────────────────────────────────────────
const IntersectionSignals = ({ liveData, fromVideo, onNewDetectionResult }) => {
  const [signals, setSignals] = useState([]);
  const prevDataRef     = useRef(null);  // track last JSON to avoid restarting on unchanged polls
  const bgJobIdRef      = useRef(null);  // background job currently being polled
  const bgPollRef       = useRef(null);  // setInterval handle for background poll
  const prevGreenDirRef = useRef(null);  // direction that was green last tick
  const [bgState, setBgState] = useState('idle'); // 'idle' | 'processing' | 'ready'

  // ── Stop background poll ───────────────────────────────────────────────────
  const stopBgPoll = useCallback(() => {
    if (bgPollRef.current) { clearInterval(bgPollRef.current); bgPollRef.current = null; }
  }, []);

  // ── Fire background auto-detect (silent, no UI block) ─────────────────────
  const triggerBgDetect = useCallback(async () => {
    if (bgJobIdRef.current) return; // already processing
    try {
      setBgState('processing');
      const res = await triggerAutoDetect();
      if (!res.success) { setBgState('idle'); return; }
      bgJobIdRef.current = res.jobId;

      bgPollRef.current = setInterval(async () => {
        try {
          const status = await getVideoStatus(bgJobIdRef.current);
          if (status.status === 'completed') {
            stopBgPoll();
            bgJobIdRef.current = null;
            setBgState('ready');
            // Deliver new results to parent (App.jsx) so dashboard updates
            if (status.laneDetails && onNewDetectionResult) {
              onNewDetectionResult({
                laneDetails:      status.laneDetails,
                signalAllocation: status.signal,
                totalVehicles:    status.totalVehicles,
                annotatedImages:  status.annotatedImages,
                laneCounts:       status.laneCounts,
                fromVideo:        true,
              });
            }
          } else if (status.status === 'error') {
            stopBgPoll();
            bgJobIdRef.current = null;
            setBgState('idle');
          }
        } catch { stopBgPoll(); bgJobIdRef.current = null; setBgState('idle'); }
      }, 1200);
    } catch { setBgState('idle'); }
  }, [stopBgPoll, onNewDetectionResult]);

  // Cleanup on unmount
  useEffect(() => () => stopBgPoll(), [stopBgPoll]);

  // ── Trigger detection 20s before cycle finishes ────────────────────────────
  useEffect(() => {
    if (fromVideo && signals.length > 0) {
      // signals[0] is typically North. The iteration ends when North turns green.
      // So when North's RED timer is exactly 20, there are 20s left in the entire iteration.
      if (signals[0].phase === 'RED' && signals[0].timer === 20) {
        triggerBgDetect();
      }
    }
  }, [signals, triggerBgDetect]);

  // 1. Build initial 4-direction signals — only reset when content actually changes
  useEffect(() => {
    const incoming = JSON.stringify(liveData);
    if (incoming === prevDataRef.current) return;
    prevDataRef.current = incoming;

    const src = (liveData && liveData.length > 0) ? liveData : signalAllocationData;
    const data = JSON.parse(JSON.stringify(src));

    setSignals(prev => {
      if (prev && prev.length > 0) {
        // If we already have signals running, preserve their sequence (phase and exact timer).
        // Only update greenTime, count, and density so the transition is seamless.
        return prev.map((oldSig, i) => {
          const raw = data.find(d => (d.lane || d.direction || '').includes(oldSig.direction)) || data[i % data.length];
          return {
            ...oldSig,
            greenTime:    Math.floor(raw.greenTime ?? 30),
            vehicleCount: raw.vehicleCount ?? null,
            density:      countToDensity(raw.vehicleCount)
          };
        });
      }

      // Startup initialization (first time)
      const mapped = DIRECTIONS.map((dir, i) => {
        const raw = data.find(d => (d.lane || d.direction || '').includes(dir)) || data[i % data.length];
        
        let basePhase = i === 0 ? 'GREEN' : 'RED';
        
        return {
          direction:    dir,
          phase:        basePhase,
          timer:        Math.floor(raw.greenTime ?? 30),
          greenTime:    Math.floor(raw.greenTime ?? 30),
          vehicleCount: raw.vehicleCount ?? null,
          density:      countToDensity(raw.vehicleCount),
          yellowPending: false,
        };
      });

      const gIdx = 0;
      let wait = mapped[gIdx].timer;
      for (let i = 1; i < mapped.length; i++) {
        const ri = (gIdx + i) % mapped.length;
        mapped[ri].timer = wait;
        wait += mapped[ri].greenTime;
      }
      return mapped;
    });

    setBgState('idle');
  }, [liveData]);

  // 2. Countdown + Yellow-phase transition
  useEffect(() => {
    if (signals.length === 0) return;

    const interval = setInterval(() => {
      setSignals(prev => {
        if (prev.length === 0) return prev;
        const next = prev.map(s => ({ ...s }));

        let greenIdx  = next.findIndex(s => s.phase === 'GREEN');
        let yellowIdx = next.findIndex(s => s.phase === 'YELLOW');

        if (yellowIdx !== -1) {
          next[yellowIdx].timer = Math.max(0, next[yellowIdx].timer - 1);

          if (next[yellowIdx].timer === 0) {
            next[yellowIdx].phase        = 'RED';
            next[yellowIdx].yellowPending = false;
            const nextGreenIdx           = (yellowIdx + 1) % next.length;
            next[nextGreenIdx].phase     = 'GREEN';
            next[nextGreenIdx].timer     = Math.max(1, next[nextGreenIdx].greenTime ?? 30);
            greenIdx                     = nextGreenIdx;
            yellowIdx                    = -1;
          }
        } else {
          if (greenIdx === -1) {
            greenIdx = 0;
            next[0].phase = 'GREEN';
          }

          next[greenIdx].timer = Math.max(0, next[greenIdx].timer - 1);

          if (next[greenIdx].timer === 0) {
            next[greenIdx].phase = 'RED';
            const nextGI = (greenIdx + 1) % next.length;
            next[nextGI].phase   = 'GREEN';
            next[nextGI].timer   = Math.max(1, next[nextGI].greenTime ?? 30);
            greenIdx             = nextGI;
          } else if (next[greenIdx].timer <= YELLOW_SECS) {
            next[greenIdx].phase = 'YELLOW';
            yellowIdx            = greenIdx;
            greenIdx             = -1;
          }
        }

        if (greenIdx !== -1) {
            const newGreenDir = next[greenIdx]?.direction;
            const lastGreenDir = prevGreenDirRef.current;
            if (newGreenDir !== lastGreenDir) {
                if (newGreenDir === 'North') {
                    setBgState(s => s === 'ready' ? 'idle' : s);
                }
                prevGreenDirRef.current = newGreenDir;
            }
        }

        // Cascade wait times for RED signals
        const activeIdx = greenIdx !== -1 ? greenIdx : yellowIdx;
        if (activeIdx !== -1) {
          let wait = next[activeIdx].timer;
          for (let i = 1; i < next.length; i++) {
            const ri = (activeIdx + i) % next.length;
            if (next[ri].phase === 'RED') {
              next[ri].timer = wait;
              wait += (next[ri].greenTime ?? 30);
            }
          }
        }

        return next;
       });
    }, 1000);

    return () => clearInterval(interval);
  }, [signals.length]);

  return (
    <div className="glass-card animate-fade-in-up" style={{ padding: '24px' }}>
      {/* Header */}
      <div className="section-header">
        <div className="section-header-icon" style={{ background: 'linear-gradient(135deg, #10b98120, #3b82f630)' }}>
          🚦
        </div>
        <div>
          <div className="section-title">Intersection Signals</div>
          <div className="section-subtitle">
            {fromVideo
              ? '⚡ Green-times computed from YOLOv8 video analysis'
              : 'Live N / S / E / W — Green → Yellow → Red cycle'}
          </div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Background detection status badge */}
          {bgState === 'processing' && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '5px',
              padding: '4px 10px', borderRadius: '999px',
              background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)',
              fontSize: '0.65rem', fontWeight: 700, color: '#f59e0b',
              animation: 'bgPulse 1.5s ease-in-out infinite',
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#f59e0b',
                animation: 'pulse 1s infinite' }} />
              Analysing next cycle…
            </div>
          )}
          {bgState === 'ready' && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '5px',
              padding: '4px 10px', borderRadius: '999px',
              background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)',
              fontSize: '0.65rem', fontWeight: 700, color: '#10b981',
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981' }} />
              New data applied ✓
            </div>
          )}
          <div className="status-badge status-green">
            <span className="pulse-dot" style={{ background: '#10b981' }} />
            {fromVideo ? 'From Video' : 'Live'}
          </div>
        </div>
      </div>

      {/* Phase legend */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
        {[
          { phase: 'GREEN',  label: 'Go',    color: '#10b981', desc: 'Active — vehicles moving' },
          { phase: 'YELLOW', label: 'Clear', color: '#f59e0b', desc: 'Stopping — last 3 seconds' },
          { phase: 'RED',    label: 'Stop',  color: '#ef4444', desc: 'Waiting for turn' },
        ].map(p => (
          <div key={p.phase} style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '4px 10px', borderRadius: '8px',
            background: `${p.color}12`, border: `1px solid ${p.color}30`,
          }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: p.color,
              boxShadow: `0 0 5px ${p.color}` }} />
            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: p.color }}>{p.label}</span>
            <span style={{ fontSize: '0.65rem', color: '#475569' }}>{p.desc}</span>
          </div>
        ))}
      </div>

      {/* 4 cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '14px',
      }}>
        {signals.map(sig => (
          <SignalCard
            key={sig.direction}
            direction={sig.direction}
            phase={sig.phase}
            timer={sig.timer}
            density={sig.density}
            vehicleCount={sig.vehicleCount}
          />
        ))}
      </div>

      <style>{`
        @keyframes yellowBlink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        @keyframes bgPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
      `}</style>
    </div>
  );
};

export default IntersectionSignals;
