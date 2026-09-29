// Scroll-scrubbed film portfolio for Abdullah Al Abrar.
// The hero is a cut-out image sequence of his MetaHuman dolly shot, drawn to a
// canvas in front of his name. Scrolling scrubs the film (with a cross-fade
// between neighbouring frames, so the motion stays continuous) and steps the
// story; the Work section then rises over the stage like a curtain.
import { PROFILE, PROJECTS } from './content.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const params = new URLSearchParams(location.search);
const TEST = params.has('nolenis');                    // automated capture: native scroll, no intro
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
const gsap = window.gsap, ScrollTrigger = window.ScrollTrigger;

// ------------------------------------------------------------------ content
function fillContent() {
  const P = PROFILE;
  $$('[data-cv]').forEach((a) => { a.href = P.cv; a.setAttribute('download', 'Abdullah-Al-Abrar-CV.pdf'); });
  $('#cvOpen').href = P.cv;
  $('#aboutIntro').textContent = P.intro;
  $('#timeline').innerHTML = P.experience.map((x) => `<li><strong>${x.role}</strong><time>${x.when}</time><span>${x.org}</span></li>`).join('');
  $('#education').innerHTML = P.education.map((x) => `<li><strong>${x.what}</strong><span>${x.where}</span></li>`).join('');
  $('#tools').innerHTML = [...P.skills, ...P.skills].map((s) => `<span>${s}</span>`).join('');
  const mail = $('#mailLink'); mail.href = `mailto:${P.email}`; mail.textContent = P.email;
  const ph = $('#phoneLink'); ph.href = `tel:${P.phone.replace(/\s/g, '')}`; ph.textContent = P.phone;
  $('#behanceLink').href = P.behance; $('#siteLink').href = P.website;
  $('#locationText').textContent = P.location;
  $('#year').textContent = new Date().getFullYear();

  $('#projects').innerHTML = PROJECTS.filter((p) => !p.video).map((p) => `
    <button class="project" type="button" data-id="${p.id}" aria-label="Open project: ${p.title}">
      <div class="project-img"><img src="${p.images[0] || p.cover}" alt="" loading="lazy"></div>
      <div class="project-meta"><h3>${p.title}<span class="open" aria-hidden="true">↗</span></h3><p>${p.kind}</p></div>
    </button>`).join('');
  $$('.project').forEach((b) => b.addEventListener('click', () => openProject(PROJECTS.find((p) => p.id === b.dataset.id), b)));
}

// ------------------------------------------------------------------ lightbox
const lb = $('#lightbox');
let lastFocus = null;
function openProject(p, opener) {
  lastFocus = opener || document.activeElement;
  const m = $('#lbMedia');
  m.innerHTML = '';
  if (p.video) {
    const v = document.createElement('video');
    v.src = p.video; v.poster = p.cover; v.controls = true; v.playsInline = true; v.autoplay = true;
    m.appendChild(v);
  }
  for (const src of p.images) { const im = new Image(); im.src = src; im.alt = p.title; im.loading = 'lazy'; m.appendChild(im); }
  $('#lbKind').textContent = p.kind; $('#lbTitle').textContent = p.title; $('#lbBlurb').textContent = p.blurb;
  lb.hidden = false; lb.scrollTop = 0;
  lenis?.stop();
  $('#reelVideo').pause();
  $('#lbClose').focus();
}
function closeLightbox() {
  const v = $('#lbMedia video'); if (v) v.pause();
  lb.hidden = true;
  lenis?.start();
  if (reelVisible) $('#reelVideo').play().catch(() => {});
  lastFocus?.focus?.();
}
$('#lbClose').addEventListener('click', closeLightbox);
addEventListener('keydown', (e) => {
  if (lb.hidden) return;
  if (e.key === 'Escape') closeLightbox();
  if (e.key === 'Tab') { e.preventDefault(); $('#lbClose').focus(); } // keep focus inside the dialog
});
$('#reelPlay').addEventListener('click', () => openProject(PROJECTS.find((p) => p.video), $('#reelPlay')));

// ------------------------------------------------------------------ film frames
const canvas = $('#film');
const ctx = canvas.getContext('2d');
let set = { dir: 'assets/seq', meta: { count: 192, w: 1280, h: 720, boxes: [] } };
const frames = [];
let wanted = 0, drawn = -1;

const frameUrl = (i) => `${set.dir}/f${String(i).padStart(3, '0')}.webp`;
function loadFrame(i) {
  return new Promise((res) => {
    const im = new Image();
    im.decoding = 'async';
    im.onload = () => { (im.decode ? im.decode() : Promise.resolve()).catch(() => {}).then(() => { frames[i] = im; res(true); }); };
    im.onerror = () => res(false);
    im.src = frameUrl(i);
  });
}
// coarse-to-fine: scrubbing works early, detail fills in
function loadOrder(n) {
  const seen = new Set(), order = [];
  for (const step of [16, 8, 4, 2, 1]) for (let i = 0; i < n; i += step) if (!seen.has(i)) { seen.add(i); order.push(i); }
  if (!seen.has(n - 1)) order.push(n - 1);
  return order;
}
function nearestLoaded(i) {
  if (frames[i]) return i;
  for (let d = 1; d < set.meta.count; d++) { if (frames[i - d]) return i - d; if (frames[i + d]) return i + d; }
  return -1;
}
function resizeCanvas() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(canvas.clientWidth * dpr);
  canvas.height = Math.round(canvas.clientHeight * dpr);
  drawn = -1; draw(wanted);
}
let focusX = null;
function placement(k) {
  const { w, h, boxes } = set.meta;
  const cw = canvas.width, ch = canvas.height;
  const portrait = cw / ch < 1.1;
  // phones: pull back from a full cover crop so his name fits above him
  const s = Math.max(cw / w, ch / h) * (portrait ? 0.74 : 1);
  const dw = w * s, dh = h * s;
  let dx = (cw - dw) / 2;
  if (portrait && boxes[k]) {
    const b = boxes[k], fx = (b[0] + b[2]) / 2;
    focusX = focusX == null ? fx : focusX + (fx - focusX) * 0.2;
    dx = Math.min(0, Math.max(cw - dw, cw * 0.5 - focusX * dw));
  }
  return { dx, dy: ch - dh, dw, dh }; // he always stands on the bottom edge
}
function draw(f) {
  wanted = f;
  const i = Math.floor(f), t = f - i;
  const a = nearestLoaded(i);
  if (a < 0) return;
  const b = t > 0.02 && frames[i + 1] ? i + 1 : -1;
  const key = a + (b >= 0 ? t : 0) * 0.999;
  if (Math.abs(key - drawn) < 0.004) return;
  drawn = key;
  const p = placement(a);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.imageSmoothingQuality = 'high';
  ctx.globalAlpha = 1;
  ctx.drawImage(frames[a], p.dx, p.dy, p.dw, p.dh);
  if (b >= 0) { ctx.globalAlpha = t; ctx.drawImage(frames[b], p.dx, p.dy, p.dw, p.dh); ctx.globalAlpha = 1; }
}

// ------------------------------------------------------------------ helpers
function splitLines(el) {
  const parts = el.innerHTML.split(/<br\s*\/?>/i);
  el.innerHTML = parts.map((p) => `<span class="line"><span class="line-in">${p.trim()}</span></span>`).join(' ');
  return $$('.line-in', el);
}

// ------------------------------------------------------------------ scroll
let lenis = null;
let reelVisible = false;

function setupScroll() {
  if (!gsap || !ScrollTrigger) { draw(set.meta.count - 1); $$('.beat').forEach((b) => { b.style.opacity = 1; }); return; }
  gsap.registerPlugin(ScrollTrigger);
  ScrollTrigger.config({ ignoreMobileResize: true });
  if (!reduced && !TEST && window.Lenis) {
    // wheel is smoothed; touch stays native (the phone's own inertia is better than any emulation)
    lenis = new window.Lenis({ lerp: 0.075, wheelMultiplier: 0.9, smoothWheel: true, syncTouch: false });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }
  $$('a[href^="#"]').forEach((a) => a.addEventListener('click', (e) => {
    const id = a.getAttribute('href');
    const el = id === '#top' ? document.body : $(id);
    if (!el) return;
    e.preventDefault();
    if (lenis) lenis.scrollTo(el, { duration: 1.6 }); else el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
  }));

  // hero: film scrub + story beats on one timeline; it ends a screen early,
  // because the last screen of the hero is the curtain into Work
  const film = { f: 0 };
  const last = set.meta.count - 1;
  const inY = reduced ? 0 : 60;
  const tl = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom 200%', scrub: reduced ? true : 0.6 },
  });
  tl.to(film, { f: last, duration: 0.86, ease: 'power1.inOut', onUpdate: () => draw(film.f) }, 0)
    .to('#heroProgress', { scaleY: 1, duration: 1 }, 0)
    .to('.beat-0', { autoAlpha: 0, y: -inY * 0.6, duration: 0.07 }, 0.04)
    .to('#bigName', { yPercent: reduced ? 0 : -16, autoAlpha: 0, duration: 0.24, ease: 'power1.in' }, 0.06)
    .fromTo('.beat-1', { autoAlpha: 0, y: inY }, { autoAlpha: 1, y: 0, duration: 0.07, ease: 'power2.out' }, 0.19)
    .to('.beat-1', { autoAlpha: 0, y: -inY, duration: 0.06, ease: 'power2.in' }, 0.39)
    .fromTo('.beat-2', { autoAlpha: 0, y: inY }, { autoAlpha: 1, y: 0, duration: 0.07, ease: 'power2.out' }, 0.46)
    .to('.beat-2', { autoAlpha: 0, y: -inY, duration: 0.06, ease: 'power2.in' }, 0.65)
    .fromTo('.beat-3', { autoAlpha: 0, y: inY }, { autoAlpha: 1, y: 0, duration: 0.08, ease: 'power2.out' }, 0.74);

  // curtain: Work rises over him while the stage recedes and dims
  gsap.timeline({ scrollTrigger: { trigger: '#work', start: 'top bottom', end: 'top top', scrub: true } })
    .to('#stage', { scale: reduced ? 1 : 0.9, borderRadius: 28, ease: 'none' }, 0)
    .to('#stageDim', { opacity: 0.6, ease: 'none' }, 0)
    .to('#film', { yPercent: reduced ? 0 : -6, ease: 'none' }, 0)
    .to('.beat-3', { autoAlpha: 0, y: -inY, ease: 'power1.in' }, 0);

  // the name drifts slightly against the pointer: a second depth plane
  if (!reduced && finePointer) {
    const nx = gsap.quickTo('#bigName', 'x', { duration: 1.4, ease: 'power3' });
    const fx = gsap.quickTo('#film', 'x', { duration: 1.4, ease: 'power3' });
    addEventListener('pointermove', (e) => { const k = e.clientX / innerWidth - 0.5; nx(k * -26); fx(k * 10); });
  }

  // headings rise line by line from a mask; supporting copy follows
  $$('.display').forEach((el) => {
    const lines = splitLines(el);
    if (reduced) return;
    gsap.from(lines, { yPercent: 115, duration: 1.2, stagger: 0.08, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 86%' } });
  });
  if (!reduced) {
    $$('.section-head .kicker, .about-lede, .cv-lede, .cv-copy .cta-row, .mail, .contact-grid').forEach((el) => {
      gsap.from(el, { y: 24, autoAlpha: 0, duration: 0.9, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 92%' } });
    });
  }

  // nav tucks away while reading down, returns on the way up
  const nav = $('#nav');
  ScrollTrigger.create({ start: 200, end: 'max', onUpdate: (self) => nav.classList.toggle('hide', self.direction === 1 && self.scroll() > 400) });

  // reel grows to fill the column as it reaches the centre, and only plays in view
  if (innerWidth > 820 && !reduced) {
    gsap.fromTo('#reelFrame', { width: '62%', borderRadius: 18 }, {
      width: '100%', borderRadius: 6, ease: 'none',
      scrollTrigger: { trigger: '#reel', start: 'top 90%', end: 'center 55%', scrub: true },
    });
  }
  const reelVideo = $('#reelVideo');
  ScrollTrigger.create({
    trigger: '#reel', start: 'top 150%', once: true, onEnter: () => { reelVideo.preload = 'auto'; reelVideo.load(); },
  });
  ScrollTrigger.create({
    trigger: '#reel', start: 'top 80%', end: 'bottom 10%',
    onToggle: (self) => { reelVisible = self.isActive; if (self.isActive && lb.hidden && !reduced) reelVideo.play().catch(() => {}); else reelVideo.pause(); },
  });

  if (!reduced) {
    // projects: the frame wipes open while the image settles
    $$('.project').forEach((p) => {
      const st = { trigger: p, start: 'top 88%' };
      gsap.from(p.querySelector('.project-img'), { clipPath: 'inset(100% 0% 0% 0%)', duration: 1.3, ease: 'expo.inOut', scrollTrigger: st });
      gsap.from(p.querySelector('.project-img img'), { scale: 1.25, duration: 1.8, ease: 'expo.out', scrollTrigger: st });
      gsap.from(p.querySelector('.project-meta'), { y: 20, autoAlpha: 0, duration: 0.9, delay: 0.3, ease: 'power3.out', scrollTrigger: st });
      gsap.fromTo(p.querySelector('.project-img img'), { yPercent: -8 }, { yPercent: 4, ease: 'none', scrollTrigger: { trigger: p, start: 'top bottom', end: 'bottom top', scrub: true } });
    });
    gsap.from('.portrait', { clipPath: 'inset(0% 0% 100% 0%)', duration: 1.5, ease: 'expo.inOut', scrollTrigger: { trigger: '.portrait', start: 'top 82%' } });
    gsap.fromTo('.portrait img', { yPercent: -6, scale: 1.12 }, { yPercent: 4, scale: 1, ease: 'none', scrollTrigger: { trigger: '.portrait', start: 'top bottom', end: 'bottom top', scrub: true } });
    $$('.timeline li').forEach((li, i) => {
      gsap.from(li, { x: 26, autoAlpha: 0, duration: 0.7, delay: (i % 6) * 0.04, ease: 'power3.out', scrollTrigger: { trigger: li, start: 'top 94%' } });
    });
    gsap.from('.cv-float', { y: 100, rotate: 8, autoAlpha: 0, duration: 1.3, ease: 'power3.out', scrollTrigger: { trigger: '#cv', start: 'top 70%' } });
    gsap.to('.cv-float', { y: -12, duration: 3.4, ease: 'sine.inOut', yoyo: true, repeat: -1 });

    // tools marquee: steady drift that surges with scroll speed
    const track = $('#tools');
    const loop = gsap.to(track, { xPercent: -50, duration: 40, ease: 'none', repeat: -1 });
    ScrollTrigger.create({
      trigger: '.marquee', start: 'top bottom', end: 'bottom top',
      onUpdate: (self) => { const v = Math.min(6, 1 + Math.abs(self.getVelocity()) / 400); gsap.to(loop, { timeScale: v * (self.direction || 1), duration: 0.3, overwrite: true }); },
      onLeave: () => loop.pause(), onEnterBack: () => loop.resume(), onEnter: () => loop.resume(), onLeaveBack: () => loop.pause(),
    });
  }

  // refresh once fonts and lazy media settle, so trigger positions are exact
  document.fonts?.ready.then(() => ScrollTrigger.refresh());
  addEventListener('load', () => ScrollTrigger.refresh());
}

// ------------------------------------------------------------------ pointer: magnetic buttons, CV tilt
function setupPointer() {
  if (reduced || !finePointer || !gsap) return;
  $$('.btn, .nav-cv, .reel-play').forEach((b) => {
    const bx = gsap.quickTo(b, 'x', { duration: 0.6, ease: 'elastic.out(1, 0.45)' });
    const by = gsap.quickTo(b, 'y', { duration: 0.6, ease: 'elastic.out(1, 0.45)' });
    b.addEventListener('pointermove', (e) => { const r = b.getBoundingClientRect(); bx((e.clientX - r.left - r.width / 2) * 0.25); by((e.clientY - r.top - r.height / 2) * 0.35); });
    b.addEventListener('pointerleave', () => { bx(0); by(0); });
  });
  const paper = $('#cvPaper'), img = $('#cvPaper img');
  paper.addEventListener('pointermove', (e) => {
    const r = paper.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
    img.style.transform = `rotateY(${x * 20}deg) rotateX(${-y * 14}deg) rotateZ(${x * 2}deg) scale(1.03)`;
  });
  paper.addEventListener('pointerleave', () => { img.style.transform = ''; });
}

function playIntro() {
  if (!gsap || reduced || TEST) return;
  gsap.timeline({ defaults: { ease: 'expo.out' } })
    .from('.name-row > span', { yPercent: 110, duration: 1.6, stagger: 0.12 }, 0.1)
    .from('#film', { autoAlpha: 0, scale: 1.06, transformOrigin: '50% 100%', duration: 1.8 }, 0)
    .from('.beat-0 > *', { y: 24, autoAlpha: 0, duration: 1.1, stagger: 0.08 }, 0.5)
    .from('.nav > *', { y: -16, autoAlpha: 0, duration: 0.9, stagger: 0.06 }, 0.6);
}

// ------------------------------------------------------------------ boot
async function pickFrameSet() {
  // HD (AI-upscaled, 1920px) unless the visitor asked to save data
  const saveData = navigator.connection && (navigator.connection.saveData || /2g|3g/.test(navigator.connection.effectiveType || ''));
  for (const dir of saveData ? ['assets/seq'] : ['assets/seq-hd', 'assets/seq']) {
    try {
      const r = await fetch(`${dir}/meta.json`);
      if (r.ok) return { dir, meta: await r.json() };
    } catch { /* try the next set */ }
  }
  return set;
}

async function boot() {
  fillContent();
  set = await pickFrameSet();
  addEventListener('resize', resizeCanvas);
  resizeCanvas();

  const order = loadOrder(set.meta.count);
  // a coarse half of the frames gates the reveal; the rest stream in after
  const stride = set.meta.count > 120 ? 4 : 2;
  const cut = order.findIndex((i) => i % stride !== 0);
  const gate = order.slice(0, cut < 0 ? order.length : cut);
  let done = 0;
  const num = $('#loaderNum'), bar = $('#loaderBar');
  const tick = () => { const p = done / gate.length; num.textContent = Math.round(p * 100); bar.style.transform = `scaleX(${p})`; };
  const queue = [...gate];
  await Promise.all(Array.from({ length: 6 }, async () => {
    while (queue.length) { const i = queue.shift(); await loadFrame(i); done++; tick(); if (i === 0) draw(0); }
  }));
  draw(0);
  document.body.classList.remove('loading');
  $('#loader').classList.add('done');
  setupScroll();
  setupPointer();
  playIntro();
  const rest = order.filter((i) => !frames[i]);
  await Promise.all(Array.from({ length: 4 }, async () => { while (rest.length) await loadFrame(rest.shift()); }));
  drawn = -1; draw(wanted);
}
boot();
