const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const VIDEO = path.resolve('From Klickpin.com- Clean Girl Makeup Looks Ideas Youll Keep Coming Back To 29596-pin-id-1110981801858164785.mp4');
const OUT = path.resolve('refs');
fs.mkdirSync(OUT, { recursive: true });

(async () => {
  const http = require('http');
  const data = fs.readFileSync(VIDEO);
  const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'video/mp4', 'Content-Length': data.length, 'Accept-Ranges': 'bytes' });
    res.end(data);
  });
  await new Promise(r => server.listen(0, r));
  const port = server.address().port;
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const url = `http://localhost:${port}/video.mp4`;
  await page.setContent(`
    <body style="margin:0;background:#000">
      <video id="v" src="${url}" style="width:1280px;height:720px;object-fit:contain" preload="auto" muted></video>
    </body>`);
  await page.evaluate(() => new Promise((res, rej) => {
    const v = document.getElementById('v');
    v.onloadedmetadata = res; v.onerror = () => rej('video load error: ' + v.error);
    setTimeout(() => res(), 8000);
  }));
  const dur = await page.evaluate(() => document.getElementById('v').duration);
  if (!isFinite(dur)) { console.error('video failed to load'); process.exit(1); }
  console.log('duration:', dur);
  const n = 12;
  for (let i = 0; i < n; i++) {
    const t = (dur * (i + 0.5)) / n;
    await page.evaluate(async (t) => {
      const v = document.getElementById('v');
      v.currentTime = t;
      await new Promise(r => { v.onseeked = r; });
    }, t);
    await page.screenshot({ path: path.join(OUT, `frame-${String(i).padStart(2, '0')}-t${t.toFixed(1)}s.png`) });
    console.log('shot', i, t.toFixed(1));
  }
  await browser.close();
  server.close();
  console.log('DONE');
})().catch(e => { console.error('ERR', e); process.exit(1); });
