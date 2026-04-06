import React from 'react';
import { emergencyEvents as dummyEvents } from '../data/dummyData';

const typeConfig = {
    Ambulance:   { icon: '🚑', color: '#ef4444', bg: 'rgba(239,68,68,0.1)',   border: 'rgba(239,68,68,0.25)'   },
    'Fire Truck':{ icon: '🚒', color: '#f97316', bg: 'rgba(249,115,22,0.1)', border: 'rgba(249,115,22,0.25)' },
    'Police Car':{ icon: '🚓', color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.25)' },
    Bus:         { icon: '🚌', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.25)' },
};

const statusStyle = {
    Approaching: { color: '#ef4444', pulse: true  },
    Cleared:     { color: '#10b981', pulse: false },
    Waiting:     { color: '#f59e0b', pulse: true  },
    Detected:    { color: '#f59e0b', pulse: true  },
};

// heuristicEvents: array of { id, type:'Bus', lane, status:'Detected', time, eta }
// derived in App.jsx from YOLO bus detections
const EmergencyVehicle = ({ heuristicEvents = [] }) => {
    // Merge: live heuristic events first, then static dummy events
    const allEvents = [...heuristicEvents, ...dummyEvents];
    const activeCount = allEvents.filter(e => e.status !== 'Cleared').length;

    return (
        <div className="glass-card animate-fade-in-up animate-delay-4" style={{ padding: '24px' }}>
            {/* Header */}
            <div className="section-header">
                <div className="section-header-icon" style={{ background: 'linear-gradient(135deg, #ef444420, #f9731630)' }}>
                    🚨
                </div>
                <div>
                    <div className="section-title">Emergency Vehicle Detection</div>
                    <div className="section-subtitle">
                        {heuristicEvents.length > 0
                            ? `🚌 ${heuristicEvents.length} bus(es) flagged via YOLO heuristic`
                            : 'Heuristic detection via YOLO vehicle classes'}
                    </div>
                </div>
                <div
                    className={`status-badge ${activeCount > 0 ? 'status-red' : 'status-green'}`}
                    style={{ marginLeft: 'auto' }}
                >
                    <span className="pulse-dot" style={{ background: activeCount > 0 ? '#ef4444' : '#10b981' }} />
                    {activeCount > 0 ? `${activeCount} Active` : 'All Clear'}
                </div>
            </div>

            {/* Detection Method Banner */}
            <div style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '10px 14px', marginBottom: '16px',
                borderRadius: '10px',
                background: 'rgba(245,158,11,0.06)',
                border: '1px solid rgba(245,158,11,0.18)',
            }}>
                <span style={{ fontSize: '1.1rem' }}>🧠</span>
                <div style={{ flex: 1 }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#f59e0b' }}>
                        Heuristic Mode
                    </span>
                    <span style={{ fontSize: '0.72rem', color: '#64748b', marginLeft: '8px' }}>
                        Buses detected by YOLOv8 are treated as potential emergency vehicles
                    </span>
                </div>
                <span style={{
                    fontSize: '0.65rem', fontWeight: 700, color: '#f59e0b',
                    background: 'rgba(245,158,11,0.12)', padding: '3px 8px',
                    borderRadius: '6px', border: '1px solid rgba(245,158,11,0.25)',
                }}>YOLO</span>
            </div>

            {/* Event List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {allEvents.map((ev) => {
                    const tc = typeConfig[ev.type] || typeConfig['Police Car'];
                    const sc = statusStyle[ev.status]  || statusStyle['Cleared'];
                    const isHeuristic = ev._source === 'heuristic';
                    return (
                        <div
                            key={ev.id}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '12px',
                                padding: '12px 14px', borderRadius: '12px',
                                background: tc.bg, border: `1px solid ${tc.border}`,
                                position: 'relative',
                            }}
                        >
                            <span style={{ fontSize: '1.5rem' }}>{tc.icon}</span>
                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#e2e8f0' }}>{ev.type}</span>
                                    <span style={{ fontSize: '0.68rem', color: '#64748b' }}>— {ev.lane}</span>
                                    {isHeuristic && (
                                        <span style={{
                                            fontSize: '0.6rem', fontWeight: 700, color: '#f59e0b',
                                            background: 'rgba(245,158,11,0.12)', padding: '1px 6px',
                                            borderRadius: '4px', border: '1px solid rgba(245,158,11,0.25)',
                                        }}>HEURISTIC</span>
                                    )}
                                </div>
                                <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                                    Detected at {ev.time} · ETA: {ev.eta}
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                {sc.pulse && (
                                    <span style={{
                                        width: '7px', height: '7px', borderRadius: '50%',
                                        background: sc.color, display: 'inline-block',
                                        animation: 'pulse 1.2s infinite',
                                    }} />
                                )}
                                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: sc.color }}>{ev.status}</span>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Corridor / priority footer */}
            {activeCount > 0 && (
                <div style={{
                    marginTop: '16px', padding: '12px 14px', borderRadius: '10px',
                    background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.12)',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                    <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                        🟥 <strong style={{ color: '#ef4444' }}>Priority Override Active</strong> — Signal corridor adjusted for detected vehicles
                    </div>
                    <span style={{
                        fontSize: '0.7rem', fontWeight: 700, color: '#ef4444',
                        background: 'rgba(239,68,68,0.1)', padding: '3px 10px',
                        borderRadius: '6px', border: '1px solid rgba(239,68,68,0.2)',
                    }}>PRIORITY</span>
                </div>
            )}
        </div>
    );
};

export default EmergencyVehicle;
