'use strict';
const { db } = require('../db');
const { AVAILABLE_SOURCE_TYPES, createAdapter } = require('./adapters');

/**
 * Seed the default, enabled sources the first time the app runs. Admins can
 * add, remove or toggle these afterwards (see admin routes).
 */
function seedSources() {
  const now = Date.now();
  const ins = db.prepare('INSERT INTO event_sources (name, type, url, reliability, config, enabled, created_at) VALUES (?, ?, ?, ?, ?, 1, ?)');
  const count = db.prepare('SELECT COUNT(*) c FROM event_sources').get().c;
  if (count === 0) {
    const defaults = [
      ['University of St Andrews', 'university', '', 10, '{}'],
      ["Students' Association & Societies", 'students_assoc', '', 8, '{}'],
      ['Local Venues & Restaurants', 'venue', '', 6, '{}'],
      ['St Andrews Community Feed', 'events_feed', '', 4, '{}'],
      ['St Andrews Town Feeds', 'town_feed', '', 8, '{}'],
      ['University Official Notices', 'university_feed', '', 10, '{}'],
    ];
    for (const d of defaults) ins.run(d[0], d[1], d[2], d[3], d[4], now);
  }
  // Real LIVE sources — added idempotently by URL so pre-existing databases
  // pick them up on next boot. These fetch genuinely public feeds.
  const live = [
    ['University of St Andrews — Official News', 'rss', 'https://news.st-andrews.ac.uk/feed', 10, '{"produces":"university","maxAgeDays":60}'],
    ['Transition St Andrews (community)', 'rss', 'https://transitionsta.org/feed/', 5, '{"produces":"town","maxAgeDays":30}'],
  ];
  const byUrl = db.prepare('SELECT id FROM event_sources WHERE url = ?');
  for (const d of live) if (!byUrl.get(d[2])) ins.run(d[0], d[1], d[2], d[3], d[4], now);
}

function allSources() {
  return db.prepare('SELECT * FROM event_sources ORDER BY reliability DESC, id ASC').all();
}
function enabledSources() {
  return db.prepare('SELECT * FROM event_sources WHERE enabled = 1 ORDER BY reliability DESC').all();
}
function getSource(id) {
  return db.prepare('SELECT * FROM event_sources WHERE id = ?').get(id);
}
function adapterFor(row) {
  return createAdapter(row.type);
}

function markRun(id, count) {
  db.prepare('UPDATE event_sources SET last_run = ?, last_count = ? WHERE id = ?').run(Date.now(), count, id);
}
function addSource({ name, type, url, reliability, config }) {
  const res = db.prepare('INSERT INTO event_sources (name, type, url, reliability, config, enabled, created_at) VALUES (?, ?, ?, ?, ?, 1, ?)')
    .run(name, type, url || '', reliability || 5, JSON.stringify(config || {}), Date.now());
  return getSource(res.lastInsertRowid);
}
function removeSource(id) {
  return db.prepare('DELETE FROM event_sources WHERE id = ?').run(id).changes > 0;
}
function toggleSource(id, enabled) {
  db.prepare('UPDATE event_sources SET enabled = ? WHERE id = ?').run(enabled ? 1 : 0, id);
}

module.exports = {
  seedSources, allSources, enabledSources, getSource, adapterFor,
  markRun, addSource, removeSource, toggleSource, AVAILABLE_SOURCE_TYPES,
};
