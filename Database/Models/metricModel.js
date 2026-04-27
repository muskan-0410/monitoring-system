// database/models/metricModel.js
// Stores system metrics collected by shell scripts and forwarded by the backend.
// TTL index automatically purges documents older than `retentionDays` (default 7 days).

'use strict';

const mongoose = require('mongoose');

const TTL_SECONDS = parseInt(process.env.METRIC_TTL_SECONDS, 10) || 7 * 24 * 60 * 60; // 7 days

const metricSchema = new mongoose.Schema(
  {
    cpu: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    memory: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    disk: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    // Disables __v field to keep documents clean
    versionKey: false,
    // Consistent collection name
    collection: 'metrics',
  }
);

// TTL index — MongoDB automatically deletes documents after TTL_SECONDS
// from the `timestamp` field. Adjust via METRIC_TTL_SECONDS env var.
metricSchema.index({ timestamp: 1 }, { expireAfterSeconds: TTL_SECONDS });

// Compound index for efficient dashboard queries (latest-first by time)
metricSchema.index({ timestamp: -1 });

const Metric = mongoose.model('Metric', metricSchema);

module.exports = Metric;
