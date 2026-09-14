'use strict';
const SourceAdapter = require('./base');

/**
 * A genuinely functional RSS/Atom adapter.
 *
 * Give it a public feed URL (via source config.url) and it fetches + parses
 * the entries into normalised events. This is the "publicly available event
 * APIs / RSS feeds" source type from the spec, and it works today with any
 * real feed when STSSOCIAL_LIVE_SOURCES=1.
 *
 * No external dependencies: a small, tolerant XML parser handles the common
 * RSS 2.0 and Atom shapes.
 */

function decode(s) {
  return String(s == null ? '' : s)
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&nbsp;/g, ' ');
}

// Grab <tag ...>...</tag> for the first item, ignoring nesting of the same tag.
function tag(xml, name) {
  const re = new RegExp(`<${name}(\\s[^>]*)?>([\\s\\S]*?)</${name}>`, 'i');
  const m = xml.match(re);
  return m ? decode(m[2]).trim() : '';
}
function items(xml) {
  const entries = [];
  let m;
  const re = /<(item|entry)[^>]*>([\s\S]*?)<\/\1>/gi;
  while ((m = re.exec(xml))) entries.push(m[2]);
  return entries;
}

class RssSource extends SourceAdapter {
  constructor() {
    super();
    this.id = 'rss';
    this.name = 'RSS / Atom Feed';
    this.type = 'rss';
    this.reliability = 5;
    this.produces = 'events';
    this.isDemoSource = false; // real fetched content
  }
  async fetch(config, live) {
    const url = (config && config.url) || this.url;
    if (!live || !url) return [];
    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'ST-Social/1.0 (event aggregation)' }, signal: AbortSignal.timeout(12000) });
      if (!res.ok) return [];
      const xml = await res.text();
      const produces = (config && config.produces) || this.produces;
      return items(xml).map((it) => {
        const title = tag(it, 'title');
        if (!title) return null;
        const desc = tag(it, 'description') || tag(it, 'content') || tag(it, 'summary');
        const link = tag(it, 'link');
        const cats = [...it.matchAll(/<category[^>]*>([\s\S]*?)<\/category>/gi)]
          .map((m) => decode(m[1]).trim()).filter(Boolean);
        const image = tag(it, 'enclosure') || null;
        const when = tag(it, 'pubDate') || tag(it, 'updated') || tag(it, 'published');
        let date = null; let startTime = null;
        const t = when ? new Date(when) : null;
        if (t && !isNaN(t)) {
          const d = new Date(t.getTime() + t.getTimezoneOffset() * 60000);
          date = d.toISOString().slice(0, 10);
          startTime = d.toISOString().slice(11, 16);
        }
        const sourceName = this.name;
        const sourceUrl = link || url;
        // Freshness gate (town/university updates are shown "just now" in the UI,
        // so never surface items older than maxAgeDays). Events keep their dates.
        if (produces !== 'events' && config && config.maxAgeDays && date) {
          const ageMs = Date.now() - new Date(date + 'T00:00:00').getTime();
          if (ageMs > Number(config.maxAgeDays) * 86400000) return null;
        }
        if (produces === 'university') {
          return { title, body: desc.slice(0, 800), category: 'news', date, sourceUrl, sourceName, important: false };
        }
        if (produces === 'town') {
          return { title, body: desc.slice(0, 800), category: 'news', date, sourceUrl, sourceName };
        }
        // events (default)
        return { title, description: desc.slice(0, 500), category: cats[0] || undefined, date, startTime, link, image, organizer: sourceName, sourceName, sourceUrl };
      }).filter(Boolean);
    } catch (e) {
      return [];
    }
  }
}
module.exports = RssSource;
