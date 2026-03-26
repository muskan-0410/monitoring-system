// database/services/alertService.js
// Service layer for all alert-related database operations.
// Called by the backend's Event Emitter when a threshold is exceeded,
// and by the dashboard when fetching alert history.

'use strict';

const Alert = require('../models/alertModel');

// ─────────────────────────────────────────────
// WRITE OPERATIONS
// ─────────────────────────────────────────────

/**
 * Insert a new alert document.
 * Called by the Node.js Event Emitter in the backend when a metric
 * exceeds a configured threshold.
 *
 * @param {Object} data
 * @param {string} data.type       - One of: "CPU", "MEMORY", "DISK"
 * @param {number} data.value      - Actual metric value that triggered the alert
 * @param {number} data.threshold  - Configured threshold that was exceeded
 * @param {Date}   [data.triggeredAt] - Defaults to now
 * @returns {Promise<Object>} Saved alert document (plain object)
 */
async function insertAlert(data) {
  if (!data.type || data.value == null || data.threshold == null) {
    throw new Error('[alertService] insertAlert: type, value, and threshold are required.');
  }

  const alert = new Alert({
    type: data.type.toUpperCase(),
    value: data.value,
    threshold: data.threshold,
    triggeredAt: data.triggeredAt || new Date(),
    resolved: false,
    resolvedAt: null,
  });

  const saved = await alert.save();
  return saved.toObject();
}

/**
 * Mark an alert as resolved by its MongoDB _id.
 * Called when the metric drops back below threshold.
 *
 * @param {string} alertId - MongoDB ObjectId string
 * @returns {Promise<Object|null>} Updated alert document, or null if not found
 */
async function resolveAlert(alertId) {
  const updated = await Alert.findByIdAndUpdate(
    alertId,
    { resolved: true, resolvedAt: new Date() },
    { new: true }
  ).lean();
  return updated;
}

// ─────────────────────────────────────────────
// READ OPERATIONS
// ─────────────────────────────────────────────

/**
 * Fetch all alerts (resolved and unresolved), newest first.
 * Used by the dashboard alert history panel.
 *
 * @param {number} [limit=50] - Max records to return
 * @returns {Promise<Object[]>}
 */
async function getAlerts(limit = 50) {
  const alerts = await Alert
    .find({})
    .sort({ triggeredAt: -1 })
    .limit(limit)
    .lean();
  return alerts;
}

/**
 * Fetch only active (unresolved) alerts.
 * Used by the backend before firing a new alert to prevent duplicates,
 * and by the dashboard for live alert banners.
 *
 * @param {string} [type] - Optional: filter by "CPU", "MEMORY", or "DISK"
 * @returns {Promise<Object[]>}
 */
async function getActiveAlerts(type) {
  const query = { resolved: false };
  if (type) query.type = type.toUpperCase();

  const alerts = await Alert
    .find(query)
    .sort({ triggeredAt: -1 })
    .lean();
  return alerts;
}

/**
 * Fetch alerts within a specific time range.
 * Useful for dashboard historical analysis.
 *
 * @param {Date} from
 * @param {Date} [to=now]
 * @param {number} [limit=200]
 * @returns {Promise<Object[]>}
 */
async function getAlertsByRange(from, to = new Date(), limit = 200) {
  if (!from) throw new Error('[alertService] getAlertsByRange: `from` date is required.');

  const alerts = await Alert
    .find({ triggeredAt: { $gte: from, $lte: to } })
    .sort({ triggeredAt: -1 })
    .limit(limit)
    .lean();
  return alerts;
}

/**
 * Count all unresolved alerts (for dashboard summary widget).
 * @returns {Promise<number>}
 */
async function countActiveAlerts() {
  return Alert.countDocuments({ resolved: false });
}

module.exports = {
  insertAlert,
  resolveAlert,
  getAlerts,
  getActiveAlerts,
  getAlertsByRange,
  countActiveAlerts,
};
