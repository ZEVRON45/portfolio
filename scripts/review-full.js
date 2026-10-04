/* Full-page visual review passes — gentle scroll so ScrollTrigger state stays honest. */
const { chromium } = require('playwright');

const PASSES = [
  { w: 360, h: 780, theme: 'dark' },
  { w: 360, h: 780, theme: 'light' },
  { w: 768, h: 900, theme: 'dark' },
  { w: 768, h: 900, theme: 'light' },
  { w: 1280, h: 800, theme: 'dark' },
  { w: 1280, h: 800, theme: 'light' },
];

(async () => {
  const browser = await chromium.launch();
  for (const p of PASSES) {
    const page = await browser.newPage({ viewport: { width: p.w, height: p.h } });
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    await page.evaluate((t) => localStorage.setItem('theme', t), p.theme);
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(3500);

    /* walk down in viewport-sized steps, letting each settle */
    const total = await page.evaluate(() => document.body.scrollHeight);
    for (let y = 0; y <= total; y += Math.round(p.h * 0.6)) {
      await page.evaluate((yy) => window.scrollTo(0, yy), y);
      await page.waitForTimeout(320);
    }
    await page.waitForTimeout(1200);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(800);

    await page.screenshot({ path: `shots/review/${p.theme}@${p.w}-full.png`, fullPage: true });
    console.log('shot', p.theme, p.w);
    await page.close();
  }
  await browser.close();
})();
