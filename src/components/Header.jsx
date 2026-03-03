import React from 'react';

const Header = () => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const dateStr = now.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    return (
        <header style={{ background: 'rgba(10, 15, 30, 0.95)', borderBottom: '1px solid rgba(59,130,246,0.15)', backdropFilter: 'blur(20px)', position: 'sticky', top: 0, zIndex: 100 }}>
            <div style={{ maxWidth: '1600px', margin: '0 auto', padding: '0 24px', height: '70px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                {/* Logo & Title */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'linear-gradient(135deg, #3b82f6, #6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', boxShadow: '0 4px 15px rgba(99,102,241,0.45)' }}>
                        🚦
                    </div>
                    <div>
                        <h1 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, background: 'linear-gradient(135deg, #e2e8f0, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                            AI Traffic Signal Management
                        </h1>
                        <p style={{ margin: 0, fontSize: '0.72rem', color: '#64748b', letterSpacing: '0.05em' }}>ATMS v2.4 — Intersection Control Unit</p>
                    </div>
                </div>

                {/* Center: System Status */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                    <StatusPill icon="🟢" label="AI Engine" value="Online" color="#10b981" />
                    <StatusPill icon="📡" label="Cameras" value="12/12 Active" color="#3b82f6" />
                    <StatusPill icon="⚡" label="Signal Sync" value="Operational" color="#f59e0b" />
                </div>

                {/* Right: Time */}
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.3rem', fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: '#e2e8f0', letterSpacing: '0.02em' }}>{timeStr}</div>
                    <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{dateStr}</div>
                </div>
            </div>
        </header>
    );
};

const StatusPill = ({ icon, label, value, color }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 14px', border: `1px solid ${color}30`, borderRadius: '999px', background: `${color}10` }}>
        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: color, display: 'inline-block', boxShadow: `0 0 6px ${color}` }} />
        <span style={{ fontSize: '0.72rem', color: '#94a3b8', letterSpacing: '0.04em' }}>{label}:</span>
        <span style={{ fontSize: '0.72rem', fontWeight: 700, color }}>{value}</span>
    </div>
);

export default Header;
