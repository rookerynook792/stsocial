'use strict';
const SourceAdapter = require('./base');
const { demoEvents } = require('../demoData');

/**
 * A local venue / restaurant that publishes its own public calendar.
 * Demonstrates the "local venues & businesses" source type.
 */
class VenueSource extends SourceAdapter {
  constructor() {
    super();
    this.id = 'venue';
    this.name = 'Local Venues & Restaurants';
    this.type = 'venue';
    this.reliability = 6;
    this.produces = 'events';
    this.isDemoSource = true; // content is generated sample data
  }
  async fetch(config, live) {
    if (live && config && config.url) {
      // Real integration point: read a venue calendar (HTML/ICS/API).
      return [];
    }
    const re = /burr o'?reilly|tavern/i;
    return demoEvents().filter((e) => re.test(e.organizer || ''));
  }
}
module.exports = VenueSource;
