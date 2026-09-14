'use strict';
/**
 * Ingestion pipeline.
 *
 *   Fetch approved sources  →  normalise  →  categorise  →  de-duplicate
 *   →  merge duplicates (keep the most reliable source as primary)  →  publish
 *
 * Events, town updates and university updates each have their own upsert path.
 * The whole run is idempotent: running it again merges rather than duplicates.
 */
const { db, metaGet, metaSet } = require('../db');
const config = require('../config');
const { categorize } = require('./categorize');
const { makeKey, fuzzyMatches } = require('./dedupe');
const { toMs, categoryById } = require('../util');
const sources = require('./sources');

const DAY = 86400000;

function sourceTypeFor(adapter, reliability) {
  if (adapter.produces === 'university') return 'university';
  if (reliability >= 7) return 'verified';
  return 'community';
}

function upsertEvent(item, row, adapter) {
  const now = Date.now();
  const date = item.date || new Date().toISOString().slice(0, 10);
  const startTime = item.startTime || '12:00';
  const startMs = toMs(date, startTime);
  const category = categorize(item.title, item.description, item.category);
  const key = makeKey(item.title, date);
  const reliability = item.reliability != null ? item.reliability : (adapter.reliability || row.reliability);
  const srcType = sourceTypeFor(adapter, reliability);
  const isDemo = adapter.isDemoSource ? 1 : 0;

  const incoming = {
    title: (item.title || 'Untitled').slice(0, 160),
    description: (item.description || '').slice(0, 1200),
    date, startTime,
    endTime: item.endTime || null,
    location: (item.location || 'St Andrews').slice(0, 120),
    address: item.address || 'St Andrews, Fife',
    category,
    price: item.price || null,
    ticketUrl: item.ticketUrl || item.link || null,
    organizer: (item.organizer || row.name).slice(0, 120),
    image: item.image || null,
    emoji: item.emoji || categoryById(category).emoji,
    lat: item.location && item.location.lat != null ? item.location.lat : null,
    lng: item.location && item.location.lng != null ? item.location.lng : null,
    reliability, srcType,
    sourceName: row.name,
    sourceUrl: item.sourceUrl || row.url || null,
  };

  let existing = db.prepare(`SELECT * FROM events WHERE dedup_key = ? AND status != 'removed' LIMIT 1`).get(key);
  if (!existing) {
    const cands = db.prepare(`SELECT * FROM events WHERE start_ms BETWEEN ? AND ? AND status != 'removed'`)
      .all(now - 3 * DAY, now + 21 * DAY);
    existing = cands.find((c) => fuzzyMatches(c, { title: incoming.title, date })) || null;
  }

  if (existing) {
    const srcList = JSON.parse(existing.sources || '[]');
    if (!srcList.some((s) => s.name === row.name)) srcList.push({ name: row.name, url: incoming.sourceUrl });
    // Promote to the most reliable source when a better one appears.
    if (reliability > (existing.reliability || 0)) {
      db.prepare(`
        UPDATE events SET
          title=?, description=?, category=?, price=?, ticket_url=?, organizer=?,
          image=?, emoji=?, location=?, address=?, end_time=?,
          source_type=?, source_name=?, source_url=?, reliability=?,
          sources=?, featured=?, updated_at=?
        WHERE id=?
      `).run(
        incoming.title, incoming.description || existing.description, incoming.category,
        incoming.price || existing.price, incoming.ticketUrl || existing.ticket_url, incoming.organizer,
        incoming.image || existing.image, incoming.emoji, incoming.location, incoming.address, incoming.endTime,
        incoming.srcType, incoming.sourceName, incoming.sourceUrl, reliability,
        JSON.stringify(srcList), item.featured ? 1 : (existing.featured || 0), now, existing.id,
      );
    } else {
      db.prepare('UPDATE events SET sources=?, featured=? WHERE id=?')
        .run(JSON.stringify(srcList), item.featured ? 1 : (existing.featured || 0), existing.id);
    }
    return { id: existing.id, merged: true };
  }

  const res = db.prepare(`
    INSERT INTO events
      (title, description, category, date, start_time, end_time, start_ms, location, address,
       lat, lng, price, ticket_url, organizer, image, emoji, reliability, source_type,
       source_id, source_name, source_url, dedup_key, sources,
       featured, approved, status, is_demo, created_at)
    VALUES
      (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,1,'published',?,?)
  `).run(
    incoming.title, incoming.description, incoming.category, date, startTime, incoming.endTime, startMs,
    incoming.location, incoming.address, incoming.lat, incoming.lng, incoming.price, incoming.ticketUrl,
    incoming.organizer, incoming.image, incoming.emoji, reliability, incoming.srcType,
    row.id, incoming.sourceName, incoming.sourceUrl, key, JSON.stringify([{ name: row.name, url: incoming.sourceUrl }]),
    item.featured ? 1 : 0, isDemo, now,
  );
  return { id: res.lastInsertRowid, merged: false };
}

function upsertTown(item, row, adapter) {
  const now = Date.now();
  const date = item.date || new Date().toISOString().slice(0, 10);
  const key = require('../util').sha1(`${row.id}:${item.category}:${(item.title || '').toLowerCase()}:${date.slice(5)}`);
  const exists = db.prepare('SELECT id FROM town_updates WHERE dedup_key = ?').get(key);
  if (exists) return { merged: true, id: exists.id };
  const res = db.prepare('INSERT INTO town_updates (category, title, body, source_name, source_url, verified, dedup_key, created_at, is_demo) VALUES (?,?,?,?,?,?,?,?,?)')
    .run(item.category, item.title, item.body || '', row.name, item.sourceUrl || row.url || null, row.reliability >= 7 ? 1 : 0, key, now, adapter && adapter.isDemoSource ? 1 : 0);
  return { merged: false, id: res.lastInsertRowid };
}

function upsertUniversity(item, row, adapter) {
  const now = Date.now();
  const date = item.date || new Date().toISOString().slice(0, 10);
  const key = require('../util').sha1(`${row.id}:${item.category}:${(item.title || '').toLowerCase()}:${date.slice(5)}`);
  const exists = db.prepare('SELECT id FROM university_updates WHERE dedup_key = ?').get(key);
  if (exists) return { merged: true, id: exists.id };
  const res = db.prepare('INSERT INTO university_updates (category, title, body, source_name, source_url, important, dedup_key, created_at, is_demo) VALUES (?,?,?,?,?,?,?,?,?)')
    .run(item.category, item.title, item.body || '', row.name, item.sourceUrl || row.url || null, item.important ? 1 : 0, key, now, adapter && adapter.isDemoSource ? 1 : 0);
  return { merged: false, id: res.lastInsertRowid };
}

async function runIngest(reason = 'scheduled') {
  const started = Date.now();
  const summary = { started, reason, eventsAdded: 0, eventsMerged: 0, townAdded: 0, uniAdded: 0, sources: [] };
  for (const row of sources.enabledSources()) {
    const rowCfg = JSON.parse(row.config || '{}');
    const adapter = sources.adapterFor(row);
    if (!adapter) continue;
    // In live-only mode, sample-data generators produce nothing.
    if (adapter.isDemoSource && !config.demoMode) { sources.markRun(row.id, 0); continue; }
    if (rowCfg.produces) adapter.produces = rowCfg.produces;
    let items = [];
    try {
      items = (await adapter.fetch({ url: row.url, ...rowCfg }, config.liveSources)) || [];
    } catch (e) {
      // A failing source never breaks the run; log and move on.
      sources.markRun(row.id, 0);
      summary.sources.push({ id: row.id, name: row.name, error: String(e.message || e), count: 0 });
      continue;
    }
    let added = 0; let merged = 0;
    for (const item of items) {
      const r = adapter.produces === 'events'
        ? upsertEvent(item, row, adapter)
        : adapter.produces === 'town'
          ? upsertTown(item, row, adapter)
          : upsertUniversity(item, row, adapter);
      if (r.merged) merged++; else added++;
      if (adapter.produces === 'events') { r.merged ? (summary.eventsMerged++) : (summary.eventsAdded++); }
      else if (adapter.produces === 'town') { if (!r.merged) summary.townAdded++; }
      else { if (!r.merged) summary.uniAdded++; }
    }
    sources.markRun(row.id, items.length);
    summary.sources.push({ id: row.id, name: row.name, produces: adapter.produces, count: items.length, added, merged });
  }
  summary.finished = Date.now();
  summary.tookMs = summary.finished - summary.started;
  metaSet('last_ingest_at', String(summary.finished));
  metaSet('last_ingest_summary', JSON.stringify({ eventsAdded: summary.eventsAdded, eventsMerged: summary.eventsMerged, tookMs: summary.tookMs, at: summary.finished }));
  // Prune demo data that is far in the past so the demo stays tidy.
  db.prepare(`DELETE FROM events WHERE is_demo = 1 AND status != 'removed' AND start_ms < ?`).run(Date.now() - 14 * DAY);
  // Prune stale live town/university updates so those pages stay current.
  db.prepare('DELETE FROM town_updates WHERE created_at < ?').run(Date.now() - 35 * DAY);
  db.prepare('DELETE FROM university_updates WHERE created_at < ?').run(Date.now() - 90 * DAY);
  return summary;
}

function lastIngest() {
  const at = parseInt(metaGet('last_ingest_at', '0'), 10);
  return at ? { at, agoMs: Date.now() - at } : null;
}

module.exports = { runIngest, lastIngest, upsertEvent, upsertTown, upsertUniversity };
