import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

// ── 3-bulb SVG traffic light ─────────────────────────────────────────────────
const TrafficLight = ({ phase = 'green', scale = 1, style = {} }) => {
  const colors = {
    red:    { r: '#ef4444', y: '#1a1a2e', g: '#1a1a2e', rGlow: 'drop-shadow(0 0 10px #ef4444)' },
    yellow: { r: '#1a1a2e', y: '#f59e0b', g: '#1a1a2e', yGlow: 'drop-shadow(0 0 10px #f59e0b)' },
    green:  { r: '#1a1a2e', y: '#1a1a2e', g: '#10b981', gGlow: 'drop-shadow(0 0 12px #10b981)' },
  };
  const c = colors[phase] ?? colors.green;
  const w = Math.round(52 * scale);
  const h = Math.round(130 * scale);

  return (
    <svg width={w} height={h} viewBox="0 0 52 130" style={style}>
      {/* Housing */}
      <rect x="3" y="3" width="46" height="124" rx="14"
        fill="#0f172a" stroke="rgba(255,255,255,0.07)" strokeWidth="1.5" />
      {/* Screws */}
      <circle cx="10" cy="10" r="2.5" fill="rgba(255,255,255,0.06)" />
      <circle cx="42" cy="10" r="2.5" fill="rgba(255,255,255,0.06)" />
      <circle cx="10" cy="120" r="2.5" fill="rgba(255,255,255,0.06)" />
      <circle cx="42" cy="120" r="2.5" fill="rgba(255,255,255,0.06)" />
      {/* Red bulb */}
      <circle cx="26" cy="30" r="14" fill={c.r}
        style={{ filter: c.r !== '#1a1a2e' ? c.rGlow : 'none', transition: 'fill 0.3s, filter 0.3s' }} />
      {/* Yellow bulb */}
      <circle cx="26" cy="65" r="14" fill={c.y}
        style={{ filter: c.y !== '#1a1a2e' ? c.yGlow : 'none', transition: 'fill 0.3s, filter 0.3s' }} />
      {/* Green bulb */}
      <circle cx="26" cy="100" r="14" fill={c.g}
        style={{ filter: c.g !== '#1a1a2e' ? c.gGlow : 'none', transition: 'fill 0.3s, filter 0.3s' }} />
      {/* Pole */}
      <rect x="23" y="124" width="6" height="6" rx="1" fill="#0f172a" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
    </svg>
  );
};

// ── Cycling hook for the hero lights ─────────────────────────────────────────
const CYCLE = [
  { phase: 'green',  dur: 3200 },
  { phase: 'yellow', dur: 1200 },
  { phase: 'red',    dur: 2600 },
];

const useCyclingPhase = (offset = 0) => {
  const [idx, setIdx] = useState(offset % CYCLE.length);
  const ref = useRef(offset % CYCLE.length);

  useEffect(() => {
    const tick = () => {
      ref.current = (ref.current + 1) % CYCLE.length;
      setIdx(ref.current);
    };
    const t = setTimeout(tick, CYCLE[ref.current].dur);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx]);

  return CYCLE[idx].phase;
};

// ── Feature pill ─────────────────────────────────────────────────────────────
const FeaturePill = ({ icon, label }) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: '7px',
    padding: '7px 16px',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '999px',
    fontSize: '0.8rem', fontWeight: 500, color: '#94a3b8',
    transition: 'all 0.2s',
    cursor: 'default',
  }}
  onMouseEnter={e => {
    e.currentTarget.style.background = 'rgba(59,130,246,0.1)';
    e.currentTarget.style.borderColor = 'rgba(59,130,246,0.3)';
    e.currentTarget.style.color = '#e2e8f0';
  }}
  onMouseLeave={e => {
    e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
    e.currentTarget.style.color = '#94a3b8';
  }}
  >
    <span>{icon}</span>
    <span>{label}</span>
  </div>
);

// ── Signal demo card (shows one named phase) ──────────────────────────────────
const SignalDemoCard = ({ name, phase, desc, accentColor, delay }) => {
  const cfg = {
    green:  { color: '#10b981', bg: 'rgba(16,185,129,0.08)',  border: 'rgba(16,185,129,0.25)', badge: 'GO' },
    yellow: { color: '#f59e0b', bg: 'rgba(245,158,11,0.08)',  border: 'rgba(245,158,11,0.25)', badge: 'CLEAR' },
    red:    { color: '#ef4444', bg: 'rgba(239,68,68,0.08)',   border: 'rgba(239,68,68,0.25)',  badge: 'STOP' },
  }[phase];

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px',
      padding: '24px 20px',
      background: cfg.bg,
      border: `1px solid ${cfg.border}`,
      borderRadius: '18px',
      animation: `fadeInUp 0.6s ease ${delay}s both`,
      textAlign: 'center',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Glow orb */}
      <div style={{
        position: 'absolute', top: -20, right: -20, width: 80, height: 80,
        background: `radial-gradient(circle, ${cfg.color}30 0%, transparent 70%)`,
        borderRadius: '50%', pointerEvents: 'none',
      }} />

      <TrafficLight phase={phase} scale={0.75} />

      <div style={{
        padding: '3px 12px', borderRadius: '999px',
        background: cfg.bg, color: cfg.color,
        border: `1px solid ${cfg.border}`,
        fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.1em',
      }}>
        {cfg.badge}
      </div>

      <div>
        <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#e2e8f0', marginBottom: '4px' }}>
          {name}
        </div>
        <div style={{ fontSize: '0.72rem', color: '#64748b', lineHeight: 1.5, maxWidth: '120px' }}>
          {desc}
        </div>
      </div>
    </div>
  );
};

// ── Stat card ─────────────────────────────────────────────────────────────────
const StatCard = ({ value, label, icon, color, delay }) => (
  <div style={{
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px',
    padding: '20px',
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: '16px',
    animation: `fadeInUp 0.6s ease ${delay}s both`,
    transition: 'all 0.2s',
  }}
  onMouseEnter={e => {
    e.currentTarget.style.background = `${color}0a`;
    e.currentTarget.style.borderColor = `${color}30`;
  }}
  onMouseLeave={e => {
    e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)';
  }}
  >
    <div style={{ fontSize: '1.4rem' }}>{icon}</div>
    <div style={{ fontSize: '1.6rem', fontWeight: 900, color, fontVariantNumeric: 'tabular-nums' }}>
      {value}
    </div>
    <div style={{ fontSize: '0.7rem', color: '#475569', fontWeight: 500, textAlign: 'center' }}>
      {label}
    </div>
  </div>
);

// ── Main Home page ─────────────────────────────────────────────────────────────
const Home = () => {
  const navigate = useNavigate();
  const phase    = useCyclingPhase(0);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--color-bg-primary)',
      display: 'flex', flexDirection: 'column',
      position: 'relative', overflow: 'hidden',
      fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
    }}>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />

      {/* ── Background decorations ── */}
      <div style={{ position: 'absolute', top: '-20%', left: '-10%', width: '700px', height: '700px',
        background: 'radial-gradient(circle, rgba(59,130,246,0.10) 0%, transparent 65%)',
        borderRadius: '50%', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '-10%', right: '-5%', width: '600px', height: '600px',
        background: 'radial-gradient(circle, rgba(99,102,241,0.09) 0%, transparent 65%)',
        borderRadius: '50%', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', inset: 0,
        backgroundImage: 'radial-gradient(rgba(59,130,246,0.05) 1px, transparent 1px)',
        backgroundSize: '32px 32px', pointerEvents: 'none' }} />

      {/* ── Simple top nav ── */}
      <nav style={{
        position: 'relative', zIndex: 10,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '18px 40px',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: 38, height: 38, borderRadius: '10px',
            background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem',
            boxShadow: '0 4px 12px rgba(99,102,241,0.4)',
          }}>🚦</div>
          <span style={{ fontWeight: 800, fontSize: '0.95rem', color: '#e2e8f0' }}>
            ATMS <span style={{ color: '#475569', fontWeight: 400 }}>v2.4</span>
          </span>
        </div>

        <button
          onClick={() => navigate('/dashboard')}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            padding: '9px 22px',
            background: 'rgba(59,130,246,0.1)',
            color: '#3b82f6', border: '1px solid rgba(59,130,246,0.3)',
            borderRadius: '10px', fontSize: '0.82rem', fontWeight: 700,
            cursor: 'pointer', transition: 'all 0.2s',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'rgba(59,130,246,0.2)';
            e.currentTarget.style.color = '#60a5fa';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'rgba(59,130,246,0.1)';
            e.currentTarget.style.color = '#3b82f6';
          }}
        >
          📊 Open Dashboard →
        </button>
      </nav>

      {/* ── Hero section ── */}
      <main style={{
        flex: 1, position: 'relative', zIndex: 1,
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        padding: '60px 24px 40px',
      }}>

        {/* Live badge */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '8px',
          padding: '6px 18px', marginBottom: '28px',
          background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.25)',
          borderRadius: '999px', fontSize: '0.78rem', fontWeight: 600, color: '#3b82f6',
          animation: 'fadeInUp 0.5s ease 0.1s both',
        }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#10b981',
            animation: 'pulse 2s infinite', display: 'inline-block' }} />
          Powered by YOLOv8 · Flask · Real-time AI
        </div>

        {/* Title */}
        <h1 style={{
          margin: 0, marginBottom: '20px',
          fontSize: 'clamp(2rem, 5vw, 3.4rem)',
          fontWeight: 900, lineHeight: 1.1, textAlign: 'center',
          background: 'linear-gradient(135deg, #f1f5f9 0%, #3b82f6 50%, #6366f1 100%)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          letterSpacing: '-0.02em',
          animation: 'fadeInUp 0.5s ease 0.15s both',
        }}>
          AI Traffic Signal<br />Management System
        </h1>

        {/* Subtitle */}
        <p style={{
          margin: 0, marginBottom: '40px',
          fontSize: '1.05rem', lineHeight: 1.75, color: '#94a3b8',
          maxWidth: '520px', textAlign: 'center',
          animation: 'fadeInUp 0.5s ease 0.2s both',
        }}>
          Upload traffic footage and let YOLOv8 analyse vehicle density across
          all four intersection lanes — then watch the AI optimise green-time
          with realistic <strong style={{ color: '#e2e8f0' }}>Green → Yellow → Red</strong> signal cycles.
        </p>

        {/* ── Hero Traffic Lights Row ── */}
        <div style={{
          display: 'flex', alignItems: 'flex-end', gap: '32px',
          marginBottom: '48px',
          animation: 'fadeInUp 0.5s ease 0.25s both',
        }}>
          <TrafficLight
            phase={phase === 'green' ? 'red' : phase === 'yellow' ? 'red' : 'green'}
            scale={0.7}
            style={{ opacity: 0.45 }}
          />
          <TrafficLight phase={phase} scale={1.1} />
          <TrafficLight
            phase={phase === 'green' ? 'red' : 'yellow'}
            scale={0.7}
            style={{ opacity: 0.45 }}
          />
        </div>

        {/* ── CTA Button ── */}
        <button
          id="start-simulation-btn"
          onClick={() => navigate('/dashboard')}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '10px',
            padding: '16px 42px',
            background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
            color: '#fff', border: 'none', borderRadius: '14px',
            fontSize: '1.05rem', fontWeight: 700, cursor: 'pointer',
            boxShadow: '0 8px 30px rgba(99,102,241,0.45)',
            transition: 'all 0.2s ease', letterSpacing: '0.01em',
            animation: 'fadeInUp 0.5s ease 0.3s both',
            marginBottom: '48px',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = 'translateY(-3px)';
            e.currentTarget.style.boxShadow = '0 14px 40px rgba(99,102,241,0.65)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 8px 30px rgba(99,102,241,0.45)';
          }}
        >
          🚦 Start Simulation
          <span style={{ fontSize: '1.1rem' }}>→</span>
        </button>

        {/* ── 3-Signal Visualization Cards ── */}
        <div style={{
          width: '100%', maxWidth: '720px',
          marginBottom: '48px',
          animation: 'fadeInUp 0.6s ease 0.35s both',
        }}>
          <div style={{
            textAlign: 'center', marginBottom: '18px',
            fontSize: '0.78rem', fontWeight: 600, color: '#475569',
            letterSpacing: '0.06em', textTransform: 'uppercase',
          }}>
            Signal Phase Visualization
          </div>
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px',
          }}>
            <SignalDemoCard
              name="Green Phase"
              phase="green"
              desc="Vehicles actively moving through intersection"
              accentColor="#10b981"
              delay={0.4}
            />
            <SignalDemoCard
              name="Yellow Phase"
              phase="yellow"
              desc="Warning — red is imminent, last 3 seconds to clear"
              accentColor="#f59e0b"
              delay={0.48}
            />
            <SignalDemoCard
              name="Red Phase"
              phase="red"
              desc="Stop — waiting for green on another lane"
              accentColor="#ef4444"
              delay={0.56}
            />
          </div>
        </div>

        {/* ── Stats Row ── */}
        <div style={{
          width: '100%', maxWidth: '720px',
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px',
          marginBottom: '40px',
        }}>
          <StatCard value="4"    label="Intersection Lanes" icon="🛣️" color="#3b82f6" delay={0.5} />
          <StatCard value="3"    label="Signal Phases"       icon="🚦" color="#10b981" delay={0.55} />
          <StatCard value="98%"  label="Detection Accuracy"  icon="🤖" color="#6366f1" delay={0.6} />
          <StatCard value="+34%" label="Efficiency Gain"     icon="📈" color="#f59e0b" delay={0.65} />
        </div>

        {/* Feature pills */}
        <div style={{
          display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center',
          animation: 'fadeInUp 0.6s ease 0.7s both',
        }}>
          {[
            { icon: '📹', label: 'Video Upload & Detection' },
            { icon: '📊', label: 'Real-time Analytics'     },
            { icon: '🚨', label: 'Emergency Override'       },
            { icon: '🧠', label: 'YOLOv8 AI Engine'        },
            { icon: '⚡', label: 'Live Signal Sync'         },
          ].map(f => <FeaturePill key={f.label} {...f} />)}
        </div>
      </main>

      {/* ── Footer ── */}
      <footer style={{
        position: 'relative', zIndex: 1,
        textAlign: 'center', padding: '20px',
        fontSize: '0.7rem', color: '#334155', letterSpacing: '0.04em',
        borderTop: '1px solid rgba(255,255,255,0.04)',
      }}>
        ATMS v2.4 · Flask + YOLOv8 · React + Vite
      </footer>

      <style>{`
        @keyframes pulse     { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes fadeInUp  { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
      `}</style>
    </div>
  );
};

export default Home;
