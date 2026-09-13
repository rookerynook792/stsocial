'use strict';
const express = require('express');
const { db } = require('../db');
const { requireAdmin } = require('../auth');
const { eventToApi } = require('./common');
const { toMs } = require('../util');
const sources = require('../aggregation/sources');
const { runIngest, lastIngest } = require('../aggregation/pipeline');
const { publicUser } = require('../auth');

const r = express.Router();
r.use(requireAdmin);

/* ------------------------------ dashboard ------------------------------ */
r.get('/dashboard', (req, res) => {
  const now = Date.now();
  const D = 86400000;
  const count = (sql) => db.prepare(sql).get().c;
  const dash = {
    users: count('SELECT COUNT(*) c FROM users WHERE status=?'),
    verified: count('SELECT COUNT(*) c FROM users WHERE verified=1'),
    events: count('SELECT COUNT(*) c FROM events WHERE status=?'),
    pendingEvents: count("SELECT COUNT(*) c FROM events WHERE status='pending'"),
    posts: count("SELECT COUNT(*) c FROM posts WHERE status='published'"),
    comments: count("SELECT COUNT(*) c FROM comments WHERE status='published'"),
    pendingReports: count("SELECT COUNT(*) c FROM reports WHERE status='pending'"),
    townUpdates: count('SELECT COUNT(*) c FROM town_updates'),
    universityUpdates: count('SELECT COUNT(*) c FROM university_updates'),
    sources: sources.allSources().length,
    lastIngest: lastIngest() || null,
    pending: db.prepare(`
      SELECT e.id, e.title, e.category, e.date, e.start_time, e.creator_id, (SELECT name FROM users WHERE id=e.creator_id) creator
      FROM events e WHERE e.status='pending' ORDER BY e.created_at DESC LIMIT 20
    `).all(),
    recentReports: db.prepare(`
      SELECT rep.*, (SELECT name FROM users WHERE id=rep.reporter_id) reporter
      FROM reports rep WHERE rep.status='pending' ORDER BY rep.created_at DESC LIMIT 20
    `).all(),
  };
  res.json(dash);
});

/* ------------------------------- reports ------------------------------- */
r.get('/reports', (req, res) => {
  const status = req.query.status || 'pending';
  const rows = db.prepare(`
    SELECT rep.*, (SELECT name FROM users WHERE id=rep.reporter_id) reporter,
      (SELECT name FROM users WHERE id=rep.target_id) target_user_name,
      (SELECT title FROM events WHERE id=rep.target_id) event_title,
      (SELECT COALESCE(title, body) FROM posts WHERE id=rep.target_id) post_title
    FROM reports rep WHERE rep.status=? ORDER BY rep.created_at DESC LIMIT 100
  `).all(status);
  res.json({ reports: rows });
});
r.post('/reports/:id/resolve', async (req, res) => {
  const rep = db.prepare('SELECT * FROM reports WHERE id=?').get(req.params.id);
  if (!rep) return res.status(404).json({ error: 'Report not found.' });
  const { action = 'resolved', remove } = req.body || {};
  if (remove && action === 'resolved') {
    if (rep.target_type === 'event') db.prepare(`UPDATE events SET status='removed' WHERE id=?`).run(rep.target_id);
    else if (rep.target_type === 'post') db.prepare(`UPDATE posts SET status='removed' WHERE id=?`).run(rep.target_id);
    else if (rep.target_type === 'comment') db.prepare(`UPDATE comments SET status='removed' WHERE id=?`).run(rep.target_id);
    else if (rep.target_type === 'user') db.prepare(`UPDATE users SET status='suspended' WHERE id=?`).run(rep.target_id);
  }
  db.prepare('UPDATE reports SET status=?, resolved_at=?, resolved_by=? WHERE id=?').run(action, Date.now(), req.userId, rep.id);
  res.json({ ok: true });
});

/* ------------------------------- events -------------------------------- */
r.get('/events', (req, res) => {
  const { status = 'all', category } = req.query;
  const where = []; const params = [];
  if (status !== 'all') { where.push('status = ?'); params.push(status); }
  if (category && category !== 'all') { where.push('category = ?'); params.push(category); }
  const rows = db.prepare(`SELECT * FROM events ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY created_at DESC LIMIT 300`).all(...params);
  res.json({ events: rows.map((e) => eventToApi(e, req.userId)) });
});
r.post('/events/:id/approve', (req, res) => {
  db.prepare(`UPDATE events SET approved=1, status='published' WHERE id=?`).run(req.params.id);
  res.json({ ok: true });
});
r.post('/events/:id/reject', (req, res) => {
  db.prepare(`UPDATE events SET approved=0, status='rejected' WHERE id=?`).run(req.params.id);
  res.json({ ok: true });
});
r.post('/events/:id/delete', (req, res) => {
  db.prepare(`UPDATE events SET status='removed' WHERE id=?`).run(req.params.id);
  res.json({ ok: true });
});
r.post('/events/:id/feature', (req, res) => {
  const e = db.prepare('SELECT featured FROM events WHERE id=?').get(req.params.id);
  db.prepare('UPDATE events SET featured=? WHERE id=?').run(e && e.featured ? 0 : 1, req.params.id);
  res.json({ ok: true, featured: e && e.featured ? false : true });
});
r.post('/events', (req, res) => {
  const { title, description, category = 'other', date, start_time, end_time, location, price, ticket_url, organizer, image, emoji } = req.body || {};
  if (!title || !date) return res.status(400).json({ error: 'title and date are required.' });
  const startMs = toMs(date, start_time || '12:00');
  const res2 = db.prepare(`
    INSERT INTO events (title, description, category, date, start_time, end_time, start_ms, location, address, price, ticket_url,
      organizer, image, emoji, reliability, source_type, source_name, approved, status, is_demo, created_at)
    VALUES (@title, @description, @category, @date, @start_time, @end_time, @start_ms, @location, @address, @price, @ticket_url,
      @organizer, @image, @emoji, 3, 'verified', 'ST SOCIAL Admin', 1, 'published', 0, @created_at)
  `).run({
    title, description: description || '', category, date, start_time: start_time || null, end_time: end_time || null, start_ms: startMs,
    location: location || 'St Andrews', address: 'St Andrews, Fife', price: price || null, ticket_url: ticket_url || null,
    organizer: organizer || 'ST SOCIAL', image: image || null, emoji: emoji || null, created_at: Date.now(),
  });
  res.status(201).json({ id: res2.lastInsertRowid });
});

/* -------------------------------- posts --------------------------------- */
r.post('/posts/:id/remove', (req, res) => {
  db.prepare(`UPDATE posts SET status='removed', approved=0 WHERE id=?`).run(req.params.id);
  res.json({ ok: true });
});

/* -------------------------------- users --------------------------------- */
r.get('/users', (req, res) => {
  const rows = db.prepare('SELECT * FROM users ORDER BY created_at DESC LIMIT 200').all();
  res.json({ users: rows.map(publicUser) });
});
r.post('/users/:id/action', (req, res) => {
  const { action } = req.body || {};
  const id = req.params.id;
  const map = {
    suspend: 'suspended', ban: 'banned', active: 'active',
  };
  if (map[action]) return db.prepare('UPDATE users SET status=? WHERE id=?').run(map[action], id), res.json({ ok: true });
  if (action === 'admin') return db.prepare(`UPDATE users SET role='admin' WHERE id=?`).run(id), res.json({ ok: true });
  if (action === 'user') return db.prepare(`UPDATE users SET role='student' WHERE id=?`).run(id), res.json({ ok: true });
  if (action === 'verify') return db.prepare('UPDATE users SET verified=1 WHERE id=?').run(id), res.json({ ok: true });
  if (action === 'unverify') return db.prepare('UPDATE users SET verified=0 WHERE id=?').run(id), res.json({ ok: true });
  res.status(400).json({ error: 'Unknown action.' });
});

/* ------------------------------- sources -------------------------------- */
r.get('/sources', (req, res) => {
  res.json({
    sources: sources.allSources().map((s) => ({
      id: s.id, name: s.name, type: s.type, url: s.url, reliability: s.reliability,
      enabled: !!s.enabled, last_run: s.last_run, last_count: s.last_count,
    })),
    available: sources.AVAILABLE_SOURCE_TYPES,
    lastIngest: lastIngest(),
  });
});
r.post('/sources', (req, res) => {
  const { name, type, url, reliability } = req.body || {};
  if (!name || !type) return res.status(400).json({ error: 'name and type required.' });
  const src = sources.addSource({ name, type, url, reliability });
  runIngest('source_added');
  res.status(201).json({ source: src });
});
r.post('/sources/:id/toggle', (req, res) => {
  const s = sources.getSource(req.params.id);
  sources.toggleSource(req.params.id, !(s && s.enabled));
  res.json({ ok: true, enabled: !!(s && s.enabled) ? false : true });
});
r.delete('/sources/:id', (req, res) => {
  sources.removeSource(req.params.id);
  res.json({ ok: true });
});

/* ------------------------------- ingestion ------------------------------ */
r.post('/ingest/run', async (req, res) => {
  const summary = await runIngest('manual');
  res.json({ summary });
});

/* ------------------------------- analytics ------------------------------ */
r.get('/analytics', (req, res) => {
  const D = 86400000; const now = Date.now();
  const dau = [];
  for (let i = 6; i >= 0; i--) {
    const a = new Date(now - i * D); a.setHours(0, 0, 0, 0);
    const b = a.getTime() + D;
    const n = db.prepare(`
      SELECT COUNT(DISTINCT x.uid) c FROM (
        SELECT user_id uid FROM event_views WHERE user_id IS NOT NULL AND created_at >= ? AND created_at < ?
        UNION SELECT user_id FROM comments WHERE user_id IS NOT NULL AND created_at >= ? AND created_at < ?
        UNION SELECT user_id FROM posts WHERE user_id IS NOT NULL AND created_at >= ? AND created_at < ?
      ) x
    `).get(a.getTime(), b, a.getTime(), b, a.getTime(), b).c;
    dau.push({ day: new Date(a).toLocaleDateString('en-GB', { weekday: 'short' }), count: n });
  }
  const topEvents = db.prepare(`
    SELECT e.title, e.category, e.interested_count, e.going_count, COUNT(v.id) views
    FROM events e LEFT JOIN event_views v ON v.event_id=e.id AND e.status!='removed'
    WHERE e.status='published' GROUP BY e.id ORDER BY views DESC, e.interested_count DESC LIMIT 8
  `).all();
  const topCategories = db.prepare(`
    SELECT category, COUNT(*) c, SUM(interested_count+going_count) engagement FROM events WHERE status='published' GROUP BY category ORDER BY c DESC
  `).all();
  const topDiscussions = db.prepare(`
    SELECT p.title, p.type, (p.upvotes-p.downvotes) score, (SELECT COUNT(*) FROM comments c WHERE c.post_id=p.id) comments
    FROM posts p WHERE p.status='published' ORDER BY comments DESC, score DESC LIMIT 8
  `).all();
  res.json({
    dau,
    activeUsers: db.prepare('SELECT COUNT(*) c FROM users WHERE status=?').get('active').c,
    communityPosts: db.prepare('SELECT COUNT(*) c FROM posts WHERE status=?').get('published').c,
    topEvents, topCategories, topDiscussions,
  });
});

/* --------------------- town / university updates mgmt -------------------- */
r.get('/updates', (req, res) => {
  res.json({
    town: db.prepare('SELECT * FROM town_updates ORDER BY created_at DESC LIMIT 100').all(),
    university: db.prepare('SELECT * FROM university_updates ORDER BY created_at DESC LIMIT 100').all(),
  });
});
r.post('/town', (req, res) => {
  const { category = 'news', title, body, verified } = req.body || {};
  if (!title) return res.status(400).json({ error: 'title required.' });
  const res2 = db.prepare('INSERT INTO town_updates (category,title,body,source_name,verified,dedup_key,created_at) VALUES (?,?,?,?,?,?,?)')
    .run(category, title, body || '', 'ST SOCIAL Admin', verified ? 1 : 0, `admin-${Date.now()}`, Date.now());
  res.status(201).json({ id: res2.lastInsertRowid });
});
r.delete('/town/:id', (req, res) => { db.prepare('DELETE FROM town_updates WHERE id=?').run(req.params.id); res.json({ ok: true }); });
r.post('/university', (req, res) => {
  const { category = 'news', title, body, important } = req.body || {};
  if (!title) return res.status(400).json({ error: 'title required.' });
  const res2 = db.prepare('INSERT INTO university_updates (category,title,body,source_name,important,dedup_key,created_at) VALUES (?,?,?,?,?,?,?)')
    .run(category, title, body || '', 'ST SOCIAL Admin', important ? 1 : 0, `admin-${Date.now()}`, Date.now());
  res.status(201).json({ id: res2.lastInsertRowid });
});
r.delete('/university/:id', (req, res) => { db.prepare('DELETE FROM university_updates WHERE id=?').run(req.params.id); res.json({ ok: true }); });

module.exports = r;
