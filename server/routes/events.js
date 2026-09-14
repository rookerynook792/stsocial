'use strict';
const express = require('express');
const { db } = require('../db');
const { eventToApi } = require('./common');
const { requireAuth } = require('../auth');
const { startOfDay, toMs, CATEGORIES } = require('../util');

const r = express.Router();
const DAY = 86400000;

function bounds(filter) {
  const now = Date.now();
  const t0 = startOfDay(now);
  const dow = new Date().getDay();
  const sat = t0 + ((6 - dow + 7) % 7) * DAY;
  switch (filter) {
    case 'today': return { a: t0, b: t0 + DAY - 1 };
    case 'tomorrow': return { a: t0 + DAY, b: t0 + 2 * DAY - 1 };
    case 'week': return { a: t0, b: t0 + 7 * DAY - 1 };
    case 'weekend': return { a: sat, b: sat + DAY + DAY - 1 };
    case 'next_week': return { a: t0 + 7 * DAY, b: t0 + 14 * DAY - 1 };
    case 'upcoming': return { a: now - 2 * 3600000, b: now + 60 * DAY };
    case 'year': return { a: now - 2 * 3600000, b: now + 365 * DAY };
    default: return { a: now - 2 * 3600000, b: now + 60 * DAY };
  }
}

// GET /api/events
r.get('/', (req, res) => {
  const { filter = 'upcoming', category, q, sort, mine, all } = req.query;
  const userId = req.userId;
  const b = bounds(filter);
  const where = [`status = 'published'`, `start_ms >= ?`, `start_ms <= ?`];
  const params = [b.a, b.b];
  if (all === '1') where.pop(), where.pop(); // admin "all" view drops date bounds
  if (category && category !== 'all') { where.push('category = ?'); params.push(category); }
  if (mine === '1') { where.push('source_type = ?'); params.push('community'); }
  if (q) { where.push('(title LIKE ? OR description LIKE ? OR location LIKE ? OR organizer LIKE ?)'); const s = `%${q}%`; params.push(s, s, s, s); }
  // Non-admins only see approved published events; their own pending ones are shown via /me.
  if (!req.user || req.user.role !== 'admin') where.push('approved = 1');
  const order = sort === 'popular' ? 'interested_count + going_count DESC, start_ms ASC' : 'start_ms ASC';
  const rows = db.prepare(`SELECT * FROM events WHERE ${where.join(' AND ')} ORDER BY ${order} LIMIT 200`).all(...params);
  res.json({
    events: rows.map((e) => eventToApi(e, userId)),
    filter, category: category || 'all',
    categories: CATEGORIES.map((c) => ({ id: c.id, label: c.label, emoji: c.emoji, color: c.color })),
  });
});

// GET /api/events/:id
r.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM events WHERE id = ? AND status != \'removed\'').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Event not found.' });
  const isOwner = row.source_type === 'community' && row.creator_id === req.userId;
  const isAdmin = req.user && req.user.role === 'admin';
  if (row.status !== 'published' && !isOwner && !isAdmin) {
    return res.status(403).json({ error: 'This event is pending approval.' });
  }
  db.prepare('INSERT INTO event_views (event_id, user_id, created_at) VALUES (?,?,?)').run(row.id, req.userId || null, Date.now());
  res.json({ event: eventToApi(row, req.userId) });
});

// POST /api/events  (community event creation → pending approval)
r.post('/', requireAuth, (req, res) => {
  const { title, description, date, start_time, end_time, location, category, price, ticket_url, contact, image, emoji } = req.body || {};
  if (!title || !title.trim()) return res.status(400).json({ error: 'Please give your event a name.' });
  if (!date) return res.status(400).json({ error: 'Please choose a date.' });
  if (!location || !location.trim()) return res.status(400).json({ error: 'Please add a location.' });
  const startMs = toMs(date, start_time || '12:00');
  const res2 = db.prepare(`
    INSERT INTO events (title, description, category, date, start_time, end_time, start_ms, location, address,
      price, ticket_url, organizer, creator_id, image, emoji, reliability, source_type, source_name, approved, status, is_demo, created_at)
    VALUES (@title, @description, @category, @date, @start_time, @end_time, @start_ms, @location, @address,
      @price, @ticket_url, @organizer, @creator_id, @image, @emoji, 3, 'community', @source_name, 0, 'pending', 0, @created_at)
  `).run({
    title: title.trim().slice(0, 160), description: description || '', category: category || 'other',
    date, start_time: start_time || null, end_time: end_time || null, start_ms: startMs,
    location: location.trim().slice(0, 120), address: req.body.address || 'St Andrews, Fife',
    price: price || null, ticket_url: ticket_url || null, organizer: req.user.name,
    creator_id: req.userId, image: image || null, emoji: emoji || null,
    source_name: req.user.name, created_at: Date.now(),
  });
  const row = db.prepare('SELECT * FROM events WHERE id = ?').get(res2.lastInsertRowid);
  res.status(201).json({ event: eventToApi(row, req.userId), status: 'pending', message: 'Your event was submitted and is pending approval by the ST SOCIAL team.' });
});

// POST /api/events/:id/interest  { type: 'interested' | 'going' }
r.post('/:id/interest', requireAuth, (req, res) => {
  const type = req.body && req.body.type;
  if (!['interested', 'going'].includes(type)) return res.status(400).json({ error: 'Bad interest type.' });
  const row = db.prepare('SELECT * FROM events WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Event not found.' });
  const exists = db.prepare('SELECT 1 FROM event_interest WHERE user_id=? AND event_id=? AND type=?').get(req.userId, row.id, type);
  if (exists) db.prepare('DELETE FROM event_interest WHERE user_id=? AND event_id=? AND type=?').run(req.userId, row.id, type);
  else db.prepare('INSERT INTO event_interest (user_id, event_id, type, created_at) VALUES (?,?,?,?)').run(req.userId, row.id, type, Date.now());
  db.prepare('UPDATE events SET interested_count = ?, going_count = ? WHERE id = ?').run(
    db.prepare('SELECT COUNT(*) c FROM event_interest WHERE event_id=? AND type=?').get(row.id, 'interested').c,
    db.prepare('SELECT COUNT(*) c FROM event_interest WHERE event_id=? AND type=?').get(row.id, 'going').c,
    row.id,
  );
  const fresh = db.prepare('SELECT * FROM events WHERE id = ?').get(row.id);
  res.json({ event: eventToApi(fresh, req.userId) });
});

// POST /api/events/:id/report
r.post('/:id/report', requireAuth, (req, res) => {
  const row = db.prepare('SELECT * FROM events WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Event not found.' });
  db.prepare('INSERT INTO reports (target_type, target_id, reporter_id, reason, details, status, created_at) VALUES (?,?,?,?,?,\'pending\',?)')
    .run('event', row.id, req.userId, (req.body && req.body.reason) || 'other', (req.body && req.body.details) || '', Date.now());
  res.json({ ok: true, message: 'Thanks — our team will review this event.' });
});

module.exports = r;
