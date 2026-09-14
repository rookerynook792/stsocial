'use strict';
import { h } from '../ui.js';
import { GALLERY } from '../data/gallery.js';

const CAT_EMOJI = { history: '🕰️', castle: '🏰', golf: '⛳', coast: '🌊', town: '🏛️' };

export async function render(container) {
  container.innerHTML = '';
  let filter = 'all';
  let list = GALLERY.photos;
  let lightbox = null;

  /* hero */
  const hero = h('div', { class: 'hero' });
  const loc = h('div', { class: 'h-loc' });
  loc.append(h('span', { text: '📸 ' + GALLERY.photos.length + ' photos · 1840s → today' }));
  hero.append(loc);
  hero.append(h('h1', { text: 'St Andrews through the years' }));
  hero.append(h('p', { text: 'From 1840s calotypes and a 1894 putting club to today’s beaches and the Old Course — the town the way the camera sees it. Tap any photo for the full story.' }));
  container.append(hero);

  /* chips */
  const chips = h('div', { class: 'chip-row', style: { marginTop: '14px' } });
  const makeChip = (id, label, count) => {
    const b = h('button', { class: 'chip' + (id === filter ? ' active' : '') },
      h('span', { class: 'e', text: id === 'all' ? '✨' : (CAT_EMOJI[id] || '📷') }), ' ',
      h('span', { text: label + (count ? ' · ' + count : '') }));
    b.addEventListener('click', () => {
      filter = id;
      list = id === 'all' ? GALLERY.photos : GALLERY.photos.filter((p) => p.cat === id);
      paintChips();
      paintGrid();
    });
    return b;
  };
  const allChip = makeChip('all', 'All', GALLERY.photos.length);
  chips.append(allChip);
  GALLERY.cats.forEach((c) => chips.append(makeChip(c.id, c.label, GALLERY.photos.filter((p) => p.cat === c.id).length)));
  container.append(chips);

  function paintChips() {
    const kids = [...chips.children];
    kids[0].classList.toggle('active', filter === 'all');
    GALLERY.cats.forEach((c, i) => kids[i + 1].classList.toggle('active', filter === c.id));
  }

  /* masonry grid */
  const grid = h('div', { class: 'masonry' });
  container.append(grid);

  function photoCard(p) {
    const img = h('img', { src: p.grid, alt: p.caption, loading: 'lazy', decoding: 'async' });
    const cap = h('div', { class: 'g-cap' });
    cap.append(h('div', { class: 'g-era' },
      h('span', { class: 'tag-soft', text: (CAT_EMOJI[p.cat] || '') + ' ' + (GALLERY.cats.find((c) => c.id === p.cat) || { label: p.cat }).label }),
      h('span', { class: 'g-year', text: p.era })));
    cap.append(h('div', { class: 'g-title', text: p.caption }));
    const card = h('div', { class: 'g-ph' }, img, cap);
    card.addEventListener('click', () => openLightbox(p.id));
    return card;
  }

  function paintGrid() {
    if (lightbox) closeLightbox();
    grid.innerHTML = '';
    list.forEach((p) => grid.append(photoCard(p)));
  }

  /* lightbox */
  function openLightbox(id) {
    const idx = list.findIndex((p) => p.id === id);
    if (idx < 0) return;
    const p = list[idx];
    const root = h('div', { class: 'lightbox' });
    const backdrop = h('div', { class: 'lb-back' });
    const panel = h('div', { class: 'lb-panel' });
    const img = h('img', { src: p.full, alt: p.caption });
    const bar = h('div', { class: 'lb-bar' });
    const closeB = h('button', { class: 'icon-btn lb-x', text: '×', 'aria-label': 'Close' });
    const prevB = h('button', { class: 'icon-btn lb-nav', text: '←', 'aria-label': 'Previous' });
    const nextB = h('button', { class: 'icon-btn lb-nav', text: '→', 'aria-label': 'Next' });
    bar.append(h('div', { class: 'lb-top' },
      h('span', { class: 'tag-soft', text: (CAT_EMOJI[p.cat] || '') + ' ' + (GALLERY.cats.find((c) => c.id === p.cat) || { label: p.cap }).label }),
      h('span', { class: 'g-year', text: p.era }), closeB));
    bar.append(h('div', { class: 'lb-cap', text: p.caption }));
    bar.append(h('div', { class: 'lb-credit', text: '📷 ' + (p.credit || 'Unknown') + ' · ' + (p.license || 'Wikimedia Commons') }));
    bar.append(h('div', { class: 'lb-navrow' }, prevB, h('span', { class: 'lb-count', text: (idx + 1) + ' / ' + list.length }), nextB));
    panel.append(img, bar);
    root.append(backdrop, panel);

    closeB.addEventListener('click', closeLightbox);
    backdrop.addEventListener('click', closeLightbox);
    prevB.addEventListener('click', () => openLightbox(list[(idx - 1 + list.length) % list.length].id));
    nextB.addEventListener('click', () => openLightbox(list[(idx + 1) % list.length].id));
    document.addEventListener('keydown', onKey);
    function onKey(e) {
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') openLightbox(list[(idx - 1 + list.length) % list.length].id);
      if (e.key === 'ArrowRight') openLightbox(list[(idx + 1) % list.length].id);
    }
    document.body.append(root);
    requestAnimationFrame(() => root.classList.add('show'));
    lightbox = { root, onKey };
  }

  function closeLightbox() {
    if (!lightbox) return;
    const { root, onKey } = lightbox;
    lightbox = null;
    document.removeEventListener('keydown', onKey);
    root.classList.remove('show');
    setTimeout(() => root.remove(), 220);
  }

  paintGrid();

  /* attribution */
  container.append(h('div', { class: 'center faint small', style: { marginTop: '26px', paddingBottom: '6px' } },
    h('span', { text: 'Photos: ' }),
    h('a', { class: 'section-link', href: 'https://commons.wikimedia.org/wiki/Category:St_Andrews', target: '_blank', rel: 'noopener', text: 'Wikimedia Commons contributors' }),
    h('span', { text: ' · CC BY / CC BY-SA / CC0 / Public Domain' })));
}
