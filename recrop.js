const { chromium } = require('playwright');
const path = require('path');
const jobs = [
  { src: 'refs/frame-11-t8.8s.png', out: 'assets/final-figure.png', clip: { x: 543, y: 370, width: 185, height: 118 } },
];
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1280, height: 720 } });
  for (const j of jobs) {
    await p.goto('file:///' + path.resolve(j.src).replace(/\\/g, '/'));
    await p.screenshot({ path: j.out, clip: j.clip });
    console.log('ok', j.out);
  }
  await b.close();
})();
