'use strict';
/**
 * Scheduled background jobs.
 *
 *  - ingestion: fetches every enabled source, categorises, de-duplicates and
 *    publishes. Runs once on boot and then on a fixed interval.
 *  - demo alive ticker (demo mode only): occasionally injects a fresh, clearly
 *    sample event/update so the home feed feels alive between real refreshes.
 */
const config = require('../config');
const sources = require('./sources');
const { runIngest } = require('./pipeline');
const { demoLiveEvent, demoTownUpdates } = require('./demoData');
const { upsertEvent } = require('./pipeline');
const { db } = require('../db');
const { toMs, sha1 } = require('../util');

let ingestTimer = null;
let aliveTimer = null;
let liveCount = 0;

async function tick() {
  try {
    const summary = await runIngest('scheduled');
    if (process.env.STSSOCIAL_LOG !== 'off') {
      // eslint-disable-next-line no-console
      console.log(`[ingest] ${summary.sources.length} sources · +${summary.eventsAdded} new · ${summary.eventsMerged} merged · ${summary.tookMs}ms`);
    }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('[ingest] error:', e.message);
  }
}

function aliveTick() {
  if (!config.demoMode) return;
  const { adapterFor } = sources;
  // Find (or create) a community feed source to attribute the sample to.
  let row = db.prepare(`SELECT * FROM event_sources WHERE type = 'events_feed' AND enabled = 1 ORDER BY id LIMIT 1`).get();
  if (!row) {
    row = db.prepare(`INSERT INTO event_sources (name, type, url, reliability, config, enabled, created_at) VALUES ('ST SOCIAL Live Feed', 'events_feed', '', 4, '{}', 1, ?)`).run(Date.now());
    row = db.prepare(`SELECT * FROM event_sources WHERE id = ?`).get(row.lastInsertRowid);
  }
  liveCount += 1;
  const item = demoLiveEvent(liveCount);
  const adapter = adapterFor(row);
  // Tag with the counter so each tick is a distinct, still-sample event.
  item.title = item.title.replace('(just posted)', `(just posted · #${liveCount})`);
  upsertEvent(item, row, adapter);
  if (process.env.STSSOCIAL_LOG !== 'off') console.log(`[alive] new sample event: ${item.title}`);
}

function start() {
  sources.seedSources();
  tick();
  if (config.ingestIntervalMs > 0) ingestTimer = setInterval(tick, config.ingestIntervalMs);
  if (config.demoMode && config.demoAliveIntervalMs > 0) aliveTimer = setInterval(aliveTick, config.demoAliveIntervalMs);
  // eslint-disable-next-line no-console
  console.log(`[scheduler] ingestion every ${Math.round(config.ingestIntervalMs / 60000)} min · demo=${config.demoMode} · live=${config.liveSources}`);
}

function stop() {
  if (ingestTimer) clearInterval(ingestTimer);
  if (aliveTimer) clearInterval(aliveTimer);
}

module.exports = { start, stop, tick, aliveTick };
