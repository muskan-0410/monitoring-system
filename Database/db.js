// database/db.js
// Central MongoDB connection manager using Mongoose.
// Import this once in your backend's entry point (e.g. server.js).

'use strict';

require('dotenv').config();
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/monitoring_db';

// Connection options
const CONNECTION_OPTIONS = {
  serverSelectionTimeoutMS: 5000, // fail fast in dev
  socketTimeoutMS: 45000,
};

/**
 * Connect to MongoDB.
 * Call once at application startup.
 * @returns {Promise<void>}
 */
async function connectDB() {
  if (mongoose.connection.readyState === 1) {
    console.log('[DB] Already connected.');
    return;
  }

  try {
    await mongoose.connect(MONGO_URI, CONNECTION_OPTIONS);
    console.log(`[DB] Connected to MongoDB at: ${MONGO_URI}`);
  } catch (err) {
    console.error('[DB] Connection error:', err.message);
    throw err;
  }
}

/**
 * Gracefully close the MongoDB connection.
 * Call during application shutdown or after tests.
 * @returns {Promise<void>}
 */
async function disconnectDB() {
  if (mongoose.connection.readyState === 0) {
    return;
  }
  await mongoose.disconnect();
  console.log('[DB] Disconnected from MongoDB.');
}

// Log key lifecycle events
mongoose.connection.on('disconnected', () => {
  console.warn('[DB] MongoDB disconnected.');
});

mongoose.connection.on('reconnected', () => {
  console.log('[DB] MongoDB reconnected.');
});

module.exports = { connectDB, disconnectDB };
