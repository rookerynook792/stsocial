'use strict';
const { db } = require('./db');
const config = require('./config');
const { hashPassword, verifyPassword, newToken } = require('./util');

function publicUser(u) {
  if (!u) return null;
  return {
    id: u.id, name: u.name, username: u.username, email: u.email,
    avatar: u.avatar || null, course: u.course || null, year: u.year || null,
    bio: u.bio || null, interests: safeJson(u.interests, []), role: u.role,
    verified: !!u.verified, privacy: u.privacy, status: u.status, created_at: u.created_at,
  };
}
function safeJson(s, def) {
  try { return s ? JSON.parse(s) : def; } catch { return def; }
}
function isVerifiedEmail(email) {
  const dom = String(email || '').split('@')[1];
  return !!dom && config.verifiedEmailDomains.includes(dom.toLowerCase());
}

function getUser(id) { return db.prepare('SELECT * FROM users WHERE id = ?').get(id); }
function getUserByUsername(username) { return db.prepare('SELECT * FROM users WHERE username = ?').get(username); }

function createUser({ name, username, email, password, course, year, bio, interests, avatar }) {
  const verified = isVerifiedEmail(email) ? 1 : 0;
  const { salt, hash } = hashPassword(password);
  const res = db.prepare(`
    INSERT INTO users (name, username, email, password_hash, password_salt, avatar, course, year, bio, interests, role, verified, privacy, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'student', ?, 'public', 'active', ?)
  `).run(
    name, username, email.toLowerCase(), hash, salt, avatar || null, course || null, year || null,
    bio || '', JSON.stringify(interests || []), verified, Date.now(),
  );
  return getUser(res.lastInsertRowid);
}

function login(email, password) {
  const user = db.prepare('SELECT * FROM users WHERE email = ? COLLATE NOCASE').get(String(email).trim());
  if (!user || !verifyPassword(password, user.password_salt, user.password_hash)) return null;
  if (user.status !== 'active') return { error: `Your account is ${user.status}.` };
  const token = newToken(32);
  db.prepare('INSERT INTO sessions (token, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)')
    .run(token, user.id, Date.now() + config.sessionTtlMs, Date.now());
  return { token, user: user };
}

function logout(token) {
  if (token) db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
}
function sessionUser(token) {
  if (!token) return null;
  const s = db.prepare('SELECT * FROM sessions WHERE token = ?').get(token);
  if (!s) return null;
  if (s.expires_at < Date.now()) { db.prepare('DELETE FROM sessions WHERE token = ?').run(token); return null; }
  return getUser(s.user_id);
}

function extractToken(req) {
  const h = req.headers['authorization'] || '';
  if (h.startsWith('Bearer ')) return h.slice(7).trim();
  return req.headers['x-session-token'] || null;
}

function optionalAuth(req, res, next) {
  const user = sessionUser(extractToken(req));
  req.user = user ? user : null;
  req.userId = user ? user.id : null;
  next();
}
function requireAuth(req, res, next) {
  optionalAuth(req, res, () => {
    if (!req.user) return res.status(401).json({ error: 'Please sign in to continue.' });
    next();
  });
}
function requireAdmin(req, res, next) {
  requireAuth(req, res, () => {
    if (!req.user || req.user.role !== 'admin') return res.status(403).json({ error: 'Admin access required.' });
    next();
  });
}

module.exports = { publicUser, createUser, login, logout, sessionUser, getUser, getUserByUsername, isVerifiedEmail, optionalAuth, requireAuth, requireAdmin, extractToken };
