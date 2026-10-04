'use client';

import { useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

export default function Home() {
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    /* dark / light theme */
    const nav = document.getElementById('nav');
    const applyTheme = t => {
      const root = document.documentElement;
      if (t === 'light') root.dataset.theme = 'light';
      else delete root.dataset.theme;
      if (nav) {
        nav.classList.toggle('on-dark', t === 'dark');
        nav.classList.toggle('on-light', t === 'light');
      }
    };
    let saved = 'dark';
    try { saved = localStorage.getItem('theme') || 'dark'; } catch {}
    applyTheme(saved);
    const themeBtn = document.getElementById('theme-btn');
    const onToggle = () => {
      const next = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light';
      applyTheme(next);
      try { localStorage.setItem('theme', next); } catch {}
      ScrollTrigger.refresh();
    };
    themeBtn.addEventListener('click', onToggle);

    /* mobile menu */
    const menuBtn = document.getElementById('menu-btn');
    const setMenu = open => {
      nav.classList.toggle('is-open', open);
      menuBtn.setAttribute('aria-expanded', String(open));
      menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    };
    const onMenu = () => setMenu(!nav.classList.contains('is-open'));
    const onKey = e => { if (e.key === 'Escape') setMenu(false); };
    const onOutside = e => { if (!e.target.closest('#nav')) setMenu(false); };
    menuBtn.addEventListener('click', onMenu);
    document.addEventListener('keydown', onKey);
    document.addEventListener('click', onOutside);

    let scroller = null;
    const onAnchor = e => {
      const link = e.target.closest('a[href^="#"]');
      if (!link) return;
      if (link.classList.contains('f2-top-btn')) {
        e.preventDefault();
        window.location.assign(window.location.pathname + window.location.search);
        return;
      }
      const el = document.querySelector(link.getAttribute('href'));
      if (!el) return;
      e.preventDefault();
      scroller.scrollTo(el, { offset: -70 });
      setMenu(false);
    };
    document.addEventListener('click', onAnchor);

    /* the CSS loops already stop under prefers-reduced-motion; this stops the GSAP ones */
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const ctx = gsap.context(() => {
      const lenis = new Lenis({ lerp: 0.09, smoothWheel: true });
      scroller = lenis;
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(t => lenis.raf(t * 1000));
      gsap.ticker.lagSmoothing(0);

      /* filmstrip marquee */
      const buildStrip = track => {
        const words = ['SCREENS', '★', 'CIRCUITS', '★', 'SYSTEMS', '★', 'FRONTEND', '★', 'ROBOTICS', '★', 'HARDWARE', '★'];
        let html = '';
        for (let i = 0; i < 12; i++) html += words.map(w => `<span class="film-cell">${w}</span>`).join('');
        track.innerHTML = html;
      };
      document.querySelectorAll('.filmstrip-track').forEach(buildStrip);
      /* above this line only builds the strips; every animation below is skipped */
      if (reduced) return;
      gsap.to('#filmstrip-track', { xPercent: -8.333, duration: 16, ease: 'none', repeat: -1 });

      /* hero intro */
      const heroTl = gsap.timeline({ defaults: { ease: 'power4.out' } });
      heroTl
        .from('.nav', { y: -80, opacity: 0, duration: .9 })
        .from('.hero-top > *', { y: 24, opacity: 0, duration: .7, stagger: .12 }, '-=.4')
        .from('.hero-cast span', { y: 30, opacity: 0, duration: .8, stagger: .1 }, '-=.3')
        .from('#hero-title .ltr', { yPercent: 120, rotate: 8, duration: 1.1, stagger: .06, ease: 'power4.out' }, '-=.5')
        .from('#hero-circle', { scale: 0, duration: 1.1, ease: 'elastic.out(1,.6)' }, '-=.9')
        .from('#hero-iii', { y: -40, opacity: 0, duration: .6 }, '-=.5')
        .from('#hero-figure', { y: 140, opacity: 0, scale: .85, duration: 1.2, ease: 'power3.out' }, '-=.9')
        .from('.filmstrip', { scaleX: 0, transformOrigin: 'left', duration: 1, ease: 'power3.inOut' }, '-=.6')
        .from('.hero-bottom > *', { y: 40, opacity: 0, duration: .8, stagger: .15 }, '-=.5');

      /* hero stays fixed while scrolling — no parallax drift */

      /* split words for masked reveals */
      const splitWrap = sel => {
        document.querySelectorAll(sel).forEach(el => {
          el.querySelectorAll('.w').forEach(w => {
            const txt = w.textContent;
            w.innerHTML = `<span>${txt}</span>`;
          });
        });
      };

      /* split a run of text into masked single characters */
      const splitLetters = sel => {
        document.querySelectorAll(sel).forEach(el => {
          const chars = [...el.textContent];
          el.textContent = '';
          const frag = document.createDocumentFragment();
          chars.forEach(c => {
            const mask = document.createElement('span');
            mask.className = 'ltr';
            const inner = document.createElement('span');
            inner.textContent = c === ' ' ? '\u00A0' : c;
            mask.appendChild(inner);
            frag.appendChild(mask);
          });
          el.appendChild(frag);
        });
      };

      /* stats */
      gsap.from('.stats-card', { y: 90, opacity: 0, duration: 1, scrollTrigger: { trigger: '.stats', start: 'top 82%' } });
      gsap.from('.edu-block > :is(.section-label,.studio-tag,.edu-meta)', {
        y: 18, opacity: 0, stagger: .08, duration: .6, ease: 'power2.out',
        clearProps: 'transform,opacity',
        scrollTrigger: { trigger: '.stats', start: 'top 78%' }
      });
      /* the name fills in character by character once the pill has landed —
         each letter swings up out of its own mask and sparks white as it settles,
         then the pill takes a small thump when the last one lands */
      splitLetters('.tag-text');
      const letterFill = { each: .022, ease: 'power1.in' };
      gsap.fromTo('.tag-text .ltr span',
        { yPercent: 128, opacity: 0, rotate: 9 },
        {
          yPercent: 0, opacity: 1, rotate: 0, duration: .55, delay: .3, ease: 'power3.out',
          stagger: letterFill, clearProps: 'transform,opacity',
          scrollTrigger: { trigger: '.stats', start: 'top 78%' }
        });
      const tagEl = document.querySelector('.studio-tag');
      gsap.fromTo('.tag-text .ltr span',
        { textShadow: '0 0 13px rgba(255,255,255,.9)' },
        {
          textShadow: '0 0 0px rgba(255,255,255,0)', duration: .55, delay: .3,
          stagger: letterFill, clearProps: 'textShadow',
          /* the pill thumps once as the last letter lands. CSS, not GSAP: a
             transform left on .studio-tag would out-rank its :hover scale forever */
          onComplete: () => tagEl.classList.add('is-thump'),
          scrollTrigger: { trigger: '.stats', start: 'top 78%' }
        });
      tagEl.addEventListener('animationend', e => {
        if (e.animationName === 'tag-thump') tagEl.classList.remove('is-thump');
      });
      /* hovering runs the fill again as a wave along the letters */
      tagEl.addEventListener('mouseenter', () => gsap.fromTo('.tag-text .ltr span',
        { y: 0 },
        { y: -4, duration: .16, ease: 'power2.out', overwrite: 'auto', clearProps: 'all',
          stagger: { each: .02, yoyo: true, repeat: 1 } }));
      /* the programme name types itself out, once, after the college name lands.
         a callback per character rather than a stagger, so the cursor is moved in
         the same tick the letter appears and can never fall behind it */
      splitLetters('.edu-degree .w');
      const degEl = document.querySelector('.edu-degree');
      const caret = degEl.querySelector('.type-caret');
      const chars = [...degEl.querySelectorAll('.ltr')];
      const TYPE_SPAN = 2, TYPE_LEAD = 1.05, TYPE_TAIL = 1.1;
      const TYPE_EACH = TYPE_SPAN / chars.length;
      const placeCaret = (l, after) => {
        const box = l.getBoundingClientRect(), host = degEl.getBoundingClientRect();
        caret.style.transform = `translate(${(after ? box.right : box.left) - host.left}px,${box.top - host.top + (box.height - caret.offsetHeight) / 2}px)`;
      };
      caret.classList.remove('is-done');
      degEl.classList.remove('is-typing');
      gsap.set('.edu-degree .ltr span', { opacity: 0 });
      placeCaret(chars[0], false);
      const typer = gsap.timeline({ scrollTrigger: { trigger: '.stats', start: 'top 76%' } });
      chars.forEach((c, i) => typer.add(() => {
        if (!i) degEl.classList.add('is-typing');
        gsap.set(c.firstElementChild, { opacity: 1 });
        placeCaret(c, true);
      }, TYPE_LEAD + i * TYPE_EACH));
      typer.add(() => caret.classList.add('is-done'), TYPE_LEAD + chars.length * TYPE_EACH + TYPE_TAIL);
      gsap.from('.edu-rule', {
        scaleX: 0, duration: .9, ease: 'power3.inOut',
        scrollTrigger: { trigger: '.stats', start: 'top 70%' }
      });
      /* clearProps so the CSS :hover lift on the cells is not blocked by an inline transform */
      gsap.from('.edu-col-head', {
        opacity: 0, y: 12, stagger: .1, duration: .5,
        scrollTrigger: { trigger: '.edu-grid', start: 'top 85%' }
      });
      gsap.from('.edu-cell', {
        y: 16, opacity: 0, stagger: .05, duration: .5, ease: 'power2.out',
        clearProps: 'transform,opacity',
        scrollTrigger: { trigger: '.edu-grid', start: 'top 85%' }
      });

      splitWrap('.final-title');

      /* directed */
      gsap.from('.directed-meta', { opacity: 0, y: 30, duration: .8, scrollTrigger: { trigger: '.directed', start: 'top 72%' } });
      gsap.from('.release-facts span', { opacity: 0, x: 16, stagger: .1, duration: .6, scrollTrigger: { trigger: '.directed', start: 'top 72%' } });
      gsap.from('.about-rule', {
        scaleX: 0, duration: .9, ease: 'power3.inOut',
        scrollTrigger: { trigger: '.about-chain', start: 'top 88%' }
      });
      gsap.from('.chain-node small', {
        opacity: 0, y: 12, stagger: .1, duration: .5,
        scrollTrigger: { trigger: '.about-chain', start: 'top 85%' }
      });
      /* clearProps so the CSS :hover effects on the nodes are not blocked by an inline transform */
      gsap.from('.chain-node', {
        y: 16, opacity: 0, stagger: .12, duration: .5, ease: 'power2.out',
        clearProps: 'transform,opacity',
        scrollTrigger: { trigger: '.about-chain', start: 'top 85%' }
      });
      gsap.from('.about-jump', { opacity: 0, y: 14, duration: .6, scrollTrigger: { trigger: '.about-chain', start: 'top 80%' } });

      /* work */
      gsap.from('.work-head-top > *', { opacity: 0, y: 14, stagger: .1, duration: .5, ease: 'power2.out', scrollTrigger: { trigger: '.work', start: 'top 76%' } });
      gsap.from('.work-rule', { scaleX: 0, transformOrigin: 'left', duration: .9, ease: 'power3.inOut', scrollTrigger: { trigger: '.work', start: 'top 70%' } });
      gsap.from('.work-card', {
        y: 70, opacity: 0, duration: .95, ease: 'power3.out', clearProps: 'transform,opacity',
        scrollTrigger: { trigger: '.work-card', start: 'top 90%' }
      });
      gsap.from('.pc-body > *', {
        opacity: 0, y: 18, stagger: .07, duration: .6, ease: 'power2.out',
        clearProps: 'transform,opacity',
        scrollTrigger: { trigger: '.work-card', start: 'top 84%' }
      });

      /* final */
      gsap.from('.final-small', { opacity: 0, y: 20, duration: .7, scrollTrigger: { trigger: '.final', start: 'top 75%' } });
      gsap.from('.final-title .w span', { yPercent: 115, duration: 1.2, stagger: .15, ease: 'power4.out', scrollTrigger: { trigger: '.final', start: 'top 72%' } });
      gsap.from('.final-row span', { opacity: 0, stagger: .15, duration: .8, scrollTrigger: { trigger: '.final', start: 'top 70%' } });
      gsap.from('.final-cta', { opacity: 0, y: 30, duration: .8, scrollTrigger: { trigger: '.final', start: 'top 60%' } });

      /* footer */
      gsap.from('.f2-top > *', { y: 34, opacity: 0, stagger: .12, duration: .9, scrollTrigger: { trigger: '.footer2', start: 'top 82%' } });
      gsap.from('.f2-giant', { y: 60, opacity: 0, duration: 1.1, ease: 'power3.out', scrollTrigger: { trigger: '.footer2', start: 'top 70%' } });

      /* page fade-in */
      gsap.from('body', { opacity: 0, duration: .6, ease: 'power2.out' });

      /* magnetic pill buttons */
      document.querySelectorAll('.pill-btn').forEach(btn => {
        const xTo = gsap.quickTo(btn, 'x', { duration: .4, ease: 'power3.out' });
        const yTo = gsap.quickTo(btn, 'y', { duration: .4, ease: 'power3.out' });
        btn.addEventListener('mousemove', e => {
          const r = btn.getBoundingClientRect();
          xTo((e.clientX - r.left - r.width / 2) * .25);
          yTo((e.clientY - r.top - r.height / 2) * .35);
        });
        btn.addEventListener('mouseleave', () => { xTo(0); yTo(0); });
      });
    });
    return () => {
      themeBtn.removeEventListener('click', onToggle);
      menuBtn.removeEventListener('click', onMenu);
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('click', onOutside);
      document.removeEventListener('click', onAnchor);
      ctx.revert();
    };
  }, []);

  /* about — scramble-decode labels + red scanline sweep */
  useEffect(() => {
    const section = document.querySelector('.directed');
    if (!section) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const GLYPHS = 'ABCDEFGHJKLMNPQRSTUVWXYZ#*<>/\\_—01';
    const decode = (el, delay) => {
      const final = el.dataset.text || el.textContent.trim();
      el.dataset.text = final;
      setTimeout(() => {
        let frame = 0;
        const id = setInterval(() => {
          frame += 1;
          const solved = Math.floor(frame / 2.4);
          el.textContent = [...final].map((c, i) =>
            c === ' ' || i < solved ? c : GLYPHS[Math.floor(Math.random() * GLYPHS.length)]
          ).join('');
          if (solved >= final.length) { clearInterval(id); el.textContent = final; }
        }, 34);
      }, delay);
    };

    const cells = [...section.querySelectorAll('.chain-node')];
    let done = false;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting || done) return;
      done = true;
      io.disconnect();
      const label = section.querySelector('.label-scramble');
      if (label) decode(label, 150);
      section.querySelectorAll('.chain-node small').forEach((h, i) => decode(h, 420 + i * 170));
      cells.forEach((c, i) => {
        c.style.setProperty('--sweep-delay', `${.3 + i * 1.15}s`);
        c.classList.add('swept');
      });
    }, { threshold: .25 });
    io.observe(section);
    return () => io.disconnect();
  }, []);

  return (
    <>
      <header className="nav" id="nav">
        <a className="logo" href="#hero">NIRAJAN<span className="logo-aryal">ARYAL</span></a>
        <nav className="nav-links">
          <a href="#stats">EDUCATION <span className="dot"></span></a>
          <a href="#about">ABOUT <span className="dot"></span></a>
          <a href="#work">WORK <span className="dot"></span></a>
          <a href="#contact">CONTACT</a>
        </nav>
        <div className="nav-right">
          <button className="icon-btn theme-btn" id="theme-btn" aria-label="Toggle dark / light theme">
            <span className="ico-sun">☀</span><span className="ico-moon">☾</span>
          </button>
          <a className="pill-btn dark" href="mailto:contact@nirajanaryal.info.np">EMAIL</a>
          <button className="menu-btn" id="menu-btn" aria-label="Open menu" aria-expanded="false" aria-controls="nav-sheet">
            <i /><i /><i />
          </button>
        </div>
        <div className="nav-sheet" id="nav-sheet">
          <a href="#hero">HOME<em>01</em></a>
          <a href="#stats">EDUCATION<em>02</em></a>
          <a href="#about">ABOUT<em>03</em></a>
          <a href="#work">WORK<em>04</em></a>
          <a href="#contact">CONTACT<em>05</em></a>
        </div>
      </header>

      <main>
        <section className="hero" id="hero">
          <div className="hero-card">
            <div className="hero-top">
              <div className="chips">
                <span className="chip">FRONTEND</span>
                <span className="chip chip-red">ROBOTICS</span>
                <span className="chip">HARDWARE</span>
              </div>
              <div className="release-note">ECIE-HCOE</div>
            </div>

            <div className="hero-cast">
              <span>FRONTEND DEVELOPMENT</span>
              <span>ROBOTICS</span>
              <span>ELECTRONICS</span>
              <span>COMPUTER HARDWARE</span>
            </div>

            <div className="hero-stage">
              <div className="hero-iii" id="hero-iii">ECIE</div>
              <div className="hero-circle" id="hero-circle"></div>
              <h1 className="hero-title" id="hero-title" aria-label="NIRAJAN ARYAL">
                <span className="word">
                  <span className="ltr">N</span><span className="ltr">I</span><span className="ltr">R</span><span className="ltr">A</span><span className="ltr">J</span><span className="ltr">A</span><span className="ltr">N</span>
                </span><span className="word">
                  <span className="ltr">A</span><span className="ltr">R</span><span className="ltr">Y</span><span className="ltr">A</span><span className="ltr">L</span>
                </span>
              </h1>
              <img className="hero-figure" id="hero-figure" src="/assets/contact.opt.png" alt="Nirajan Aryal" width={750} height={1125} decoding="async" />
            </div>

            <div className="filmstrip" id="filmstrip">
              <div className="filmstrip-track" id="filmstrip-track"></div>
            </div>

            <div className="hero-bottom">
              <div className="hero-blurb">
                <div className="blurb-label"><span className="red-dot"></span> ABOUT NIRAJAN</div>
                <p>An Electronics, Communication and Information Engineering student exploring frontend development, robotics, electronics, and computer hardware.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="stats" id="stats">
          <div className="stats-card">
            <div className="edu-block">
              <div className="section-label"><span className="red-dot"></span> EDUCATION</div>
              <div className="studio-tag"><span className="tag-text">HIMALAYA COLLEGE OF ENGINEERING</span></div>
              <h2 className="edu-degree">
                <span className="w">ELECTRONICS,</span> <span className="w">COMMUNICATION</span>{' '}
                <span className="w">&amp;</span> <span className="w">INFORMATION</span>{' '}
                <span className="w">ENGINEERING</span>
                <i className="type-caret" aria-hidden="true"></i>
              </h2>
              <div className="edu-meta"><span>UNDERGRADUATE</span><i /><span>BATCH 2026</span></div>
              <div className="edu-rule" />
              <div className="edu-grid">
                <div className="edu-col">
                  <div className="edu-col-head">IN THE DEGREE</div>
                  <div className="edu-cell"><span>ELECTRONICS</span></div>
                  <div className="edu-cell"><span>COMMUNICATION</span></div>
                  <div className="edu-cell"><span>INFORMATION ENGINEERING</span></div>
                  <div className="edu-cell"><span>CIRCUITS &amp; SYSTEMS</span></div>
                </div>
                <div className="edu-col">
                  <div className="edu-col-head">ON MY OWN TIME</div>
                  <div className="edu-cell"><span>FRONTEND</span></div>
                  <div className="edu-cell"><span>ROBOTICS</span></div>
                  <div className="edu-cell"><span>COMPUTER HARDWARE</span></div>
                  <div className="edu-cell"><span>DIGITAL INTERFACES</span></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="directed" id="about">
          <div className="directed-inner">
            <div className="directed-meta">
              <div className="release-col">
                <div className="section-label dark"><span className="red-dot"></span> <span className="label-scramble">ABOUT</span></div>
                <p className="release-copy"><b>NIRAJAN ARYAL</b> is an Electronics, Communication and Information Engineering student at <b>Himalaya College of Engineering</b>, working across <b>frontend development, robotics, electronics and computer hardware</b> — from the interface on screen to the circuit underneath it.</p>
                <p className="release-copy">The through-line is <b>digital interfaces and physical systems</b>: building things that move electrons and pixels, and understanding both well enough to debug them.</p>
              </div>
              <div className="release-facts">
                <small>NOW</small>
                <span>UNDERGRADUATE <em>BATCH 2026</em></span>
                <span>BASED IN <em>NEPAL</em></span>
                <span>OPEN TO <em>COLLABORATION &amp; INTERNSHIPS</em></span>
              </div>
            </div>
            <div className="about-rule"></div>
            <div className="about-chain">
              <div className="chain-node">
                <small>INPUT</small>
                <b>CURIOSITY</b>
                <span>ECIE coursework, screens, circuits — always asking how a thing works</span>
              </div>
              <div className="chain-wire"></div>
              <div className="chain-node">
                <small>PROCESS</small>
                <b>BUILD · BREAK · DEBUG</b>
                <span>code and solder — iterate until electrons and pixels cooperate</span>
              </div>
              <div className="chain-wire"></div>
              <div className="chain-node">
                <small>OUTPUT</small>
                <b>THINGS THAT WORK</b>
                <span>web interfaces, embedded systems, hardware you can actually touch</span>
              </div>
            </div>
            <a className="about-jump" href="#work">VIEW WORK <i>↓</i></a>
          </div>
        </section>

        <section className="work" id="work">
          <div className="work-head">
            <div className="work-head-top">
              <div className="section-label"><span className="red-dot"></span> WORK</div>
            </div>
            <div className="work-rule"></div>
          </div>

          <div className="work-card" id="work-card">
            <div className="pc-strip">
              <span className="led on"></span><span className="led"></span><span className="led"></span>
              STATUS // BUILDING
            </div>
            <div className="pc-body">
              <div className="wc-kicker"><span className="red-dot"></span> NEXT RELEASE</div>
              <h3 className="wc-headline">COMING <span className="num">SOON</span></h3>
              <p className="wc-copy">Nothing published yet — the first builds are still on the bench. Frontend interfaces, embedded systems and hardware work land here as they finish.</p>
              <div className="wc-progress">
                <div className="wc-track" aria-hidden="true"><i /></div>
                <span>BUILD IN PROGRESS</span>
              </div>
              <div className="pc-chips">
                <span>FRONTEND</span><span>ROBOTICS</span><span>ELECTRONICS</span><span>HARDWARE</span>
              </div>
              <a className="wc-status" href="#contact"><span className="led on"></span> LET’S BUILD SOMETHING <i>→</i></a>
            </div>
          </div>
        </section>

        <section className="final" id="contact">
          <div className="final-small">OPEN TO COLLABORATION</div>
          <h2 className="final-title" id="final-title">
            <span className="w">NIRAJAN</span> <span className="w num">ARYAL</span>
          </h2>
          <div className="final-row">
            <span>
              <a className="contact-pill mail-link" href="mailto:contact@nirajanaryal.info.np" data-email="contact@nirajanaryal.info.np">
                <svg className="cp-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"></rect><path d="m3 7 9 6 9-6"></path></svg>
                EMAIL
              </a>
            </span>
            <span>
              <a className="contact-pill" href="https://github.com/ZEVRON45" target="_blank" rel="noopener noreferrer">
                <svg className="cp-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 .5C5.7.5.5 5.7.5 12c0 5.1 3.3 9.4 7.9 10.9.6.1.8-.2.8-.6v-1.9c-3.2.7-3.9-1.6-3.9-1.6-.5-1.3-1.3-1.7-1.3-1.7-1.1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.7-1.6-2.6-.3-5.3-1.3-5.3-5.8 0-1.3.5-2.3 1.2-3.1-.1-.3-.5-1.5.1-3.1 0 0 1-.3 3.3 1.2a11.4 11.4 0 0 1 6 0C17.3 4.7 18.3 5 18.3 5c.6 1.6.2 2.8.1 3.1.8.8 1.2 1.8 1.2 3.1 0 4.5-2.7 5.5-5.3 5.8.4.4.8 1.1.8 2.2v3.3c0 .4.2.7.8.6 4.6-1.5 7.9-5.8 7.9-10.9C23.5 5.7 18.3.5 12 .5Z"></path></svg>
                GITHUB
              </a>
            </span>
            <span>
              <a className="contact-pill" href="https://www.linkedin.com/in/nirajan-aryal-b9738836a/" target="_blank" rel="noopener noreferrer">
                <svg className="cp-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M20.5 2h-17A1.5 1.5 0 0 0 2 3.5v17A1.5 1.5 0 0 0 3.5 22h17a1.5 1.5 0 0 0 1.5-1.5v-17A1.5 1.5 0 0 0 20.5 2ZM8 19H5V9.5h3V19ZM6.5 8.2A1.6 1.6 0 1 1 6.5 5a1.6 1.6 0 0 1 0 3.2ZM19 19h-3v-4.9c0-1.3-.5-2-1.5-2-.9 0-1.5.6-1.5 2V19h-3V9.5h2.9v1.3c.6-.9 1.4-1.5 2.7-1.5 1.9 0 3.4 1.2 3.4 3.9V19Z"></path></svg>
                LINKEDIN
              </a>
            </span>
          </div>
          <a className="pill-btn dark final-cta" href="mailto:contact@nirajanaryal.info.np">CONTACT ME ↗</a>
        </section>
      </main>

      <footer className="footer2">
        <div className="f2-inner">
          <div className="f2-top">
            <div className="f2-brand">
              <div className="f2-logo">NIRAJAN<span>ARYAL</span></div>
              <p>Building across screens, circuits, and systems. Frontend development, robotics, electronics and computer hardware.</p>
            </div>
            <div className="f2-cols">
              <div className="f2-col">
                <small>FOCUS</small>
                <span>FRONTEND</span>
                <span>ROBOTICS</span>
                <span>ELECTRONICS</span>
                <span>HARDWARE</span>
              </div>
              <div className="f2-col">
                <small>CONNECT</small>
                <a href="mailto:contact@nirajanaryal.info.np">CONTACT@NIRAJANARYAL.INFO.NP</a>
                <a href="https://github.com/ZEVRON45" target="_blank" rel="noopener noreferrer">GITHUB.COM/ZEVRON45</a>
                <a href="https://www.linkedin.com/in/nirajan-aryal-b9738836a/" target="_blank" rel="noopener noreferrer">LINKEDIN / NIRAJAN-ARYAL</a>
              </div>
            </div>
          </div>
          <div className="f2-giant" aria-hidden="true">ZEVRON</div>
          <div className="f2-bottom">
            <span>© 2026 NIRAJAN ARYAL</span>
            <span>ECIE-HCOE</span>
            <a className="f2-top-btn" href="#hero">BACK TO TOP ↑</a>
          </div>
        </div>
      </footer>
    </>
  );
}
