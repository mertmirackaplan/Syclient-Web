/* =========================================================
   SYCLIENT — Pixel Landing Page
   ========================================================= */
(() => {
  'use strict';

  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const rand = (a, b) => Math.random() * (b - a) + a;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const COLORS = ['#3ef0ff', '#ff4fd8', '#ffe14f', '#6bff8f', '#ff9a3c', '#a56bff'];
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------- 8-BIT SOUND ---------------- */
  let audio;
  function beep(freq = 660, dur = 0.08, type = 'square', vol = 0.04) {
    try {
      audio = audio || new (window.AudioContext || window.webkitAudioContext)();
      const o = audio.createOscillator(), g = audio.createGain();
      o.type = type; o.frequency.value = freq;
      g.gain.setValueAtTime(vol, audio.currentTime);
      g.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + dur);
      o.connect(g).connect(audio.destination);
      o.start(); o.stop(audio.currentTime + dur);
    } catch (e) { /* no audio */ }
  }
  const coinSound = () => { beep(988, 0.06); setTimeout(() => beep(1319, 0.12), 60); };

  /* ---------------- SCORE ---------------- */
  let score = 0;
  const scoreEl = $('#score');
  function addScore(n) {
    score += n;
    scoreEl.textContent = String(score).padStart(6, '0');
  }

  /* ---------------- SPRITES ---------------- */
  function drawSprite(cv, map, pal, scale) {
    const w = Math.max(...map.map(r => r.length));
    cv.width = w * scale; cv.height = map.length * scale;
    const ctx = cv.getContext('2d');
    ctx.clearRect(0, 0, cv.width, cv.height);
    map.forEach((row, y) => {
      [...row].forEach((ch, x) => {
        if (ch === '.' || !pal[ch]) return;
        ctx.fillStyle = pal[ch];
        ctx.fillRect(x * scale, y * scale, scale, scale);
      });
    });
  }

  const ROBOT_TOP = [
    '.....33.....',
    '.....11.....',
    '..11111111..',
    '.1222222221.',
    '.1244224421.',
    '.1244224421.',
    '.1222222221.',
    '.1225555221.',
    '..11111111..',
    '1.16666661.1',
    '111666666111',
    '...111111...',
  ];
  const ROBOT_BLINK = ROBOT_TOP.map((r, i) => (i === 4 ? '.1222222221.' : i === 5 ? '.1244224421.'.replace(/4/g, '4') : r));
  const LEGS_A = ['...11..11...', '..111..111..'];
  const LEGS_B = ['....11.11...', '...111.111..'];
  const ROBOT_PAL = { 1: '#cfd6ff', 2: '#1a1a3a', 3: '#ff4fd8', 4: '#3ef0ff', 5: '#ff4fd8', 6: '#5a5aa0' };

  const ICONS = {
    brain: { pal: { 1: '#ff4fd8', 2: '#a0208a' }, map: [
      '..1111.11.', '.11221111.', '1112111211', '1211121111', '1111211121',
      '1121111211', '1111121111', '.11211121.', '..111111..', '....11....'] },
    eye: { pal: { 1: '#ffe14f', 2: '#ffffff', 3: '#3ef0ff', 4: '#0a0a18' }, map: [
      '..........', '...1111...', '.11222211.', '1223333221', '1233443321',
      '1233443321', '1223333221', '.11222211.', '...1111...', '..........'] },
    chat: { pal: { 1: '#3ef0ff', 2: '#0a3a44', 3: '#ffffff' }, map: [
      '1111111111', '1222222221', '1232323231', '1222222221', '1233332221',
      '1222222221', '1111111111', '.111......', '.11.......', '.1........'] },
    chip: { pal: { 1: '#6bff8f', 2: '#1c5a2c', 3: '#2f8f48', 4: '#ffffff' }, map: [
      '..1.11.1..', '.11111111.', '1122222211', '.12333321.', '1123443211',
      '1123443211', '.12333321.', '1122222211', '.11111111.', '..1.11.1..'] },
    rocket: { pal: { 1: '#ff9a3c', 2: '#ffffff', 3: '#3ef0ff', 4: '#ffe14f' }, map: [
      '....11....', '...1221...', '...1221...', '..122221..', '..123321..',
      '..122221..', '.11222211.', '1111221111', '...4334...', '....44....'] },
    shield: { pal: { 1: '#a56bff', 2: '#4a2a8a', 3: '#ffffff' }, map: [
      '1111111111', '1222222221', '1222332221', '1223333221', '1222332221',
      '1222332221', '.12222221.', '..122221..', '...1221...', '....11....'] },
  };

  const CLOUD = [
    '....1111......',
    '..11111111....',
    '.1111111111.11',
    '11111111111111',
    '.111111111111.',
  ];

  /* ---------------- LOGO PIXEL MAP ---------------- */
  // Recreates the Syclient "cc / infinity" mark on a tiny canvas and samples it into pixels.
  function logoPixels(w, h) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const x = c.getContext('2d');
    const r = h * 0.3, cy = h / 2, d = r * 1.45;
    const lx = w / 2 - d, rx = w / 2 + d;
    x.strokeStyle = '#fff';
    x.lineWidth = h * 0.19;
    x.lineCap = 'butt';
    x.beginPath();
    x.arc(lx, cy, r, -Math.PI * 0.22, Math.PI * 0.25, true);
    x.lineTo(rx + r * Math.cos(-Math.PI * 0.75), cy + r * Math.sin(-Math.PI * 0.75));
    x.arc(rx, cy, r, -Math.PI * 0.75, Math.PI * 0.78, false);
    x.stroke();
    const data = x.getImageData(0, 0, w, h).data;
    const pts = [];
    for (let yy = 0; yy < h; yy++)
      for (let xx = 0; xx < w; xx++)
        if (data[(yy * w + xx) * 4 + 3] > 110) pts.push([xx, yy]);
    return pts;
  }

  function drawStaticLogo(cv, w, h, scale, color = '#fff', shadow = '#ff4fd8') {
    const pts = logoPixels(w, h);
    cv.width = (w + 1) * scale; cv.height = (h + 1) * scale;
    const ctx = cv.getContext('2d');
    ctx.fillStyle = shadow;
    pts.forEach(([x, y]) => ctx.fillRect((x + 1) * scale, (y + 1) * scale, scale, scale));
    ctx.fillStyle = color;
    pts.forEach(([x, y]) => ctx.fillRect(x * scale, y * scale, scale, scale));
  }

  drawStaticLogo($('#navLogo'), 24, 12, 3);
  drawStaticLogo($('#footLogo'), 24, 12, 3);
  drawStaticLogo($('#loaderLogo'), 40, 20, 6, '#fff', '#3ef0ff');

  /* ---------------- LOADER ---------------- */
  const loader = $('#loader'), fill = $('#loaderFill');
  let prog = 0, loaderDone = false;
  function finishLoader() {
    if (loaderDone) return;
    loaderDone = true;
    fill.style.width = '100%';
    setTimeout(() => { loader.classList.add('done'); startHero(); }, 250);
  }
  const loadTimer = setInterval(() => {
    prog += rand(6, 16);
    fill.style.width = Math.min(prog, 100) + '%';
    if (prog >= 100) { clearInterval(loadTimer); finishLoader(); }
  }, 110);
  ['keydown', 'click', 'touchstart'].forEach(ev =>
    loader.addEventListener(ev, () => { clearInterval(loadTimer); finishLoader(); }, { once: true }));
  window.addEventListener('keydown', () => { if (!loaderDone) { clearInterval(loadTimer); finishLoader(); } }, { once: true });

  /* ---------------- BACKGROUND STARFIELD ---------------- */
  const bg = $('#bg'), bctx = bg.getContext('2d');
  let W = 0, H = 0, stars = [], shooters = [];
  function resizeBg() {
    W = bg.width = window.innerWidth;
    H = bg.height = window.innerHeight;
    fx.width = W; fx.height = H;
    const n = Math.floor((W * H) / 5000);
    stars = Array.from({ length: n }, () => ({
      x: rand(0, W), y: rand(0, H * 3),
      s: Math.random() < 0.15 ? 4 : 2,
      z: rand(0.1, 0.6),
      t: rand(0, Math.PI * 2),
      c: Math.random() < 0.2 ? COLORS[Math.floor(rand(0, COLORS.length))] : '#ffffff',
    }));
  }
  function drawBg(time) {
    const sy = window.scrollY;
    bctx.fillStyle = '#0a0a18';
    bctx.fillRect(0, 0, W, H);

    // pixel moon
    const mx = Math.floor(W * 0.82 / 8) * 8, my = Math.floor((90 - sy * 0.15) / 8) * 8, R = 40;
    for (let y = -R; y <= R; y += 8)
      for (let x = -R; x <= R; x += 8) {
        if (x * x + y * y > R * R) continue;
        bctx.fillStyle = (x + 16) * (x + 16) + (y - 8) * (y - 8) < 140 || (x - 16) * (x - 16) + (y + 16) * (y + 16) < 70 ? '#c7c2ff' : (x > 16 || y > 24 ? '#9a94e6' : '#e6e2ff');
        bctx.fillRect(mx + x, my + y, 8, 8);
      }

    // stars
    for (const st of stars) {
      const y = ((st.y - sy * st.z) % (H * 1.2) + H * 1.2) % (H * 1.2);
      const tw = Math.sin(time * 0.003 + st.t);
      if (tw < -0.6) continue;
      bctx.fillStyle = st.c;
      const px = Math.floor(st.x / 2) * 2, py = Math.floor(y / 2) * 2;
      bctx.fillRect(px, py, st.s, st.s);
      if (st.s === 4 && tw > 0.85) { // sparkle cross
        bctx.fillRect(px - 4, py, 2, 4); bctx.fillRect(px + 6, py, 2, 4);
        bctx.fillRect(px, py - 4, 4, 2); bctx.fillRect(px, py + 6, 4, 2);
      }
    }

    // shooting stars
    if (Math.random() < 0.006) shooters.push({ x: rand(0, W), y: rand(0, H * 0.5), l: 0 });
    shooters = shooters.filter(s => s.l < 40);
    for (const s of shooters) {
      s.l++; s.x += 10; s.y += 5;
      for (let i = 0; i < 8; i++) {
        bctx.fillStyle = i === 0 ? '#fff' : `rgba(62,240,255,${1 - i / 8})`;
        bctx.fillRect(Math.floor(s.x - i * 8), Math.floor(s.y - i * 4), 4, 4);
      }
    }
  }

  /* ---------------- FX CANVAS (trail + bursts) ---------------- */
  const fx = $('#fx'), fctx = fx.getContext('2d');
  let parts = [], texts = [];
  let mouse = { x: -999, y: -999 };
  let lastTrail = 0;
  window.addEventListener('mousemove', e => {
    mouse.x = e.clientX; mouse.y = e.clientY;
    const now = performance.now();
    if (now - lastTrail > 16 && !reduceMotion) {
      lastTrail = now;
      parts.push({ x: e.clientX, y: e.clientY, vx: rand(-0.5, 0.5), vy: rand(0.2, 1.2), life: 30, s: 4, c: COLORS[Math.floor(rand(0, COLORS.length))] });
    }
  });
  function burst(x, y, n = 18, txt) {
    for (let i = 0; i < n; i++) {
      const a = rand(0, Math.PI * 2), sp = rand(2, 7);
      parts.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 2, life: rand(30, 55), s: Math.random() < 0.3 ? 8 : 4, c: COLORS[Math.floor(rand(0, COLORS.length))], g: 0.25 });
    }
    if (txt) texts.push({ x, y, t: txt, life: 50 });
  }
  window.addEventListener('click', e => {
    if (!loaderDone) return;
    if (e.target.closest('input')) return;
    burst(e.clientX, e.clientY, 14, '+10');
    addScore(10);
    if (e.target.closest('.btn, a')) coinSound(); else beep(rand(400, 800), 0.05);
  });
  function drawFx() {
    fctx.clearRect(0, 0, W, H);
    parts = parts.filter(p => p.life > 0);
    for (const p of parts) {
      p.life--; p.x += p.vx; p.y += p.vy; if (p.g) p.vy += p.g;
      fctx.globalAlpha = Math.min(1, p.life / 20);
      fctx.fillStyle = p.c;
      fctx.fillRect(Math.floor(p.x / 4) * 4, Math.floor(p.y / 4) * 4, p.s, p.s);
    }
    fctx.globalAlpha = 1;
    texts = texts.filter(t => t.life > 0);
    fctx.font = '12px "Press Start 2P"';
    fctx.textAlign = 'center';
    for (const t of texts) {
      t.life--; t.y -= 1.2;
      fctx.fillStyle = '#0a0a18'; fctx.fillText(t.t, t.x + 2, t.y + 2);
      fctx.fillStyle = '#ffe14f'; fctx.fillText(t.t, t.x, t.y);
    }
  }

  /* ---------------- HERO PARTICLE LOGO ---------------- */
  const hero = $('#heroLogo'), hctx = hero.getContext('2d');
  const LW = 40, LH = 20;
  const logoPts = logoPixels(LW, LH);
  let S = 12, logoParts = [], heroStarted = false;
  function sizeHero() {
    S = clamp(Math.floor((Math.min(window.innerWidth, 900) * 0.6) / LW), 5, 14);
    hero.width = (LW + 2) * S; hero.height = (LH + 2) * S;
  }
  function startHero() {
    if (heroStarted) return;
    heroStarted = true;
    sizeHero();
    logoParts = logoPts.map(([x, y]) => ({
      tx: (x + 0.5) * S, ty: (y + 0.5) * S,
      x: rand(-200, hero.width + 200), y: rand(-300, hero.height + 300),
      vx: 0, vy: 0, d: rand(0, 40),
    }));
    $$('.hero .reveal').forEach(el => el.classList.add('in'));
  }
  function explodeLogo() {
    logoParts.forEach(p => { const a = rand(0, Math.PI * 2), s = rand(8, 22); p.vx = Math.cos(a) * s; p.vy = Math.sin(a) * s; });
    beep(220, 0.2, 'sawtooth', 0.05); setTimeout(() => beep(880, 0.15), 120);
  }
  hero.addEventListener('click', () => { explodeLogo(); addScore(100); });
  function drawHero(time) {
    if (!heroStarted) return;
    const rect = hero.getBoundingClientRect();
    if (rect.bottom < 0) return;
    const scaleX = hero.width / rect.width;
    const mx = (mouse.x - rect.left) * scaleX, my = (mouse.y - rect.top) * scaleX;
    hctx.clearRect(0, 0, hero.width, hero.height);
    for (const p of logoParts) {
      if (p.d > 0) { p.d--; continue; }
      // spring to target
      p.vx += (p.tx - p.x) * 0.06; p.vy += (p.ty - p.y) * 0.06;
      // mouse repel
      const dx = p.x - mx, dy = p.y - my, dist = Math.hypot(dx, dy), R = S * 6;
      if (dist < R && dist > 0.1) { const f = (1 - dist / R) * 6; p.vx += (dx / dist) * f; p.vy += (dy / dist) * f; }
      p.vx *= 0.8; p.vy *= 0.8;
      p.x += p.vx; p.y += p.vy;
    }
    // shadow pass
    hctx.fillStyle = '#ff4fd8';
    for (const p of logoParts) hctx.fillRect(Math.round(p.x / S) * S - S / 2 + S, Math.round(p.y / S) * S - S / 2 + S, S, S);
    // main pass with travelling color wave
    for (const p of logoParts) {
      const w = Math.sin(p.tx / (S * 4) - time * 0.004);
      hctx.fillStyle = w > 0.88 ? '#3ef0ff' : w > 0.75 ? '#bff9ff' : '#ffffff';
      hctx.fillRect(Math.round(p.x / S) * S - S / 2, Math.round(p.y / S) * S - S / 2, S - 1, S - 1);
    }
  }

  /* ---------------- PIXEL CITY ---------------- */
  const city = $('#city'), cctx = city.getContext('2d');
  let buildings = [];
  function buildCity() {
    city.width = city.clientWidth; city.height = 200;
    buildings = [];
    let x = 0;
    while (x < city.width) {
      const w = Math.floor(rand(5, 12)) * 8, h = Math.floor(rand(6, 22)) * 8;
      const wins = [];
      for (let wy = city.height - h + 12; wy < city.height - 12; wy += 16)
        for (let wx = x + 8; wx < x + w - 8; wx += 12)
          wins.push({ x: wx, y: wy, on: Math.random() < 0.45, c: Math.random() < 0.15 ? '#ff4fd8' : Math.random() < 0.3 ? '#3ef0ff' : '#ffe14f' });
      buildings.push({ x, w, h, wins, ant: Math.random() < 0.3, shade: Math.random() < 0.5 ? '#16163a' : '#1c1c48' });
      x += w + Math.floor(rand(0, 2)) * 8;
    }
  }
  function drawCity(time) {
    if (city.getBoundingClientRect().bottom < 0) return;
    cctx.clearRect(0, 0, city.width, city.height);
    for (const b of buildings) {
      cctx.fillStyle = b.shade;
      cctx.fillRect(b.x, city.height - b.h, b.w, b.h);
      cctx.fillStyle = '#2a2a66';
      cctx.fillRect(b.x, city.height - b.h, b.w, 4);
      if (b.ant) {
        cctx.fillStyle = '#2a2a66';
        cctx.fillRect(b.x + b.w / 2 - 2, city.height - b.h - 20, 4, 20);
        cctx.fillStyle = Math.floor(time / 500) % 2 ? '#ff3b3b' : '#550000';
        cctx.fillRect(b.x + b.w / 2 - 4, city.height - b.h - 24, 8, 6);
      }
      for (const w of b.wins) {
        if (Math.random() < 0.0015) w.on = !w.on;
        if (!w.on) continue;
        cctx.fillStyle = w.c;
        cctx.fillRect(w.x, w.y, 4, 6);
      }
    }
    // ground
    cctx.fillStyle = '#ff4fd8';
    cctx.fillRect(0, city.height - 4, city.width, 4);
  }

  /* ---------------- ROBOTS ---------------- */
  const heroRobot = $('#robot');
  const walker = $('#walker');
  let robotFrame = -1;
  function robotMap(legs, blink) { return [...(blink ? ROBOT_BLINK : ROBOT_TOP), ...legs]; }
  function drawRobots(time) {
    const f = Math.floor(time / 250);
    if (f === robotFrame) return;
    robotFrame = f;
    const blink = f % 14 === 0;
    drawSprite(heroRobot, robotMap(f % 2 ? LEGS_A : LEGS_B, blink), ROBOT_PAL, 6);
    drawSprite(walker, robotMap(walking && f % 2 ? LEGS_A : LEGS_B, blink), ROBOT_PAL, 4);
  }
  heroRobot.addEventListener('click', e => { e.stopPropagation(); burst(e.clientX, e.clientY, 30, 'BEEP BOOP!'); addScore(50); beep(523, 0.08); setTimeout(() => beep(784, 0.1), 90); });
  heroRobot.style.cursor = 'pointer';

  /* ---------------- CLOUDS ---------------- */
  const cloudBox = $('#clouds');
  for (let i = 0; i < 6; i++) {
    const c = document.createElement('canvas');
    c.className = 'cloud';
    drawSprite(c, CLOUD, { 1: i % 2 ? '#2b2b5c' : '#3a3a78' }, Math.floor(rand(5, 10)));
    c.style.top = rand(8, 60) + '%';
    const dur = rand(40, 90);
    c.style.animationDuration = dur + 's';
    c.style.animationDelay = -rand(0, dur) + 's';
    cloudBox.appendChild(c);
  }

  /* ---------------- ICONS ---------------- */
  $$('canvas[data-sprite]').forEach(cv => {
    const s = ICONS[cv.dataset.sprite];
    if (s) drawSprite(cv, s.map, s.pal, 6);
  });

  /* ---------------- TYPER ---------------- */
  const phrases = [
    'Building the future, pixel by pixel.',
    'Meet Omi: 500M parameters of pure power.',
    'Smart AI agents for your business.',
    'From data to value, in seconds.',
  ];
  const typed = $('#typed');
  let pi = 0, ci = 0, del = false;
  (function type() {
    const p = phrases[pi];
    typed.textContent = p.slice(0, ci);
    if (!del && ci < p.length) ci++;
    else if (!del) { del = true; return setTimeout(type, 1800); }
    else if (ci > 0) ci--;
    else { del = false; pi = (pi + 1) % phrases.length; }
    setTimeout(type, del ? 28 : 60);
  })();

  /* ---------------- REVEAL + COUNTERS ---------------- */
  const io = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      en.target.classList.add('in');
      $$('[data-count]', en.target).forEach(countUp);
      if (en.target.classList.contains('xp')) fillXp();
      io.unobserve(en.target);
    });
  }, { threshold: 0.2 });
  $$('.reveal').forEach(el => { if (!el.closest('.hero')) io.observe(el); });

  function countUp(el) {
    const target = +el.dataset.count;
    let n = 0;
    const step = Math.max(1, Math.ceil(target / 30));
    const t = setInterval(() => {
      n = Math.min(target, n + step);
      el.textContent = n;
      if (n % (step * 3) === 0) beep(300 + n * 4, 0.02, 'square', 0.015);
      if (n >= target) clearInterval(t);
    }, 45);
  }
  function fillXp() {
    const fillEl = $('#xpFill'), txt = $('#xpText');
    let p = 0;
    const t = setInterval(() => {
      p = Math.min(87, p + 1);
      fillEl.style.width = p + '%';
      txt.textContent = Math.round(p * 99.99) + ' / 9999 XP';
      if (p >= 87) clearInterval(t);
    }, 25);
  }

  /* ---------------- LEVEL MAP WALKER ---------------- */
  const map = $('#map'), pathFill = $('#pathFill'), nodes = $$('.node');
  let walking = false, lastP = 0, walkTimeout;
  function updateWalker() {
    const r = map.getBoundingClientRect();
    const p = clamp((window.innerHeight * 0.75 - r.top) / (r.height + window.innerHeight * 0.1), 0, 1);
    walker.style.left = (12 + p * 76) + '%';
    walker.style.transform = `translateX(-50%) scaleX(${p < lastP ? -1 : 1})`;
    pathFill.style.width = (p * 100) + '%';
    if (Math.abs(p - lastP) > 0.001) {
      walking = true;
      clearTimeout(walkTimeout);
      walkTimeout = setTimeout(() => (walking = false), 200);
    }
    nodes.forEach((n, i) => {
      const lit = p >= i / 3 - 0.02;
      if (lit && !n.classList.contains('lit')) {
        n.classList.add('lit');
        const c = $('.coin', n).getBoundingClientRect();
        burst(c.left + c.width / 2, c.top, 16, i === 3 ? 'LEVEL CLEAR!' : '+100');
        addScore(100);
        if (audio) coinSound();
      } else if (!lit) n.classList.remove('lit');
    });
    lastP = p;
  }

  /* ---------------- NAV ---------------- */
  const nav = $('#nav');
  function onScroll() {
    nav.classList.toggle('scrolled', window.scrollY > 40);
    updateWalker();
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  $('#burger').addEventListener('click', e => { e.stopPropagation(); $('#links').classList.toggle('open'); });
  $$('#links a').forEach(a => a.addEventListener('click', () => $('#links').classList.remove('open')));

  /* ---------------- TERMINAL ---------------- */
  const term = $('#term');
  let termBusy = false, termStarted = false;
  function termLine(text, cls, speed = 22) {
    return new Promise(res => {
      const div = document.createElement('div');
      div.className = cls;
      term.appendChild(div);
      let i = 0;
      const t = setInterval(() => {
        div.textContent = text.slice(0, ++i);
        term.scrollTop = term.scrollHeight;
        if (i >= text.length) { clearInterval(t); res(); }
      }, speed);
    });
  }
  async function termIntro() {
    termBusy = true;
    await termLine('SYCLIENT OS v2.0 — booting Omi neural core...', 's', 18);
    await termLine('[■■■■■■■■■■] omi-500m loaded ✓', 's', 18);
    await termLine('user> What can you do for my business?', 'u');
    await termLine('omi> I analyze your data, learn your domain and automate your workflows. All with just 500M parameters. 🕹', 'a');
    await termLine('omi> Ask me anything, let\'s play!', 'a');
    termBusy = false;
  }
  new IntersectionObserver((en, obs) => {
    if (en[0].isIntersecting && !termStarted) { termStarted = true; termIntro(); obs.disconnect(); }
  }, { threshold: 0.4 }).observe(term);

  const answers = [
    [/hello|hi\b|hey|yo\b|sup/i, 'Hey Player 1! I\'m Omi. Welcome to the Syclient world. 👾'],
    [/price|pricing|cost|how much/i, 'Every project is a different boss fight. The first discovery call is free!'],
    [/param|size|big|small|500/i, 'I run on 500M parameters: small enough for the edge, smart enough for the enterprise.'],
    [/what.*(do|offer)|service|feature/i, 'Fine-tuned Omi models, AI assistants, computer vision and automation.'],
    [/contact|email|mail|reach|phone/i, 'Drop your email in the INSERT COIN box below and we\'ll get back to you!'],
    [/who are you|what are you|omi|your name/i, 'I\'m Omi, Syclient\'s in-house model. 8-bit heart, 500M parameters. 😄'],
    [/secur|privacy|gdpr|data/i, 'Your data is encrypted and stays yours. Omi can even run fully on-prem.'],
  ];
  $('#termForm').addEventListener('submit', async e => {
    e.preventDefault();
    const inp = $('#termIn'), q = inp.value.trim();
    if (!q || termBusy) return;
    inp.value = '';
    termBusy = true;
    await termLine('user> ' + q, 'u', 8);
    await termLine('omi> ...', 's', 120);
    term.lastChild.remove();
    const hit = answers.find(([re]) => re.test(q));
    await termLine('omi> ' + (hit ? hit[1] : 'Great question! Want to talk it through with our team? Reach out below.'), 'a');
    addScore(25);
    termBusy = false;
  });

  /* ---------------- CTA ---------------- */
  $('#ctaForm').addEventListener('submit', e => {
    e.preventDefault();
    const msg = $('#ctaMsg');
    msg.textContent = '★ PLAYER 1 HAS JOINED! SEE YOU SOON ★';
    const r = e.target.getBoundingClientRect();
    for (let i = 0; i < 4; i++) setTimeout(() => burst(rand(r.left, r.right), r.top, 24), i * 150);
    [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => beep(f, 0.12), i * 110));
    addScore(1000);
    e.target.reset();
  });

  /* ---------------- KONAMI ---------------- */
  const konami = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
  let kIdx = 0;
  window.addEventListener('keydown', e => {
    kIdx = e.key.toLowerCase() === konami[kIdx].toLowerCase() ? kIdx + 1 : (e.key === konami[0] ? 1 : 0);
    if (kIdx === konami.length) {
      kIdx = 0;
      document.body.classList.toggle('rainbow');
      toast('KONAMI CODE! +30 LIVES 🎮');
      addScore(30000);
      [262, 330, 392, 523, 659, 784].forEach((f, i) => setTimeout(() => beep(f, 0.1), i * 80));
    }
  });
  let toastT;
  function toast(t) {
    const el = $('#toast');
    el.textContent = t; el.classList.add('show');
    clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove('show'), 2600);
  }

  /* ---------------- MAIN LOOP ---------------- */
  function resizeAll() {
    resizeBg(); buildCity();
    if (heroStarted) {
      const old = S; sizeHero();
      logoParts.forEach((p, i) => { p.tx = (logoPts[i][0] + 0.5) * S; p.ty = (logoPts[i][1] + 0.5) * S; p.x *= S / old; p.y *= S / old; });
    }
  }
  window.addEventListener('resize', resizeAll);
  resizeAll();
  onScroll();

  function loop(t) {
    drawBg(t);
    drawHero(t);
    drawCity(t);
    drawRobots(t);
    drawFx();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
