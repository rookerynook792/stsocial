'use strict';
/**
 * Base class for all ingestion sources (adapters).
 *
 * To add a new event source:
 *   1. Create a class that extends SourceAdapter.
 *   2. Set `id`, `name`, `reliability`, `produces` ('events' | 'town' | 'university').
 *   3. Implement `fetch(config)` to return normalised items.
 *   4. Register it in adapters/index.js.
 *
 * `fetch` may return an empty array or throw; the pipeline treats an error as
 * "no data this run" and keeps the source enabled. Normalised event shape:
 *   { title, description, date(YYYY-MM-DD), startTime(HH:MM), endTime, location,
 *     address, category?, price?, ticketUrl?, organizer?, image?, emoji?, lat?, lng? }
 */
class SourceAdapter {
  constructor() {
    this.id = 'base';
    this.name = 'Base Source';
    this.type = this.id;
    this.reliability = 5;
    this.produces = 'events';
    this.url = null;
  }
  async fetch(/* config, live */) {
    return [];
  }
}

module.exports = SourceAdapter;
