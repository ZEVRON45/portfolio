const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve('.');
const MIME = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.mp4': 'video/mp4' };

const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p === '/') p = '/index.html';
  const file = path.join(ROOT, p);
  if (!file.startsWith(ROOT)) { res.writeHead(403); return res.end(); }
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404); return res.end('nf'); }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
    res.end(data);
  });
});

(async () => {
  await new Promise(r => server.listen(8734, r));
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 810 } });
  const errors = [];
  page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push('CONSOLE: ' + m.text()); });
  await page.goto('http://localhost:8734/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(3500);
  fs.mkdirSync('shots', { recursive: true });
  await page.screenshot({ path: 'shots/01-hero.png' });
  const h = await page.evaluate(() => document.body.scrollHeight);
  const steps = [['02-stats', 0.18], ['03-directed', 0.38], ['04-work', 0.58], ['05-final', 0.8]];
  for (const [name, frac] of steps) {
    await page.evaluate(y => window.scrollTo(0, y), Math.round(h * frac));
    await page.waitForTimeout(1600);
    await page.screenshot({ path: `shots/${name}.png` });
  }
  console.log('pageHeight', h);
  console.log(errors.length ? errors.join('\n') : 'NO JS ERRORS');
  await browser.close();
  server.close();
  console.log('DONE');
})().catch(e => { console.error(e); process.exit(1); });
