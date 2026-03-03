import React, { useState } from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    LineElement,
    PointElement,
    Title,
    Tooltip,
    Legend,
    Filler,
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';
import { chartHistoryData, laneDensityData } from '../data/dummyData';

ChartJS.register(
    CategoryScale, LinearScale, BarElement, LineElement,
    PointElement, Title, Tooltip, Legend, Filler
);

const laneColors = {
    North: { border: '#3b82f6', bg: 'rgba(59,130,246,0.15)' },
    South: { border: '#10b981', bg: 'rgba(16,185,129,0.15)' },
    East: { border: '#ef4444', bg: 'rgba(239,68,68,0.15)' },
    West: { border: '#f59e0b', bg: 'rgba(245,158,11,0.15)' },
};

const baseChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 600, easing: 'easeInOutQuart' },
    plugins: {
        legend: {
            position: 'top',
            labels: {
                color: '#94a3b8',
                font: { size: 11, family: 'Inter, system-ui, sans-serif', weight: '600' },
                boxWidth: 12,
                boxHeight: 12,
                borderRadius: 4,
                padding: 16,
            },
        },
        tooltip: {
            backgroundColor: 'rgba(13, 21, 40, 0.95)',
            borderColor: 'rgba(59,130,246,0.3)',
            borderWidth: 1,
            titleColor: '#e2e8f0',
            bodyColor: '#94a3b8',
            padding: 12,
            callbacks: {
                label: (ctx) => ` ${ctx.dataset.label}: ${ctx.raw}%`,
            },
        },
    },
    scales: {
        x: {
            grid: { color: 'rgba(255,255,255,0.04)', drawBorder: false },
            ticks: { color: '#64748b', font: { size: 10 } },
            border: { color: 'transparent' },
        },
        y: {
            min: 0,
            max: 100,
            grid: { color: 'rgba(255,255,255,0.05)', drawBorder: false },
            ticks: {
                color: '#64748b',
                font: { size: 10 },
                callback: (v) => v + '%',
                stepSize: 25,
            },
            border: { color: 'transparent' },
        },
    },
};

const DensityChart = () => {
    const [chartType, setChartType] = useState('bar');

    // Bar chart – current snapshot
    const barData = {
        labels: laneDensityData.map((l) => l.name),
        datasets: [
            {
                label: 'Vehicle Density',
                data: laneDensityData.map((l) => l.density),
                backgroundColor: [
                    'rgba(59,130,246,0.7)',
                    'rgba(16,185,129,0.7)',
                    'rgba(239,68,68,0.7)',
                    'rgba(245,158,11,0.7)',
                ],
                borderColor: ['#3b82f6', '#10b981', '#ef4444', '#f59e0b'],
                borderWidth: 2,
                borderRadius: 8,
                borderSkipped: false,
            },
        ],
    };

    // Line chart – historical trend
    const lineData = {
        labels: chartHistoryData.labels,
        datasets: [
            { label: 'North Lane', data: chartHistoryData.north, borderColor: laneColors.North.border, backgroundColor: laneColors.North.bg, tension: 0.4, fill: true, pointRadius: 3, pointHoverRadius: 6, borderWidth: 2 },
            { label: 'South Lane', data: chartHistoryData.south, borderColor: laneColors.South.border, backgroundColor: laneColors.South.bg, tension: 0.4, fill: true, pointRadius: 3, pointHoverRadius: 6, borderWidth: 2 },
            { label: 'East Lane', data: chartHistoryData.east, borderColor: laneColors.East.border, backgroundColor: laneColors.East.bg, tension: 0.4, fill: true, pointRadius: 3, pointHoverRadius: 6, borderWidth: 2 },
            { label: 'West Lane', data: chartHistoryData.west, borderColor: laneColors.West.border, backgroundColor: laneColors.West.bg, tension: 0.4, fill: true, pointRadius: 3, pointHoverRadius: 6, borderWidth: 2 },
        ],
    };

    return (
        <div className="glass-card animate-fade-in-up animate-delay-3" style={{ padding: '24px' }}>
            {/* Header */}
            <div className="section-header">
                <div className="section-header-icon" style={{ background: 'linear-gradient(135deg, #6366f120, #3b82f630)' }}>
                    📊
                </div>
                <div>
                    <div className="section-title">Density Analytics</div>
                    <div className="section-subtitle">
                        {chartType === 'bar' ? 'Current snapshot across all lanes' : 'Historical trend over last 20 minutes'}
                    </div>
                </div>
                {/* Toggle */}
                <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px', padding: '4px', background: 'rgba(255,255,255,0.04)', borderRadius: '9px' }}>
                    {[
                        { key: 'bar', label: '▊ Bar' },
                        { key: 'line', label: '╱ Line' },
                    ].map(({ key, label }) => (
                        <button
                            key={key}
                            onClick={() => setChartType(key)}
                            style={{
                                padding: '6px 14px',
                                borderRadius: '7px',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                transition: 'all 0.2s',
                                background: chartType === key ? 'linear-gradient(135deg, #3b82f6, #6366f1)' : 'transparent',
                                color: chartType === key ? '#fff' : '#64748b',
                                boxShadow: chartType === key ? '0 2px 10px rgba(99,102,241,0.4)' : 'none',
                            }}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Chart Area */}
            <div style={{ height: '280px', position: 'relative' }}>
                {chartType === 'bar'
                    ? <Bar data={barData} options={baseChartOptions} />
                    : <Line data={lineData} options={baseChartOptions} />
                }
            </div>

            {/* Summary row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginTop: '18px', paddingTop: '18px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                {laneDensityData.map((lane) => {
                    const colors = Object.values(laneColors);
                    const c = colors[lane.id - 1];
                    return (
                        <div key={lane.id} style={{ textAlign: 'center' }}>
                            <div style={{ width: '28px', height: '4px', background: c.border, borderRadius: '2px', margin: '0 auto 6px' }} />
                            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: c.border }}>{lane.density}%</div>
                            <div style={{ fontSize: '0.68rem', color: '#64748b' }}>{lane.name}</div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default DensityChart;
