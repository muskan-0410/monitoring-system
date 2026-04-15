// Load DB env vars (create a .env in backend/ or point to Database/.env)
require('dotenv').config({ path: '../Database/.env' });

const { connectDB } = require('../Database/db');
const { insertMetric } = require('../Database/Services/metricService');
const { insertAlert } = require('../Database/Services/alertService');

require('./cron/monitorCron');
const wss = require('./websocket/wsServer');
const express = require('express');
const alertEmitter = require('./events/alertEmitter');

const app = express();
const PORT = 3000;

app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Monitoring backend is running' });
});

// Save metrics to DB whenever cron collects them
alertEmitter.on('thresholdBreach', async (alert) => {
  try {
    if (alert.type === 'SYSTEM_METRICS') {
      await insertMetric({ cpu: alert.cpu, memory: alert.memory, disk: alert.disk });
    } else {
      // alert.type will be CPU_ALERT, MEMORY_ALERT, etc.
      const metricType = alert.type.replace('_ALERT', '');
      await insertAlert({ type: metricType, value: alert.value, threshold: 80 });
    }
  } catch (err) {
    console.error('[DB] Failed to save:', err.message);
  }
});

// Connect to DB first, then start server
connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Monitoring backend started on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to connect to DB, exiting.', err.message);
    process.exit(1);
  });
