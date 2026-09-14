'use strict';
const SourceAdapter = require('./base');
const { demoTownUpdates } = require('../demoData');

/**
 * Town updates: road closures, transport, weather, council, local business,
 * community news. Live mode would pull from the council feed + weather API.
 */
class TownFeedSource extends SourceAdapter {
  constructor() {
    super();
    this.id = 'townFeed';
    this.name = 'St Andrews Town Feeds';
    this.type = 'town_feed';
    this.reliability = 8;
    this.produces = 'town';
    this.isDemoSource = true; // content is generated sample data
  }
  async fetch(config, live) {
    if (live && config && config.url) {
      // Real integration point: Fife council notices + a weather API (env key).
      return [];
    }
    return demoTownUpdates();
  }
}
module.exports = TownFeedSource;
