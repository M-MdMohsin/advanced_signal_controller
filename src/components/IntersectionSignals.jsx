import React, { useState, useEffect } from 'react';
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
const IntersectionSignals = ({ liveData, fromVideo }) => {
  const [signals, setSignals] = useState([]);

  // 1. Build initial 4-direction signals from data
  useEffect(() => {
    const src = (liveData && liveData.length > 0) ? liveData : signalAllocationData;
    const data = JSON.parse(JSON.stringify(src));

    // Ensure exactly 4 entries, one per direction
    const mapped = DIRECTIONS.map((dir, i) => {
      const raw = data[i % data.length];
      return {
        direction:    dir,
        phase:        i === 0 ? 'GREEN' : 'RED',   // start with North GREEN
        timer:        i === 0 ? (raw.nextChange ?? 30) : (raw.nextChange ?? 30) * (i + 1),
        greenTime:    raw.greenTime ?? 30,
        vehicleCount: raw.vehicleCount ?? null,
        density:      countToDensity(raw.vehicleCount),
        yellowPending: false,     // true when we're doing a yellow flash
      };
    });

    setSignals(mapped);
  }, [liveData]);

  // 2. Countdown + Yellow-phase transition
  useEffect(() => {
    if (signals.length === 0) return;

    const interval = setInterval(() => {
      setSignals(prev => {
        if (prev.length === 0) return prev;
        const next = prev.map(s => ({ ...s }));

        let greenIdx = next.findIndex(s => s.phase === 'GREEN');
        let yellowIdx = next.findIndex(s => s.phase === 'YELLOW');

        // ── Handle YELLOW phase countdown ──────────────────────────────────
        if (yellowIdx !== -1) {
          next[yellowIdx].timer = Math.max(0, next[yellowIdx].timer - 1);

          if (next[yellowIdx].timer === 0) {
            // Yellow expired → go RED, next direction goes GREEN
            next[yellowIdx].phase        = 'RED';
            next[yellowIdx].yellowPending = false;
            const nextGreenIdx           = (yellowIdx + 1) % next.length;
            next[nextGreenIdx].phase     = 'GREEN';
            next[nextGreenIdx].timer     = Math.max(1, next[nextGreenIdx].greenTime ?? 30);
            greenIdx                     = nextGreenIdx;
          }

          // Cascade waits for remaining RED signals
          let wait = (greenIdx !== -1 ? next[greenIdx].timer : 0) + YELLOW_SECS;
          for (let i = 1; i < next.length; i++) {
            const idx = (greenIdx !== -1 ? greenIdx : yellowIdx + 1) + i;
            const ri  = ((idx % next.length) + next.length) % next.length;
            if (next[ri].phase === 'RED') {
              next[ri].timer = wait;
              wait += (next[ri].greenTime ?? 30);
            }
          }

          return next;
        }

        // ── Handle GREEN phase countdown ────────────────────────────────────
        if (greenIdx === -1) {
          greenIdx = 0;
          next[0].phase = 'GREEN';
        }

        next[greenIdx].timer = Math.max(0, next[greenIdx].timer - 1);

        // When GREEN timer hits YELLOW_SECS → switch to YELLOW
        if (next[greenIdx].timer <= YELLOW_SECS && next[greenIdx].timer > 0) {
          next[greenIdx].phase = 'YELLOW';
        } else if (next[greenIdx].timer === 0) {
          // Fallback if yellow was skipped somehow
          next[greenIdx].phase = 'RED';
          const nextGI = (greenIdx + 1) % next.length;
          next[nextGI].phase   = 'GREEN';
          next[nextGI].timer   = Math.max(1, next[nextGI].greenTime ?? 30);
          greenIdx = nextGI;
        }

        // Cascade wait times for RED signals
        const activeIdx = next.findIndex(s => s.phase === 'GREEN') === -1
          ? next.findIndex(s => s.phase === 'YELLOW')
          : next.findIndex(s => s.phase === 'GREEN');

        if (activeIdx !== -1) {
          let wait = next[activeIdx].timer + (next[activeIdx].phase === 'GREEN' ? YELLOW_SECS : 0);
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
        <div className="status-badge status-green" style={{ marginLeft: 'auto' }}>
          <span className="pulse-dot" style={{ background: '#10b981' }} />
          {fromVideo ? 'From Video' : 'Live'}
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
      `}</style>
    </div>
  );
};

export default IntersectionSignals;
