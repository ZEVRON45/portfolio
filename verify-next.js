const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 810 } });
  const errors = [];
  page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push('CONSOLE: ' + m.text()); });

  let up = false;
  for (let i = 0; i < 60; i++) {
    try { await page.goto('http://localhost:3001/', { timeout: 5000, waitUntil: 'domcontentloaded' }); up = true; break; }
    catch { await new Promise(r => setTimeout(r, 3000)); }
  }
  if (!up) { console.error('SERVER NOT UP'); process.exit(1); }
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(6000);
  fs.mkdirSync('shots', { recursive: true });
  await page.screenshot({ path: 'shots/next-01-hero.png' });
  const h = await page.evaluate(() => document.body.scrollHeight);
  for (const [name, frac] of [['next-02-stats', 0.18], ['next-03-directed', 0.38], ['next-04-work', 0.58], ['next-05-final', 0.8]]) {
    await page.evaluate(y => window.scrollTo(0, y), Math.round(h * frac));
    await page.waitForTimeout(1600);
    await page.screenshot({ path: `shots/${name}.png` });
  }
  console.log('pageHeight', h);
  console.log(errors.length ? errors.join('\n') : 'NO JS ERRORS');

  /* mobile pass */
  const mob = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const mErrors = [];
  mob.on('pageerror', e => mErrors.push('MOBILE PAGEERROR: ' + e.message));
  await mob.goto('http://localhost:3001/', { waitUntil: 'networkidle' });
  await mob.waitForTimeout(3000);
  await mob.screenshot({ path: 'shots/mob-01-hero.png' });
  const mh = await mob.evaluate(() => document.body.scrollHeight);
  for (const [name, frac] of [['mob-02-stats', 0.24], ['mob-03-work', 0.55], ['mob-04-final', 0.85]]) {
    await mob.evaluate(y => window.scrollTo(0, y), Math.round(mh * frac));
    await mob.waitForTimeout(1400);
    await mob.screenshot({ path: `shots/${name}.png` });
  }
  const overflow = await mob.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  console.log('mobileHeight', mh, 'hOverflow:', overflow);
  console.log(mErrors.length ? mErrors.join('\n') : 'NO MOBILE ERRORS');
  await browser.close();
  console.log('DONE');
})().catch(e => { console.error(e); process.exit(1); });
