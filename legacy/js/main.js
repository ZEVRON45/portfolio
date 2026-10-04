gsap.registerPlugin(ScrollTrigger);

/* ---------- Lenis smooth scroll wired to GSAP ---------- */
const LenisClass = (window.Lenis && window.Lenis.default) ? window.Lenis.default : window.Lenis;
const lenis = new LenisClass({ lerp: 0.09, smoothWheel: true });
if (typeof lenis.on === 'function') lenis.on('scroll', ScrollTrigger.update);
else if (typeof lenis.onScroll === 'function') lenis.onScroll(ScrollTrigger.update);
gsap.ticker.add(t => lenis.raf(t * 1000));
gsap.ticker.lagSmoothing(0);

document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const el = document.querySelector(a.getAttribute('href'));
    if (el) { e.preventDefault(); lenis.scrollTo(el, { offset: -70 }); }
  });
});

/* ---------- filmstrip marquee ---------- */
function buildStrip(track) {
  const words = ['DEV', '★', 'MOTION', '★', 'CODE', '★', 'DESIGN', '★', 'SHIP', '★', 'REPEAT', '★'];
  let html = '';
  for (let i = 0; i < 14; i++) html += words.map(w => `<span class="film-cell">${w}</span>`).join('');
  track.innerHTML = html;
}
document.querySelectorAll('.filmstrip-track').forEach(buildStrip);
gsap.to('#filmstrip-track', { xPercent: -8.333, duration: 14, ease: 'none', repeat: -1 });
gsap.to('#filmstrip-2', { xPercent: -8.333, duration: 18, ease: 'none', repeat: -1 });

/* ---------- hero intro timeline ---------- */
const heroTl = gsap.timeline({ defaults: { ease: 'power4.out' } });
heroTl
  .from('.nav', { y: -80, opacity: 0, duration: .9 })
  .from('.hero-top > *', { y: 24, opacity: 0, duration: .7, stagger: .12 }, '-=.4')
  .from('.hero-cast span', { y: 30, opacity: 0, duration: .8, stagger: .1 }, '-=.3')
  .from('#hero-title .ltr', {
    yPercent: 120, rotate: 8, duration: 1.1, stagger: .055, ease: 'power4.out'
  }, '-=.5')
  .from('#hero-circle', { scale: 0, duration: 1.1, ease: 'elastic.out(1,.6)' }, '-=.9')
  .from('#hero-iii', { y: -40, opacity: 0, duration: .6 }, '-=.5')
  .from('#hero-figure', { y: 120, opacity: 0, scale: .85, duration: 1.2, ease: 'power3.out' }, '-=.9')
  .from('#hero-year', { opacity: 0, x: 30, duration: .6 }, '-=.5')
  .from('.filmstrip', { scaleX: 0, transformOrigin: 'left', duration: 1, ease: 'power3.inOut' }, '-=.6')
  .from('.hero-bottom > *', { y: 40, opacity: 0, duration: .8, stagger: .15 }, '-=.5');

/* hero parallax on scroll */
gsap.to('#hero-figure', {
  yPercent: 18, ease: 'none',
  scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true }
});
gsap.to('#hero-title', {
  yPercent: -14, opacity: .35, ease: 'none',
  scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true }
});

/* ---------- stats section ---------- */
gsap.from('.stats-card', {
  y: 90, opacity: 0, duration: 1,
  scrollTrigger: { trigger: '.stats', start: 'top 82%' }
});
gsap.from('.stat-circles .circle', {
  scale: 0, opacity: 0, stagger: .14, duration: .9, ease: 'back.out(2)',
  scrollTrigger: { trigger: '.stats', start: 'top 75%' }
});
gsap.from('.stat-col.left > *', {
  x: -40, opacity: 0, stagger: .1, duration: .8,
  scrollTrigger: { trigger: '.stats', start: 'top 75%' }
});
gsap.from('.stat-col.right', {
  x: 40, opacity: 0, duration: .8,
  scrollTrigger: { trigger: '.stats', start: 'top 75%' }
});
gsap.from('.stats-figure', {
  y: 80, opacity: 0, duration: 1, ease: 'power3.out',
  scrollTrigger: { trigger: '.stats', start: 'top 70%' }
});

/* ---------- directed (giant heading) ---------- */
const splitWrap = sel => {
  document.querySelectorAll(sel).forEach(el => {
    el.querySelectorAll('.w').forEach(w => {
      const txt = w.textContent;
      w.innerHTML = `<span>${txt}</span>`;
    });
  });
};
splitWrap('#directed-title .w');
splitWrap('.final-title .w');

gsap.from('#directed-title .w span', {
  yPercent: 110, duration: 1.1, stagger: .12, ease: 'power4.out',
  scrollTrigger: { trigger: '.directed', start: 'top 70%' }
});
gsap.from('.directed-meta', {
  opacity: 0, y: 30, duration: .8,
  scrollTrigger: { trigger: '.directed', start: 'top 72%' }
});
gsap.from('.gallery-count', {
  opacity: 0, x: -30, duration: .8,
  scrollTrigger: { trigger: '.directed', start: 'top 68%' }
});

/* ---------- work section ---------- */
gsap.from('.work-head span', {
  opacity: 0, y: 20, stagger: .08, duration: .6,
  scrollTrigger: { trigger: '.work', start: 'top 80%' }
});
gsap.from('.work-title', {
  opacity: 0, scale: .9, duration: .9, ease: 'power3.out',
  scrollTrigger: { trigger: '.work', start: 'top 75%' }
});
gsap.from('.work-card', {
  y: 120, opacity: 0, rotate: 3, duration: 1.1, ease: 'power3.out',
  scrollTrigger: { trigger: '.work-grid', start: 'top 80%' }
});
gsap.from('.work-item.left', {
  x: -70, opacity: 0, duration: 1,
  scrollTrigger: { trigger: '.work-grid', start: 'top 78%' }
});
gsap.from('.work-item.right', {
  x: 70, opacity: 0, duration: 1,
  scrollTrigger: { trigger: '.work-grid', start: 'top 78%' }
});
gsap.to('.work-orbit', {
  rotate: 60, ease: 'none',
  scrollTrigger: { trigger: '.work', start: 'top bottom', end: 'bottom top', scrub: true }
});

/* ---------- final section ---------- */
gsap.from('.final-small', { opacity: 0, y: 20, duration: .7, scrollTrigger: { trigger: '.final', start: 'top 75%' } });
gsap.from('.final-title .w span', {
  yPercent: 115, duration: 1.2, stagger: .15, ease: 'power4.out',
  scrollTrigger: { trigger: '.final', start: 'top 72%' }
});
gsap.from('.final-figure', {
  y: 140, opacity: 0, scale: .8, duration: 1.3, ease: 'power3.out',
  scrollTrigger: { trigger: '.final', start: 'top 70%' }
});
gsap.from('.final-row span', {
  opacity: 0, stagger: .15, duration: .8,
  scrollTrigger: { trigger: '.final', start: 'top 70%' }
});
gsap.to('.final-circle-deco', {
  scale: 1.25, ease: 'none',
  scrollTrigger: { trigger: '.final', start: 'top bottom', end: 'bottom top', scrub: true }
});
gsap.from('.final-cta', { opacity: 0, y: 30, duration: .8, scrollTrigger: { trigger: '.final', start: 'top 60%' } });
