'use strict';
/**
 * Central configuration. All secrets/API keys come from environment variables.
 * Nothing sensitive is ever hard-coded or sent to the frontend.
 */

const path = require('path');

function bool(v, def = false) {
  if (v === undefined || v === null || v === '') return def;
  return ['1', 'true', 'yes', 'on'].includes(String(v).toLowerCase());
}
function int(v, def) {
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : def;
}

const config = {
  env: process.env.NODE_ENV || 'development',
  port: int(process.env.PORT, 3000),
  host: process.env.HOST || '0.0.0.0',

  dataDir: process.env.DATA_DIR || path.join(__dirname, '..', 'data'),
  dbFile: process.env.DB_FILE || path.join(__dirname, '..', 'data', 'stsocial.db'),

  // Auth
  authSecret: process.env.AUTH_SECRET || 'st-social-dev-secret-change-me',
  sessionTtlMs: int(process.env.SESSION_TTL_MS, 1000 * 60 * 60 * 24 * 30), // 30 days

  // Ingest API key used by approved external systems pushing events to /api/ingest/*
  ingestApiKey: process.env.INGEST_API_KEY || 'st-social-ingest-dev-key',

  // University email domains that auto-verify a student.
  verifiedEmailDomains: (process.env.VERIFIED_EMAIL_DOMAINS || 'st-andrews.ac.uk,students.st-andrews.ac.uk,ac.st-andrews.ac.uk')
    .split(',').map((s) => s.trim().toLowerCase()).filter(Boolean),

  // Aggregation scheduling (ms)
  ingestIntervalMs: int(process.env.INGEST_INTERVAL_MS, 5 * 60 * 1000), // every 5 min
  demoMode: bool(process.env.STSSOCIAL_DEMO_MODE, true), // DEMO DATA on by default (no invented live data)
  liveSources: bool(process.env.STSSOCIAL_LIVE_SOURCES, false), // attempt real fetches when true

  // How often (ms) the demo feed "goes live" with a new sample item so the app feels alive.
  demoAliveIntervalMs: int(process.env.DEMO_ALIVE_INTERVAL_MS, 90 * 1000),

  // Where the live preview may be served from (CORS for API, if ever split)
  corsOrigin: process.env.CORS_ORIGIN || '*',
};

module.exports = config;
