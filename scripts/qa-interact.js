/* Interaction + accessibility checks. */
const { chromium } = require('playwright');
const URL = 'http://localhost:3000';

(async () => {
  const browser = await chromium.launch();
  const out = {};

  /* ---------- desktop: anchors, links, focus ---------- */
  {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    const errs = [];
    page.on('console', (m) => m.type() === 'error' && errs.push(m.text()));
    page.on('pageerror', (e) => errs.push('PAGEERROR ' + e.message));
    await page.goto(URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2500);

    out.anchors = await page.evaluate(() => {
      const bad = [];
      for (const a of document.querySelectorAll('a[href^="#"]')) {
        const id = a.getAttribute('href').slice(1);
        if (!id) { bad.push({ href: a.href, why: 'empty' }); continue; }
        if (!document.getElementById(id)) bad.push({ href: a.getAttribute('href'), why: 'no target', text: a.textContent.trim().slice(0, 30) });
      }
      return bad;
    });

    out.external = await page.evaluate(() =>
      [...document.querySelectorAll('a[href^="http"], a[href^="mailto"]')].map((a) => ({
        href: a.getAttribute('href'),
        text: a.textContent.trim().slice(0, 26),
        target: a.target || '', rel: a.rel || '',
      })));

    out.invisibleFocusables = await page.evaluate(() => {
      const sel = 'a[href],button,input,select,textarea,[tabindex]:not([tabindex="-1"])';
      return [...document.querySelectorAll(sel)].filter((e) => {
        if (e.closest('[hidden]') || e.getAttribute('aria-hidden') === 'true') return false;
        const cs = getComputedStyle(e);
        if (cs.visibility === 'hidden' || cs.display === 'none') return false;
        const r = e.getBoundingClientRect();
        if (r.width < 2 && r.height < 2) return true;
        if (cs.opacity === '0') return true;
        if (r.bottom <= 0 || r.top >= innerHeight) return cs.position === 'fixed';
        return false;
      }).map((e) => (e.tagName + '.' + e.className + ' ' + e.textContent.trim().slice(0, 20)).slice(0, 70));
    });

    /* tab order + focus ring visibility */
    await page.evaluate(() => window.scrollTo(0, 0));
    const rings = [];
    for (let i = 0; i < 8; i++) {
      await page.keyboard.press('Tab');
      rings.push(await page.evaluate(() => {
        const e = document.activeElement; if (!e) return null;
        const cs = getComputedStyle(e);
        return {
          el: (e.tagName + '.' + (e.className || '')).slice(0, 34),
          outline: cs.outlineStyle + ' ' + cs.outlineWidth + ' ' + cs.outlineColor,
          shadow: cs.boxShadow === 'none' ? 'none' : 'yes',
        };
      }));
    }
    out.tabOrder = rings;

    /* theme persistence across reload */
    await page.click('#theme-btn');
    await page.waitForTimeout(600);
    const afterClick = await page.evaluate(() => document.documentElement.dataset.theme);
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(1200);
    out.theme = { afterClick, survivesReload: await page.evaluate(() => document.documentElement.dataset.theme), stored: await page.evaluate(() => localStorage.getItem('theme')) };

    out.desktopErrors = errs;
    await page.close();
  }

  /* ---------- mobile: menu behaviour ---------- */
  {
    const page = await browser.newPage({ viewport: { width: 390, height: 780 }, hasTouch: true, isMobile: true });
    const errs = [];
    page.on('console', (m) => m.type() === 'error' && errs.push(m.text()));
    page.on('pageerror', (e) => errs.push('PAGEERROR ' + e.message));
    await page.goto(URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2200);

    const sheet = () => page.evaluate(() => {
      const s = document.querySelector('.nav-sheet'); if (!s) return null;
      const cs = getComputedStyle(s); const r = s.getBoundingClientRect();
      return { display: cs.display, vis: cs.visibility, op: cs.opacity, tf: cs.transform, h: Math.round(r.height), top: Math.round(r.top), ariaHidden: s.getAttribute('aria-hidden'), links: s.querySelectorAll('a,button').length };
    });
    const btn = () => page.evaluate(() => { const b = document.querySelector('#menu-btn'); return b ? { exp: b.getAttribute('aria-expanded'), label: b.getAttribute('aria-label') } : null; });

    out.menu = { before: { sheet: await sheet(), btn: await btn() } };
    await page.click('#menu-btn'); await page.waitForTimeout(600);
    out.menu.open = { sheet: await sheet(), btn: await btn() };
    await page.screenshot({ path: 'shots/review/menu-open.png' });

    await page.keyboard.press('Escape'); await page.waitForTimeout(600);
    out.menu.afterEscape = { sheet: await sheet(), btn: await btn() };

    await page.click('#menu-btn'); await page.waitForTimeout(600);
    await page.mouse.click(195, 700); await page.waitForTimeout(600);
    out.menu.afterOutsideClick = await sheet();

    await page.click('#menu-btn'); await page.waitForTimeout(600);
    const link = page.locator('.nav-sheet a').first();
    await link.click(); await page.waitForTimeout(1800);
    out.menu.afterLink = {
      sheet: await sheet(),
      scrollY: await page.evaluate(() => Math.round(window.scrollY)),
      sheetLinks: await page.evaluate(() => [...document.querySelectorAll('.nav-sheet a')].map(a => a.getAttribute('href'))),
    };
    out.mobileErrors = errs;
    await page.close();
  }

  /* ---------- contrast ---------- */
  {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    for (const theme of ['dark', 'light']) {
      await page.goto(URL, { waitUntil: 'networkidle' });
      await page.evaluate((t) => localStorage.setItem('theme', t), theme);
      await page.reload({ waitUntil: 'networkidle' });
      await page.waitForTimeout(2000);
      const total = await page.evaluate(() => document.body.scrollHeight);
      for (let y = 0; y <= total; y += 500) { await page.evaluate((v) => window.scrollTo(0, v), y); await page.waitForTimeout(120); }
      const low = await page.evaluate(() => {
        const px = (c) => { const m = c.match(/\d+(\.\d+)?/g); if (!m) return null; const [r, g, b] = m.slice(0, 3).map(Number); const f = [r, g, b].map((v) => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }); return .2126 * f[0] + .7152 * f[1] + .0722 * f[2]; };
        const bgOf = (e) => { let n = e; while (n && n !== document.documentElement) { const c = getComputedStyle(n).backgroundColor; if (c && c !== 'rgba(0, 0, 0, 0)' && c !== 'transparent') return c; n = n.parentElement; } return 'rgb(255,255,255)'; };
        const bad = [];
        for (const e of document.querySelectorAll('p,span,small,b,i,a,li,h1,h2,h3,h4,em,strong,div')) {
          if (e.children.length) continue;
          const t = (e.textContent || '').trim(); if (!t) continue;
          const cs = getComputedStyle(e); if (cs.visibility === 'hidden' || cs.display === 'none' || +cs.opacity < .5) continue;
          const r = e.getBoundingClientRect(); if (r.width < 2 || r.height < 2) continue;
          const fs = parseFloat(cs.fontSize); const bold = +cs.fontWeight >= 700;
          const L1 = px(cs.color), L2 = px(bgOf(e)); if (L1 == null || L2 == null) continue;
          const cr = (Math.max(L1, L2) + .05) / (Math.min(L1, L2) + .05);
          const need = fs >= 24 || (bold && fs >= 18.66) ? 3 : 4.5;
          if (cr < need) bad.push({ t: t.slice(0, 26), fs: Math.round(fs), fw: cs.fontWeight, cr: +cr.toFixed(2), need, cls: (e.className + '').slice(0, 22) });
        }
        const seen = new Set(); return bad.filter((b) => { const k = b.t + b.cls; if (seen.has(k)) return false; seen.add(k); return true; });
      });
      out['contrast_' + theme] = low;
    }
    await page.close();
  }

  /* ---------- reduced motion ---------- */
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, reducedMotion: 'reduce' });
    const page = await ctx.newPage();
    await page.goto(URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2500);
    out.reduced = await page.evaluate(() => {
      const hidden = [];
      for (const e of document.querySelectorAll('section *')) {
        const cs = getComputedStyle(e); const t = (e.textContent || '').trim();
        if (+cs.opacity < .1 && t && t.length > 2 && !e.closest('.nav-sheet')) hidden.push((e.tagName + '.' + (e.className + '').slice(0, 20) + ' "' + t.slice(0, 18) + '"'));
      }
      return { invisibleCount: hidden.length, sample: hidden.slice(0, 12) };
    });
    await page.screenshot({ path: 'shots/review/reduced-hero.png' });
    await ctx.close();
  }

  console.log(JSON.stringify(out, null, 1));
  await browser.close();
})();
