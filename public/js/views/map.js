'use strict';
import { api } from '../api.js';
import { h, emptyState, eventWhenLabel } from '../ui.js';

/**
 * Google Maps view — live, real map (no API key: uses the public
 * "output=embed" endpoint). Tap any event or place to centre the map on it.
 */

function mapsEmbed(query, zoom) {
  const q = encodeURIComponent(query || 'St Andrews, Fife, Scotland');
  return `https://maps.google.com/maps?q=${q}&z=${zoom || 15}&hl=en-GB&output=embed`;
}

export async function render(container, ctx) {
  container.innerHTML = '';
  let events = [], places = [];
  try {
    [events, places] = await Promise.all([api.get('/api/events?filter=upcoming'), api.get('/api/town/places')]);
  } catch { /* keep going with whatever loaded */ }
  events = (events.events || []).slice(0, 20);
  places = (places.places || []).slice(0, 20);

  const frame = h('iframe', {
    class: 'gmap',
    src: mapsEmbed('St Andrews, Fife, Scotland', 15),
    title: 'St Andrews on Google Maps',
    loading: 'lazy',
    allow: 'fullscreen',
    referrerPolicy: 'no-referrer-when-downgrade',
  });
  const mapWrap = h('div', { class: 'map-wrap mb' }, frame);
  const status = h('div', { class: 'faint small center mb-sm', text: 'Tap an event or place below to find it on the map' });
  container.append(mapWrap, status);

  function locate(query, label) {
    frame.src = mapsEmbed(query, 16);
    status.textContent = '📍 ' + label;
    frame.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  const section = h('div', { class: 'section' },
    h('div', { class: 'section-head' }, h('div', { class: 'section-title' }, h('span', { class: 'emoji', text: '📍' }), 'Events & places')));

  if (events.length || places.length) {
    const list = h('div', { class: 'stack-sm' });

    if (events.length) {
      list.append(h('div', { class: 'faint small mt-sm', text: 'EVENTS' }));
      events.forEach((e) => {
        const q = e.location && e.location !== 'St Andrews'
          ? `${e.location}, St Andrews, Fife, Scotland`
          : 'St Andrews, Fife, Scotland';
        list.append(h('button', { class: 'row-item', onClick: () => locate(q, e.title) },
          h('div', { class: 'ri-body' },
            h('div', { class: 'ri-title', text: e.title.slice(0, 90) }),
            h('div', { class: 'ri-sub', text: `${eventWhenLabel(e)} · ${e.location || 'St Andrews'}` })),
          h('span', { class: 'faint', text: '🧭' }),
        ));
      });
    }

    if (places.length) {
      list.append(h('div', { class: 'faint small mt-sm', text: 'PLACES' }));
      places.forEach((p) => {
        const q = p.lat != null && p.lng != null
          ? `${p.lat},${p.lng}`
          : `${p.name}, ${p.address || 'St Andrews, Fife, Scotland'}`;
        list.append(h('button', { class: 'row-item', onClick: () => locate(q, p.name) },
          h('div', { class: 'ri-body' },
            h('div', { class: 'ri-title', text: p.name }),
            h('div', { class: 'ri-sub', text: p.address || 'St Andrews' })),
          h('span', { class: 'faint', text: '🧭' }),
        ));
      });
    }
    section.append(list);
  } else {
    section.append(emptyState('🗺️', 'Nothing on the map yet', 'Events and places will appear here as they come in.'));
  }
  container.append(section);
}
