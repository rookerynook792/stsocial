'use strict';
const SourceAdapter = require('./base');
const { demoEvents } = require('../demoData');

/**
 * University of St Andrews official events.
 * In live mode this would read the university's public events feed/API from
 * `config.url` (and mark items with high reliability + source_type=university).
 */
class UniversitySource extends SourceAdapter {
  constructor() {
    super();
    this.id = 'university';
    this.name = 'University of St Andrews';
    this.type = 'university';
    this.reliability = 10;
    this.produces = 'events';
    this.isDemoSource = true; // content is generated sample data
  }
  async fetch(config, live) {
    if (live && config && config.url) {
      // Real integration point:
      //   const res = await fetch(config.url); const data = await res.json();
      //   return data.map(mapUniversityEvent);
      return [];
    }
    const re = /university|library|careers service/i;
    return demoEvents().filter((e) => re.test(e.organizer || ''));
  }
}
module.exports = UniversitySource;
