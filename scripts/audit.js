const { chromium } = require('playwright');

const WIDTHS = [320, 360, 375, 390, 414, 480, 560, 640, 768, 820, 900, 1024, 1100, 1280, 1440, 1600, 1920, 2560];

const probe = () => {
  const de = document.documentElement;
  const vw = de.clientWidth;
  const out = {
    hOverflow: de.scrollWidth > vw,
    scrollWidth: de.scrollWidth,
    clientWidth: vw,
    wide: [],
    clipped: [],
    broken: [],
    tiny: [],
    offRight: [],
  };

  const clippedByAncestor = el => {
    for (let a = el.parentElement; a; a = a.parentElement) {
      const o = getComputedStyle(a).overflowX;
      if (o === 'hidden' || o === 'clip' || o === 'auto' || o === 'scroll') return true;
    }
    return false;
  };
  const path = el => {
    let s = el.tagName.toLowerCase();
    if (el.id) s += '#' + el.id;
    else if (el.className && typeof el.className === 'string') s += '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.');
    return s;
  };

  document.querySelectorAll('*').forEach(el => {
    const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden' || cs.display === 'none' || cs.opacity === '0') return;
    const r = el.getBoundingClientRect();
    if (!r.width && !r.height) return;

    if (r.right > vw + 1 && cs.position !== 'fixed' && !clippedByAncestor(el)) {
      out.offRight.push({ el: path(el), right: Math.round(r.right), w: Math.round(r.width) });
    }

    if ((cs.overflowX === 'hidden' || cs.overflowX === 'clip') && el.children.length === 0 && el.textContent.trim()) {
      if (el.scrollWidth > el.clientWidth + 1) out.clipped.push({ el: path(el), lost: el.scrollWidth - el.clientWidth, text: el.textContent.trim().slice(0, 40) });
    }
    if ((cs.overflowY === 'hidden' || cs.overflowY === 'clip') && el.children.length === 0 && el.textContent.trim()) {
      if (el.scrollHeight > el.clientHeight + 1) out.clipped.push({ el: path(el), lostY: el.scrollHeight - el.clientHeight, text: el.textContent.trim().slice(0, 40) });
    }
  });

  document.querySelectorAll('img').forEach(im => {
    if (im.complete && im.naturalWidth === 0) out.broken.push(im.getAttribute('src'));
    if (!im.getAttribute('alt')) out.broken.push('NO ALT: ' + im.getAttribute('src'));
  });

  if (matchMedia('(pointer: coarse)').matches || vw < 820) {
    document.querySelectorAll('a,button').forEach(el => {
      const r = el.getBoundingClientRect();
      if (!r.width || !r.height) return;
      if (r.width < 24 || r.height < 24) out.tiny.push({ el: path(el), w: Math.round(r.width), h: Math.round(r.height) });
    });
  }

  out.wide = out.offRight.slice(0, 8);
  return out;
};

(async () => {
  const browser = await chromium.launch();
  const problems = [];

  for (const theme of ['dark', 'light']) {
    for (const w of WIDTHS) {
      const isMobile = w < 820;
      const page = await browser.newPage({
        viewport: { width: w, height: w < 820 ? 844 : 900 },
        isMobile,
        hasTouch: isMobile,
        deviceScaleFactor: 1,
      });
      const errs = [];
      page.on('pageerror', e => errs.push('PAGEERROR ' + e.message));
      page.on('console', m => { if (m.type() === 'error') errs.push('CONSOLE ' + m.text()); });

      await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' });
      await page.evaluate(t => localStorage.setItem('theme', t), theme);
      await page.reload({ waitUntil: 'networkidle' });
      await page.waitForTimeout(1200);

      /* walk in viewport-sized steps and let each one settle — a fast pixel crawl
         leaves ScrollTrigger mid-flight and the probe then reports ghosts */
      const step = Math.round((w < 820 ? 844 : 900) * 0.7);
      const h = await page.evaluate(() => document.body.scrollHeight);
      const seen = { offRight: new Set(), clipped: new Set(), tiny: new Set() };
      let r = null;
      for (let y = 0; ; y += step) {
        await page.evaluate(v => window.scrollTo(0, v), y);
        await page.waitForTimeout(260);
        r = await page.evaluate(probe);
        r.offRight.forEach(o => seen.offRight.add(JSON.stringify(o)));
        r.clipped.forEach(o => seen.clipped.add(JSON.stringify(o)));
        r.tiny.forEach(o => seen.tiny.add(JSON.stringify(o)));
        if (y >= h) break;
      }
      r.offRight = [...seen.offRight].map(s => JSON.parse(s));
      r.clipped = [...seen.clipped].map(s => JSON.parse(s));
      r.tiny = [...seen.tiny].map(s => JSON.parse(s));
      r.wide = r.offRight.slice(0, 8);
      const tag = `${theme} @${w}`;

      if (r.hOverflow) problems.push(`${tag}: H-OVERFLOW scrollWidth=${r.scrollWidth} client=${r.clientWidth}`);
      if (r.offRight.length) problems.push(`${tag}: past right edge -> ${JSON.stringify(r.wide)}`);
      if (r.clipped.length) problems.push(`${tag}: CLIPPED TEXT -> ${JSON.stringify(r.clipped.slice(0, 6))}`);
      if (r.broken.length) problems.push(`${tag}: IMAGES -> ${JSON.stringify([...new Set(r.broken)])}`);
      if (r.tiny.length) problems.push(`${tag}: SMALL TARGETS -> ${JSON.stringify(r.tiny.slice(0, 8))}`);
      if (errs.length) problems.push(`${tag}: ${errs.join(' | ')}`);

      await page.close();
      process.stdout.write('.');
    }
  }

  await browser.close();
  console.log('\n\n===== FINDINGS =====');
  console.log(problems.length ? problems.join('\n') : 'NONE');
})();
