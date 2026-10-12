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
  // dev/preview: ?nointro skips the loader, &y=1200 jumps to a scroll position
  const qs = new URLSearchParams(location.search);
  if (qs.has('nointro')) { clearInterval(loadTimer); loaderDone = true; loader.classList.add('done'); setTimeout(startHero); if (qs.get('y')) setTimeout(() => window.scrollTo(0, +qs.get('y')), 50); }

  /* ---------------- BACKGROUND: SKY + DAY/NIGHT CYCLE ---------------- */
  const bg = $('#bg'), bctx = bg.getContext('2d');
  let W = 0, H = 0, stars = [], shooters = [], hillsFar = [], hillsNear = [], skyClouds = [], birds = [], ufo = null;
  let isDay = false, sunTarget = 0, sunPhase = 0;
  const NIGHT_TOP = [10, 10, 24], NIGHT_BOT = [26, 20, 60];
  const DAY_TOP = [190, 228, 255], DAY_BOT = [255, 255, 255];
  const GLOW = [255, 138, 92];
  const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
  const rgb = c => `rgb(${c[0]},${c[1]},${c[2]})`;
  const spriteCanvas = (map, pal, s) => { const c = document.createElement('canvas'); drawSprite(c, map, pal, s); return c; };
  const cloudSprites = [6, 8, 10].map(s => spriteCanvas(CLOUD, { 1: '#ffffff' }, s));
  const birdSprites = [['11...11', '..1.1..', '...1...'], ['.......', '1111111', '...1...']].map(m => spriteCanvas(m, { 1: '#1a1a3a' }, 4));
  const UFO_A = ['....2222....', '..22222222..', '111111111111', '131131131131', '..11111111..'];
  const UFO_B = UFO_A.map((r, i) => (i === 3 ? '311311311311' : r));
  const ufoSprites = [UFO_A, UFO_B].map(m => spriteCanvas(m, { 1: '#a56bff', 2: '#3ef0ff', 3: '#ffe14f' }, 4));
  const servicesSec = $('#services'), demoSec = $('#demo');

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
    hillsFar = []; hillsNear = [];
    for (let x = 0; x <= W + 8; x += 8) {
      hillsFar.push(Math.round((H * 0.17 + 40 * Math.sin(x * 0.0035 + 1) + 22 * Math.sin(x * 0.009 + 2)) / 8) * 8);
      hillsNear.push(Math.round((H * 0.08 + 24 * Math.sin(x * 0.006 + 4) + 12 * Math.sin(x * 0.02)) / 8) * 8);
    }
    skyClouds = Array.from({ length: 6 }, (_, i) => ({ x: rand(0, W), y: rand(H * 0.06, H * 0.45), sp: rand(0.2, 0.6), s: cloudSprites[i % 3] }));
  }

  // 0 = before sunrise, 0.5 = noon, 1 = after sunset. Sunrise starts as the Omi features section scrolls in.
  function cyclePhase() {
    const start = servicesSec.offsetTop - H * 0.85;
    const end = demoSec.offsetTop - H * 0.35;
    return clamp((window.scrollY - start) / (end - start), 0, 1);
  }

  function setDay(day) {
    if (day === isDay) return;
    isDay = day;
    document.body.classList.toggle('day', day);
    toast(day ? '☀ GOOD MORNING, PLAYER 1!' : '☾ GOOD NIGHT, PLAYER 1!');
    if (audio) (day ? [523, 659, 784] : [784, 659, 523]).forEach((f, i) => setTimeout(() => beep(f, 0.1, 'triangle', 0.05), i * 110));
  }

  function drawMoon(mx, my) {
    const R = 40;
    for (let y = -R; y <= R; y += 8)
      for (let x = -R; x <= R; x += 8) {
        if (x * x + y * y > R * R) continue;
        bctx.fillStyle = (x + 16) * (x + 16) + (y - 8) * (y - 8) < 140 || (x - 16) * (x - 16) + (y + 16) * (y + 16) < 70 ? '#c7c2ff' : (x > 16 || y > 24 ? '#9a94e6' : '#e6e2ff');
        bctx.fillRect(mx + x, my + y, 8, 8);
      }
  }

  function drawSun(sx, sy, alt, time) {
    const R = 48, warm = clamp(alt * 2.2, 0, 1);
    const edge = mix([255, 80, 50], [255, 190, 40], warm);
    const core = mix([255, 150, 70], [255, 232, 90], warm);
    const hi = mix([255, 210, 150], [255, 252, 200], warm);
    // rotating, pulsing pixel rays
    const rot = Math.floor(time / 400) * (Math.PI / 16);
    const len = 3 + (Math.floor(time / 300) % 2);
    bctx.fillStyle = rgb(core);
    for (let k = 0; k < 12; k++) {
      const a = rot + (k * Math.PI) / 6;
      for (let i = 0; i < len; i++) {
        const d = R + 14 + i * 12;
        bctx.fillRect(Math.round((sx + Math.cos(a) * d) / 8) * 8, Math.round((sy + Math.sin(a) * d) / 8) * 8, 8, 8);
      }
    }
    for (let y = -R; y <= R; y += 8)
      for (let x = -R; x <= R; x += 8) {
        const r2 = x * x + y * y;
        if (r2 > R * R) continue;
        bctx.fillStyle = rgb(r2 > (R - 10) * (R - 10) ? edge : (x < -8 && y < -8 && r2 < 900 ? hi : core));
        bctx.fillRect(sx + x, sy + y, 8, 8);
      }
  }

  function drawBg(time) {
    const sy = window.scrollY;
    // ease the sun towards the scroll target so it animates smoothly
    sunTarget = cyclePhase();
    sunPhase += (sunTarget - sunPhase) * 0.08;
    if (Math.abs(sunTarget - sunPhase) < 0.0005) sunPhase = sunTarget;
    const p = sunPhase;
    const alt = Math.sin(p * Math.PI);                                   // sun altitude 0..1
    const d = Math.round(clamp((alt - 0.12) / 0.45, 0, 1) * 10) / 10;    // stepped daylight
    const glow = alt > 0 ? clamp(1 - Math.abs(alt - 0.3) / 0.3, 0, 1) : 0;
    setDay(d >= 0.5);

    // sky in chunky 8px bands (pixel gradient)
    for (let y = 0; y < H; y += 8) {
      const t = y / H;
      let c = mix(mix(NIGHT_TOP, NIGHT_BOT, t), mix(DAY_TOP, DAY_BOT, t), d);
      c = mix(c, GLOW, (Math.round(glow * Math.pow(t, 1.5) * 6) / 6) * 0.85);
      bctx.fillStyle = rgb(c);
      bctx.fillRect(0, y, W, 8);
    }

    // stars + shooting stars fade out at dawn
    const starA = clamp(1 - d * 1.8, 0, 1);
    if (starA > 0) {
      bctx.globalAlpha = starA;
      for (const st of stars) {
        const y = ((st.y - sy * st.z) % (H * 1.2) + H * 1.2) % (H * 1.2);
        const tw = Math.sin(time * 0.003 + st.t);
        if (tw < -0.6) continue;
        bctx.fillStyle = st.c;
        const px = Math.floor(st.x / 2) * 2, py = Math.floor(y / 2) * 2;
        bctx.fillRect(px, py, st.s, st.s);
        if (st.s === 4 && tw > 0.85) {
          bctx.fillRect(px - 4, py, 2, 4); bctx.fillRect(px + 6, py, 2, 4);
          bctx.fillRect(px, py - 4, 4, 2); bctx.fillRect(px, py + 6, 4, 2);
        }
      }
      if (Math.random() < 0.006) shooters.push({ x: rand(0, W), y: rand(0, H * 0.5), l: 0 });
      shooters = shooters.filter(s => s.l < 40);
      for (const s of shooters) {
        s.l++; s.x += 10; s.y += 5;
        for (let i = 0; i < 8; i++) {
          bctx.fillStyle = i === 0 ? '#fff' : `rgba(62,240,255,${1 - i / 8})`;
          bctx.fillRect(Math.floor(s.x - i * 8), Math.floor(s.y - i * 4), 4, 4);
        }
      }
      bctx.globalAlpha = 1;
    }

    // moon sinks while the sun is up, comes back at night
    const moonY = Math.floor((96 + clamp(alt * 1.8, 0, 1) * (H + 60)) / 8) * 8;
    if (moonY < H + 50) drawMoon(Math.floor(W * 0.82 / 8) * 8, moonY);

    // sun: rises bottom-left, arcs across, sets bottom-right
    if (alt > 0.001) {
      const sx = Math.floor(W * (0.1 + 0.8 * p) / 8) * 8;
      const sY = Math.floor((H * 0.95 - alt * H * 0.72) / 8) * 8;
      drawSun(sx, sY, alt, time);
    }

    // day clouds
    if (d > 0) {
      bctx.globalAlpha = d * 0.95;
      for (const c of skyClouds) {
        c.x += c.sp;
        if (c.x > W + 20) c.x = -c.s.width - 20;
        bctx.drawImage(c.s, Math.floor(c.x / 4) * 4, c.y);
      }
      bctx.globalAlpha = 1;
    }

    // birds (day)
    if (d > 0.6 && !birds.length && Math.random() < 0.006) {
      const by = rand(H * 0.12, H * 0.4);
      birds = Array.from({ length: 5 }, (_, i) => ({ x: -60 - i * 26, y: by + Math.abs(i - 2) * 14, o: rand(0, 2) }));
    }
    if (birds.length) {
      bctx.globalAlpha = d;
      for (const b of birds) {
        b.x += 1.6;
        const f = Math.floor(time / 180 + b.o) % 2;
        bctx.drawImage(birdSprites[f], Math.floor(b.x / 4) * 4, Math.floor((b.y + Math.sin(time * 0.003 + b.o) * 6) / 4) * 4);
      }
      bctx.globalAlpha = 1;
      if (birds.every(b => b.x > W + 40)) birds = [];
    }

    // UFO (night only)
    if (!ufo && d === 0 && Math.random() < 0.0015) ufo = { x: -60, y: rand(70, H * 0.35) };
    if (ufo) {
      ufo.x += 2.2;
      const uy = Math.floor((ufo.y + Math.sin(time * 0.004) * 8) / 4) * 4;
      bctx.globalAlpha = 1 - d;
      if (Math.abs(ufo.x - W * 0.5) < 140) {
        for (let i = 0; i < 12; i++) {
          bctx.fillStyle = `rgba(107,255,143,${0.28 - i * 0.02})`;
          bctx.fillRect(Math.floor(ufo.x + 8 - i * 4), uy + 22 + i * 8, 32 + i * 8, 8);
        }
      }
      bctx.drawImage(ufoSprites[Math.floor(time / 200) % 2], Math.floor(ufo.x / 4) * 4, uy);
      bctx.globalAlpha = 1;
      if (ufo.x > W + 60) ufo = null;
    }

    // hills rise up with the sun, sun sets behind them
    const ha = clamp(Math.min(p, 1 - p) * 10, 0, 1);
    if (ha > 0) {
      const off = Math.round((1 - ha) * 160 / 8) * 8;
      bctx.fillStyle = rgb(mix([27, 27, 68], [150, 214, 150], d));
      hillsFar.forEach((h, i) => bctx.fillRect(i * 8, H - h + off, 8, h));
      const near = rgb(mix([18, 18, 54], [84, 176, 96], d));
      const tree = rgb(mix([12, 12, 40], [40, 120, 60], d));
      hillsNear.forEach((h, i) => {
        bctx.fillStyle = near;
        bctx.fillRect(i * 8, H - h + off, 8, h);
        if (i % 13 === 5) { // little pixel trees
          const tx = i * 8, ty = H - h + off;
          bctx.fillStyle = tree;
          bctx.fillRect(tx - 8, ty - 16, 24, 8);
          bctx.fillRect(tx - 4, ty - 24, 16, 8);
          bctx.fillRect(tx, ty - 32, 8, 8);
          bctx.fillRect(tx, ty - 8, 8, 8);
        }
      });
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

  /* ---------------- HERO 2.5D VOXEL LOGO ---------------- */
  const hero = $('#heroLogo'), hctx = hero.getContext('2d');
  const LW = 40, LH = 20, PAD = 3, DEPTH = 5;
  const DEPTH_COLS = ['#3a1060', '#5a1a7a', '#8a1f8f', '#c2189a', '#ff4fd8'];
  const logoPts = logoPixels(LW, LH);
  let S = 12, logoParts = [], heroStarted = false;
  const tiltV = { x: 0.6, y: 0.6 };
  function sizeHero() {
    const byW = Math.min(window.innerWidth * 0.78, 1100) / (LW + PAD * 2);
    const byH = (window.innerHeight * 0.3) / (LH + PAD * 2);
    S = clamp(Math.floor(Math.min(byW, byH)), 4, 18);
    hero.width = (LW + PAD * 2) * S; hero.height = (LH + PAD * 2) * S;
  }
  function setLogoTargets(scale = 1) {
    logoParts.forEach((p, i) => {
      p.tx = (logoPts[i][0] + PAD + 0.5) * S; p.ty = (logoPts[i][1] + PAD + 0.5) * S;
      p.x *= scale; p.y *= scale;
    });
  }
  function startHero() {
    if (heroStarted) return;
    heroStarted = true;
    sizeHero();
    logoParts = logoPts.map(() => ({ tx: 0, ty: 0, x: rand(-200, hero.width + 200), y: rand(-300, hero.height + 300), vx: 0, vy: 0, d: rand(0, 40) }));
    setLogoTargets();
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

    // extrusion direction: away from the pointer (2.5D parallax), idle sway otherwise
    let ex, ey;
    if (mouse.x > -500) {
      ex = clamp(-(mouse.x - (rect.left + rect.width / 2)) / (window.innerWidth / 2), -1, 1);
      ey = clamp(-(mouse.y - (rect.top + rect.height / 2)) / (window.innerHeight / 2), -1, 1);
    } else { ex = Math.sin(time * 0.0008) * 0.8; ey = 0.7; }
    tiltV.x += (ex - tiltV.x) * 0.08; tiltV.y += (ey - tiltV.y) * 0.08;

    for (const p of logoParts) {
      if (p.d > 0) { p.d--; continue; }
      p.vx += (p.tx - p.x) * 0.06; p.vy += (p.ty - p.y) * 0.06;
      const dx = p.x - mx, dy = p.y - my, dist = Math.hypot(dx, dy), R = S * 6;
      if (dist < R && dist > 0.1) { const f = (1 - dist / R) * 6; p.vx += (dx / dist) * f; p.vy += (dy / dist) * f; }
      p.vx *= 0.8; p.vy *= 0.8;
      p.x += p.vx; p.y += p.vy;
    }
    const half = S / 2;
    const step = Math.max(1, Math.round(S / 3));
    // voxel depth layers, back to front
    for (let k = DEPTH; k >= 1; k--) {
      const ox = Math.round(tiltV.x * k * step), oy = Math.round(tiltV.y * k * step);
      hctx.fillStyle = DEPTH_COLS[DEPTH - k];
      for (const p of logoParts) hctx.fillRect(Math.round(p.x / S) * S - half + ox, Math.round(p.y / S) * S - half + oy, S, S);
    }
    // front face with travelling shine + bevel highlight
    for (const p of logoParts) {
      const w = Math.sin(p.tx / (S * 4) - time * 0.004);
      const fx0 = Math.round(p.x / S) * S - half, fy0 = Math.round(p.y / S) * S - half;
      hctx.fillStyle = w > 0.88 ? '#3ef0ff' : w > 0.75 ? '#bff9ff' : '#ffffff';
      hctx.fillRect(fx0, fy0, S, S);
      if (S >= 8) { hctx.fillStyle = 'rgba(10,10,24,.12)'; hctx.fillRect(fx0 + S - 2, fy0, 2, S); hctx.fillRect(fx0, fy0 + S - 2, S, 2); }
    }
  }

  /* ---------------- 2.5D PIXEL CITY ---------------- */
  const city = $('#city'), cctx = city.getContext('2d');
  let buildings = [], farBuildings = [];
  const WIN_COLS = () => (Math.random() < 0.15 ? '#ff4fd8' : Math.random() < 0.3 ? '#3ef0ff' : '#ffe14f');
  function makeRow(maxRows, minRows, gapMax, withWins) {
    const row = [];
    let x = -16;
    while (x < city.width + 16) {
      const w = Math.floor(rand(5, 11)) * 8, h = Math.floor(rand(minRows, maxRows)) * 8;
      const wins = [];
      if (withWins)
        for (let wy = city.height - h + 12; wy < city.height - 12; wy += 16)
          for (let wx = x + 8; wx < x + w - 8; wx += 12)
            wins.push({ x: wx, y: wy, on: Math.random() < 0.45, c: WIN_COLS() });
      row.push({ x, w, h, wins, ant: Math.random() < 0.3, shade: Math.random() < 0.5 ? '#16163a' : '#1c1c48' });
      x += w + Math.floor(rand(1, gapMax)) * 8;
    }
    return row;
  }
  function buildCity() {
    city.width = city.clientWidth; city.height = city.clientHeight || 200;
    const rows = Math.floor((city.height - 40) / 8);
    farBuildings = makeRow(Math.max(8, rows - 2), 5, 2, false);
    buildings = makeRow(rows, 5, 4, true);
  }
  // building with isometric side wall (right) + roof (top)
  function drawBlock(b, front, side, roof, depth) {
    const top = city.height - b.h;
    // side wall: stepped 4px columns rising at 2:1
    cctx.fillStyle = side;
    for (let i = 0; i < depth; i += 4) cctx.fillRect(b.x + b.w + i, top - Math.floor((i + 4) / 2), 4, b.h + Math.floor((i + 4) / 2));
    // roof parallelogram
    cctx.fillStyle = roof;
    for (let r = 0; r < depth / 2; r += 2) cctx.fillRect(b.x + r * 2, top - r - 2, b.w, 2);
    // front face
    cctx.fillStyle = front;
    cctx.fillRect(b.x, top, b.w, b.h);
  }
  function drawCity(time) {
    if (city.getBoundingClientRect().bottom < 0) return;
    cctx.clearRect(0, 0, city.width, city.height);
    for (const b of farBuildings) drawBlock(b, '#0f0f2c', '#0a0a20', '#1a1a42', 8);
    for (const b of buildings) {
      const top = city.height - b.h;
      drawBlock(b, b.shade, '#0e0e28', '#34347a', 16);
      // dim side windows for depth
      for (let wy = top + 12; wy < city.height - 12; wy += 16)
        if ((wy + b.x) % 48 < 16) { cctx.fillStyle = 'rgba(255,225,79,.35)'; cctx.fillRect(b.x + b.w + 6, wy - 4, 4, 5); }
      if (b.ant) {
        const ax = b.x + b.w / 2 + 4;
        cctx.fillStyle = '#2a2a66';
        cctx.fillRect(ax - 2, top - 26, 4, 22);
        cctx.fillStyle = Math.floor(time / 500) % 2 ? '#ff3b3b' : '#550000';
        cctx.fillRect(ax - 4, top - 30, 8, 6);
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

  /* ---------------- CLEAN URLS (no #hash) ---------------- */
  function scrollToId(id) {
    const el = id === 'top' ? document.body : document.getElementById(id);
    if (!el) return;
    const y = id === 'top' ? 0 : el.getBoundingClientRect().top + window.scrollY - 70;
    window.scrollTo({ top: y, behavior: 'smooth' });
  }
  $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
    e.preventDefault();
    scrollToId(a.getAttribute('href').slice(1));
  }));
  if (location.hash) {
    const id = location.hash.slice(1);
    history.replaceState(null, '', location.pathname + location.search);
    setTimeout(() => scrollToId(id), 300);
  }

  /* ---------------- PIXEL DIVIDER: SPACE INVADERS ---------------- */
  const INV_A = ['..1.....1..', '...1...1...', '..1111111..', '.11.111.11.', '11111111111', '1.1111111.1', '1.1.....1.1', '...11.11...'];
  const INV_B = ['..1.....1..', '1..1...1..1', '1.1111111.1', '111.111.111', '11111111111', '.111111111.', '..1.....1..', '.1.......1.'];
  const SHIP = ['.....1.....', '....111....', '.111111111.', '11111111111'];
  const invSprites = ['#ff4fd8', '#3ef0ff', '#6bff8f'].map(c => [INV_A, INV_B].map(m => spriteCanvas(m, { 1: c }, 4)));
  const shipSprite = spriteCanvas(SHIP, { 1: '#ffe14f' }, 4);
  const invCv = $('#invaders'), ictx = invCv.getContext('2d');
  const inv = { list: [], cols: 8, ox: 0, dir: 1, lastStep: 0, frame: 0, bullets: [], booms: [], shipX: 100, shipTarget: 100, lastShot: 0, hover: false, resetting: false };
  function resetInvaders() {
    inv.cols = clamp(Math.floor(invCv.width / 90), 4, 10);
    inv.list = [];
    for (let r = 0; r < 2; r++) for (let c = 0; c < inv.cols; c++) inv.list.push({ c, r, alive: true });
    inv.ox = 0; inv.dir = 1; inv.resetting = false;
  }
  function invPos(e) {
    const fw = inv.cols * 64, bx = (invCv.width - fw) / 2 + inv.ox;
    return { x: bx + e.c * 64, y: 12 + e.r * 44 };
  }
  function invShoot() {
    inv.bullets.push({ x: inv.shipX + 20, y: invCv.height - 24 });
    beep(1400, 0.04, 'square', 0.02);
  }
  invCv.addEventListener('mousemove', e => { inv.hover = true; inv.shipTarget = e.clientX - invCv.getBoundingClientRect().left - 22; });
  invCv.addEventListener('mouseleave', () => (inv.hover = false));
  invCv.addEventListener('click', invShoot);
  function drawInvaders(time) {
    const r = invCv.getBoundingClientRect();
    if (r.bottom < 0 || r.top > H) return;
    const cw = invCv.width, ch = invCv.height;
    ictx.clearRect(0, 0, cw, ch);
    // march
    if (time - inv.lastStep > 380) {
      inv.lastStep = time; inv.frame ^= 1;
      const limit = (cw - inv.cols * 64) / 2 - 8;
      inv.ox += inv.dir * 8;
      if (Math.abs(inv.ox) > limit) inv.dir *= -1;
    }
    const alive = inv.list.filter(e => e.alive);
    alive.forEach(e => { const p = invPos(e); ictx.drawImage(invSprites[e.r === 0 ? 0 : (e.c % 2 ? 1 : 2)][inv.frame], p.x, p.y); });
    // ship AI (or follow mouse)
    if (!inv.hover && alive.length && time - inv.lastShot > 900) {
      const t = alive[Math.floor(rand(0, alive.length))];
      inv.shipTarget = invPos(t).x;
      inv.lastShot = time;
      setTimeout(() => { if (!inv.hover) invShoot(); }, 450);
    }
    inv.shipX += clamp(inv.shipTarget - inv.shipX, -4, 4);
    ictx.drawImage(shipSprite, Math.floor(inv.shipX / 4) * 4, ch - 18);
    // bullets
    ictx.fillStyle = '#ffe14f';
    inv.bullets = inv.bullets.filter(b => b.y > -10);
    for (const b of inv.bullets) {
      b.y -= 7;
      ictx.fillRect(b.x, b.y, 4, 12);
      for (const e of alive) {
        if (!e.alive) continue;
        const p = invPos(e);
        if (b.x >= p.x && b.x <= p.x + 44 && b.y >= p.y && b.y <= p.y + 32) {
          e.alive = false; b.y = -99;
          inv.booms.push({ x: p.x + 22, y: p.y + 16, l: 14 });
          if (inv.hover) addScore(50);
        }
      }
    }
    // explosions
    inv.booms = inv.booms.filter(b => b.l > 0);
    for (const b of inv.booms) {
      b.l--;
      const s = (14 - b.l) * 2;
      ictx.fillStyle = b.l % 4 < 2 ? '#fff' : '#ff9a3c';
      [[-1, -1], [1, -1], [-1, 1], [1, 1], [0, -1.4], [0, 1.4], [-1.4, 0], [1.4, 0]].forEach(([dx, dy]) =>
        ictx.fillRect(Math.floor((b.x + dx * s) / 4) * 4, Math.floor((b.y + dy * s) / 4) * 4, 4, 4));
    }
    if (!alive.length && !inv.resetting) { inv.resetting = true; setTimeout(resetInvaders, 1200); }
  }

  /* ---------------- PIXEL DIVIDER: PAC-MAN ---------------- */
  const GHOST_TOP = ['....1111....', '..11111111..', '.1111111111.', '.1221111221.', '112311112311', '112211112211', '111111111111', '111111111111', '111111111111', '111111111111'];
  const GHOST_LEGS = ['1.11.11.11.1', '.11.11.11.11'];
  const ghostSprites = ['#ff3b3b', '#ff4fd8', '#3ef0ff', '#ff9a3c'].map(c => GHOST_LEGS.map(l => spriteCanvas([...GHOST_TOP, l], { 1: c, 2: '#fff', 3: '#2121de' }, 4)));
  const scaredSprites = GHOST_LEGS.map(l => spriteCanvas([...GHOST_TOP, l], { 1: '#2121de', 2: '#ffb8ae', 3: '#ffb8ae' }, 4));
  const pacCv = $('#pacman'), pctx = pacCv.getContext('2d');
  const pac = { x: -60, dots: [], scared: 0 };
  function resetPac() {
    pac.x = -60; pac.dots = [];
    for (let x = 48; x < pacCv.width - 20; x += 32) pac.dots.push({ x, eaten: false, big: false });
    if (pac.dots.length > 6) pac.dots[Math.floor(rand(4, pac.dots.length - 1))].big = true;
  }
  function drawPac(time) {
    const r = pacCv.getBoundingClientRect();
    if (r.bottom < 0 || r.top > H) return;
    const cw = pacCv.width, mid = pacCv.height / 2;
    pctx.clearRect(0, 0, cw, pacCv.height);
    pac.x += 2.4;
    if (pac.scared > 0) pac.scared--;
    // dots
    for (const d of pac.dots) {
      if (!d.eaten && pac.x >= d.x) {
        d.eaten = true;
        if (d.big) { pac.scared = 320; if (audio) beep(200, 0.25, 'triangle', 0.05); }
      }
      if (d.eaten) continue;
      pctx.fillStyle = '#ffd7a8';
      if (d.big) { if (Math.floor(time / 250) % 2) pctx.fillRect(d.x - 8, mid - 8, 16, 16); }
      else pctx.fillRect(d.x - 4, mid - 4, 8, 8);
    }
    // pac-man
    const R = 24, mouth = [0.05, 0.35, 0.7, 0.35][Math.floor(time / 70) % 4];
    pctx.fillStyle = '#ffe14f';
    for (let y = -R; y < R; y += 4)
      for (let x = -R; x < R; x += 4) {
        const cx = x + 2, cy = y + 2;
        if (cx * cx + cy * cy > R * R) continue;
        if (Math.abs(Math.atan2(cy, cx)) < mouth && cx > 0) continue;
        pctx.fillRect(Math.floor(pac.x) + x, mid + y, 4, 4);
      }
    // ghosts chase (or fall behind when scared)
    for (let i = 0; i < 4; i++) {
      const gap = pac.scared ? 120 + i * 70 : 90 + i * 62;
      const gx = Math.floor((pac.x - gap) / 4) * 4;
      const f = Math.floor(time / 150) % 2;
      const spr = pac.scared && (pac.scared > 80 || Math.floor(time / 150) % 2) ? scaredSprites[f] : ghostSprites[i][f];
      pctx.drawImage(spr, gx - 24, mid - 22 + (Math.floor(time / 150 + i) % 2) * 4);
    }
    if (pac.x > cw + 400) resetPac();
  }

  /* ---------------- FOOTER CAT ---------------- */
  const CAT_TOP = ['1.1.........', '111.......1.', '212.......1.', '1111111111..', '.111111111..', '.111111111..'];
  const CAT_LEGS = [['.1.1....1.1.', '.1.1....1.1.'], ['..1.1..1.1..', '.1...1..1..1']];
  const catSprites = CAT_LEGS.map(l => spriteCanvas([...CAT_TOP, ...l], { 1: '#ff9a3c', 2: '#6bff8f' }, 4));
  const catCv = $('#cat'), catCtx = catCv.getContext('2d');
  catCv.width = catSprites[0].width; catCv.height = catSprites[0].height;
  const cat = { x: 40, dir: 1, pause: 0 };
  catCv.addEventListener('click', e => { e.stopPropagation(); burst(e.clientX, e.clientY, 16, 'MEOW!'); beep(1200, 0.06, 'triangle'); setTimeout(() => beep(900, 0.1, 'triangle'), 70); addScore(9); cat.pause = 60; });
  function drawCat(time) {
    const fw = catCv.parentElement.clientWidth;
    if (cat.pause > 0) cat.pause--;
    else {
      cat.x += cat.dir * 1.2;
      if (cat.x > fw - 60 || cat.x < 10) cat.dir *= -1;
      if (Math.random() < 0.002) cat.pause = 120;
    }
    catCtx.clearRect(0, 0, catCv.width, catCv.height);
    catCtx.drawImage(catSprites[cat.pause ? 0 : Math.floor(time / 160) % 2], 0, 0);
    catCv.style.transform = `translateX(${Math.floor(cat.x)}px) scaleX(${cat.dir > 0 ? -1 : 1})`;
  }

  /* ---------------- 2.5D ISOMETRIC "OMI CORE" DIORAMA ---------------- */
  const isoCv = $('#omiCore'), ix = isoCv.getContext('2d');
  const IW = 280, IH = 184, OX = 140, OY = 64;
  isoCv.width = IW; isoCv.height = IH;
  const P = (x, y, z) => [OX + (x - y), OY + (x + y) / 2 - z];

  // pixel-perfect convex polygon fill (no anti-aliasing)
  function fillPoly(pts, col) {
    ix.fillStyle = col;
    let minY = Infinity, maxY = -Infinity;
    for (const p of pts) { minY = Math.min(minY, p[1]); maxY = Math.max(maxY, p[1]); }
    for (let y = Math.ceil(minY); y <= Math.floor(maxY); y++) {
      let lo = Infinity, hi = -Infinity;
      for (let i = 0; i < pts.length; i++) {
        const a = pts[i], b = pts[(i + 1) % pts.length];
        if (y < Math.min(a[1], b[1]) || y > Math.max(a[1], b[1])) continue;
        if (a[1] === b[1]) { lo = Math.min(lo, a[0], b[0]); hi = Math.max(hi, a[0], b[0]); continue; }
        const x = a[0] + ((y - a[1]) * (b[0] - a[0])) / (b[1] - a[1]);
        lo = Math.min(lo, x); hi = Math.max(hi, x);
      }
      if (lo <= hi) ix.fillRect(Math.round(lo), y, Math.round(hi) - Math.round(lo) + 1, 1);
    }
  }
  function isoBox(x, y, z, w, d, h, c) {
    fillPoly([P(x, y + d, z + h), P(x + w, y + d, z + h), P(x + w, y + d, z), P(x, y + d, z)], c[1]);
    fillPoly([P(x + w, y, z + h), P(x + w, y + d, z + h), P(x + w, y + d, z), P(x + w, y, z)], c[2]);
    fillPoly([P(x, y, z + h), P(x + w, y, z + h), P(x + w, y + d, z + h), P(x, y + d, z + h)], c[0]);
  }
  function isoPx(x, y, z, col, w = 1) { const [sx, sy] = P(x, y, z); ix.fillStyle = col; ix.fillRect(Math.round(sx), Math.round(sy), w, 1); }
  function isoLine(x1, y1, x2, y2, z, col) {
    const n = Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1)) * 2;
    for (let i = 0; i <= n; i++) isoPx(x1 + ((x2 - x1) * i) / n, y1 + ((y2 - y1) * i) / n, z, col);
  }

  const TOWER_C = ['#3a3a8a', '#24245c', '#18183e'];
  const towers = [
    { x: 6, y: 6, h: 38 }, { x: 78, y: 6, h: 28 }, { x: 6, y: 78, h: 28 }, { x: 78, y: 78, h: 44 },
  ];
  const traces = [
    [[14, 22], [14, 50], [35, 50]], [[86, 22], [86, 40], [65, 40]],
    [[22, 86], [50, 86], [50, 65]], [[78, 86], [60, 86], [60, 65]],
  ];
  function pathPoint(path, t) {
    const segs = [];
    let total = 0;
    for (let i = 0; i < path.length - 1; i++) { const l = Math.hypot(path[i + 1][0] - path[i][0], path[i + 1][1] - path[i][1]); segs.push(l); total += l; }
    let d = t * total;
    for (let i = 0; i < segs.length; i++) {
      if (d <= segs[i]) { const k = d / segs[i]; return [path[i][0] + (path[i + 1][0] - path[i][0]) * k, path[i][1] + (path[i + 1][1] - path[i][1]) * k]; }
      d -= segs[i];
    }
    return path[path.length - 1];
  }
  const chipLogo = logoPixels(22, 11);
  const miniRobot = [LEGS_A, LEGS_B].map(l => spriteCanvas(robotMap(l, false), ROBOT_PAL, 1));
  const robotLoop = [[26, 26], [74, 26], [74, 74], [26, 74], [26, 26]];

  function drawTower(t, time) {
    isoBox(t.x, t.y, 8, 16, 16, t.h, TOWER_C);
    // rack seams
    for (let z = 14; z < 8 + t.h; z += 6) { isoLine(t.x, t.y + 16, t.x + 16, t.y + 16, z, '#18183e'); isoLine(t.x + 16, t.y, t.x + 16, t.y + 16, z, '#101030'); }
    // blinking LEDs
    for (let k = 0; k < Math.floor((t.h - 6) / 6); k++)
      for (let j = 0; j < 3; j++) {
        const on = (k * 7 + j * 13 + Math.floor(time / 140) + t.x) % 6;
        isoPx(t.x + 3 + j * 5, t.y + 16, 11 + k * 6, on === 0 ? '#ff4fd8' : on < 3 ? '#6bff8f' : '#1f5a35', 2);
        isoPx(t.x + 16, t.y + 3 + j * 5, 11 + k * 6, on === 1 ? '#3ef0ff' : on < 4 ? '#6bff8f' : '#1f5a35', 2);
      }
    // roof antenna light
    isoPx(t.x + 8, t.y + 8, 8 + t.h + 2, Math.floor(time / 400 + t.x) % 2 ? '#ff3b3b' : '#550000', 2);
  }

  function drawChip(time) {
    isoBox(34, 34, 8, 32, 32, 7, ['#14142e', '#0a0a1c', '#06060f']);
    for (let i = 0; i < 6; i++) {
      isoBox(37 + i * 5, 66, 8, 2, 3, 3, ['#cfd6ff', '#8d8db8', '#6a6a90']);
      isoBox(66, 37 + i * 5, 8, 3, 2, 3, ['#cfd6ff', '#8d8db8', '#6a6a90']);
    }
    const glow = Math.floor(time / 300) % 2 ? '#ff4fd8' : '#c2189a';
    isoLine(37, 37, 63, 37, 15, glow); isoLine(63, 37, 63, 63, 15, glow);
    isoLine(63, 63, 37, 63, 15, glow); isoLine(37, 63, 37, 37, 15, glow);
    const pulse = Math.sin(time * 0.004);
    for (const [lx, ly] of chipLogo) {
      const w = Math.sin(lx * 0.5 - time * 0.006);
      fillPoly([P(39 + lx, 44 + ly, 15), P(40 + lx, 44 + ly, 15), P(40 + lx, 45 + ly, 15), P(39 + lx, 45 + ly, 15)], w > 0.7 ? '#3ef0ff' : pulse > 0.6 ? '#ffffff' : '#e6e2ff');
    }
  }

  function drawHologram(time) {
    const zc = 46 + Math.sin(time * 0.003) * 3, r = 9, a = time * 0.0015;
    // beam
    for (let z = 16; z < zc - 12; z += 2) if (Math.random() < 0.8) isoPx(50 + (Math.random() < 0.2 ? rand(-2, 2) : 0), 50, z, z % 4 ? '#3ef0ff' : '#bff9ff');
    const eq = [0, 1, 2, 3].map(k => [50 + Math.cos(a + (k * Math.PI) / 2) * r, 50 + Math.sin(a + (k * Math.PI) / 2) * r, zc]);
    const tris = [];
    for (let k = 0; k < 4; k++) {
      const p1 = eq[k], p2 = eq[(k + 1) % 4];
      const depth = (p1[0] + p1[1] + p2[0] + p2[1]) / 2;
      tris.push({ pts: [[50, 50, zc + 13], p1, p2], depth, col: k % 2 ? '#bff9ff' : '#3ef0ff' });
      tris.push({ pts: [[50, 50, zc - 13], p1, p2], depth: depth - 0.1, col: k % 2 ? '#1a9fb5' : '#0f6f80' });
    }
    tris.sort((u, v) => u.depth - v.depth).forEach(t => fillPoly(t.pts.map(q => P(q[0], q[1], q[2])), t.col));
    // orbiting sparkles
    for (let i = 0; i < 6; i++) {
      const b = a * 2 + (i * Math.PI) / 3;
      isoPx(50 + Math.cos(b) * 16, 50 + Math.sin(b) * 16, zc + Math.sin(b * 2) * 6, i % 2 ? '#ffe14f' : '#ff4fd8', 2);
    }
  }

  function drawIso(time) {
    const r = isoCv.getBoundingClientRect();
    if (r.bottom < 0 || r.top > H) return;
    ix.clearRect(0, 0, IW, IH);
    // ground shadow
    fillPoly([P(-6, -6, -6), P(106, -6, -6), P(106, 106, -6), P(-6, 106, -6)], 'rgba(0,0,0,.35)');
    // platform
    isoBox(0, 0, 0, 100, 100, 8, ['#1c1c48', '#121236', '#0b0b26']);
    for (let i = 10; i < 100; i += 10) { isoLine(i, 0, i, 100, 8, '#26265a'); isoLine(0, i, 100, i, 8, '#26265a'); }
    isoLine(0, 100, 100, 100, 8, '#ff4fd8'); isoLine(100, 0, 100, 100, 8, '#ff4fd8');
    isoLine(0, 100, 100, 100, 0, '#3ef0ff'); isoLine(100, 0, 100, 100, 0, '#3ef0ff');
    // circuit traces
    traces.forEach(tr => { for (let i = 0; i < tr.length - 1; i++) isoLine(tr[i][0], tr[i][1], tr[i + 1][0], tr[i + 1][1], 8, '#2f5f8f'); });

    // painter's algorithm: sort everything by depth (x + y)
    const items = [];
    towers.forEach(t => items.push({ d: t.x + t.y + 16, f: () => drawTower(t, time) }));
    items.push({ d: 100, f: () => drawChip(time) });
    items.push({ d: 100.5, f: () => drawHologram(time) });
    traces.forEach((tr, i) => {
      for (let k = 0; k < 2; k++) {
        const t = ((time * 0.00035) + i * 0.27 + k * 0.5) % 1;
        const [qx, qy] = pathPoint(tr, t);
        const c = (i + k) % 2 ? ['#ffe14f', '#c98a00', '#8a5e00'] : ['#bff9ff', '#3ef0ff', '#1a9fb5'];
        items.push({ d: qx + qy, f: () => isoBox(qx - 1.5, qy - 1.5, 8, 3, 3, 3, c) });
      }
    });
    const rt = (time * 0.00008) % 1, [rx, ry] = pathPoint(robotLoop, rt);
    items.push({ d: rx + ry, f: () => { const [sx, sy] = P(rx, ry, 8); ix.drawImage(miniRobot[Math.floor(time / 200) % 2], Math.round(sx - 6), Math.round(sy - 14)); } });
    items.sort((a, b) => a.d - b.d).forEach(it => it.f());
  }

  /* ---------------- 3D TILT (cards + diorama) ---------------- */
  const canHover = window.matchMedia('(hover: hover)').matches;
  function tilt(el, max, inner) {
    el.addEventListener('pointermove', e => {
      if (e.pointerType !== 'mouse') return;
      const r = el.getBoundingClientRect();
      const nx = (e.clientX - r.left) / r.width - 0.5, ny = (e.clientY - r.top) / r.height - 0.5;
      const step = v => Math.round(v / 2) * 2; // stepped rotation = retro feel
      el.style.setProperty('--rx', step(-ny * max) + 'deg');
      el.style.setProperty('--ry', step(nx * max) + 'deg');
      el.classList.add('tilt');
    });
    el.addEventListener('pointerleave', () => { el.classList.remove('tilt'); el.style.setProperty('--rx', '0deg'); el.style.setProperty('--ry', '0deg'); });
  }
  if (canHover && !reduceMotion) {
    $$('.card').forEach(c => tilt(c, 14));
    tilt($('.iso-wrap'), 18);
  }

  /* ---------------- TOUCH SUPPORT ---------------- */
  window.addEventListener('touchmove', e => { const t = e.touches[0]; if (t) { mouse.x = t.clientX; mouse.y = t.clientY; } }, { passive: true });
  window.addEventListener('touchstart', e => { const t = e.touches[0]; if (t) { mouse.x = t.clientX; mouse.y = t.clientY; } }, { passive: true });
  window.addEventListener('touchend', () => setTimeout(() => { mouse.x = -999; mouse.y = -999; }, 300), { passive: true });
  invCv.addEventListener('touchstart', e => {
    const t = e.touches[0];
    inv.hover = true;
    inv.shipTarget = t.clientX - invCv.getBoundingClientRect().left - 22;
    setTimeout(invShoot, 120);
    clearTimeout(inv.touchT); inv.touchT = setTimeout(() => (inv.hover = false), 2500);
  }, { passive: true });

  /* ---------------- MOBILE MENU UX ---------------- */
  const burger = $('#burger'), linksEl = $('#links');
  const syncBurger = () => { burger.classList.toggle('open', linksEl.classList.contains('open')); burger.setAttribute('aria-expanded', linksEl.classList.contains('open')); };
  burger.addEventListener('click', () => setTimeout(syncBurger));
  linksEl.addEventListener('click', () => setTimeout(syncBurger));
  document.addEventListener('click', e => {
    if (linksEl.classList.contains('open') && !e.target.closest('#links, #burger')) { linksEl.classList.remove('open'); syncBurger(); }
  });
  window.addEventListener('keydown', e => { if (e.key === 'Escape') { linksEl.classList.remove('open'); syncBurger(); } });

  /* ---------------- PLANET SPM: ROTATING PIXEL VENUS ---------------- */
  const venusCv = $('#venus'), vctx = venusCv.getContext('2d');
  const VS = 96, VR = 34, VC = VS / 2;
  venusCv.width = VS; venusCv.height = VS;
  const vImg = vctx.createImageData(VS, VS), v32 = new Uint32Array(vImg.data.buffer);
  const hexToABGR = h => { const n = parseInt(h.slice(1), 16); return (255 << 24) | ((n & 255) << 16) | (((n >> 8) & 255) << 8) | (n >> 16); };
  const VPAL = [
    ['#3a1206', '#5a1e08', '#6e2508', '#7a2e0a', '#5a1e08', '#4a1606'],   // night side
    ['#7a2e0a', '#a8420f', '#c25e18', '#d87a24', '#b54a12', '#94360d'],   // mid
    ['#c25e18', '#e88324', '#f5a640', '#ffd27a', '#f09636', '#d8691a'],   // lit side
  ].map(r => r.map(hexToABGR));
  const ATMO = [hexToABGR('#ff9a3c'), hexToABGR('#c2410c')];
  let vMeteors = [];
  function drawVenus(time) {
    const r = venusCv.getBoundingClientRect();
    if (r.bottom < 0 || r.top > H) return;
    v32.fill(0);
    const rot = time * 0.00035;
    for (let y = 0; y < VS; y++) for (let x = 0; x < VS; x++) {
      const dx = (x + 0.5 - VC) / VR, dy = (y + 0.5 - VC) / VR, d2 = dx * dx + dy * dy;
      if (d2 > 1) {
        // dithered atmosphere halo, brighter on the lit (right) side
        const d = Math.sqrt(d2);
        if (d < 1.1 && (x + y) % 2 === 0 && dx > -0.4) v32[y * VS + x] = ATMO[0];
        else if (d < 1.18 && (x + y) % 4 === 0 && dx > 0) v32[y * VS + x] = ATMO[1];
        continue;
      }
      const dz = Math.sqrt(1 - d2);
      const lon = Math.atan2(dx, dz) + rot, lat = Math.asin(dy);
      const v = lat * 4.2 + Math.sin(lon * 2 + lat * 3) * 0.7 + Math.sin(lon * 5 - time * 0.0006 + lat * 8) * 0.25;
      const band = ((Math.floor(v * 1.6) % 6) + 6) % 6;
      const light = dx * 0.62 - dy * 0.38 + dz * 0.68;
      let tier = light > 0.45 ? 2 : light > 0.05 ? 1 : 0;
      if (Math.abs(light - 0.45) < 0.06 || Math.abs(light - 0.05) < 0.06) tier = (x + y) % 2 ? tier : Math.max(0, tier - 1); // dithered terminator
      v32[y * VS + x] = VPAL[tier][band];
    }
    vctx.putImageData(vImg, 0, 0);
    // meteors streaking past the planet
    if (!reduceMotion && Math.random() < 0.02 && vMeteors.length < 3) vMeteors.push({ x: rand(40, 110), y: -4, vx: rand(-1.4, -0.8), vy: rand(0.8, 1.3), tr: [] });
    vMeteors = vMeteors.filter(m => m.y < VS + 6 && m.x > -6);
    for (const m of vMeteors) {
      m.tr.push([m.x, m.y]); if (m.tr.length > 8) m.tr.shift();
      m.x += m.vx; m.y += m.vy;
      m.tr.forEach(([x, y], i) => { vctx.fillStyle = i > 5 ? '#fff2b0' : i > 2 ? '#ff9a3c' : '#c2300a'; vctx.fillRect(Math.round(x), Math.round(y), 1, 1); });
      vctx.fillStyle = '#fff'; vctx.fillRect(Math.round(m.x), Math.round(m.y), 1, 1);
    }
  }

  /* ---------------- WARP TO PLANET SPM ---------------- */
  const SPM_URL = location.protocol === 'file:' ? 'spm/index.html' : 'spm/';
  const warpCv = document.createElement('canvas');
  warpCv.id = 'warpMain'; document.body.appendChild(warpCv);
  const wmctx = warpCv.getContext('2d');
  let warpBlocks = null, warpTo = null;
  $$('[data-warp]').forEach(a => {
    a.setAttribute('href', SPM_URL);
    a.addEventListener('click', e => {
      if (reduceMotion || e.metaKey || e.ctrlKey || e.shiftKey) return;
      e.preventDefault(); e.stopPropagation();
      warpCv.width = window.innerWidth; warpCv.height = window.innerHeight;
      const s = window.innerWidth < 600 ? 20 : 28, cols = ['#ff6a00', '#ffb000', '#ff3b1a', '#c2410c', '#1a0603'];
      warpBlocks = [];
      for (let y = 0; y < warpCv.height; y += s) for (let x = 0; x < warpCv.width; x += s) warpBlocks.push({ x, y, s, c: cols[Math.floor(Math.random() * cols.length)], on: false });
      warpBlocks.sort(() => Math.random() - 0.5);
      warpTo = SPM_URL;
      rumbleWarp();
    });
  });
  function rumbleWarp() { beep(110, 0.3, 'sawtooth', 0.05); setTimeout(() => beep(70, 0.4, 'triangle', 0.06), 120); }
  function drawWarpMain() {
    if (!warpBlocks) return;
    const n = Math.ceil(warpBlocks.length / 26);
    let changed = 0;
    for (const b of warpBlocks) { if (changed >= n) break; if (!b.on) { b.on = true; changed++; } }
    wmctx.clearRect(0, 0, warpCv.width, warpCv.height);
    for (const b of warpBlocks) if (b.on) { wmctx.fillStyle = b.c; wmctx.fillRect(b.x, b.y, b.s, b.s); }
    if (!changed && warpTo) { const to = warpTo; warpTo = null; location.href = to; }
  }
  // coming back with the browser back button: clear the overlay
  window.addEventListener('pageshow', e => { if (e.persisted) { warpBlocks = null; wmctx.clearRect(0, 0, warpCv.width, warpCv.height); } });

  /* ---------------- MAIN LOOP ---------------- */
  let lastW = 0, lastH = 0;
  function resizeAll(force) {
    const w = window.innerWidth, h = window.innerHeight;
    // mobile address bar show/hide only changes height slightly → cheap update, no rebuild
    const minor = !force && w === lastW && Math.abs(h - lastH) < 160;
    lastW = w; lastH = h;
    if (minor) {
      H = bg.height = fx.height = h;
      return;
    }
    resizeBg(); buildCity();
    invCv.width = invCv.clientWidth; invCv.height = invCv.clientHeight || 170; resetInvaders();
    pacCv.width = pacCv.clientWidth; pacCv.height = 96; resetPac();
    if (heroStarted) {
      const old = S; sizeHero(); setLogoTargets(S / old);
    }
  }
  let resizeT;
  window.addEventListener('resize', () => { clearTimeout(resizeT); resizeT = setTimeout(() => resizeAll(false), 120); });
  window.addEventListener('orientationchange', () => setTimeout(() => resizeAll(true), 300));
  resizeAll(true);
  onScroll();

  function loop(t) {
    drawBg(t);
    drawHero(t);
    drawCity(t);
    drawRobots(t);
    drawIso(t);
    drawInvaders(t);
    drawPac(t);
    drawCat(t);
    drawVenus(t);
    drawFx();
    drawWarpMain();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
