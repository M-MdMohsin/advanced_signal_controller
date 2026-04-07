import React, { useState, useEffect, useRef } from 'react';
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
const SignalAllocation = ({ liveData, fromVideo, priorityLane }) => {
    const [mode, setMode] = useState('AI Adaptive');
    const modes = ['AI Adaptive', 'Fixed Cycle', 'Manual', 'Emergency'];

    const [signals, setSignals] = useState([]);
    const prevDataRef = useRef(null); // track last JSON to avoid restarting on unchanged polls

    // 1. Sync incoming data — only reset cycle when content actually changes
    useEffect(() => {
        const incoming = JSON.stringify({ liveData, priorityLane });
        if (incoming === prevDataRef.current) return;
        prevDataRef.current = incoming;

        const data = (liveData && liveData.length > 0) ? liveData : signalAllocationData;
        
        const DIRECTIONS = ['North', 'South', 'East', 'West'];
        const freshSignals = DIRECTIONS.map((dir, i) => {
            const raw = data.find(d => (d.lane || d.direction || '').includes(dir)) || data[i % data.length];
            return {
                lane: dir,
                phase: 'RED',
                nextChange: Math.floor(raw.greenTime ?? 15),
                greenTime: Math.floor(raw.greenTime ?? 15),
                vehicleCount: raw.vehicleCount ?? null,
                priority: raw.priority ?? 'Medium'
            };
        });

        if (priorityLane) {
            const pIdx = freshSignals.findIndex(s => s.lane === priorityLane);
            if (pIdx > 0) {
                const [ps] = freshSignals.splice(pIdx, 1);
                freshSignals.unshift(ps);
            }
        }

        freshSignals[0].phase = 'GREEN';
        let wait = freshSignals[0].nextChange;
        for (let i = 1; i < freshSignals.length; i++) {
            freshSignals[i].nextChange = wait;
            wait += freshSignals[i].greenTime;
        }

        setSignals(freshSignals);
    }, [liveData]);

    // 2. Real-time cycle countdown interval
    useEffect(() => {
        if (signals.length === 0) return;

        const timer = setInterval(() => {
            setSignals(prev => {
                if (prev.length === 0) return prev;
                const nextState = prev.map(s => ({ ...s }));
                let greenIdx = nextState.findIndex(s => s.phase === 'GREEN');
                let yellowIdx = nextState.findIndex(s => s.phase === 'YELLOW');

                if (yellowIdx !== -1) {
                    nextState[yellowIdx].nextChange = Math.max(0, nextState[yellowIdx].nextChange - 1);
                    if (nextState[yellowIdx].nextChange === 0) {
                        nextState[yellowIdx].phase = 'RED';
                        const nextGreenIdx = (yellowIdx + 1) % nextState.length;
                        nextState[nextGreenIdx].phase = 'GREEN';
                        nextState[nextGreenIdx].nextChange = Math.max(1, Math.floor(nextState[nextGreenIdx].greenTime || 15));
                        greenIdx = nextGreenIdx;
                        yellowIdx = -1;
                    }
                } else {
                    if (greenIdx === -1) {
                        greenIdx = 0;
                        nextState[0].phase = 'GREEN';
                    }
                    nextState[greenIdx].nextChange = Math.max(0, nextState[greenIdx].nextChange - 1);
                    
                    if (nextState[greenIdx].nextChange === 0) {
                        nextState[greenIdx].phase = 'RED';
                        const nextGI = (greenIdx + 1) % nextState.length;
                        nextState[nextGI].phase = 'GREEN';
                        nextState[nextGI].nextChange = Math.max(1, Math.floor(nextState[nextGI].greenTime || 15));
                        greenIdx = nextGI;
                    } else if (nextState[greenIdx].nextChange <= 3) {
                        nextState[greenIdx].phase = 'YELLOW';
                        yellowIdx = greenIdx;
                        greenIdx = -1;
                    }
                }

                // Cascade wait times for RED lights
                const activeIdx = greenIdx !== -1 ? greenIdx : yellowIdx;
                if (activeIdx !== -1) {
                    let accumulatedWait = nextState[activeIdx].nextChange;
                    for (let i = 1; i < nextState.length; i++) {
                        const idx = (activeIdx + i) % nextState.length;
                        if (nextState[idx].phase === 'RED') {
                            nextState[idx].nextChange = accumulatedWait;
                            accumulatedWait += (nextState[idx].greenTime || 15);
                        }
                    }
                }

                return nextState;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [signals.length]); // bind only once per array shape

    // Total cycle = sum of all green times
    const cycleLen = signals.reduce((s, sig) => s + (sig.greenTime ?? 0), 0) || 60;

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
                    {fromVideo ? 'From Images' : 'Synced from Backend'}
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
    const pr = priorityConfig[signal.priority] ?? priorityConfig.Low;

    return (
        <div className="signal-block" style={{ background: 'rgba(255,255,255,0.02)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                {/* Lane */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div>
                        <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#e2e8f0' }}>{signal.lane} Lane</div>
                        <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                            {signal.vehicleCount != null ? (
                                <span style={{ color: '#475569' }}>{signal.vehicleCount} vehicles detected</span>
                            ) : (
                                <span>AI Optimized</span>
                            )}
                        </div>
                    </div>
                </div>
                {/* Badges */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ padding: '3px 10px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 700, background: pr.bg, color: pr.color }}>
                        {signal.priority}
                    </span>
                </div>
            </div>

            {/* Green Time Bar */}
            <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                    <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Green Time Allocation</span>
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#10b981' }}>{Math.floor(signal.greenTime)}s / {Math.floor(cycleLen)}s</span>
                </div>
                <div className="progress-bar-track">
                    <div className="progress-bar-fill" style={{ width: `${Math.min(100, (signal.greenTime / cycleLen) * 100)}%`, background: 'linear-gradient(90deg, #10b981, #34d399)' }} />
                </div>
            </div>
        </div>
    );
};

export default SignalAllocation;
