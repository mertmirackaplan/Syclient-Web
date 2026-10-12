/* =========================================================
   SYCLIENT — PLANET SPM (Venus world)
   Low-res pixel buffer upscaled to screen: sulfuric cloud decks,
   lightning, meteors, erupting 2.5D volcanoes, lava cracks, heat haze.
   ========================================================= */
(() => {
  'use strict';

  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const rand = (a, b) => Math.random() * (b - a) + a;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isFile = location.protocol === 'file:';
  const HOME = isFile ? '../index.html' : '../';
  const REPO = 'https://github.com/Syclient/SPM-350M';

  /* ---------------- SOUND (after first user gesture) ---------------- */
  let audio;
  function beep(freq = 440, dur = 0.1, type = 'square', vol = 0.04) {
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
  const rumble = () => { beep(70, 0.35, 'sawtooth', 0.05); setTimeout(() => beep(45, 0.4, 'triangle', 0.06), 60); };

  /* ---------------- TOAST ---------------- */
  let toastT;
  function toast(t) {
    const el = $('#toast');
    el.textContent = t; el.classList.add('show');
    clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove('show'), 2400);
  }

  /* ---------------- LOGO ---------------- */
  function logoPixels(w, h) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const x = c.getContext('2d');
    const r = h * 0.3, cy = h / 2, d = r * 1.45, lx = w / 2 - d, rx = w / 2 + d;
    x.strokeStyle = '#fff'; x.lineWidth = h * 0.19;
    x.beginPath();
    x.arc(lx, cy, r, -Math.PI * 0.22, Math.PI * 0.25, true);
    x.lineTo(rx + r * Math.cos(-Math.PI * 0.75), cy + r * Math.sin(-Math.PI * 0.75));
    x.arc(rx, cy, r, -Math.PI * 0.75, Math.PI * 0.78, false);
    x.stroke();
    const data = x.getImageData(0, 0, w, h).data, pts = [];
    for (let yy = 0; yy < h; yy++) for (let xx = 0; xx < w; xx++) if (data[(yy * w + xx) * 4 + 3] > 110) pts.push([xx, yy]);
    return pts;
  }
  (function navLogo() {
    const cv = $('#navLogo'), s = 3, pts = logoPixels(24, 12);
    cv.width = 25 * s; cv.height = 13 * s;
    const c = cv.getContext('2d');
    c.fillStyle = '#ff6a00'; pts.forEach(([x, y]) => c.fillRect((x + 1) * s, (y + 1) * s, s, s));
    c.fillStyle = '#fff1d6'; pts.forEach(([x, y]) => c.fillRect(x * s, y * s, s, s));
  })();

  /* ---------------- WARP TRANSITIONS ---------------- */
  const warp = $('#warp'), wctx = warp.getContext('2d');
  let warpBlocks = [], warpMode = null, warpHref = null;
  function setupWarp(filled, colors) {
    warp.width = window.innerWidth; warp.height = window.innerHeight;
    const s = window.innerWidth < 600 ? 20 : 28;
    warpBlocks = [];
    for (let y = 0; y < warp.height; y += s) for (let x = 0; x < warp.width; x += s)
      warpBlocks.push({ x, y, s, on: filled, c: colors[Math.floor(Math.random() * colors.length)] });
    warpBlocks.sort(() => Math.random() - 0.5);
  }
  function drawWarp() {
    if (!warpMode) return;
    const n = Math.ceil(warpBlocks.length / 28);
    let changed = 0;
    for (const b of warpBlocks) {
      if (changed >= n) break;
      if (warpMode === 'in' && b.on) { b.on = false; changed++; }
      if (warpMode === 'out' && !b.on) { b.on = true; changed++; }
    }
    wctx.clearRect(0, 0, warp.width, warp.height);
    for (const b of warpBlocks) if (b.on) { wctx.fillStyle = b.c; wctx.fillRect(b.x, b.y, b.s, b.s); }
    if (!changed) {
      if (warpMode === 'out' && warpHref) location.href = warpHref;
      warpMode = null;
      if (!warpHref) wctx.clearRect(0, 0, warp.width, warp.height);
    }
  }
  if (!reduceMotion) { setupWarp(true, ['#ff6a00', '#ffb000', '#ff3b1a', '#c2410c']); warpMode = 'in'; }
  $$('[data-home]').forEach(a => {
    a.setAttribute('href', HOME);
    a.addEventListener('click', e => {
      if (reduceMotion || e.metaKey || e.ctrlKey) return;
      e.preventDefault();
      setupWarp(false, ['#ff4fd8', '#3ef0ff', '#0a0a18', '#a56bff']);
      warpMode = 'out'; warpHref = HOME;
      beep(880, 0.08); setTimeout(() => beep(1320, 0.12), 80);
    });
  });

  /* ---------------- WORLD ---------------- */
  const cv = $('#world'), ctx = cv.getContext('2d');
  const buf = document.createElement('canvas'), b = buf.getContext('2d');
  const sky = document.createElement('canvas'), sctx = sky.getContext('2d');
  let W = 0, H = 0, PX = 4, BW = 0, BH = 0, hz = 0, skyHz = -1;

  function makeNoise(seedFreqs) {
    const n = new Float32Array(1024), ph = seedFreqs.map(() => rand(0, Math.PI * 2));
    let max = 0;
    for (let i = 0; i < 1024; i++) {
      let v = 0;
      seedFreqs.forEach((f, k) => { v += Math.sin((i * f * Math.PI * 2) / 1024 + ph[k]) / (k + 1); });
      n[i] = v; max = Math.max(max, Math.abs(v));
    }
    for (let i = 0; i < 1024; i++) n[i] /= max;
    return n;
  }
  const NZ = [makeNoise([3, 7, 13, 29]), makeNoise([2, 5, 17, 37]), makeNoise([4, 9, 21, 43]), makeNoise([2, 6, 11, 31]), makeNoise([5, 12, 27, 53])];
  const nz = (k, x) => NZ[k][(Math.floor(x) % 1024 + 1024) % 1024];

  const SKY = ['#1a0603', '#2a0a04', '#3e1206', '#561a07', '#73260a', '#94360d', '#b54a12', '#d16418', '#e88324', '#f5a640'];
  const CLOUDS = [
    { y: 0.10, th: 10, sp: 0.05, par: 0.010, n: 0, cols: ['#3a1206', '#5a1e08', '#7a2e0c'] },
    { y: 0.26, th: 13, sp: 0.09, par: 0.022, n: 1, cols: ['#6a2608', '#984010', '#c25e18'] },
    { y: 0.46, th: 10, sp: 0.15, par: 0.040, n: 2, cols: ['#a24a12', '#d0701e', '#f09636'] },
  ];
  let volcanoes = [], cracks = [], rocks = [], ash = [];
  let parts = [], meteors = [], rings = [], craters = [], bolt = null, flash = 0, shake = 0, nextMeteor = 60;

  function buildWorld() {
    const vh = BH * 0.66;
    volcanoes = [
      { fx: 0.17, fh: 0.20, timer: 80 }, { fx: 0.58, fh: 0.28, timer: 260 }, { fx: 0.89, fh: 0.16, timer: 460 },
    ].map(v => {
      const h = Math.round(v.fh * vh), bw = Math.round(h * 1.25);
      const streams = [];
      for (let s = 0; s < 3; s++) {
        const pts = []; let dx = rand(-2, 2);
        for (let r = 2; r < h * rand(0.6, 0.95); r++) {
          dx += [-1, 0, 0, 1][Math.floor(Math.random() * 4)] * 0.6;
          const half = 3 + (bw - 3) * (r / h);
          dx = clamp(dx, -half * 0.75, half * 0.75);
          pts.push([Math.round(dx), r]);
        }
        streams.push(pts);
      }
      return { ...v, h, bw, streams, erupt: 0 };
    });
    cracks = Array.from({ length: 7 }, () => {
      const pts = []; let x = rand(-20, BW), d = rand(0.08, 0.95);
      const len = rand(40, 140);
      for (let i = 0; i < len; i++) { x += 1; d = clamp(d + rand(-0.012, 0.012), 0.04, 0.98); pts.push([Math.round(x), d]); }
      return pts;
    });
    rocks = Array.from({ length: Math.floor(BW / 10) }, () => ({ x: Math.round(rand(0, BW)), d: rand(0.05, 1), s: Math.random() < 0.3 ? 3 : 2 }));
    ash = Array.from({ length: Math.floor(BW * 0.45) }, () => ({ x: rand(0, BW), y: rand(0, BH), vx: rand(-0.35, -0.1), vy: rand(0.15, 0.5), c: Math.random() < 0.3 ? '#ffd27a' : '#e09a4a' }));
  }

  function resize() {
    W = window.innerWidth; H = window.innerHeight;
    PX = W < 600 ? 3 : W > 2200 ? 5 : 4;
    BW = Math.ceil(W / PX); BH = Math.ceil(H / PX);
    buf.width = BW; buf.height = BH; sky.width = BW; sky.height = BH;
    cv.width = W; cv.height = H;
    ctx.imageSmoothingEnabled = false;
    skyHz = -1;
    buildWorld();
  }

  function renderSky() {
    sctx.clearRect(0, 0, BW, BH);
    const bh = hz / SKY.length;
    for (let i = 0; i < SKY.length; i++) {
      const y0 = Math.floor(i * bh), y1 = Math.floor((i + 1) * bh);
      sctx.fillStyle = SKY[i]; sctx.fillRect(0, y0, BW, y1 - y0 + 1);
      if (i < SKY.length - 1) { // dithered transition
        sctx.fillStyle = SKY[i + 1];
        for (let y = y1 - 2; y < y1; y++) for (let x = (y % 2); x < BW; x += 2) sctx.fillRect(x, y, 1, 1);
      }
    }
    // hazy sun behind the cloud deck
    const sx = Math.round(BW * 0.74), sy = Math.round(hz * 0.3);
    for (let y = -24; y <= 24; y++) for (let x = -24; x <= 24; x++) {
      const d = Math.sqrt(x * x + y * y);
      if (d < 9) sctx.fillStyle = '#fff2cc';
      else if (d < 13) sctx.fillStyle = '#ffe0a0';
      else if (d < 18 && (x + y) % 2 === 0) sctx.fillStyle = '#f7b85a';
      else if (d < 24 && (x + y) % 4 === 0) sctx.fillStyle = '#e88a34';
      else continue;
      sctx.fillRect(sx + x, sy + y, 1, 1);
    }
    skyHz = hz;
  }

  function drawClouds(t, sy) {
    for (let li = 0; li < CLOUDS.length; li++) {
      const L = CLOUDS[li];
      const yb = hz * L.y, off = t * L.sp * 0.06 + sy * L.par;
      for (let x = 0; x < BW; x++) {
        const top = Math.round(yb + nz(L.n, x + off) * L.th * 0.8 - L.th * 0.3);
        const bot = Math.round(yb + L.th + nz((L.n + 3) % 5, x * 1.3 + off) * L.th * 0.6);
        if (bot <= top) continue;
        b.fillStyle = L.cols[1]; b.fillRect(x, top, 1, bot - top);
        b.fillStyle = L.cols[2]; b.fillRect(x, top, 1, 1);
        b.fillStyle = L.cols[0]; b.fillRect(x, bot - 2, 1, 2);
      }
    }
  }

  function drawLightning() {
    if (!bolt && !reduceMotion && Math.random() < 0.004) {
      const L = CLOUDS[1 + Math.floor(Math.random() * 2)];
      let x = rand(BW * 0.05, BW * 0.95), y = hz * L.y + L.th;
      const toGround = Math.random() < 0.35, end = toGround ? hz + rand(2, 12) : y + rand(10, 26);
      const pts = [[x, y]];
      while (y < end) { y += rand(2, 5); x += rand(-4, 4); pts.push([x, Math.min(y, end)]); }
      bolt = { pts, life: 8 }; flash = 6;
      if (audio) setTimeout(() => beep(55, 0.5, 'sawtooth', 0.04), 120);
    }
    if (!bolt) return;
    bolt.life--;
    if (bolt.life % 3 !== 2) {
      for (let i = 0; i < bolt.pts.length - 1; i++) {
        const [x1, y1] = bolt.pts[i], [x2, y2] = bolt.pts[i + 1];
        const n = Math.max(1, Math.ceil(Math.hypot(x2 - x1, y2 - y1)));
        for (let k = 0; k <= n; k++) {
          const px = Math.round(x1 + ((x2 - x1) * k) / n), py = Math.round(y1 + ((y2 - y1) * k) / n);
          b.fillStyle = '#ffd27a'; b.fillRect(px - 1, py, 3, 1);
          b.fillStyle = '#fffbe8'; b.fillRect(px, py, 1, 1);
        }
      }
    }
    if (bolt.life <= 0) bolt = null;
  }

  function drawRidges(sy) {
    for (let x = 0; x < BW; x++) {
      const y1 = Math.round(hz - 16 - (nz(3, x * 0.7 + sy * 0.004) * 0.5 + 0.5) * 16);
      b.fillStyle = '#3a1408'; b.fillRect(x, y1, 1, hz - y1 + 1);
      b.fillStyle = '#5a220c'; b.fillRect(x, y1, 1, 1);
    }
    for (let x = 0; x < BW; x++) {
      const y2 = Math.round(hz - 5 - (nz(4, x * 1.1 + sy * 0.008) * 0.5 + 0.5) * 8);
      b.fillStyle = '#260b05'; b.fillRect(x, y2, 1, hz - y2 + 1);
    }
  }

  function drawVolcano(v, t) {
    const vx = Math.round(BW * v.fx), top = hz - v.h;
    // 2.5D cone: shaded left flank, sun-lit right flank, ridge stripes
    for (let r = 0; r <= v.h; r++) {
      const half = Math.round(3 + (v.bw - 3) * (r / v.h)), y = top + r;
      const split = Math.round(half * 0.2);
      b.fillStyle = r % 6 === 0 ? '#1e0804' : '#2a0c05'; b.fillRect(vx - half, y, half + split, 1);
      b.fillStyle = r % 6 === 0 ? '#3a1408' : '#4e1c0a'; b.fillRect(vx + split, y, half - split, 1);
      b.fillStyle = '#6a2a10'; b.fillRect(vx + half - 1, y, 1, 1); // rim light
    }
    // crater glow
    const hot = Math.floor(t / 180) % 2 || v.erupt > 0;
    b.fillStyle = hot ? '#ffb000' : '#ff6a00'; b.fillRect(vx - 2, top, 5, 1);
    b.fillStyle = '#ff3b1a'; b.fillRect(vx - 3, top + 1, 7, 1);
    // flowing lava streams
    v.streams.forEach((s, si) => s.forEach(([dx, r], i) => {
      const k = ((i - t * 0.03 + si * 7) % 10 + 10) % 10;
      b.fillStyle = k < 1.5 ? '#ffe9a8' : k < 4 ? '#ffb000' : k < 7 ? '#ff5a00' : '#b8280a';
      b.fillRect(vx + dx, top + r, 1, 1);
    }));
    // eruption cycle
    if (!reduceMotion) {
      if (v.erupt > 0) {
        v.erupt--;
        for (let i = 0; i < 2; i++) parts.push({ k: 'lava', x: vx + rand(-2, 2), y: top, vx: rand(-0.8, 0.8), vy: rand(-3, -1.4), life: 170 });
        if (v.erupt % 3 === 0) parts.push({ k: 'smoke', x: vx + rand(-2, 2), y: top - 2, vx: rand(0.05, 0.3), vy: rand(-0.45, -0.25), s: 2, life: 240 });
      } else if (--v.timer <= 0) {
        v.erupt = Math.floor(rand(90, 200)); v.timer = Math.floor(rand(260, 700)); shake = Math.max(shake, 3);
        if (audio) rumble();
      } else if (Math.random() < 0.05) parts.push({ k: 'smoke', x: vx + rand(-1, 1), y: top - 1, vx: rand(0.05, 0.2), vy: rand(-0.3, -0.15), s: 1, life: 160 });
    }
  }

  function drawGround(t) {
    const G = ['#2a0c05', '#220a04', '#1a0703', '#140502', '#0f0402'];
    const gh = BH - hz;
    G.forEach((c, i) => { b.fillStyle = c; b.fillRect(0, Math.floor(hz + (gh * i) / G.length), BW, Math.ceil(gh / G.length) + 1); });
    // glowing lava cracks (perspective: deeper = lower on screen)
    cracks.forEach((cr, ci) => cr.forEach(([x, d], i) => {
      const y = Math.round(hz + d * gh);
      const k = ((i * 0.5 - t * 0.02 + ci * 5) % 12 + 12) % 12;
      b.fillStyle = k < 2 ? '#ffd27a' : k < 6 ? '#ff6a00' : '#c2300a';
      b.fillRect(x, y, 1, 1);
      if (d > 0.5) { b.fillStyle = 'rgba(255,90,0,.35)'; b.fillRect(x, y - 1, 1, 1); }
    }));
    // 2.5D rocks: dark body + lit top-right
    rocks.forEach(r => {
      const y = Math.round(hz + r.d * gh), s = Math.round(r.s * (0.6 + r.d));
      b.fillStyle = '#0a0302'; b.fillRect(r.x, y - s + 1, s + 1, s);
      b.fillStyle = '#4a1a0a'; b.fillRect(r.x + 1, y - s + 1, s, 1);
    });
    // impact craters cooling down
    craters = craters.filter(c => --c.life > 0);
    craters.forEach(c => {
      const a = c.life / 600;
      b.fillStyle = a > 0.6 ? '#ffb000' : a > 0.3 ? '#ff5a00' : '#6a1a06';
      b.fillRect(c.x - 3, c.y, 7, 1); b.fillRect(c.x - 2, c.y + 1, 5, 1);
      b.fillStyle = '#0a0302'; b.fillRect(c.x - 1, c.y, 3, 1);
    });
  }

  function spawnMeteor(tx, ty) {
    const userAimed = tx !== undefined;
    if (!userAimed) { tx = rand(0, BW); ty = Math.random() < 0.4 ? rand(hz * 0.2, hz * 0.7) : rand(hz + 3, BH - 4); }
    const steps = rand(55, 85), sx = tx + rand(60, 140), sy = ty - rand(150, 230);
    meteors.push({ x: sx, y: sy, vx: (tx - sx) / steps, vy: (ty - sy) / steps, ty, impact: ty > hz, trail: [], user: userAimed });
  }

  function updateMeteors() {
    if (!reduceMotion && --nextMeteor <= 0) { spawnMeteor(); nextMeteor = Math.floor(rand(50, 150)); }
    meteors = meteors.filter(m => {
      m.trail.push([m.x, m.y]); if (m.trail.length > 16) m.trail.shift();
      m.x += m.vx; m.y += m.vy;
      if (m.y >= m.ty) {
        const n = m.impact ? 30 : 12;
        for (let i = 0; i < n; i++) parts.push({ k: 'spark', x: m.x, y: m.y, vx: rand(-1.6, 1.6), vy: rand(-2.6, m.impact ? -0.4 : 1), life: rand(25, 45) });
        if (m.impact) {
          rings.push({ x: m.x, y: m.y, r: 1, life: 22 });
          craters.push({ x: Math.round(m.x), y: Math.round(m.y), life: 600 });
          shake = Math.max(shake, m.user ? 7 : 4);
          for (let i = 0; i < 4; i++) parts.push({ k: 'smoke', x: m.x + rand(-2, 2), y: m.y - 1, vx: rand(-0.2, 0.2), vy: rand(-0.4, -0.2), s: 2, life: 120 });
          if (audio && m.user) rumble();
        }
        return false;
      }
      return true;
    });
    const TR = ['#6a1a06', '#9a2a0a', '#c2300a', '#ff5a00', '#ff9a3c', '#ffd27a', '#fff2b0'];
    meteors.forEach(m => {
      m.trail.forEach(([x, y], i) => { b.fillStyle = TR[Math.floor((i / m.trail.length) * TR.length)]; b.fillRect(Math.round(x), Math.round(y), 1, 1); });
      b.fillStyle = '#ffffff'; b.fillRect(Math.round(m.x) - 1, Math.round(m.y) - 1, 2, 2);
    });
    rings = rings.filter(r => --r.life > 0);
    rings.forEach(r => {
      r.r += 1.2;
      b.fillStyle = r.life > 12 ? '#ffd27a' : '#ff6a00';
      for (let a = 0; a < Math.PI * 2; a += 0.25) b.fillRect(Math.round(r.x + Math.cos(a) * r.r), Math.round(r.y + Math.sin(a) * r.r * 0.35), 1, 1);
    });
  }

  function updateParts() {
    parts = parts.filter(p => p.life > 0);
    for (const p of parts) {
      p.life--;
      if (p.k === 'smoke') {
        p.x += p.vx + 0.08; p.y += p.vy; if (p.life % 40 === 0 && p.s < 6) p.s++;
        b.globalAlpha = Math.min(0.75, p.life / 200);
        b.fillStyle = p.life > 180 ? '#5a3020' : '#2e1a14';
        b.fillRect(Math.round(p.x), Math.round(p.y), p.s, p.s);
        b.globalAlpha = 1;
        continue;
      }
      p.vy += p.k === 'lava' ? 0.05 : 0.09;
      p.x += p.vx; p.y += p.vy;
      if (p.y > hz + 2 && p.vy > 0 && p.k === 'lava') { p.vy = 0; p.vx = 0; p.y = hz + 2; p.life = Math.min(p.life, 30); }
      const L = p.life;
      b.fillStyle = L > 120 ? '#fff2b0' : L > 70 ? '#ffb000' : L > 30 ? '#ff6a00' : '#a8240a';
      b.fillRect(Math.round(p.x), Math.round(p.y), 1, 1);
    }
  }

  function drawAsh() {
    for (const a of ash) {
      a.x += a.vx; a.y += a.vy;
      if (a.y > BH) { a.y = -2; a.x = rand(0, BW * 1.2); }
      if (a.x < -2) a.x = BW + 2;
      b.fillStyle = a.c; b.globalAlpha = 0.55;
      b.fillRect(Math.round(a.x), Math.round(a.y), 1, a.c === '#ffd27a' ? 1 : 2);
    }
    b.globalAlpha = 1;
  }

  function frame(t) {
    const sy = window.scrollY;
    // camera slowly descends towards the surface as you scroll
    hz = Math.round(BH * 0.66 - Math.min(sy * 0.03, BH * 0.2));
    if (hz !== skyHz) renderSky();
    b.drawImage(sky, 0, 0);
    drawClouds(t, sy);
    drawLightning();
    drawRidges(sy);
    volcanoes.forEach(v => drawVolcano(v, t));
    drawGround(t);
    updateMeteors();
    updateParts();
    drawAsh();
    if (flash > 0) { b.fillStyle = `rgba(255,240,200,${flash * 0.04})`; b.fillRect(0, 0, BW, BH); flash--; }

    // upscale to screen with heat-haze row wobble near the ground + camera shake
    const ox = shake ? Math.round(rand(-shake, shake)) * 2 : 0, oy = shake ? Math.round(rand(-shake, shake)) * 2 : 0;
    shake = shake > 0.3 ? shake * 0.86 : 0;
    const hazeTop = Math.max(0, hz - 28);
    ctx.drawImage(buf, 0, 0, BW, hazeTop, ox, oy, BW * PX, hazeTop * PX);
    for (let y = hazeTop; y < BH; y++) {
      const amp = reduceMotion ? 0 : (y < hz + 6 ? 1 : 0.5);
      const off = Math.round(Math.sin(y * 0.45 + t * 0.006) * amp) * PX;
      ctx.drawImage(buf, 0, y, BW, 1, off + ox - PX, y * PX + oy, BW * PX, PX);
      ctx.drawImage(buf, 0, y, BW, 1, off + ox, y * PX + oy, BW * PX, PX);
    }
    drawWarp();
    requestAnimationFrame(frame);
  }

  // tap the sky → meteor lands where you tapped
  window.addEventListener('click', e => {
    if (e.target.closest('a, button, input, .terminal')) return;
    spawnMeteor(e.clientX / PX, e.clientY / PX);
    beep(1200, 0.05, 'square', 0.02);
  });

  /* ---------------- UI ---------------- */
  const io = new IntersectionObserver(entries => entries.forEach(en => {
    if (!en.isIntersecting) return;
    en.target.classList.add('in');
    $$('[data-count]', en.target).forEach(el => {
      const target = +el.dataset.count; let n = 0;
      const step = Math.ceil(target / 30);
      const iv = setInterval(() => { n = Math.min(target, n + step); el.textContent = n; if (n >= target) clearInterval(iv); }, 40);
    });
    io.unobserve(en.target);
  }), { threshold: 0.2 });
  $$('.reveal').forEach(el => io.observe(el));
  setTimeout(() => $$('.hero .reveal').forEach(el => el.classList.add('in')), 350);

  $('#copyBtn').addEventListener('click', async () => {
    const cmd = `git clone ${REPO}.git`;
    try { await navigator.clipboard.writeText(cmd); }
    catch (e) {
      const ta = document.createElement('textarea'); ta.value = cmd; document.body.appendChild(ta); ta.select();
      document.execCommand('copy'); ta.remove();
    }
    toast('COPIED! ✓  ' + cmd.replace('https://', ''));
    beep(988, 0.06); setTimeout(() => beep(1319, 0.1), 60);
  });

  const nav = $('#nav');
  window.addEventListener('scroll', () => nav.classList.toggle('scrolled', window.scrollY > 30), { passive: true });

  let lastW = 0, rT;
  function onResize(force) {
    if (!force && window.innerWidth === lastW && Math.abs(window.innerHeight - H) < 160) {
      H = cv.height = window.innerHeight; BH = Math.ceil(H / PX); buf.height = BH; sky.height = BH; skyHz = -1; ctx.imageSmoothingEnabled = false;
      return;
    }
    lastW = window.innerWidth;
    resize();
  }
  window.addEventListener('resize', () => { clearTimeout(rT); rT = setTimeout(() => onResize(false), 120); });
  onResize(true);
  requestAnimationFrame(frame);
})();
