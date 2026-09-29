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

  const work = PROJECTS.filter((p) => !p.video);
  // featured cards pair up left/right; portrait and square covers take 5 of 12 columns,
  // wide ones 7, and each card keeps its render's own aspect ratio
  const featured = work.filter((p) => p.featured);
  const ratio = (p) => { const [a, b] = (p.ratio || '4 / 3').split('/').map(Number); return a / b; };
  const want = (p) => (ratio(p) < 1.1 ? 5 : 7);
  const place = [];
  for (let i = 0; i < featured.length; i += 2) {
    const a = featured[i], b = featured[i + 1];
    if (!b) { const s = want(a); place.push(`grid-column:${Math.floor((12 - s) / 2) + 1} / span ${s}`); break; }
    const l = want(a), r = Math.min(want(b), 12 - l), inset = (i / 2) % 2 && l + r <= 11 ? 1 : 0;
    place.push(`grid-column:${1 + inset} / span ${l}`, `grid-column:${13 - r} / span ${r};margin-top:${ratio(b) < ratio(a) ? 8 : 16}vh`);
  }
  $('#projects').innerHTML = featured.map((p, i) => `
    <button class="project" type="button" data-id="${p.id}" style="${place[i]}" aria-label="Open project ${p.no}: ${p.title}">
      <div class="project-img" style="aspect-ratio:${p.ratio || '4 / 3'}"><img src="${p.cover}" alt="" loading="lazy" decoding="async">${p.youtube ? '<span class="play-badge">Animation</span>' : ''}</div>
      <div class="project-meta"><span class="project-no" aria-hidden="true">${p.no}</span><h3>${p.title}<span class="open" aria-hidden="true">↗</span></h3><p>${p.kind}</p></div>
    </button>`).join('');
  $('#indexList').innerHTML = work.filter((p) => !p.featured).map((p) => `
    <li><button class="index-row" type="button" data-id="${p.id}" aria-label="Open project: ${p.title}">
      <img class="index-thumb" src="${p.cover}" alt="" loading="lazy" decoding="async">
      <strong>${p.title}</strong><span>${p.kind}</span><i aria-hidden="true">↗</i>
    </button></li>`).join('');
  $$('.project, .index-row').forEach((b) => b.addEventListener('click', () => openProject(PROJECTS.find((p) => p.id === b.dataset.id), b)));
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
  if (p.youtube) {
    const wrap = document.createElement('div'); wrap.className = 'lb-yt';
    wrap.innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${p.youtube}?rel=0&modestbranding=1&playsinline=1" title="${p.title} animation" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>`;
    m.appendChild(wrap);
  }
  p.images.forEach((src, i) => { const im = new Image(); im.src = src; im.alt = `${p.title}, image ${i + 1}`; im.decoding = 'async'; if (i > 1) im.loading = 'lazy'; m.appendChild(im); });
  $('#lbKind').textContent = p.kind; $('#lbTitle').textContent = p.title; $('#lbBlurb').textContent = p.blurb;
  const link = $('#lbLink'); link.hidden = !p.link; if (p.link) link.href = p.link;
  const watch = $('#lbWatch'); watch.hidden = !p.youtube; if (p.youtube) watch.href = `https://www.youtube.com/watch?v=${p.youtube}`;
  lb.hidden = false; lb.scrollTop = 0;
  document.documentElement.classList.add('lb-open');   // page behind stays put, with or without Lenis
  lenis?.stop();
  $('#reelVideo').pause();
  $('#lbClose').focus({ preventScroll: true });
}
function closeLightbox() {
  const v = $('#lbMedia video'); if (v) v.pause();
  $('#lbMedia').innerHTML = '';   // also unloads a YouTube player, which stops its sound
  lb.hidden = true;
  document.documentElement.classList.remove('lb-open');
  lenis?.start();
  if (reelVisible) $('#reelVideo').play().catch(() => {});
  lastFocus?.focus?.({ preventScroll: true });
}
$('#lbClose').addEventListener('click', closeLightbox);
addEventListener('keydown', (e) => {
  if (lb.hidden) return;
  if (e.key === 'Escape') closeLightbox();
  if (e.key === 'Tab') { // keep focus inside the dialog
    const stops = [$('#lbClose'), $('#lbMedia iframe'), $('#lbWatch'), $('#lbLink')].filter((el) => el && !el.hidden);
    const k = stops.indexOf(document.activeElement);
    e.preventDefault(); stops[(k + (e.shiftKey ? -1 : 1) + stops.length) % stops.length].focus();
  }
});
$('#reelPlay').addEventListener('click', () => openProject(PROJECTS.find((p) => p.video), $('#reelPlay')));

// ------------------------------------------------------------------ film frames
const canvas = $('#film');
const ctx = canvas.getContext('2d');
let set = { dir: 'assets/seq', meta: { count: 192, w: 1280, h: 720, boxes: [] } };
const frames = [];
let wanted = 0, drawn = -1;

// frame URLs carry the set's content version, so cached frames from an older build
// are never drawn with a newer meta.json (or the other way round)
const frameUrl = (i) => `${set.dir}/f${String(i).padStart(3, '0')}.webp${set.meta.v ? `?v=${set.meta.v}` : ''}`;
// Each frame is decoded once, off the main thread, into an ImageBitmap that stays
// ready to draw, so scrubbing never waits on a decode.
function loadFrame(i) {
  const url = frameUrl(i);
  const asImage = () => new Promise((res) => {
    const im = new Image();
    im.onload = () => (im.decode ? im.decode() : Promise.resolve()).catch(() => {}).then(() => res(im));
    im.onerror = () => res(null);
    im.src = url;
  });
  const job = window.createImageBitmap
    ? fetch(url).then((r) => (r.ok ? r.blob() : Promise.reject())).then((b) => createImageBitmap(b)).catch(asImage)
    : asImage();
  return job.then((bm) => { if (bm) frames[i] = bm; return !!bm; });
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
  // never back the canvas with more pixels than the frames carry: past that it only
  // costs drawing time (the frames are 1920px wide at most)
  const cw = canvas.clientWidth, chh = canvas.clientHeight;
  const css = Math.max(cw / set.meta.w, chh / set.meta.h) * (cw / chh < 1.1 ? 0.74 : 1);
  const dpr = Math.min(window.devicePixelRatio || 1, 2, Math.max(1, 1 / css));
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
// One frame at a time: cross-fading two cut-outs of a moving figure ghosts his edges.
// Frames are stored cropped to his outline (meta.crops), which keeps GPU memory low.
function draw(f) {
  wanted = f;
  const a = nearestLoaded(Math.round(f));
  if (a < 0 || a === drawn) return;
  drawn = a;
  const p = placement(a), c = set.meta.crops?.[a], s = p.dw / set.meta.w;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.imageSmoothingQuality = 'high';
  if (c) ctx.drawImage(frames[a], p.dx + c[0] * s, p.dy + c[1] * s, c[2] * s, c[3] * s);
  else ctx.drawImage(frames[a], p.dx, p.dy, p.dw, p.dh);
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

  // reel opens out to the full column as it reaches the centre (clip-path, so the
  // layout below never moves), and only plays in view
  if (innerWidth > 820 && !reduced) {
    const reelST = { trigger: '#reel', start: 'top 90%', end: 'center 55%', scrub: true };
    gsap.fromTo('#reelFrame', { clipPath: 'inset(19% 19% 19% 19% round 18px)' }, { clipPath: 'inset(0% 0% 0% 0% round 6px)', ease: 'none', scrollTrigger: reelST });
    gsap.fromTo('#reelVideo', { scale: 1.12 }, { scale: 1, ease: 'none', scrollTrigger: reelST });
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
    $$('.index-list li').forEach((li, i) => {
      gsap.from(li, { y: 34, autoAlpha: 0, duration: 0.9, delay: (i % 4) * 0.05, ease: 'power3.out', scrollTrigger: { trigger: li, start: 'top 96%' } });
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
  // project index: a preview of the hovered render trails the cursor
  const list = $('#indexList'), peek = $('#indexPeek');
  gsap.set(peek, { xPercent: -50, yPercent: -58, scale: 0.86 });
  const px = gsap.quickTo(peek, 'x', { duration: 0.55, ease: 'power3.out' });
  const py = gsap.quickTo(peek, 'y', { duration: 0.55, ease: 'power3.out' });
  const show = (id) => $$('img', peek).forEach((im) => im.classList.toggle('on', im.dataset.id === id));
  list.addEventListener('pointerenter', (e) => {
    if (!peek.children.length) peek.innerHTML = $$('.index-row').map((r) => `<img src="${r.querySelector('img').getAttribute('src')}" alt="" data-id="${r.dataset.id}">`).join('');
    gsap.set(peek, { x: e.clientX, y: e.clientY });
    gsap.to(peek, { autoAlpha: 1, scale: 1, duration: 0.45, ease: 'expo.out', overwrite: 'auto' });
  });
  list.addEventListener('pointerleave', () => gsap.to(peek, { autoAlpha: 0, scale: 0.86, duration: 0.3, ease: 'power2.in', overwrite: 'auto' }));
  list.addEventListener('pointermove', (e) => { px(e.clientX); py(e.clientY); });
  $$('.index-row').forEach((r) => r.addEventListener('pointerenter', () => show(r.dataset.id)));
  list.addEventListener('click', () => gsap.set(peek, { autoAlpha: 0 }));

  const paper = $('#cvPaper'), img = $('#cvPaper img');
  paper.addEventListener('pointermove', (e) => {
    const r = paper.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
    img.style.transform = `rotateY(${x * 20}deg) rotateX(${-y * 14}deg) rotateZ(${x * 2}deg) scale(1.03)`;
  });
  paper.addEventListener('pointerleave', () => { img.style.transform = ''; });
}

// the loader lifts away like a sheet while the intro starts underneath it
function revealPage() {
  const el = $('#loader');
  document.body.classList.remove('loading');
  if (!gsap || reduced || TEST) { el.classList.add('done'); return; }
  gsap.timeline({ onComplete: () => el.classList.add('done') })
    .to('#loader > *', { y: -30, autoAlpha: 0, duration: 0.45, ease: 'power3.in', stagger: 0.04 }, 0)
    .to(el, { yPercent: -100, duration: 1, ease: 'expo.inOut' }, 0.15);
}

function playIntro() {
  if (!gsap || reduced || TEST) return;
  gsap.timeline({ delay: 0.35, defaults: { ease: 'expo.out' } })
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
      const r = await fetch(`${dir}/meta.json`, { cache: 'no-cache' });   // always revalidate: it names the frame version
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

  // The loader waits only for what the first screen needs: frame 0, the backdrop and a
  // coarse pass of the film (every 16th frame, enough to scrub). Everything else
  // streams in behind the page, and a slow connection never holds it past ~2 s.
  const order = loadOrder(set.meta.count);
  const coarse = order.filter((i) => i % 16 === 0 && i !== 0);
  const num = $('#loaderNum'), bar = $('#loaderBar');
  let target = 0, shown = 0, done = 0, counting = true;
  const total = coarse.length + 2;
  const bump = () => { done++; target = done / total; };
  (function count() {
    shown += (target - shown) * 0.16;
    if (target - shown < 0.004) shown = target;
    num.textContent = Math.round(shown * 100); bar.style.transform = `scaleX(${shown})`;
    if (counting) requestAnimationFrame(count);
  })();
  const bd = $('.backdrop');
  const backdrop = (bd.complete ? Promise.resolve() : new Promise((r) => { bd.onload = bd.onerror = r; })).then(bump);
  const first = loadFrame(0).then(() => { draw(0); bump(); });
  const queue = [...coarse];
  const gate = Promise.all([backdrop, first, ...Array.from({ length: 6 }, async () => {
    while (queue.length) { await loadFrame(queue.shift()); bump(); }
  })]);
  await Promise.race([gate, first.then(() => new Promise((r) => setTimeout(r, 2000)))]);
  target = 1;
  await new Promise((r) => setTimeout(r, TEST ? 0 : 260));   // let the count land on 100
  counting = false;
  num.textContent = 100; bar.style.transform = 'scaleX(1)';
  draw(0);
  revealPage();
  setupScroll();
  setupPointer();
  playIntro();
  const rest = order.filter((i) => !frames[i] && i % 16 !== 0);   // coarse frames are still in the gate queue
  await Promise.all(Array.from({ length: 4 }, async () => { while (rest.length) await loadFrame(rest.shift()); }));
  drawn = -1; draw(wanted);
}
boot();
