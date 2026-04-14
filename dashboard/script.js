const CIRCUMFERENCE = 2 * Math.PI * 66;
let historicalData = {
    cpu: [],
    memory: [],
    disk: []
};
let chart = null;

function updateRing(ringId, value) {
    const ring = document.getElementById(ringId);
    const offset = CIRCUMFERENCE - (value / 100) * CIRCUMFERENCE;
    ring.style.strokeDashoffset = offset;
}

function getStatusText(value) {
    if (value < 30) return '✅ Excellent';
    if (value < 60) return '🟡 Good';
    if (value < 80) return '🟠 Warning';
    return '🔴 Critical';
}

function getStatusColor(value) {
    if (value < 30) return '#6bcf7f';
    if (value < 60) return '#ffd93d';
    if (value < 80) return '#ff9500';
    return '#ff6b6b';
}

function updateMetric(metricName, value) {
    const timestamp = new Date().toLocaleTimeString();

    // Update value display
    document.getElementById(`${metricName}Value`).textContent = Math.round(value) + '%';

    // Update ring
    updateRing(`${metricName}Ring`, value);

    // Update status
    const statusText = getStatusText(value);
    document.getElementById(`${metricName}Status`).textContent = statusText;

    // Update alerts — show high alert OR normal alert, not both
    const alert = document.getElementById(`${metricName}Alert`);
    const alertNormal = document.getElementById(`${metricName}Normal`);

    if (value > 80) {
        alert.classList.add('show');
        alertNormal.classList.remove('show');
    } else {
        alert.classList.remove('show');
        alertNormal.classList.add('show');
    }

    // Update time
    document.getElementById(`${metricName}Time`).textContent = `Last updated: ${timestamp}`;

    // Store historical data (keep last 20 entries)
    historicalData[metricName].push(value);
    if (historicalData[metricName].length > 20) {
        historicalData[metricName].shift();
    }

    updateChart();
}

function updateChart() {
    if (!chart) {
        const ctx = document.getElementById('performanceChart').getContext('2d');
        chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: Array.from({length: historicalData.cpu.length}, (_, i) => i + 1),
                datasets: [
                    {
                        label: 'CPU Usage',
                        data: historicalData.cpu,
                        borderColor: '#ff6b6b',
                        backgroundColor: 'rgba(255, 107, 107, 0.1)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.4,
                        pointRadius: 3,
                        pointBackgroundColor: '#ff6b6b',
                        pointBorderColor: 'rgba(255, 255, 255, 0.5)',
                        pointBorderWidth: 1
                    },
                    {
                        label: 'Memory Usage',
                        data: historicalData.memory,
                        borderColor: '#ffd93d',
                        backgroundColor: 'rgba(255, 217, 61, 0.1)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.4,
                        pointRadius: 3,
                        pointBackgroundColor: '#ffd93d',
                        pointBorderColor: 'rgba(255, 255, 255, 0.5)',
                        pointBorderWidth: 1
                    },
                    {
                        label: 'Disk Usage',
                        data: historicalData.disk,
                        borderColor: '#6bcf7f',
                        backgroundColor: 'rgba(107, 199, 127, 0.1)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.4,
                        pointRadius: 3,
                        pointBackgroundColor: '#6bcf7f',
                        pointBorderColor: 'rgba(255, 255, 255, 0.5)',
                        pointBorderWidth: 1
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: {
                            color: 'rgba(255, 255, 255, 0.8)',
                            font: { size: 12, weight: 'bold' }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        grid: { color: 'rgba(255, 255, 255, 0.1)' },
                        ticks: { color: 'rgba(255, 255, 255, 0.7)' }
                    },
                    x: {
                        grid: { color: 'rgba(255, 255, 255, 0.1)' },
                        ticks: { color: 'rgba(255, 255, 255, 0.7)' }
                    }
                }
            }
        });
    } else {
        chart.data.labels = Array.from({length: historicalData.cpu.length}, (_, i) => i + 1);
        chart.data.datasets[0].data = historicalData.cpu;
        chart.data.datasets[1].data = historicalData.memory;
        chart.data.datasets[2].data = historicalData.disk;
        chart.update();
    }
}

function connectWebSocket() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${protocol}//${window.location.host}`);

    ws.onopen = () => {
        document.getElementById('connectionStatus').textContent = '● Connected';
        document.getElementById('connectionStatus').classList.remove('offline');
    };

    ws.onmessage = (event) => {
        try {
            const data = JSON.parse(event.data);
            if (data.cpu !== undefined) updateMetric('cpu', data.cpu);
            if (data.memory !== undefined) updateMetric('memory', data.memory);
            if (data.disk !== undefined) updateMetric('disk', data.disk);
        } catch (e) {
            console.error('Error parsing WebSocket data:', e);
        }
    };

    ws.onerror = () => {
        document.getElementById('connectionStatus').textContent = '● Connection Error';
        document.getElementById('connectionStatus').classList.add('offline');
    };

    ws.onclose = () => {
        document.getElementById('connectionStatus').textContent = '● Disconnected';
        document.getElementById('connectionStatus').classList.add('offline');
        setTimeout(connectWebSocket, 3000);
    };
}

// Fallback: Update with simulated data if WebSocket fails
function startFallbackUpdates() {
    setInterval(() => {
        updateMetric('cpu', Math.floor(Math.random() * 85) + 5);
        updateMetric('memory', Math.floor(Math.random() * 75) + 10);
        updateMetric('disk', Math.floor(Math.random() * 70) + 15);
    }, 2000);
}

// Try WebSocket first, fallback to simulation
try {
    connectWebSocket();
    setTimeout(() => {
        if (!historicalData.cpu.length) {
            startFallbackUpdates();
        }
    }, 5000);
} catch (e) {
    console.log('WebSocket unavailable, using simulated data');
    startFallbackUpdates();
}