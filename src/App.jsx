import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import VideoUpload from './components/VideoUpload';
import LaneDensityCards from './components/LaneDensityCards';
import SignalAllocation from './components/SignalAllocation';
import DensityChart from './components/DensityChart';
import EmergencyVehicle from './components/EmergencyVehicle';
import LicensePlate from './components/LicensePlate';
import ViolationLogs from './components/ViolationLogs';

// Stat counter at the top
const TopStatBar = () => {
  const stats = [
    { label: 'Total Vehicles Today', value: '14,823', icon: '🚗', color: '#3b82f6' },
    { label: 'Violations Detected', value: '38', icon: '⚠️', color: '#ef4444' },
    { label: 'Avg Wait Time', value: '1m 42s', icon: '⏱️', color: '#f59e0b' },
    { label: 'Signal Cycles', value: '1,204', icon: '🔄', color: '#10b981' },
    { label: 'Emergency Events', value: '2', icon: '🚨', color: '#ef4444' },
    { label: 'AI Model Uptime', value: '99.8%', icon: '🤖', color: '#8b5cf6' },
  ];

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(6, 1fr)',
      gap: '12px',
      marginBottom: '24px',
    }}>
      {stats.map((s) => (
        <div
          key={s.label}
          className="glass-card"
          style={{ padding: '16px', textAlign: 'center', borderColor: `${s.color}22` }}
        >
          <div style={{ fontSize: '1.3rem', marginBottom: '6px' }}>{s.icon}</div>
          <div style={{ fontSize: '1.35rem', fontWeight: 800, color: s.color, fontVariantNumeric: 'tabular-nums', lineHeight: 1.1 }}>
            {s.value}
          </div>
          <div style={{ fontSize: '0.65rem', color: '#64748b', marginTop: '4px', lineHeight: 1.3 }}>{s.label}</div>
        </div>
      ))}
    </div>
  );
};

const App = () => {
  const [activeTab, setActiveTab] = useState('overview');

  const tabs = [
    { id: 'overview', label: '🗺 Overview' },
    { id: 'analytics', label: '📊 Analytics' },
    { id: 'violations', label: '⚠️ Violations' },
    { id: 'emergency', label: '🚨 Emergency' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg-primary)' }}>
      {/* Google Font */}
      <link
        href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap"
        rel="stylesheet"
      />

      <Header />

      <main style={{ maxWidth: '1600px', margin: '0 auto', padding: '28px 24px 48px' }}>
        {/* Tab Nav */}
        <div style={{ display: 'flex', gap: '4px', marginBottom: '28px', padding: '4px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', width: 'fit-content', border: '1px solid rgba(255,255,255,0.06)' }}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '8px 20px',
                borderRadius: '9px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.82rem',
                fontWeight: 700,
                transition: 'all 0.2s',
                background: activeTab === tab.id ? 'linear-gradient(135deg, #3b82f6, #6366f1)' : 'transparent',
                color: activeTab === tab.id ? '#fff' : '#64748b',
                boxShadow: activeTab === tab.id ? '0 4px 14px rgba(99,102,241,0.45)' : 'none',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* TOP STATS */}
        <TopStatBar />

        {/* ── OVERVIEW TAB ── */}
        {activeTab === 'overview' && (
          <>
            {/* Row 1: Video Upload + Signal Allocation */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: '20px', marginBottom: '20px' }}>
              <VideoUpload />
              <SignalAllocation />
            </div>

            {/* Row 2: Lane Density Cards (full width) */}
            <div style={{ marginBottom: '20px' }}>
              <LaneDensityCards />
            </div>

            {/* Row 3: Chart + Emergency */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '20px' }}>
              <DensityChart />
              <EmergencyVehicle />
            </div>
          </>
        )}

        {/* ── ANALYTICS TAB ── */}
        {activeTab === 'analytics' && (
          <>
            <div style={{ marginBottom: '20px' }}>
              <LaneDensityCards />
            </div>
            <DensityChart />
          </>
        )}

        {/* ── VIOLATIONS TAB ── */}
        {activeTab === 'violations' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: '20px' }}>
            <ViolationLogs />
            <LicensePlate />
          </div>
        )}

        {/* ── EMERGENCY TAB ── */}
        {activeTab === 'emergency' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <EmergencyVehicle />
            <SignalAllocation />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.05)', padding: '20px 24px', textAlign: 'center' }}>
        <p style={{ margin: 0, color: '#334155', fontSize: '0.75rem' }}>
          AI Traffic Signal Management System · ATMS v2.4 · All data is simulated for demonstration purposes
        </p>
      </footer>
    </div>
  );
};

export default App;
