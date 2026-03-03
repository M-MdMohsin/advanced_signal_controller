import React from 'react';
import { laneDensityData } from '../data/dummyData';

const statusConfig = {
    critical: { color: '#ef4444', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.2)', label: 'Critical', glow: 'rgba(239,68,68,0.2)', icon: '🔴' },
    high: { color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)', label: 'High', glow: 'rgba(245,158,11,0.15)', icon: '🟡' },
    moderate: { color: '#3b82f6', bg: 'rgba(59,130,246,0.08)', border: 'rgba(59,130,246,0.2)', label: 'Moderate', glow: 'rgba(59,130,246,0.12)', icon: '🔵' },
    low: { color: '#10b981', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.2)', label: 'Low', glow: 'rgba(16,185,129,0.12)', icon: '🟢' },
};

const trendIcon = { up: '↑', down: '↓', stable: '→' };
const trendColor = { up: '#ef4444', down: '#10b981', stable: '#94a3b8' };

const LaneDensityCards = () => (
    <div>
        <div className="section-header">
            <div className="section-header-icon" style={{ background: 'linear-gradient(135deg, #f59e0b20, #ef444430)' }}>🚗</div>
            <div>
                <div className="section-title">Lane Density Monitor</div>
                <div className="section-subtitle">Real-time vehicle density across all lanes</div>
            </div>
            <div className="status-badge status-blue" style={{ marginLeft: 'auto' }}>
                <span className="pulse-dot" style={{ background: '#3b82f6' }} />
                Live Feed
            </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
            {laneDensityData.map((lane, idx) => (
                <LaneCard key={lane.id} lane={lane} delay={idx} />
            ))}
        </div>
    </div>
);

const LaneCard = ({ lane, delay }) => {
    const cfg = statusConfig[lane.status];
    const mini = [45, 60, 52, 68, 75, lane.density].map((v, i) => v + (i % 2 === 0 ? -5 : 5));

    return (
        <div
            className={`glass-card animate-fade-in-up animate-delay-${delay + 1}`}
            style={{ padding: '22px', border: `1px solid ${cfg.border}`, boxShadow: `0 4px 32px ${cfg.glow}` }}
        >
            {/* Top Row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>Lane {delay + 1}</div>
                    <div style={{ fontSize: '1rem', fontWeight: 700, color: '#e2e8f0' }}>{lane.name}</div>
                </div>
                <div style={{ fontSize: '1.4rem' }}>{cfg.icon}</div>
            </div>

            {/* Density Number */}
            <div style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                    <span style={{ fontSize: '2.8rem', fontWeight: 800, lineHeight: 1, color: cfg.color, fontVariantNumeric: 'tabular-nums' }}>
                        {lane.density}
                    </span>
                    <span style={{ fontSize: '1rem', color: '#64748b' }}>%</span>
                    <span style={{ fontSize: '1rem', color: trendColor[lane.trend], marginLeft: '4px', fontWeight: 700 }}>
                        {trendIcon[lane.trend]}
                    </span>
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>
                    {lane.vehicleCount} vehicles detected
                </div>
            </div>

            {/* Progress */}
            <div className="progress-bar-track" style={{ marginBottom: '14px' }}>
                <div className="progress-bar-fill" style={{ width: `${lane.density}%`, background: `linear-gradient(90deg, ${cfg.color}aa, ${cfg.color})` }} />
            </div>

            {/* Mini Sparkline */}
            <Sparkline data={mini} color={cfg.color} />

            {/* Stats Row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '14px', paddingTop: '14px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <Stat label="Congestion" value={lane.congestionLevel} color={cfg.color} />
                <Stat label="Avg Speed" value={`${lane.avgSpeed} km/h`} color="#94a3b8" />
            </div>
        </div>
    );
};

const Sparkline = ({ data, color }) => {
    const W = 140, H = 36, pad = 2;
    const min = Math.min(...data), max = Math.max(...data);
    const range = max - min || 1;
    const pts = data.map((v, i) => {
        const x = pad + (i / (data.length - 1)) * (W - 2 * pad);
        const y = H - pad - ((v - min) / range) * (H - 2 * pad);
        return `${x},${y}`;
    });
    return (
        <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: 'block', opacity: 0.7 }}>
            <polyline points={pts.join(' ')} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <polyline points={`${pad},${H} ${pts.join(' ')} ${W - pad},${H}`} fill={`${color}22`} stroke="none" />
        </svg>
    );
};

const Stat = ({ label, value, color }) => (
    <div>
        <div style={{ fontSize: '0.65rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '2px' }}>{label}</div>
        <div style={{ fontSize: '0.82rem', fontWeight: 700, color }}>{value}</div>
    </div>
);

export default LaneDensityCards;
