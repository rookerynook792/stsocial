'use strict';
const SourceAdapter = require('./base');
const { demoEvents } = require('../demoData');

/**
 * Generic community / catch-all event feed. Any event not claimed by a more
 * specific source lands here (reliability 4 → shown as auto-imported).
 */
class EventsFeedSource extends SourceAdapter {
  constructor() {
    super();
    this.id = 'eventsFeed';
    this.name = 'St Andrews Community Feed';
    this.type = 'events_feed';
    this.reliability = 4;
    this.produces = 'events';
  }
  async fetch(config, live) {
    if (live && config && config.url) {
      // Real integration point: any public events calendar/API.
      return [];
    }
    const uniRe = /university|library|careers service/i;
    const saRe = /society|students'? association|choir/i;
    const venueRe = /burr o'?reilly|tavern/i;
    return demoEvents().filter((e) => {
      const o = e.organizer || '';
      return !(uniRe.test(o) || saRe.test(o) || venueRe.test(o));
    });
  }
}
module.exports = EventsFeedSource;
