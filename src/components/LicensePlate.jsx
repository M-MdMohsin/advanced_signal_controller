import React, { useState } from 'react';
import { detectedPlates } from '../data/dummyData';

const vehicleIcon = { Car: '🚗', Bike: '🏍️', Truck: '🚛', Bus: '🚌' };

const LicensePlate = () => {
    const [filter, setFilter] = useState('All');
    const filters = ['All', 'Flagged', 'Cars', 'Heavy'];

    const filtered = detectedPlates.filter((p) => {
        if (filter === 'Flagged') return p.flagged;
        if (filter === 'Cars') return p.type === 'Car' || p.type === 'Bike';
        if (filter === 'Heavy') return p.type === 'Truck' || p.type === 'Bus';
        return true;
    });

    return (
        <div className="glass-card animate-fade-in-up animate-delay-5" style={{ padding: '24px' }}>
            {/* Header */}
            <div className="section-header">
                <div className="section-header-icon" style={{ background: 'linear-gradient(135deg, #8b5cf620, #6366f130)' }}>
                    🔍
                </div>
                <div>
                    <div className="section-title">License Plate Detection</div>
                    <div className="section-subtitle">Optical character recognition — live stream</div>
                </div>
                <div className="status-badge status-blue" style={{ marginLeft: 'auto' }}>
                    <span className="pulse-dot" style={{ background: '#3b82f6' }} />
                    OCR Active
                </div>
            </div>

            {/* Placeholder OCR Feed */}
            <div
                className="placeholder-shimmer"
                style={{
                    height: '100px',
                    borderRadius: '12px',
                    border: '2px dashed rgba(139,92,246,0.25)',
                    background: 'rgba(139,92,246,0.04)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '24px',
                    marginBottom: '18px',
                }}
            >
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.6rem', marginBottom: '4px' }}>🔎</div>
                    <div style={{ fontSize: '0.7rem', color: '#8b5cf6', fontWeight: 600 }}>OCR Engine</div>
                    <div style={{ fontSize: '0.65rem', color: '#64748b' }}>PaddleOCR v3</div>
                </div>
                {/* Mock plate display */}
                <div style={{ padding: '10px 20px', background: '#fff', borderRadius: '8px', border: '3px solid #1e293b', position: 'relative' }}>
                    <div style={{ fontSize: '0.55rem', color: '#1e3a8a', fontWeight: 800, letterSpacing: '0.1em', textAlign: 'center', marginBottom: '2px' }}>INDIA 🇮🇳</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#1e293b', letterSpacing: '0.15em', fontFamily: 'monospace' }}>MH12 AB 3456</div>
                    <div style={{ position: 'absolute', top: '4px', right: '6px', width: '8px', height: '8px', borderRadius: '50%', background: '#3b82f6' }} />
                </div>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#10b981' }}>97.4%</div>
                    <div style={{ fontSize: '0.65rem', color: '#64748b' }}>Confidence</div>
                </div>
            </div>

            {/* Filter Tabs */}
            <div style={{ display: 'flex', gap: '6px', marginBottom: '14px' }}>
                {filters.map((f) => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        style={{
                            padding: '5px 12px',
                            borderRadius: '7px',
                            border: `1px solid ${filter === f ? '#8b5cf6' : 'rgba(255,255,255,0.08)'}`,
                            background: filter === f ? 'rgba(139,92,246,0.15)' : 'transparent',
                            color: filter === f ? '#8b5cf6' : '#64748b',
                            fontSize: '0.72rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                        }}
                    >
                        {f}
                    </button>
                ))}
                <div style={{ marginLeft: 'auto', fontSize: '0.72rem', color: '#64748b', alignSelf: 'center' }}>
                    {filtered.length} result{filtered.length !== 1 ? 's' : ''}
                </div>
            </div>

            {/* Plate List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '220px', overflowY: 'auto', paddingRight: '4px' }}>
                {filtered.map((p) => (
                    <div
                        key={p.plate}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '10px 14px',
                            borderRadius: '10px',
                            background: p.flagged ? 'rgba(239,68,68,0.06)' : 'rgba(255,255,255,0.025)',
                            border: `1px solid ${p.flagged ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.06)'}`,
                        }}
                    >
                        <span style={{ fontSize: '1.2rem' }}>{vehicleIcon[p.type] || '🚗'}</span>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#e2e8f0', fontFamily: 'monospace', letterSpacing: '0.05em' }}>
                                {p.plate}
                            </div>
                            <div style={{ fontSize: '0.68rem', color: '#64748b' }}>{p.lane} Lane · {p.time}</div>
                        </div>
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.68rem', padding: '2px 8px', borderRadius: '5px', background: 'rgba(255,255,255,0.06)', color: '#94a3b8' }}>{p.type}</span>
                            {p.flagged && (
                                <span style={{ fontSize: '0.68rem', padding: '2px 8px', borderRadius: '5px', background: 'rgba(239,68,68,0.12)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)', fontWeight: 700 }}>⚑ Flagged</span>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Stats Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px', paddingTop: '14px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                {[
                    { label: 'Total Scanned', value: '1,482', color: '#8b5cf6' },
                    { label: 'Flagged Today', value: '23', color: '#ef4444' },
                    { label: 'Accuracy', value: '98.1%', color: '#10b981' },
                ].map((s) => (
                    <div key={s.label} style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '1.05rem', fontWeight: 800, color: s.color }}>{s.value}</div>
                        <div style={{ fontSize: '0.65rem', color: '#64748b' }}>{s.label}</div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default LicensePlate;
