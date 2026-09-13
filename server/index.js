'use strict';
/**
 * ST SOCIAL — server entry point.
 *  1. Open the database (schema auto-migrates).
 *  2. Seed demo community data if the DB is empty.
 *  3. Start the scheduled ingestion (event/town/university aggregation).
 *  4. Serve the API + the SPA on one port (same origin → works through the
 *     preview proxy and in the in-app viewer).
 */
const config = require('./config');
const app = require('./app');
const { seed } = require('./seed');
const scheduler = require('./aggregation/scheduler');

// Seed demo data on first boot.
seed();

// Start scheduled background jobs (runs an immediate ingest on boot).
scheduler.start();

const server = app.listen(config.port, config.host, () => {
  // eslint-disable-next-line no-console
  console.log(`\n  🌊 ST SOCIAL is running`);
  console.log(`  → http://localhost:${config.port}`);
  console.log(`  → demo mode: ${config.demoMode} · live sources: ${config.liveSources}`);
  console.log(`  → St Andrews, Fife, Scotland\n`);
});

process.on('SIGINT', () => { scheduler.stop(); server.close(() => process.exit(0)); });
process.on('SIGTERM', () => { scheduler.stop(); server.close(() => process.exit(0)); });
