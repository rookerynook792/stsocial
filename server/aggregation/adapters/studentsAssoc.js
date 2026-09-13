'use strict';
const SourceAdapter = require('./base');
const { demoEvents } = require('../demoData');

/**
 * Students' Association + society events. Live mode would scrape/parse the SA
 * events listing (config.url) with medium-high reliability.
 */
class StudentsAssocSource extends SourceAdapter {
  constructor() {
    super();
    this.id = 'studentsAssoc';
    this.name = "Students' Association & Societies";
    this.type = 'students_assoc';
    this.reliability = 8;
    this.produces = 'events';
  }
  async fetch(config, live) {
    if (live && config && config.url) {
      // Real integration point: parse the SA events page / API.
      return [];
    }
    const re = /society|students'? association|choir/i;
    return demoEvents().filter((e) => re.test(e.organizer || ''));
  }
}
module.exports = StudentsAssocSource;
