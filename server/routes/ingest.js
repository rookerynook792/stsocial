'use strict';
/**
 * Public, API-ready ingestion endpoint for *approved* external systems.
 * Protected by INGEST_API_KEY (never exposed to the frontend).
 *
 *   POST /api/ingest/events  { source: {name,type,url,reliability}, events: [...] }
 *   POST /api/ingest/town    { source: {...}, updates: [...] }
 *   POST /api/ingest/university { source: {...}, updates: [...] }
 *
 * Pushed items go through the same categorise + de-duplicate + merge pipeline
 * as scheduled sources, so a push can never create duplicates.
 */
const express = require('express');
const config = require('../config');
const { upsertEvent, upsertTown, upsertUniversity } = require('../aggregation/pipeline');

const r = express.Router();

function guard(req, res, next) {
  const key = req.headers['x-ingest-key'] || (req.headers['authorization'] || '').replace(/^Bearer\s+/i, '');
  if (!key || key !== config.ingestApiKey) return res.status(401).json({ error: 'Invalid ingest API key.' });
  next();
}
r.use(guard);

function virtualAdapter(source, produces) {
  return { produces: produces || 'events', reliability: source.reliability || 5 };
}
function virtualRow(source) {
  return { id: null, name: source.name || 'External Source', type: source.type || 'external', url: source.url || '', reliability: source.reliability || 5, config: '{}' };
}

r.post('/events', (req, res) => {
  const { source = {}, events } = req.body || {};
  const list = Array.isArray(events) ? events : (events ? [events] : []);
  if (!list.length) return res.status(400).json({ error: 'No events provided.' });
  const row = virtualRow(source);
  const adapter = virtualAdapter(source, 'events');
  let added = 0; let merged = 0; const ids = [];
  for (const item of list.slice(0, 200)) {
    if (!item.title) continue;
    const out = upsertEvent(item, row, adapter);
    out.merged ? merged++ : added++;
    ids.push(out.id);
  }
  res.status(201).json({ added, merged, ids });
});

r.post('/town', (req, res) => {
  const { source = {}, updates } = req.body || {};
  const list = Array.isArray(updates) ? updates : (updates ? [updates] : []);
  const row = virtualRow(source);
  let added = 0; let merged = 0;
  for (const item of list.slice(0, 200)) {
    if (!item.title) continue;
    const out = upsertTown(item, row);
    out.merged ? merged++ : added++;
  }
  res.status(201).json({ added, merged });
});

r.post('/university', (req, res) => {
  const { source = {}, updates } = req.body || {};
  const list = Array.isArray(updates) ? updates : (updates ? [updates] : []);
  const row = virtualRow(source);
  let added = 0; let merged = 0;
  for (const item of list.slice(0, 200)) {
    if (!item.title) continue;
    const out = upsertUniversity(item, row);
    out.merged ? merged++ : added++;
  }
  res.status(201).json({ added, merged });
});

module.exports = r;
