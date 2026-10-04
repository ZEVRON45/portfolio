const { chromium } = require('playwright');
const path = require('path');

const jobs = [
  { src: 'refs/frame-02-t1.9s.png', out: 'assets/hero-figure.png', clip: { x: 548, y: 282, width: 185, height: 200 } },
  { src: 'refs/frame-11-t8.8s.png', out: 'assets/final-figure.png', clip: { x: 515, y: 330, width: 250, height: 165 } },
  { src: 'refs/frame-04-t3.5s.png', out: 'assets/stats-figure.png', clip: { x: 590, y: 398, width: 100, height: 95 } },
  { src: 'refs/frame-08-t6.5s.png', out: 'assets/tile-1.png', clip: { x: 462, y: 440, width: 60, height: 55 } },
  { src: 'refs/frame-08-t6.5s.png', out: 'assets/tile-2.png', clip: { x: 755, y: 440, width: 62, height: 58 } },
];

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  for (const j of jobs) {
    await page.goto('file:///' + path.resolve(j.src).replace(/\\/g, '/'));
    await page.screenshot({ path: j.out, clip: j.clip });
    console.log('cropped', j.out);
  }
  await browser.close();
  console.log('DONE');
})().catch(e => { console.error(e); process.exit(1); });
