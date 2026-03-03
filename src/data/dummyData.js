// Dummy data for the dashboard
export const laneDensityData = [
    {
        id: 1,
        name: 'North Lane',
        density: 78,
        vehicleCount: 47,
        trend: 'up',
        status: 'high',
        congestionLevel: 'Heavy',
        avgSpeed: 18,
    },
    {
        id: 2,
        name: 'South Lane',
        density: 42,
        vehicleCount: 26,
        trend: 'down',
        status: 'moderate',
        congestionLevel: 'Moderate',
        avgSpeed: 34,
    },
    {
        id: 3,
        name: 'East Lane',
        density: 91,
        vehicleCount: 61,
        trend: 'up',
        status: 'critical',
        congestionLevel: 'Critical',
        avgSpeed: 8,
    },
    {
        id: 4,
        name: 'West Lane',
        density: 23,
        vehicleCount: 14,
        trend: 'stable',
        status: 'low',
        congestionLevel: 'Light',
        avgSpeed: 52,
    },
];

export const signalAllocationData = [
    { lane: 'North', greenTime: 45, phase: 'RED', nextChange: 12, priority: 'High' },
    { lane: 'South', greenTime: 30, phase: 'GREEN', nextChange: 8, priority: 'Medium' },
    { lane: 'East', greenTime: 60, phase: 'GREEN', nextChange: 22, priority: 'Critical' },
    { lane: 'West', greenTime: 20, phase: 'RED', nextChange: 35, priority: 'Low' },
];

export const violationLogs = [
    { id: 'V-001', type: 'Red Light Jump', lane: 'North Lane', time: '16:14:03', plate: 'MH12-AB-3456', severity: 'High' },
    { id: 'V-002', type: 'Over Speeding', lane: 'East Lane', time: '16:11:47', plate: 'DL09-CD-7890', severity: 'Medium' },
    { id: 'V-003', type: 'Wrong Way', lane: 'South Lane', time: '16:08:22', plate: 'KA05-EF-1234', severity: 'High' },
    { id: 'V-004', type: 'No Helmet', lane: 'West Lane', time: '16:05:58', plate: 'TN03-GH-5678', severity: 'Low' },
    { id: 'V-005', type: 'Lane Change', lane: 'North Lane', time: '15:59:31', plate: 'MH14-IJ-9012', severity: 'Low' },
];

export const emergencyEvents = [
    { id: 'E-001', type: 'Ambulance', lane: 'East Lane', status: 'Approaching', time: '16:17:01', eta: '~40s' },
    { id: 'E-002', type: 'Fire Truck', lane: 'North Lane', status: 'Cleared', time: '16:09:12', eta: 'Passed' },
];

export const detectedPlates = [
    { plate: 'MH12-AB-3456', lane: 'North', time: '16:17:44', type: 'Car', flagged: true },
    { plate: 'KA05-EF-1234', lane: 'South', time: '16:17:39', type: 'Bike', flagged: false },
    { plate: 'DL09-CD-7890', lane: 'East', time: '16:17:33', type: 'Truck', flagged: true },
    { plate: 'TN03-GH-5678', lane: 'West', time: '16:17:28', type: 'Car', flagged: false },
    { plate: 'UP16-KL-2345', lane: 'North', time: '16:17:21', type: 'Bus', flagged: false },
];

export const chartHistoryData = {
    labels: ['16:00', '16:02', '16:04', '16:06', '16:08', '16:10', '16:12', '16:14', '16:16', '16:18'],
    north: [55, 60, 65, 72, 80, 74, 78, 82, 79, 78],
    south: [30, 28, 35, 40, 44, 41, 38, 42, 40, 42],
    east: [60, 70, 75, 82, 88, 90, 87, 91, 93, 91],
    west: [20, 22, 18, 25, 24, 23, 21, 22, 24, 23],
};
