import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route } from 'react-router-dom';

import Home from './pages/Home';
import Header from './components/Header';
import VideoUpload from './components/VideoUpload';
import LaneDensityCards from './components/LaneDensityCards';
import SignalAllocation from './components/SignalAllocation';
import IntersectionSignals from './components/IntersectionSignals';
import DensityChart from './components/DensityChart';
import EmergencyVehicle from './components/EmergencyVehicle';
import LicensePlate from './components/LicensePlate';
import ViolationLogs from './components/ViolationLogs';
import { getDashboardSummary } from './api/index.js';


// ── Top stat bar ──────────────────────────────────────────────────────────────
const TopStatBar = ({ stats, videoStats }) => {
  const defaultStats = [
    { label: 'Total Vehicles Today', value: '—', icon: '🚗', color: '#3b82f6' },
    { label: 'Violations Detected', value: '—', icon: '⚠️', color: '#ef4444' },
    { label: 'Avg Wait Time', value: '—', icon: '⏱️', color: '#f59e0b' },
    { label: 'Signal Cycles', value: '—', icon: '🔄', color: '#10b981' },
    { label: 'Emergency Events', value: '—', icon: '🚨', color: '#ef4444' },
    { label: 'AI Model Uptime', value: '—', icon: '🤖', color: '#8b5cf6' },
  ];

  let display = (stats && stats.length) ? [...stats] : [...defaultStats];
  if (videoStats) {
    display = display.map((s) =>
      s.label === 'Total Vehicles Today'
        ? { ...s, value: String(videoStats.totalVehicles ?? '—'), icon: '📹' }
        : s
    );
  }

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(6, 1fr)',
      gap: '12px',
      marginBottom: '24px',
    }}>
      {display.map((s) => (
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

// ── API status badge ──────────────────────────────────────────────────────────
const ApiStatusBadge = ({ status }) => {
  const cfg = {
    connected: { color: '#10b981', label: 'API Connected' },
    error:     { color: '#ef4444', label: 'API Offline — using local data' },
    loading:   { color: '#f59e0b', label: 'Connecting…' },
  }[status] || { color: '#64748b', label: 'Unknown' };

  return (
    <div style={{
      position: 'fixed', bottom: 20, right: 20,
      display: 'flex', alignItems: 'center', gap: '7px',
      padding: '8px 14px',
      background: 'rgba(15,23,42,0.85)',
      border: `1px solid ${cfg.color}44`,
      borderRadius: '999px',
      backdropFilter: 'blur(10px)',
      zIndex: 9999,
      fontSize: '0.72rem',
      fontWeight: 600,
      color: cfg.color,
    }}>
      <span style={{
        width: 8, height: 8, borderRadius: '50%',
        background: cfg.color,
        boxShadow: status === 'connected' ? `0 0 8px ${cfg.color}` : 'none',
        animation: status === 'connected' ? 'pulse 2s infinite' : 'none',
      }} />
      {cfg.label}
    </div>
  );
};

// ── Dashboard (unchanged logic) ───────────────────────────────────────────────
const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [apiStatus, setApiStatus] = useState('loading');
  const [dashData, setDashData] = useState(null);
  const [detectionData, setDetectionData] = useState(null);

  const tabs = [
    { id: 'overview',   label: '🗺 Overview'  },
    { id: 'analytics',  label: '📊 Analytics' },
    { id: 'violations', label: '⚠️ Violations' },
    { id: 'emergency',  label: '🚨 Emergency' },
  ];

  const fetchDashboard = useCallback(async () => {
    try {
      const data = await getDashboardSummary();
      setDashData(data);
      setApiStatus('connected');
    } catch {
      setApiStatus('error');
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
    const interval = setInterval(fetchDashboard, 15000);
    return () => clearInterval(interval);
  }, [fetchDashboard]);

  const handleDetectionComplete = useCallback((results) => {
    setDetectionData(results);
  }, []);

  const laneDensityData = detectionData?.laneDetails    ?? dashData?.laneDensity;
  const signalData      = detectionData?.signalAllocation ?? dashData?.signalAllocation;
  const fromVideo       = !!detectionData?.fromVideo;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg-primary)' }}>
      <link
        href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap"
        rel="stylesheet"
      />

      <Header />

      <main style={{ maxWidth: '1600px', margin: '0 auto', padding: '28px 24px 48px' }}>

        {/* Video-detection banner */}
        {fromVideo && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '12px',
            padding: '12px 18px', marginBottom: '20px',
            background: 'rgba(16,185,129,0.08)',
            border: '1px solid rgba(16,185,129,0.25)',
            borderRadius: '12px',
          }}>
            <span style={{ fontSize: '1.1rem' }}>📹</span>
            <div style={{ flex: 1 }}>
              <span style={{ fontWeight: 700, color: '#10b981', fontSize: '0.85rem' }}>Live Video Analysis Active</span>
              <span style={{ fontSize: '0.78rem', color: '#64748b', marginLeft: '10px' }}>
                Lane Density and Signal Allocation panels are showing real YOLOv8 results from your uploaded video.
                {detectionData?.totalVehicles != null && ` ${detectionData.totalVehicles} vehicles detected.`}
              </span>
            </div>
            <button
              onClick={() => setDetectionData(null)}
              style={{
                padding: '5px 12px', background: 'rgba(255,255,255,0.05)',
                color: '#64748b', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 600,
              }}
            >
              Clear &amp; use live feed
            </button>
          </div>
        )}

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
        <TopStatBar stats={dashData?.topStats} videoStats={detectionData} />

        {/* ── OVERVIEW TAB ── */}
        {activeTab === 'overview' && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: '20px', marginBottom: '20px' }}>
              <VideoUpload onDetectionComplete={handleDetectionComplete} />
              <SignalAllocation liveData={signalData} fromVideo={fromVideo} />
            </div>

            {/* ── 4-Signal Intersection Cards ── */}
            <div style={{ marginBottom: '20px' }}>
              <IntersectionSignals liveData={signalData} fromVideo={fromVideo} />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <LaneDensityCards liveData={laneDensityData} fromVideo={fromVideo} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '20px' }}>
              <DensityChart liveData={dashData?.chartHistory} />
              <EmergencyVehicle liveData={dashData?.emergencyEvents} />
            </div>
          </>
        )}

        {/* ── ANALYTICS TAB ── */}
        {activeTab === 'analytics' && (
          <>
            <div style={{ marginBottom: '20px' }}>
              <IntersectionSignals liveData={signalData} fromVideo={fromVideo} />
            </div>
            <div style={{ marginBottom: '20px' }}>
              <LaneDensityCards liveData={laneDensityData} fromVideo={fromVideo} />
            </div>
            <DensityChart liveData={dashData?.chartHistory} />
          </>
        )}

        {/* ── VIOLATIONS TAB ── */}
        {activeTab === 'violations' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: '20px' }}>
            <ViolationLogs liveData={dashData?.violationLogs} />
            <LicensePlate liveData={dashData?.detectedPlates} />
          </div>
        )}

        {/* ── EMERGENCY TAB ── */}
        {activeTab === 'emergency' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <EmergencyVehicle liveData={dashData?.emergencyEvents} />
            <SignalAllocation liveData={signalData} fromVideo={fromVideo} />
          </div>
        )}
      </main>

      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.05)', padding: '20px 24px', textAlign: 'center' }}>
        <p style={{ margin: 0, color: '#334155', fontSize: '0.75rem' }}>
          AI Traffic Signal Management System · ATMS v2.4 · Backend: Flask + YOLOv8 · Formula: GreenTime = MIN + (count/total) × (MAX − MIN)
        </p>
      </footer>

      <ApiStatusBadge status={apiStatus} />

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
};

// ── Root App — only routing, no logic ────────────────────────────────────────
const App = () => (
  <Routes>
    <Route path="/"          element={<Home />} />
    <Route path="/dashboard" element={<Dashboard />} />
  </Routes>
);

export default App;
