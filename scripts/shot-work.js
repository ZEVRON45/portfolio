const { chromium } = require('playwright');

const passes = [
  ['wsx-desk-dark', { viewport: { width: 1440, height: 900 } }, null],
  ['wsx-desk-light', { viewport: { width: 1440, height: 900 } }, 'light'],
  ['wsx-tab-dark', { viewport: { width: 900, height: 1000 } }, null],
  ['wsx-mob-dark', { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }, null],
  ['wsx-mob-light', { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }, 'light'],
  ['wsx-micro', { viewport: { width: 320, height: 700 }, isMobile: true, hasTouch: true }, null],
];

(async () => {
  const browser = await chromium.launch();
  const errors = [];
  for (const [tag, opts, theme] of passes) {
    const page = await browser.newPage(opts);
    page.on('pageerror', e => errors.push(`${tag} PAGEERROR: ${e.message}`));
    page.on('console', m => { if (m.type() === 'error') errors.push(`${tag} CONSOLE: ${m.text()}`); });
    await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' });
    if (theme) {
      await page.evaluate(t => localStorage.setItem('theme', t), theme);
      await page.reload({ waitUntil: 'networkidle' });
    }
    await page.waitForTimeout(2000);
    /* walk the page so every ScrollTrigger fires before we shoot */
    const h = await page.evaluate(() => document.body.scrollHeight);
    for (let y = 0; y < h; y += 300) {
      await page.evaluate(v => window.scrollTo(0, v), y);
      await page.waitForTimeout(90);
    }
    await page.evaluate(() => document.querySelector('#work').scrollIntoView({ block: 'start' }));
    await page.waitForTimeout(9000);
    await page.locator('#work').screenshot({ path: `shots/${tag}.png` });
    if (tag === 'wsx-desk-dark') {
      await page.locator('.work-card').hover();
      await page.waitForTimeout(700);
      await page.locator('#work').screenshot({ path: 'shots/wsx-desk-hover.png' });
    }
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    if (overflow) console.log('H-OVERFLOW at', tag);
    console.log('shot', tag);
    await page.close();
  }
  await browser.close();
  console.log(errors.length ? errors.join('\n') : 'NO JS ERRORS');
})().catch(e => { console.error(e); process.exit(1); });
