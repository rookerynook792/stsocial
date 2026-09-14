'use strict';
const SourceAdapter = require('./base');

/**
 * University of St Andrews events calendar — a REAL, live source.
 *
 * The events site (events.st-andrews.ac.uk) is WordPress with the "AJDS Events
 * for WordPress" plugin (post type: ajde_events). There is no single feed with
 * dates, so we:
 *   1. List recently-updated event posts via the WP REST API.
 *   2. Open each event page and read the schema.org JSON-LD, which carries the
 *      exact startDate / endDate and the venue.
 *   3. Keep only upcoming events (within the next ~90 days).
 *
 * This surfaces real music, student, lecture, film, theatre and museum events
 * with correct dates and venues.
 */

const UA = 'Mozilla/5.0 (compatible; ST-Social/1.0; student events aggregator)';
const TZ = 'Europe/London';

function stripHtml(s) {
  return String(s || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#8217;|&#39;|&apos;/g, "'")
    .replace(/&#8211;/g, '–').replace(/&#8216;/g, '‘').replace(/&#8230;/g, '…')
    .replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
}

/** Convert an ISO instant to St Andrews wall-clock {date:YYYY-MM-DD, time:HH:MM}. */
function lonParts(iso) {
  const d = new Date(iso);
  if (isNaN(d)) return null;
  const f = (opt) => new Intl.DateTimeFormat('en-GB', Object.assign({ timeZone: TZ }, opt)).formatToParts(d);
  const get = (type) => (f({ hour12: false, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) || []).find((p) => p.type === type);
  const Y = get('year'), Mo = get('month'), Da = get('day'), H = get('hour'), Mi = get('minute');
  if (!Y || !Mo || !Da) return null;
  return {
    date: `${Y.value}-${Mo.value}-${Da.value}`,
    time: `${((+H.value + 11) % 12 + 1).toString().padStart(2, '0')}:${Mi.value}`, // normalise 24h
  };
}

function parseJsonLd(html) {
  const blocks = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi) || [];
  for (const raw of blocks) {
    const body = raw.replace(/<script[^>]*>/i, '').replace(/<\/script>/i, '').trim();
    let d;
    try { d = JSON.parse(body); } catch { continue; }
    const node = d['@graph'] ? d['@graph'].find((n) => n && n['@type'] === 'Event') : (d['@type'] === 'Event' ? d : null);
    if (!node || !node.startDate) continue;
    const image = node.image && typeof node.image === 'string' ? node.image
      : node.image && node.image[0] ? (node.image[0].url || node.image[0]) : null;
    return {
      start: node.startDate,
      end: node.endDate || null,
      name: node.name || null,
      location: node.location && node.location.name ? node.location.name : null,
      image: image || null,
      organizer: node.organizer && node.organizer.name ? node.organizer.name : null,
    };
  }
  return null;
}

class UniEventsSource extends SourceAdapter {
  constructor() {
    super();
    this.id = 'uni_events';
    this.name = 'University of St Andrews Events';
    this.type = 'uni_events';
    this.reliability = 10;
    this.produces = 'events';
    this.isDemoSource = false;
  }

  async fetch(config, live) {
    if (!live) return [];
    const base = (config && config.url) || 'https://events.st-andrews.ac.uk/wp-json/wp/v2/ajde_events';
    const listUrl = base + (base.includes('?') ? '&' : '?') + 'per_page=25&orderby=modified&order=desc';
    let posts;
    try {
      const res = await fetch(listUrl, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(15000) });
      if (!res.ok) return [];
      posts = await res.json();
    } catch { return []; }
    if (!Array.isArray(posts)) return [];

    const max = (config && Number(config.maxPageFetches)) || 18;
    const now = Date.now();
    const horizon = now + 90 * 86400000;
    const out = [];

    for (const p of posts.slice(0, max)) {
      if (!p.link) continue;
      let html;
      try {
        const res = await fetch(p.link, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(12000) });
        if (!res.ok) continue;
        html = await res.text();
      } catch { continue; }

      const ev = parseJsonLd(html);
      if (!ev) continue;
      const s = new Date(ev.start);
      if (isNaN(s) || s.getTime() < now - 3600000 || s.getTime() > horizon) continue;

      const sp = lonParts(ev.start);
      if (!sp) continue;
      let endTime = null;
      if (ev.end) {
        const ep = lonParts(ev.end);
        if (ep && ep.date === sp.date) endTime = ep.time;
      }
      const title = stripHtml(p.title && p.title.rendered) || (ev.name ? stripHtml(ev.name) : 'University event');
      const desc = stripHtml(p.content && p.content.rendered).slice(0, 600);

      out.push({
        title: title.slice(0, 160),
        description: desc,
        date: sp.date,
        startTime: sp.time,
        endTime,
        location: (ev.location || 'St Andrews').slice(0, 120),
        address: 'St Andrews, Fife',
        ticketUrl: p.link,
        link: p.link,
        image: ev.image || null,
        organizer: (ev.organizer || 'University of St Andrews').slice(0, 120),
        sourceUrl: p.link,
        sourceName: this.name,
      });
    }
    return out;
  }
}
module.exports = UniEventsSource;
