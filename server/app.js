'use strict';
const path = require('path');
const fs = require('fs');
const express = require('express');
const config = require('./config');
const { db, metaGet } = require('./db');
const { optionalAuth } = require('./auth');
const { lastIngest } = require('./aggregation/pipeline');
const { newToken } = require('./util');

const app = express();
const publicDir = path.join(__dirname, '..', 'public');
const uploadDir = path.join(config.dataDir, 'uploads');
fs.mkdirSync(uploadDir, { recursive: true });

app.disable('x-powered-by');
app.use(express.json({ limit: '8mb' }));
app.use(express.urlencoded({ extended: true }));

// Optional CORS for the (proxied) preview host.
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', config.corsOrigin);
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Session-Token, X-Ingest-Key');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

// Lightweight access log (events + api only), to keep the console useful.
if (config.env !== 'test') {
  app.use((req, res, next) => {
    if (req.path.startsWith('/api/')) {
      const start = Date.now();
      res.on('finish', () => {
        if (process.env.STSSOCIAL_LOG !== 'off') {
          // eslint-disable-next-line no-console
          console.log(`${req.method} ${req.originalUrl} ${res.statusCode} ${Date.now() - start}ms`);
        }
      });
    }
    next();
  });
}

app.use(optionalAuth);

/* --------------------------------- meta ---------------------------------- */
app.get('/api/health', (req, res) => res.json({ ok: true, app: 'SAINT SOCIAL', version: '1.0.0', time: Date.now() }));
app.get('/api/meta', (req, res) => {
  res.json({
    app: 'SAINT SOCIAL',
    location: 'University of St Andrews, Fife, Scotland',
    demoMode: config.demoMode,
    liveSources: config.liveSources,
    version: '1.0.0',
    verifiedDomains: config.verifiedEmailDomains,
    lastIngest: lastIngest() || null,
  });
});

/* --------------------------------- routes -------------------------------- */
app.use('/api/auth', require('./routes/auth'));
app.use('/api/events', require('./routes/events'));
app.use('/api/town', require('./routes/town'));
app.use('/api/university', require('./routes/university'));
app.use('/api/home', require('./routes/home'));
app.use('/api/search', require('./routes/search'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/profiles', require('./routes/profile'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api', require('./routes/forum')); // forum list (/forum) + posts + comments
app.use('/api/ingest', require('./routes/ingest'));

/* ------------------------------- uploads --------------------------------- */
// Accept a base64 data-URL (read client-side) so we avoid a multipart dependency.
app.post('/api/upload', optionalAuth, (req, res) => {
  const { data, name } = req.body || {};
  if (!data || !/^data:image\/(png|jpe?g|webp|gif)/i.test(data)) return res.status(400).json({ error: 'Send an image as a data URL.' });
  const m = data.match(/^data:image\/(\w+);base64,(.*)$/);
  if (!m) return res.status(400).json({ error: 'Bad image.' });
  const ext = m[1].replace('jpeg', 'jpg');
  const buf = Buffer.from(m[2], 'base64');
  if (buf.length > 4 * 1024 * 1024) return res.status(413).json({ error: 'Image too large (max 4MB).' });
  const fname = `${Date.now()}-${newToken(4)}.${ext}`;
  fs.writeFileSync(path.join(uploadDir, fname), buf);
  res.status(201).json({ url: `/uploads/${fname}`, name: name || fname });
});
app.use('/uploads', express.static(uploadDir, { maxAge: '7d' }));

/* ------------------------------- static ---------------------------------- */
app.use(express.static(publicDir, { extensions: ['html'] }));

// SPA fallback: any GET that isn't an API call or a real file → index.html
app.use((req, res, next) => {
  if (req.method !== 'GET' || req.path.startsWith('/api/')) return next();
  res.sendFile(path.join(publicDir, 'index.html'));
});

/* ------------------------------- errors ---------------------------------- */
app.use((req, res) => res.status(404).json({ error: 'Not found.' }));
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  // eslint-disable-next-line no-console
  console.error('[error]', err.message);
  res.status(err.status || 500).json({ error: err.message || 'Server error.' });
});

module.exports = app;
