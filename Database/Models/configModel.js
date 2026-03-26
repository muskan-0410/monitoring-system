// database/models/configModel.js
// Stores system-wide threshold and retention configuration.
// Designed as a single-document config (singleton pattern via `name` field).
// Git branches (dev/prod) should seed different configs on startup.

'use strict';

const mongoose = require('mongoose');

const configSchema = new mongoose.Schema(
  {
    // Unique name identifies the environment config (e.g. "default", "dev", "prod")
    name: {
      type: String,
      required: true,
      unique: true,
      default: 'default',
    },

    // --- Thresholds (percent 0–100) ---
    cpuThreshold: {
      type: Number,
      required: true,
      min: 1,
      max: 100,
      default: 80,
    },
    memoryThreshold: {
      type: Number,
      required: true,
      min: 1,
      max: 100,
      default: 75,
    },
    diskThreshold: {
      type: Number,
      required: true,
      min: 1,
      max: 100,
      default: 90,
    },

    // --- Retention ---
    // How many days to keep metric records before TTL index removes them
    retentionDays: {
      type: Number,
      required: true,
      min: 1,
      default: 7,
    },

    // --- Exponential Backoff (alert spam prevention) ---
    // Minimum wait between repeated alerts for the same metric type (seconds)
    alertCooldownSeconds: {
      type: Number,
      default: 60,
    },
    // Maximum backoff cap (seconds)
    alertMaxBackoffSeconds: {
      type: Number,
      default: 3600,
    },

    // Timestamp of last update (useful for cache invalidation in the backend)
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    versionKey: false,
    collection: 'configs',
  }
);

// Auto-update `updatedAt` on every save
configSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

/**
 * Returns the active config document.
 * Uses `name: "default"` — swap for env-specific names (dev/prod) as needed.
 * Creates one with defaults if none exists (upsert).
 * @param {string} [name="default"]
 * @returns {Promise<Document>}
 */
configSchema.statics.getActive = async function (name = 'default') {
  return this.findOneAndUpdate(
    { name },
    { $setOnInsert: { name } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
};

const Config = mongoose.model('Config', configSchema);

module.exports = Config;
