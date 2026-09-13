'use strict';
const express = require('express');
const { db } = require('../db');
const { requireAuth } = require('../auth');
const { prefsFor, savePrefs } = require('../notify');

const r = express.Router();

// GET /api/notifications
r.get('/', requireAuth, (req, res) => {
  const rows = db.prepare('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50').all(req.userId);
  const unread = db.prepare('SELECT COUNT(*) c FROM notifications WHERE user_id = ? AND read = 0').get(req.userId).c;
  res.json({
    notifications: rows.map((n) => ({
      id: n.id, type: n.type, title: n.title, body: n.body, link: n.link,
      created_at: n.created_at, read: !!n.read,
    })),
    unread,
    prefs: prefsFor(req.userId),
  });
});

// POST /api/notifications/read
r.post('/read', requireAuth, (req, res) => {
  const id = Number(req.body && req.body.id);
  if (id) db.prepare('UPDATE notifications SET read = 1 WHERE id = ? AND user_id = ?').run(id, req.userId);
  res.json({ ok: true });
});

// POST /api/notifications/read-all
r.post('/read-all', requireAuth, (req, res) => {
  db.prepare('UPDATE notifications SET read = 1 WHERE user_id = ?').run(req.userId);
  res.json({ ok: true });
});

// POST /api/notifications/prefs
r.post('/prefs', requireAuth, (req, res) => {
  const merged = savePrefs(req.userId, req.body && req.body.prefs);
  res.json({ prefs: merged });
});

module.exports = r;
