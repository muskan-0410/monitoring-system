// database/test.js
// Simulates the full data flow:
//   1. Backend shell script pushes metrics → insertMetric()
//   2. Event Emitter fires alerts → insertAlert()
//   3. Dashboard fetches recent metrics and alert history
//   4. Alert is resolved (metric drops below threshold)
//
// Run with: node test.js
// Requires MongoDB running at MONGO_URI (default: localhost:27017/monitoring_db)

'use strict';

require('dotenv').config();

const { connectDB, disconnectDB } = require('./db');
const { insertMetric, getRecentMetrics, getMetricsByRange, getLatestMetric } = require('./services/metricService');
const { insertAlert, resolveAlert, getAlerts, getActiveAlerts } = require('./services/alertService');
const Config = require('./models/configModel');

// ── Helpers ──────────────────────────────────────────────────────────────────

function printSection(title) {
  console.log('\n' + '═'.repeat(55));
  console.log(`  ${title}`);
  console.log('═'.repeat(55));
}

function printJSON(label, data) {
  console.log(`\n[${label}]`);
  console.log(JSON.stringify(data, null, 2));
}

// ── Main Test Runner ──────────────────────────────────────────────────────────

async function runTests() {
  // 1. Connect to MongoDB
  printSection('STEP 1 — Connect to MongoDB');
  await connectDB();

  // ── 2. Seed/verify active config ─────────────────────────────────────────
  printSection('STEP 2 — Load Active Config');
  const config = await Config.getActive('default');
  printJSON('Active Config', {
    name: config.name,
    cpuThreshold: config.cpuThreshold,
    memoryThreshold: config.memoryThreshold,
    diskThreshold: config.diskThreshold,
    retentionDays: config.retentionDays,
    alertCooldownSeconds: config.alertCooldownSeconds,
  });

  // ── 3. Simulate incoming metrics from shell script ────────────────────────
  printSection('STEP 3 — Insert Simulated Metrics');

  // Batch of metrics as if received over time from the backend
  const mockMetrics = [
    { cpu: 45, memory: 55, disk: 30 },  // normal
    { cpu: 72, memory: 60, disk: 35 },  // normal, cpu approaching
    { cpu: 85, memory: 78, disk: 40 },  // cpu + memory breach threshold
    { cpu: 91, memory: 82, disk: 88 },  // all three high
    { cpu: 50, memory: 55, disk: 42 },  // recovery
  ];

  const insertedMetrics = [];
  for (const m of mockMetrics) {
    const saved = await insertMetric(m);
    insertedMetrics.push(saved);
    console.log(`  ✔ Inserted metric — cpu: ${m.cpu}%  mem: ${m.memory}%  disk: ${m.disk}%`);
  }

  // ── 4. Simulate alerts fired by Event Emitter ─────────────────────────────
  printSection('STEP 4 — Insert Simulated Alerts');

  const mockAlerts = [
    { type: 'CPU',    value: 85, threshold: config.cpuThreshold },
    { type: 'MEMORY', value: 78, threshold: config.memoryThreshold },
    { type: 'CPU',    value: 91, threshold: config.cpuThreshold },
    { type: 'DISK',   value: 88, threshold: config.diskThreshold },
    { type: 'MEMORY', value: 82, threshold: config.memoryThreshold },
  ];

  const insertedAlerts = [];
  for (const a of mockAlerts) {
    const saved = await insertAlert(a);
    insertedAlerts.push(saved);
    console.log(`  ✔ Alert — [${a.type}] value: ${a.value}%  threshold: ${a.threshold}%  id: ${saved._id}`);
  }

  // ── 5. Resolve one alert (metric recovered) ───────────────────────────────
  printSection('STEP 5 — Resolve an Alert');
  const alertToResolve = insertedAlerts[0];
  const resolved = await resolveAlert(alertToResolve._id.toString());
  console.log(`\n  ✔ Resolved alert ID: ${resolved._id}`);
  console.log(`    type: ${resolved.type} | resolved: ${resolved.resolved} | resolvedAt: ${resolved.resolvedAt}`);

  // ── 6. Fetch recent metrics (dashboard real-time graph) ───────────────────
  printSection('STEP 6 — Fetch Recent Metrics (last 5)');
  const recentMetrics = await getRecentMetrics(5);
  printJSON('Recent Metrics', recentMetrics.map(m => ({
    cpu: m.cpu,
    memory: m.memory,
    disk: m.disk,
    timestamp: m.timestamp,
  })));

  // ── 7. Fetch latest single metric ─────────────────────────────────────────
  printSection('STEP 7 — Fetch Latest Metric Snapshot');
  const latest = await getLatestMetric();
  printJSON('Latest Metric', { cpu: latest.cpu, memory: latest.memory, disk: latest.disk });

  // ── 8. Fetch metrics in a time range (dashboard historical graph) ─────────
  printSection('STEP 8 — Fetch Metrics by Time Range (last 1 hour)');
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const rangeMetrics = await getMetricsByRange(oneHourAgo);
  console.log(`\n  ✔ Metrics in range: ${rangeMetrics.length} record(s)`);

  // ── 9. Fetch full alert history ───────────────────────────────────────────
  printSection('STEP 9 — Fetch Alert History');
  const allAlerts = await getAlerts(10);
  printJSON('Alert History', allAlerts.map(a => ({
    type: a.type,
    value: a.value,
    threshold: a.threshold,
    resolved: a.resolved,
    triggeredAt: a.triggeredAt,
  })));

  // ── 10. Fetch only active alerts ──────────────────────────────────────────
  printSection('STEP 10 — Fetch Active (Unresolved) Alerts');
  const activeAlerts = await getActiveAlerts();
  console.log(`\n  ✔ Active alerts: ${activeAlerts.length}`);
  activeAlerts.forEach(a => {
    console.log(`    [${a.type}] value: ${a.value}%  threshold: ${a.threshold}%`);
  });

  // ── Done ──────────────────────────────────────────────────────────────────
  printSection('ALL TESTS PASSED ✅');
  console.log('\n  The database module is ready to integrate with:');
  console.log('  • Backend WebSocket server (push metrics → insertMetric)');
  console.log('  • Event Emitter alert handler (fire → insertAlert)');
  console.log('  • Dashboard API routes (GET /metrics, GET /alerts)\n');

  await disconnectDB();
}

runTests().catch(async (err) => {
  console.error('\n[TEST ERROR]', err.message);
  await disconnectDB();
  process.exit(1);
});
