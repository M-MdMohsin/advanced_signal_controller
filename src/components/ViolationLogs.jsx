import React, { useState } from 'react';
import { violationLogs } from '../data/dummyData';

const severityConfig = {
    High: { color: '#ef4444', bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.3)', icon: '🔴' },
    Medium: { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)', icon: '🟡' },
    Low: { color: '#10b981', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.3)', icon: '🟢' },
};

const typeIcon = {
    'Red Light Jump': '🚫',
    'Over Speeding': '⚡',
    'Wrong Way': '⛔',
    'No Helmet': '⛑️',
    'Lane Change': '↔️',
};

const ViolationLogs = () => {
    const [selectedSeverity, setSelectedSeverity] = useState('All');
    const filters = ['All', 'High', 'Medium', 'Low'];

    const filtered = selectedSeverity === 'All'
        ? violationLogs
        : violationLogs.filter((v) => v.severity === selectedSeverity);

    return (
        <div className="glass-card animate-fade-in-up animate-delay-5" style={{ padding: '24px' }}>
            {/* Header */}
            <div className="section-header">
                <div className="section-header-icon" style={{ background: 'linear-gradient(135deg, #ef444420, #f59e0b30)' }}>
                    ⚠️
                </div>
                <div>
                    <div className="section-title">Traffic Violation Logs</div>
                    <div className="section-subtitle">Automated AI-detected infractions</div>
                </div>
                {/* Export button */}
                <button
                    style={{
                        marginLeft: 'auto',
                        padding: '6px 14px',
                        borderRadius: '8px',
                        border: '1px solid rgba(255,255,255,0.1)',
                        background: 'rgba(255,255,255,0.05)',
                        color: '#94a3b8',
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        transition: 'all 0.2s',
                    }}
                    title="Export CSV (placeholder)"
                >
                    ⬇ Export
                </button>
            </div>

            {/* Summary Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '18px' }}>
                {[
                    { label: 'Total Today', value: '38', color: '#94a3b8', icon: '📋' },
                    { label: 'High Severity', value: '11', color: '#ef4444', icon: '🔴' },
                    { label: 'Pending Review', value: '7', color: '#f59e0b', icon: '⏳' },
                ].map((s) => (
                    <div key={s.label} style={{ padding: '12px', borderRadius: '10px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', textAlign: 'center' }}>
                        <div style={{ fontSize: '1.1rem', marginBottom: '4px' }}>{s.icon}</div>
                        <div style={{ fontSize: '1.2rem', fontWeight: 800, color: s.color }}>{s.value}</div>
                        <div style={{ fontSize: '0.65rem', color: '#64748b' }}>{s.label}</div>
                    </div>
                ))}
            </div>

            {/* Severity Filter */}
            <div style={{ display: 'flex', gap: '6px', marginBottom: '14px' }}>
                {filters.map((f) => {
                    const sc = f !== 'All' ? severityConfig[f] : null;
                    const isActive = selectedSeverity === f;
                    return (
                        <button
                            key={f}
                            onClick={() => setSelectedSeverity(f)}
                            style={{
                                padding: '5px 14px',
                                borderRadius: '7px',
                                border: `1px solid ${isActive ? (sc?.border || 'rgba(99,102,241,0.4)') : 'rgba(255,255,255,0.07)'}`,
                                background: isActive ? (sc?.bg || 'rgba(99,102,241,0.12)') : 'transparent',
                                color: isActive ? (sc?.color || '#6366f1') : '#64748b',
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                            }}
                        >
                            {f !== 'All' && sc?.icon + ' '}{f}
                        </button>
                    );
                })}
                <span style={{ marginLeft: 'auto', fontSize: '0.72rem', color: '#64748b', alignSelf: 'center' }}>
                    {filtered.length} record{filtered.length !== 1 ? 's' : ''}
                </span>
            </div>

            {/* Table */}
            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                            {['ID', 'Type', 'Lane', 'Time', 'Plate', 'Severity'].map((h) => (
                                <th key={h} style={{ padding: '8px 12px', textAlign: 'left', color: '#64748b', fontWeight: 600, fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>
                                    {h}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map((v, i) => {
                            const sc = severityConfig[v.severity];
                            return (
                                <tr
                                    key={v.id}
                                    style={{
                                        borderBottom: '1px solid rgba(255,255,255,0.04)',
                                        background: i % 2 === 0 ? 'rgba(255,255,255,0.015)' : 'transparent',
                                        transition: 'background 0.15s',
                                        cursor: 'default',
                                    }}
                                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(59,130,246,0.06)')}
                                    onMouseLeave={(e) => (e.currentTarget.style.background = i % 2 === 0 ? 'rgba(255,255,255,0.015)' : 'transparent')}
                                >
                                    <td style={{ padding: '10px 12px', color: '#64748b', whiteSpace: 'nowrap' }}>{v.id}</td>
                                    <td style={{ padding: '10px 12px', color: '#e2e8f0', whiteSpace: 'nowrap' }}>
                                        <span style={{ marginRight: '6px' }}>{typeIcon[v.type] || '⚠️'}</span>{v.type}
                                    </td>
                                    <td style={{ padding: '10px 12px', color: '#94a3b8', whiteSpace: 'nowrap' }}>{v.lane}</td>
                                    <td style={{ padding: '10px 12px', color: '#64748b', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>{v.time}</td>
                                    <td style={{ padding: '10px 12px', fontFamily: 'monospace', color: '#a5b4fc', fontWeight: 700, letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>{v.plate}</td>
                                    <td style={{ padding: '10px 12px' }}>
                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '3px 10px', borderRadius: '6px', background: sc.bg, color: sc.color, border: `1px solid ${sc.border}`, fontSize: '0.68rem', fontWeight: 700, whiteSpace: 'nowrap' }}>
                                            {sc.icon} {v.severity}
                                        </span>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ViolationLogs;
