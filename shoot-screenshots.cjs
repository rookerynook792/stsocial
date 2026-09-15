'use strict';
const { chromium } = require('playwright-core');

const BASE = 'https://stsocial.onrender.com';
const SHOTS = [
  { file: '01-home.png', hash: '#/home', wait: 4000 },
  { file: '02-events.png', hash: '#/events', wait: 3000 },
  { file: '03-guide.png', hash: '#/explore', wait: 3000 },
  { file: '04-gallery.png', hash: '#/gallery', wait: 4000 },
  { file: '05-town.png', hash: '#/town', wait: 5000 },
];

(async () => {
  // Warm the Render service (free-tier cold start + boot ingestion) before shooting.
  for (let i = 0; i < 40; i++) {
    try {
      const r = await fetch('https://stsocial.onrender.com/api/events');
      const d = await r.json();
      if (Array.isArray(d) ? d.length > 0 : (d.events || []).length > 0) { console.log('service warm, events:', (d.events || d).length); break; }
    } catch (e) {}
    await new Promise((res) => setTimeout(res, 3000));
  }
  const executablePath = require('path').join(process.env.HOME, '.cache/ms-playwright/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell');
  const browser = await chromium.launch({ executablePath, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const ctx = await browser.newContext({
    viewport: { width: 1080, height: 1920 },
    deviceScaleFactor: 1,
    userAgent: 'Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138 Mobile Safari/537.36',
    isMobile: true,
    hasTouch: true,
  });
  await ctx.addInitScript(() => { try { localStorage.setItem('sttheme', 'dark'); } catch (e) {} });
  const page = await ctx.newPage();

  for (const s of SHOTS) {
    if (s === SHOTS[0]) {
      await page.goto(BASE + '/', { waitUntil: 'networkidle', timeout: 60000 }).catch(() => {});
      await page.waitForTimeout(3500);
    }
    await page.evaluate((hash) => {
      try { localStorage.setItem('sttheme', 'dark'); } catch (e) {}
      document.documentElement.setAttribute('data-theme', 'dark');
      location.hash = hash;
      window.scrollTo(0, 0);
    }, s.hash);
    await page.waitForTimeout(s.wait);
    await page.evaluate(() => { document.documentElement.setAttribute('data-theme', 'dark'); window.scrollTo(0, 0); });
    await page.screenshot({ path: 'play-assets/screenshots/' + s.file, fullPage: false });
    console.log('shot', s.file);
  }
  await browser.close();
  console.log('DONE');
})().catch((e) => { console.error('FAIL', e.message); process.exit(1); });
