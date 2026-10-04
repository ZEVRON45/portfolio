const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const VIDEO = path.resolve('From Klickpin.com- Clean Girl Makeup Looks Ideas Youll Keep Coming Back To 29596-pin-id-1110981801858164785.mp4');
const OUT = path.resolve('frames-dense');
fs.mkdirSync(OUT, { recursive: true });

(async () => {
  const http = require('http');
  const data = fs.readFileSync(VIDEO);
  const server = http.createServer((req, res) => {
    const range = req.headers.range;
    if (range) {
      const m = /bytes=(\d*)-(\d*)/.exec(range);
      const start = m[1] ? parseInt(m[1]) : 0;
      const end = m[2] ? parseInt(m[2]) : data.length - 1;
      res.writeHead(206, { 'Content-Type': 'video/mp4', 'Content-Range': `bytes ${start}-${end}/${data.length}`, 'Accept-Ranges': 'bytes', 'Content-Length': end - start + 1 });
      res.end(data.subarray(start, end + 1));
    } else {
      res.writeHead(200, { 'Content-Type': 'video/mp4', 'Content-Length': data.length, 'Accept-Ranges': 'bytes' });
      res.end(data);
    }
  });
  await new Promise(r => server.listen(0, r));
  const port = server.address().port;
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await page.setContent(`
    <body style="margin:0;background:#000">
      <video id="v" src="http://localhost:${port}/video.mp4" style="width:1280px;height:720px;object-fit:contain" preload="auto" muted></video>
    </body>`);
  await page.evaluate(() => new Promise(res => {
    const v = document.getElementById('v');
    v.onloadedmetadata = res; setTimeout(res, 8000);
  }));
  const dur = await page.evaluate(() => document.getElementById('v').duration);
  for (let t = 0; t < dur; t += 0.25) {
    await page.evaluate(async (t) => {
      const v = document.getElementById('v');
      v.currentTime = t;
      await new Promise(r => { v.onseeked = r; });
    }, t);
    await page.screenshot({ path: path.join(OUT, `f-${t.toFixed(2)}.png`) });
  }
  await browser.close();
  server.close();
  console.log('DONE', dur);
})().catch(e => { console.error('ERR', e); process.exit(1); });
