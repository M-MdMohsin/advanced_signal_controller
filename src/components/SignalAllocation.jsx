import React, { useState } from 'react';
import { signalAllocationData } from '../data/dummyData';

const phaseConfig = {
    GREEN: { color: '#10b981', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.3)', light: '🟢' },
    RED: { color: '#ef4444', bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.3)', light: '🔴' },
    YELLOW: { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)', light: '🟡' },
};

const priorityConfig = {
    Critical: { color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
    High: { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
    Medium: { color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
    Low: { color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
};

// ── Component ──────────────────────────────────────────────────────────────────
// liveData  – signal allocation array from backend or YOLO detection results.
//             Falls back to static dummyData only when liveData is absent.
// fromVideo – boolean: true when green-times were computed from a real video
const SignalAllocation = ({ liveData, fromVideo }) => {
    const [mode, setMode] = useState('AI Adaptive');
    const modes = ['AI Adaptive', 'Fixed Cycle', 'Manual', 'Emergency'];

    const signals = (liveData && liveData.length > 0) ? liveData : signalAllocationData;

    // Total cycle = sum of all green times
    const cycleLen = signals.reduce((s, sig) => s + (sig.greenTime ?? 0), 0) || 155;

    return (
        <div className="glass-card animate-fade-in-up animate-delay-2" style={{ padding: '24px' }}>
            {/* Header */}
            <div className="section-header">
                <div className="section-header-icon" style={{ background: 'linear-gradient(135deg, #10b98120, #3b82f630)' }}>
                    🚦
                </div>
                <div>
                    <div className="section-title">Signal Allocation Panel</div>
                    <div className="section-subtitle">
                        {fromVideo
                            ? '⚡ Green-times computed from video vehicle counts'
                            : 'AI-optimized green-time distribution'}
                    </div>
                </div>
                <div
                    className={`status-badge ${fromVideo ? 'status-green' : 'status-green'}`}
                    style={{ marginLeft: 'auto' }}
                >
                    <span className="pulse-dot" style={{ background: '#10b981' }} />
                    {fromVideo ? 'From Video' : 'Synced'}
                </div>
            </div>

            {/* Mode Selector */}
            <div style={{ display: 'flex', gap: '6px', marginBottom: '20px', padding: '4px', background: 'rgba(255,255,255,0.04)', borderRadius: '10px' }}>
                {modes.map((m) => (
                    <button
                        key={m}
                        onClick={() => setMode(m)}
                        style={{
                            flex: 1,
                            padding: '7px 4px',
                            borderRadius: '7px',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '0.72rem',
                            fontWeight: 600,
                            transition: 'all 0.2s',
                            background: mode === m ? 'linear-gradient(135deg, #3b82f6, #6366f1)' : 'transparent',
                            color: mode === m ? '#fff' : '#64748b',
                            boxShadow: mode === m ? '0 2px 10px rgba(99,102,241,0.4)' : 'none',
                        }}
                    >
                        {m}
                    </button>
                ))}
            </div>

            {/* Signal Rows */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {signals.map((signal) => (
                    <SignalRow key={signal.lane} signal={signal} cycleLen={cycleLen} />
                ))}
            </div>

            {/* Cycle Info */}
            <div style={{ marginTop: '20px', padding: '14px', background: 'rgba(59,130,246,0.06)', borderRadius: '12px', border: '1px solid rgba(59,130,246,0.12)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <div style={{ fontSize: '0.72rem', color: '#64748b', marginBottom: '2px' }}>Current Mode</div>
                        <div style={{ fontWeight: 700, color: '#3b82f6', fontSize: '0.9rem' }}>{mode}</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '0.72rem', color: '#64748b', marginBottom: '2px' }}>Cycle Length</div>
                        <div style={{ fontWeight: 700, color: '#e2e8f0', fontSize: '0.9rem' }}>{cycleLen}s</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.72rem', color: '#64748b', marginBottom: '2px' }}>
                            {fromVideo ? 'Data Source' : 'Efficiency Gain'}
                        </div>
                        <div style={{ fontWeight: 700, color: '#10b981', fontSize: '0.9rem' }}>
                            {fromVideo ? '🎥 Video' : '+34%'}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const SignalRow = ({ signal, cycleLen }) => {
    const ph = phaseConfig[signal.phase] ?? phaseConfig.RED;
    const pr = priorityConfig[signal.priority] ?? priorityConfig.Low;

    return (
        <div className="signal-block" style={{ background: 'rgba(255,255,255,0.02)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                {/* Lane + Light */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ fontSize: '1.4rem' }}>{ph.light}</div>
                    <div>
                        <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#e2e8f0' }}>{signal.lane} — Signal</div>
                        <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                            Next change in {signal.nextChange}s
                            {signal.vehicleCount != null && (
                                <span style={{ marginLeft: '8px', color: '#475569' }}>· {signal.vehicleCount} vehicles</span>
                            )}
                        </div>
                    </div>
                </div>
                {/* Badges */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ padding: '3px 10px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.08em', background: ph.bg, color: ph.color, border: `1px solid ${ph.border}` }}>
                        {signal.phase}
                    </span>
                    <span style={{ padding: '3px 10px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 700, background: pr.bg, color: pr.color }}>
                        {signal.priority}
                    </span>
                </div>
            </div>

            {/* Green Time Bar */}
            <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                    <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Green Time Allocation</span>
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#10b981' }}>{signal.greenTime}s / {cycleLen}s</span>
                </div>
                <div className="progress-bar-track">
                    <div className="progress-bar-fill" style={{ width: `${Math.min(100, (signal.greenTime / cycleLen) * 100)}%`, background: 'linear-gradient(90deg, #10b981, #34d399)' }} />
                </div>
            </div>
        </div>
    );
};

export default SignalAllocation;
