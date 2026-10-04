/* Report every text node failing WCAG AA, with the exact colour pair to change. */
const { chromium } = require('playwright');

const probe = () => {
  const rgb = (c) => { const m = c.match(/[\d.]+/g); return m ? m.slice(0, 3).map(Number) : null; };
  const lin = (v) => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); };
  const L = (c) => .2126 * lin(c[0]) + .7152 * lin(c[1]) + .0722 * lin(c[2]);
  const hex = (c) => '#' + c.map((v) => v.toString(16).padStart(2, '0')).join('');
  const bgOf = (e) => {
    for (let n = e; n && n !== document.documentElement; n = n.parentElement) {
      const m = rgb(getComputedStyle(n).backgroundColor);
      if (m && (getComputedStyle(n).backgroundColor.includes('rgb') || true)) {
        const a = (getComputedStyle(n).backgroundColor.match(/[\d.]+/g) || [])[3];
        if (a === undefined || a > 0.5) return m;
      }
    }
    return [255, 255, 255];
  };
  const rules = [];
  for (const sheet of document.styleSheets) {
    let list; try { list = sheet.cssRules; } catch (e) { continue; }
    const walk = (l) => { for (const r of l) { if (r.cssRules) walk(r.cssRules); if (r.selectorText && r.style && r.style.color) rules.push(r); } };
    list && walk(list);
  }
  /* last matching rule with an explicit colour is the one actually in force */
  const owner = (e) => { for (let i = rules.length - 1; i >= 0; i--) { try { if (e.matches(rules[i].selectorText)) return rules[i].selectorText; } catch (x) { } } return '?'; };

  const bad = [];
  for (const e of document.querySelectorAll('p,span,small,b,i,a,li,h1,h2,h3,h4,em,strong,div')) {
    if (e.children.length) continue;
    const t = (e.textContent || '').trim(); if (!t) continue;
    if (e.closest('[aria-hidden="true"]')) continue;
    const cs = getComputedStyle(e);
    if (cs.visibility === 'hidden' || cs.display === 'none' || +cs.opacity < .5) continue;
    const r = e.getBoundingClientRect(); if (r.width < 2 || r.height < 2) continue;
    const fg = rgb(cs.color), bg = bgOf(e); if (!fg) continue;
    const L1 = L(fg), L2 = L(bg);
    const cr = (Math.max(L1, L2) + .05) / (Math.min(L1, L2) + .05);
    const fs = parseFloat(cs.fontSize), bold = +cs.fontWeight >= 700;
    const need = fs >= 24 || (bold && fs >= 18.66) ? 3 : 4.5;
    if (cr >= need) continue;
    /* what foreground colour would clear the bar against this background? */
    const target = need; let fix = null;
    for (let k = 0; k <= 100; k++) {
      const f = k / 100;
      const c = fg.map((v, i) => Math.round(v + (bg[i] < 128 ? 255 - v : -v) * f));
      const l = L(c);
      if ((Math.max(l, L2) + .05) / (Math.min(l, L2) + .05) >= target) { fix = hex(c); break; }
    }
    bad.push({ text: t.slice(0, 22), sel: owner(e), fs: Math.round(fs), fw: cs.fontWeight, cr: +cr.toFixed(2), need, fg: hex(fg), bg: hex(bg), fix });
  }
  const seen = new Set();
  return bad.filter((b) => { const k = b.sel + b.fg; if (seen.has(k)) return false; seen.add(k); return true; });
};

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  for (const theme of ['dark', 'light']) {
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    await page.evaluate((t) => localStorage.setItem('theme', t), theme);
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    const total = await page.evaluate(() => document.body.scrollHeight);
    for (let y = 0; y <= total; y += 500) { await page.evaluate((v) => window.scrollTo(0, v), y); await page.waitForTimeout(130); }
    await page.waitForTimeout(400);
    console.log('\n===== ' + theme.toUpperCase() + ' =====');
    for (const b of await page.evaluate(probe)) console.log(JSON.stringify(b));
  }
  await browser.close();
})();
