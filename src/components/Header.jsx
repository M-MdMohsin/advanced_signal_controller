import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const Header = () => {
  const navigate  = useNavigate();
  const location  = useLocation();
  const isDash    = location.pathname === '/dashboard';

  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const timeStr = time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const dateStr = time.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' });

  return (
    <header style={{
      background: 'rgba(10,15,30,0.97)',
      borderBottom: '1px solid rgba(59,130,246,0.15)',
      backdropFilter: 'blur(20px)',
      position: 'sticky', top: 0, zIndex: 100,
    }}>
      <div style={{
        maxWidth: '1600px', margin: '0 auto', padding: '0 24px',
        height: '64px', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', gap: '16px',
      }}>

        {/* ── Logo ── */}
        <div
          style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', flexShrink: 0 }}
          onClick={() => navigate('/')}
        >
          <div style={{
            width: '40px', height: '40px', borderRadius: '11px',
            background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.25rem', boxShadow: '0 4px 14px rgba(99,102,241,0.4)',
            transition: 'transform 0.2s',
          }}
          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.08)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
          >
            🚦
          </div>
          <div>
            <div style={{
              margin: 0, fontSize: '1rem', fontWeight: 800,
              background: 'linear-gradient(135deg, #e2e8f0, #94a3b8)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              lineHeight: 1.2,
            }}>
              AI Traffic Signal
            </div>
            <div style={{ fontSize: '0.65rem', color: '#475569', letterSpacing: '0.05em' }}>
              ATMS v2.4
            </div>
          </div>
        </div>

        {/* ── Nav Links ── */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {[
            { label: '🏠 Home',      path: '/'          },
            { label: '📊 Dashboard', path: '/dashboard' },
          ].map(({ label, path }) => {
            const active = location.pathname === path;
            return (
              <button
                key={path}
                onClick={() => navigate(path)}
                style={{
                  padding: '7px 18px',
                  borderRadius: '9px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  transition: 'all 0.2s',
                  background: active
                    ? 'linear-gradient(135deg, #3b82f6, #6366f1)'
                    : 'rgba(255,255,255,0.04)',
                  color: active ? '#fff' : '#64748b',
                  boxShadow: active ? '0 3px 12px rgba(99,102,241,0.4)' : 'none',
                  border: active ? '1px solid transparent' : '1px solid rgba(255,255,255,0.06)',
                }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.color = '#e2e8f0'; }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.color = '#64748b'; }}
              >
                {label}
              </button>
            );
          })}
        </nav>

        {/* ── Center: Status Pills ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
          <StatusPill icon="🟢" label="AI Engine"    value="Online"      color="#10b981" />
          <StatusPill icon="📡" label="Cameras"      value="12/12"       color="#3b82f6" />
          <StatusPill icon="⚡" label="Signal Sync"  value="Active"      color="#f59e0b" />
        </div>

        {/* ── Right: Live Clock ── */}
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{
            fontSize: '1.15rem', fontWeight: 700, fontVariantNumeric: 'tabular-nums',
            color: '#e2e8f0', letterSpacing: '0.02em', lineHeight: 1.2,
          }}>
            {timeStr}
          </div>
          <div style={{ fontSize: '0.65rem', color: '#64748b' }}>{dateStr}</div>
        </div>
      </div>
    </header>
  );
};

const StatusPill = ({ icon, label, value, color }) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: '6px',
    padding: '5px 12px',
    border: `1px solid ${color}30`,
    borderRadius: '999px',
    background: `${color}10`,
  }}>
    <span style={{
      width: '7px', height: '7px', borderRadius: '50%',
      background: color, display: 'inline-block',
      boxShadow: `0 0 5px ${color}`,
      animation: 'pulse 2s infinite',
    }} />
    <span style={{ fontSize: '0.68rem', color: '#94a3b8', letterSpacing: '0.03em' }}>{label}:</span>
    <span style={{ fontSize: '0.68rem', fontWeight: 700, color }}>{value}</span>
  </div>
);

export default Header;
