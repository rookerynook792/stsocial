'use strict';
const SourceAdapter = require('./base');
const { demoUniversityUpdates } = require('../demoData');

/**
 * Official University of St Andrews updates: news, academic, exams, notices.
 * High reliability, always surfaced with the "UNIVERSITY VERIFIED" label.
 */
class UniversityFeedSource extends SourceAdapter {
  constructor() {
    super();
    this.id = 'universityFeed';
    this.name = 'University Official Notices';
    this.type = 'university_feed';
    this.reliability = 10;
    this.produces = 'university';
  }
  async fetch(config, live) {
    if (live && config && config.url) {
      // Real integration point: official university news / notices RSS or API.
      return [];
    }
    return demoUniversityUpdates();
  }
}
module.exports = UniversityFeedSource;
