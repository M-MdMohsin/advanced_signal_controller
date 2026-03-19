import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

// Animated traffic-light SVG
const TrafficLight = ({ phase = 'green', style = {} }) => {
  const colors = {
    red:    { r: '#ef4444', y: '#1a1a1a', g: '#1a1a1a' },
    yellow: { r: '#1a1a1a', y: '#f59e0b', g: '#1a1a1a' },
    green:  { r: '#1a1a1a', y: '#1a1a1a', g: '#10b981' },
  };
  const c = colors[phase] ?? colors.green;
  return (
    <svg width="48" height="120" viewBox="0 0 48 120" style={style}>
      <rect x="4" y="4" width="40" height="112" rx="12" fill="#1e293b" stroke="rgba(255,255,255,0.08)" strokeWidth="1.5" />
      <circle cx="24" cy="26" r="13" fill={c.r} style={{ filter: c.r !== '#1a1a1a' ? 'drop-shadow(0 0 8px #ef4444)' : 'none' }} />
      <circle cx="24" cy="60" r="13" fill={c.y} style={{ filter: c.y !== '#1a1a1a' ? 'drop-shadow(0 0 8px #f59e0b)' : 'none' }} />
      <circle cx="24" cy="94" r="13" fill={c.g} style={{ filter: c.g !== '#1a1a1a' ? 'drop-shadow(0 0 10px #10b981)' : 'none' }} />
    </svg>
  );
};

// Cycle the traffic lights
const useCyclingPhase = () => {
  const [phase, setPhase] = React.useState('green');
  const phases = ['green', 'yellow', 'red'];
  const durations = { green: 3000, yellow: 1000, red: 2500 };
  const idx = useRef(0);

  useEffect(() => {
    const next = () => {
      idx.current = (idx.current + 1) % phases.length;
      setPhase(phases[idx.current]);
    };
    const t = setTimeout(next, durations[phase]);
    return () => clearTimeout(t);
  }, [phase]);

  return phase;
};

const Home = () => {
  const navigate = useNavigate();
  const phase = useCyclingPhase();

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--color-bg-primary)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden',
      fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
    }}>
      {/* Google Font */}
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />

      {/* ── Background glow orbs ── */}
      <div style={{
        position: 'absolute', top: '-15%', left: '-10%',
        width: '600px', height: '600px',
        background: 'radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 70%)',
        borderRadius: '50%', pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: '-10%', right: '-5%',
        width: '500px', height: '500px',
        background: 'radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 70%)',
        borderRadius: '50%', pointerEvents: 'none',
      }} />

      {/* ── Animated grid dots background ── */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'radial-gradient(rgba(59,130,246,0.06) 1px, transparent 1px)',
        backgroundSize: '32px 32px',
        pointerEvents: 'none',
      }} />

      {/* ── Main content ── */}
      <div style={{
        position: 'relative', zIndex: 1,
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        gap: '0', textAlign: 'center', padding: '32px 24px',
        maxWidth: '720px', width: '100%',
        animation: 'fadeInUp 0.6s ease both',
      }}>

        {/* Animated traffic lights row */}
        <div style={{ display: 'flex', gap: '24px', marginBottom: '40px', alignItems: 'flex-end' }}>
          <TrafficLight phase={phase === 'green' ? 'red' : phase === 'yellow' ? 'red' : 'green'}
            style={{ opacity: 0.5, transform: 'scale(0.75)' }} />
          <TrafficLight phase={phase} />
          <TrafficLight phase={phase === 'green' ? 'red' : phase === 'yellow' ? 'yellow' : 'red'}
            style={{ opacity: 0.5, transform: 'scale(0.75)' }} />
        </div>

        {/* Badge */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '8px',
          padding: '6px 16px', marginBottom: '24px',
          background: 'rgba(59,130,246,0.1)',
          border: '1px solid rgba(59,130,246,0.25)',
          borderRadius: '999px', fontSize: '0.78rem', fontWeight: 600, color: '#3b82f6',
        }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#10b981', animation: 'pulse 2s infinite', display: 'inline-block' }} />
          Powered by YOLOv8 + Flask AI Backend
        </div>

        {/* Title */}
        <h1 style={{
          margin: 0, marginBottom: '20px',
          fontSize: 'clamp(2rem, 5vw, 3.2rem)',
          fontWeight: 900, lineHeight: 1.1,
          background: 'linear-gradient(135deg, #f1f5f9 0%, #3b82f6 50%, #6366f1 100%)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          letterSpacing: '-0.02em',
        }}>
          AI Traffic Signal<br />Management System
        </h1>

        {/* Description */}
        <p style={{
          margin: 0, marginBottom: '40px',
          fontSize: '1.05rem', lineHeight: 1.75,
          color: '#94a3b8', maxWidth: '520px',
        }}>
          Upload traffic footage and let YOLOv8 analyse vehicle density across
          all four intersection lanes — then watch the AI optimise green-time
          allocation in real time.
        </p>

        {/* CTA Button */}
        <button
          id="start-simulation-btn"
          onClick={() => navigate('/dashboard')}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '10px',
            padding: '16px 40px',
            background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
            color: '#fff', border: 'none', borderRadius: '14px',
            fontSize: '1rem', fontWeight: 700, cursor: 'pointer',
            boxShadow: '0 8px 30px rgba(99,102,241,0.45)',
            transition: 'all 0.2s ease',
            letterSpacing: '0.01em',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = 'translateY(-3px)';
            e.currentTarget.style.boxShadow = '0 14px 40px rgba(99,102,241,0.6)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 8px 30px rgba(99,102,241,0.45)';
          }}
        >
          🚦 Start Simulation
          <span style={{ fontSize: '1.1rem' }}>→</span>
        </button>

        {/* Sub-links */}
        <div style={{ display: 'flex', gap: '32px', marginTop: '32px', flexWrap: 'wrap', justifyContent: 'center' }}>
          {[
            { icon: '📹', label: 'Video Upload & Detection' },
            { icon: '📊', label: 'Real-time Analytics' },
            { icon: '🚨', label: 'Emergency Override' },
          ].map(f => (
            <div key={f.label} style={{ display: 'flex', alignItems: 'center', gap: '7px', color: '#475569', fontSize: '0.82rem', fontWeight: 500 }}>
              <span>{f.icon}</span>
              <span>{f.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Footer ── */}
      <div style={{
        position: 'absolute', bottom: '20px',
        fontSize: '0.7rem', color: '#334155', letterSpacing: '0.04em',
      }}>
        ATMS v2.4 · Flask + YOLOv8 · React + Vite
      </div>

      <style>{`
        @keyframes pulse  { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes fadeInUp { from{opacity:0;transform:translateY(28px)} to{opacity:1;transform:translateY(0)} }
      `}</style>
    </div>
  );
};

export default Home;
