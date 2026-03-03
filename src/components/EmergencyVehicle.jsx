import React from 'react';
import { emergencyEvents } from '../data/dummyData';

const typeConfig = {
    Ambulance: { icon: '🚑', color: '#ef4444', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.25)' },
    'Fire Truck': { icon: '🚒', color: '#f97316', bg: 'rgba(249,115,22,0.1)', border: 'rgba(249,115,22,0.25)' },
    'Police Car': { icon: '🚓', color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.25)' },
};

const statusStyle = {
    Approaching: { color: '#ef4444', pulse: true },
    Cleared: { color: '#10b981', pulse: false },
    Waiting: { color: '#f59e0b', pulse: true },
};

const EmergencyVehicle = () => (
    <div className="glass-card animate-fade-in-up animate-delay-4" style={{ padding: '24px' }}>
        {/* Header */}
        <div className="section-header">
            <div className="section-header-icon" style={{ background: 'linear-gradient(135deg, #ef444420, #f9731630)' }}>
                🚨
            </div>
            <div>
                <div className="section-title">Emergency Vehicle Detection</div>
                <div className="section-subtitle">AI-powered siren & visual detection</div>
            </div>
            <div className="status-badge status-red" style={{ marginLeft: 'auto' }}>
                <span className="pulse-dot" style={{ background: '#ef4444' }} />
                1 Active
            </div>
        </div>

        {/* Placeholder Model Feed */}
        <div
            style={{
                height: '140px',
                borderRadius: '12px',
                border: '2px dashed rgba(239,68,68,0.25)',
                background: 'rgba(239,68,68,0.04)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                marginBottom: '18px',
                position: 'relative',
                overflow: 'hidden',
            }}
            className="placeholder-shimmer"
        >
            {/* animated ring */}
            <div style={{ position: 'relative', width: '52px', height: '52px' }}>
                <div style={{
                    position: 'absolute', inset: 0, borderRadius: '50%',
                    border: '2px solid rgba(239,68,68,0.4)',
                    animation: 'pulse 1.5s infinite',
                }} />
                <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: 'rgba(239,68,68,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem' }}>
                    🚑
                </div>
            </div>
            <span style={{ fontSize: '0.78rem', color: '#ef4444', fontWeight: 600 }}>Computer Vision Model Active</span>
            <span style={{ fontSize: '0.68rem', color: '#64748b' }}>YOLOv8 · Emergency Classification · Siren Detection</span>
        </div>

        {/* Event List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {emergencyEvents.map((ev) => {
                const tc = typeConfig[ev.type] || typeConfig['Police Car'];
                const sc = statusStyle[ev.status] || statusStyle['Cleared'];
                return (
                    <div
                        key={ev.id}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '12px 14px',
                            borderRadius: '12px',
                            background: tc.bg,
                            border: `1px solid ${tc.border}`,
                        }}
                    >
                        <span style={{ fontSize: '1.5rem' }}>{tc.icon}</span>
                        <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#e2e8f0' }}>{ev.type}</span>
                                <span style={{ fontSize: '0.68rem', color: '#64748b' }}>— {ev.lane}</span>
                            </div>
                            <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Detected at {ev.time} · ETA: {ev.eta}</div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                            {sc.pulse && (
                                <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: sc.color, display: 'inline-block', animation: 'pulse 1.2s infinite' }} />
                            )}
                            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: sc.color }}>{ev.status}</span>
                        </div>
                    </div>
                );
            })}
        </div>

        {/* Corridor Info */}
        <div style={{ marginTop: '16px', padding: '12px 14px', borderRadius: '10px', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.12)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                🟥 <strong style={{ color: '#ef4444' }}>Green Corridor Active</strong> — East Lane priority override in effect
            </div>
            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#ef4444', background: 'rgba(239,68,68,0.1)', padding: '3px 10px', borderRadius: '6px', border: '1px solid rgba(239,68,68,0.2)' }}>PRIORITY</span>
        </div>
    </div>
);

export default EmergencyVehicle;
