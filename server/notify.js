'use strict';
const { db } = require('./db');

const DEFAULT_PREFS = {
  event_reminder: true,
  replies: true,
  trending: true,
  university: true,
  town: true,
  follows: true,
};

function prefsFor(userId) {
  const row = db.prepare('SELECT prefs FROM notifications_prefs WHERE user_id = ?').get(userId);
  try { return row ? { ...DEFAULT_PREFS, ...JSON.parse(row.prefs) } : { ...DEFAULT_PREFS }; } catch { return { ...DEFAULT_PREFS }; }
}
function savePrefs(userId, prefs) {
  const merged = { ...DEFAULT_PREFS, ...(prefs || {}) };
  db.prepare('INSERT INTO notifications_prefs (user_id, prefs) VALUES (?, ?) ON CONFLICT(user_id) DO UPDATE SET prefs = excluded.prefs')
    .run(userId, JSON.stringify(merged));
  return merged;
}
/** Fire a notification to a user, gated by their preferences. */
function notify(userId, type, title, body, link) {
  if (!userId) return;
  const prefs = prefsFor(userId);
  if (prefs && prefs[type] === false) return;
  db.prepare('INSERT INTO notifications (user_id, type, title, body, link, created_at, read) VALUES (?,?,?,?,?,?,0)')
    .run(userId, type, title, body, link || '', Date.now());
}

module.exports = { notify, prefsFor, savePrefs, DEFAULT_PREFS };
