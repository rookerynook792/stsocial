'use strict';
const express = require('express');
const { createUser, login, logout, publicUser, requireAuth, getUserByUsername, isVerifiedEmail } = require('../auth');
const { db } = require('../db');
const config = require('../config');
const { slug } = require('../util');

const r = express.Router();

function uniqueUsername(name) {
  const base = slug(name) || 'student';
  let u = base; let i = 1;
  while (db.prepare('SELECT 1 FROM users WHERE username = ?').get(u)) u = `${base}${++i}`;
  return u;
}

// POST /api/auth/signup
r.post('/signup', (req, res) => {
  const { name, username, email, password, course, year, bio, interests, avatar } = req.body || {};
  if (!name || !name.trim()) return res.status(400).json({ error: 'Please enter your name.' });
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return res.status(400).json({ error: 'Please enter a valid email address.' });
  if (!password || String(password).length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters.' });
  if (db.prepare('SELECT 1 FROM users WHERE email = ? COLLATE NOCASE').get(String(email).trim()))
    return res.status(409).json({ error: 'An account with that email already exists.' });
  const uname = (username && username.trim()) ? slug(username) : uniqueUsername(name);
  if (db.prepare('SELECT 1 FROM users WHERE username = ?').get(uname))
    return res.status(409).json({ error: 'That username is taken.' });
  const user = createUser({ name: name.trim(), username: uname, email, password, course, year, bio, interests, avatar });
  const token = (() => { const t = require('../util').newToken(32); db.prepare('INSERT INTO sessions (token, user_id, expires_at, created_at) VALUES (?,?,?,?)').run(t, user.id, Date.now() + config.sessionTtlMs, Date.now()); return t; })();
  res.json({ token, user: publicUser(user), verified: user.verified, verifiedDomains: config.verifiedEmailDomains });
});

// POST /api/auth/login
r.post('/login', (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required.' });
  const out = login(email, password);
  if (!out) return res.status(401).json({ error: 'Incorrect email or password.' });
  if (out.error) return res.status(403).json({ error: out.error });
  res.json({ token: out.token, user: publicUser(out.user) });
});

// POST /api/auth/logout
r.post('/logout', (req, res) => {
  logout(req.headers['authorization'] ? req.headers['authorization'].slice(7) : (req.body && req.body.token));
  res.json({ ok: true });
});

// GET /api/auth/me
r.get('/me', requireAuth, (req, res) => {
  res.json({ user: publicUser(req.user) });
});

// GET /api/auth/verify-domain (help the UI show what domains verify)
r.get('/verify-domains', (req, res) => {
  res.json({ domains: config.verifiedEmailDomains });
});

// PUT /api/auth/me  (update own profile / privacy)
r.put('/me', requireAuth, (req, res) => {
  const u = req.user;
  const { name, course, year, bio, interests, avatar, privacy, email } = req.body || {};
  const allowed = ['public', 'students', 'private'];
  db.prepare(`
    UPDATE users SET name=?, course=?, year=?, bio=?, interests=?, avatar=?, privacy=?, email=?
    WHERE id=?
  `).run(
    name != null ? name : u.name, course != null ? course : u.course, year != null ? year : u.year,
    bio != null ? bio : u.bio, interests ? JSON.stringify(interests) : u.interests,
    avatar != null ? avatar : u.avatar, allowed.includes(privacy) ? privacy : u.privacy,
    email != null ? email : u.email, u.id,
  );
  res.json({ user: publicUser(getUserByUsername(u.username)) });
});

module.exports = r;
