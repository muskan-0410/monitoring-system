// database/services/metricService.js
// Service layer for all metric-related database operations.
// Called by the backend when shell scripts push new metrics,
// and by the dashboard when fetching data for graphs.

'use strict';

const Metric = require('../models/metricModel');

// ─────────────────────────────────────────────
// WRITE OPERATIONS
// ─────────────────────────────────────────────

/**
 * Insert a single metric document.
 * Called by the backend each time the shell script reports metrics.
 *
 * @param {Object} data - Metric payload from backend
 * @param {number} data.cpu    - CPU usage percent (0–100)
 * @param {number} data.memory - Memory usage percent (0–100)
 * @param {number} data.disk   - Disk usage percent (0–100)
 * @param {Date}   [data.timestamp] - Defaults to now if not provided
 * @returns {Promise<Object>} Saved Mongoose document (plain object)
 */
async function insertMetric(data) {
  if (
    data.cpu == null ||
    data.memory == null ||
    data.disk == null
  ) {
    throw new Error('[metricService] insertMetric: cpu, memory, and disk are required.');
  }

  const metric = new Metric({
    cpu: data.cpu,
    memory: data.memory,
    disk: data.disk,
    timestamp: data.timestamp || new Date(),
  });

  const saved = await metric.save();
  return saved.toObject();
}

// ─────────────────────────────────────────────
// READ OPERATIONS
// ─────────────────────────────────────────────

/**
 * Fetch the most recent N metric records.
 * Used by the dashboard for real-time graphs.
 *
 * @param {number} [limit=10] - Number of records to return
 * @returns {Promise<Object[]>} Array of metric objects, newest first
 */
async function getRecentMetrics(limit = 10) {
  const metrics = await Metric
    .find({})
    .sort({ timestamp: -1 })
    .limit(limit)
    .lean(); // .lean() returns plain JS objects — faster for read-only use
  return metrics;
}

/**
 * Fetch metrics within a time range.
 * Used by the dashboard for historical analysis graphs.
 *
 * @param {Date} from - Start of range (inclusive)
 * @param {Date} to   - End of range (inclusive), defaults to now
 * @param {number} [limit=500] - Max records to return
 * @returns {Promise<Object[]>} Array of metric objects, oldest first
 */
async function getMetricsByRange(from, to = new Date(), limit = 500) {
  if (!from) throw new Error('[metricService] getMetricsByRange: `from` date is required.');

  const metrics = await Metric
    .find({ timestamp: { $gte: from, $lte: to } })
    .sort({ timestamp: 1 })
    .limit(limit)
    .lean();
  return metrics;
}

/**
 * Get the single most recent metric snapshot.
 * Useful for the backend to compare against thresholds before firing alerts.
 *
 * @returns {Promise<Object|null>}
 */
async function getLatestMetric() {
  const metric = await Metric
    .findOne({})
    .sort({ timestamp: -1 })
    .lean();
  return metric;
}

/**
 * Count total metrics stored (useful for health-check endpoints).
 * @returns {Promise<number>}
 */
async function countMetrics() {
  return Metric.countDocuments();
}

module.exports = {
  insertMetric,
  getRecentMetrics,
  getMetricsByRange,
  getLatestMetric,
  countMetrics,
};
