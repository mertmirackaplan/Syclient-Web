/* GoBits landing: the live pixel office in "How it works".
 * Pixel art comes straight from the app (office-world.png + bits-sheet.png).
 * Sheet: 6 rows (max, rae, wren, ana, eddie, player) x 20 cols of 16x26:
 * left 0-3, right 4-7, down 8-11, up 12-15, stand 16, cheer 17, type 18-19. */
(function () {
  'use strict';
  var canvas = document.getElementById('office-canvas');
  if (!canvas) return;
  var wrap = document.getElementById('diorama');
  var caption = document.getElementById('diorama-caption');
  var toggleBtn = document.getElementById('diorama-toggle');
  var stepEls = Array.prototype.slice.call(document.querySelectorAll('#steps .step'));
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var ctx = canvas.getContext('2d');
  var W = 352, H = 240, T = 16;
  var STEP_NAMES = ['Give an order', 'Max makes a plan', 'The Bits get to work', 'Delivery Box'];
  var STEP_MS = [6200, 4200, 9100, 9400];

  var GRID = [
    '######################', '######################', '######################',
    '##.#.#..#.#.##.#.#####', '#....................#', '#.##..##.............#',
    '#..........####....#.#', '#....................#', '#..............##...##',
    '####..##.#.#........##', '#................##.##', '##...................#',
    '#......##............#', '#####..............###', '######################'
  ];
  function free(tx, ty) { return ty >= 0 && ty < GRID.length && tx >= 0 && tx < 22 && GRID[ty][tx] === '.'; }
  function bfs(a, b) {
    var key = function (x, y) { return y * 22 + x; };
    var prev = {}; prev[key(a[0], a[1])] = null;
    var q = [a], found = false;
    while (q.length) {
      var c = q.shift();
      if (c[0] === b[0] && c[1] === b[1]) { found = true; break; }
      var n = [[1, 0], [-1, 0], [0, 1], [0, -1]];
      for (var i = 0; i < 4; i++) {
        var nx = c[0] + n[i][0], ny = c[1] + n[i][1], k = key(nx, ny);
        if (k in prev) continue;
        if (!free(nx, ny) && !(nx === b[0] && ny === b[1])) continue;
        prev[k] = c; q.push([nx, ny]);
      }
    }
    if (!found) return [b];
    var path = [], cur = b;
    while (cur) { path.unshift(cur); cur = prev[key(cur[0], cur[1])]; }
    return path.slice(1);
  }
  function foot(t) { return { x: t[0] * T + 8, y: t[1] * T + 13 }; }

  /* ---------- actors ---------- */
  var SEATS = { max: [12, 4], rae: [2, 6], wren: [6, 6], ana: [2, 10], eddie: [6, 10] };
  var ROW = { max: 0, rae: 1, wren: 2, ana: 3, eddie: 4, player: 5 };
  var actors = {};
  function makeActor(id, tile, dir) {
    var f = foot(tile);
    return { id: id, row: ROW[id], x: f.x, y: f.y, tile: tile.slice(), dir: dir || 'up', pose: 'idle', path: [], t: Math.random() * 1000, onArrive: null, speed: 64 };
  }
  var wbLines = 0, wbTarget = 0, boxGlow = 0;
  function resetWorld() {
    actors = {
      max: makeActor('max', SEATS.max, 'up'),
      rae: makeActor('rae', SEATS.rae, 'up'),
      wren: makeActor('wren', SEATS.wren, 'up'),
      ana: makeActor('ana', SEATS.ana, 'up'),
      eddie: makeActor('eddie', SEATS.eddie, 'up'),
      player: makeActor('player', [11, 14], 'up')
    };
    actors.player.y = 14 * T + 20;
    wbLines = 0; wbTarget = 0; boxGlow = 0;
    hideAllBubbles();
  }
  function walkTo(a, tile) {
    return new Promise(function (res) {
      a.path = bfs(a.tile, tile);
      a.pose = 'walk';
      a.onArrive = res;
    });
  }
  function place(a, tile, dir, pose) { var f = foot(tile); a.x = f.x; a.y = f.y; a.tile = tile.slice(); a.dir = dir; a.pose = pose || 'idle'; a.path = []; a.onArrive = null; }

  function update(a, dt) {
    a.t += dt;
    if (!a.path.length) return;
    var nt = a.path[0], f = foot(nt);
    var dx = f.x - a.x, dy = f.y - a.y, d = Math.abs(dx) + Math.abs(dy);
    if (Math.abs(dx) > Math.abs(dy)) a.dir = dx > 0 ? 'right' : 'left'; else if (d > 0.01) a.dir = dy > 0 ? 'down' : 'up';
    var step = a.speed * dt / 1000;
    if (d <= step) {
      a.x = f.x; a.y = f.y; a.tile = nt.slice(); a.path.shift();
      if (!a.path.length) { a.pose = 'idle'; var cb = a.onArrive; a.onArrive = null; if (cb) cb(); }
    } else if (Math.abs(dx) > 0.01) a.x += Math.sign(dx) * Math.min(step, Math.abs(dx));
    else a.y += Math.sign(dy) * Math.min(step, Math.abs(dy));
  }
  function frameCol(a) {
    var base = { left: 0, right: 4, down: 8, up: 12 }[a.dir] || 8;
    if (a.pose === 'walk') return base + (Math.floor(a.t / 125) % 4);
    if (a.pose === 'type') return 18 + (Math.floor(a.t / 220) % 2);
    if (a.pose === 'cheer') return (Math.floor(a.t / 300) % 2) ? 17 : 16;
    return base;
  }

  /* ---------- drawing ---------- */
  var imgWorld = new Image(), imgSheet = new Image();
  var scale = 1;
  function resize() {
    var r = canvas.getBoundingClientRect();
    var dpr = Math.min(window.devicePixelRatio || 1, 3);
    var bw = Math.max(W, Math.round(r.width * dpr));
    if (canvas.width !== bw) { canvas.width = bw; canvas.height = Math.round(bw * H / W); }
    scale = canvas.width / W;
    if (ready) draw();
  }
  function draw() {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    ctx.drawImage(imgWorld, 0, 0, W, H);
    // whiteboard plan lines
    var colors = ['#3b6fd1', '#d14b3b', '#3b6fd1', '#3a8f3a'];
    var lens = [18, 14, 20, 12];
    for (var i = 0; i < Math.floor(wbLines); i++) {
      ctx.fillStyle = colors[i];
      ctx.fillRect(191, 26 + i * 4, 2, 2);
      ctx.fillRect(195, 26 + i * 4, lens[i], 1);
    }
    var partial = wbLines - Math.floor(wbLines);
    if (partial > 0 && wbLines < 4) {
      var j = Math.floor(wbLines);
      ctx.fillStyle = colors[j];
      ctx.fillRect(191, 26 + j * 4, 2, 2);
      ctx.fillRect(195, 26 + j * 4, Math.round(lens[j] * partial), 1);
    }
    if (boxGlow > 0) {
      ctx.globalAlpha = 0.35 * boxGlow;
      ctx.fillStyle = '#ffe28a';
      ctx.fillRect(268, 140, 24, 18);
      ctx.globalAlpha = 1;
    }
    var list = Object.keys(actors).map(function (k) { return actors[k]; }).sort(function (a, b) { return a.y - b.y; });
    list.forEach(function (a) {
      if (a.y > H + 20) return;
      ctx.globalAlpha = 0.28; ctx.fillStyle = '#000';
      ctx.beginPath(); ctx.ellipse(a.x, a.y + 1, 5, 1.6, 0, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1;
      var col = frameCol(a);
      var bob = a.pose === 'cheer' && col === 17 ? -2 : 0;
      ctx.drawImage(imgSheet, col * 16, a.row * 26, 16, 26, Math.round(a.x - 8), Math.round(a.y - 24 + bob), 16, 26);
    });
    // keep bubbles glued to their actors
    Object.keys(bubbles).forEach(function (id) {
      var b = bubbles[id], a = actors[id]; if (!a) return;
      b.el.style.left = (a.x / W * 100) + '%';
      b.el.style.top = ((a.y - 28) / H * 100) + '%';
    });
  }

  /* ---------- bubbles ---------- */
  var bubbles = {};
  function say(id, html, ms) {
    var b = bubbles[id];
    if (!b) {
      var el = document.createElement('div'); el.className = 'd-bubble'; el.setAttribute('aria-hidden', 'true');
      wrap.appendChild(el); b = bubbles[id] = { el: el, until: 0 };
    }
    b.el.innerHTML = html; // static strings written below, never user input
    b.el.classList.add('show');
    b.until = ms ? sim + ms : Infinity;
  }
  function hush(id) { var b = bubbles[id]; if (b) { b.el.classList.remove('show'); b.until = 0; } }
  function hideAllBubbles() { Object.keys(bubbles).forEach(hush); }
  var coinEl = document.createElement('div'); coinEl.className = 'd-coin'; coinEl.setAttribute('aria-hidden', 'true'); coinEl.textContent = '+100 coins';
  wrap.appendChild(coinEl);
  function coin(x, y) {
    coinEl.style.left = (x / W * 100) + '%'; coinEl.style.top = ((y - 30) / H * 100) + '%';
    coinEl.classList.remove('show'); void coinEl.offsetWidth; coinEl.classList.add('show');
  }

  /* ---------- sim clock + cancellable waits ---------- */
  var sim = 0, waiters = [], token = 0, paused = false, offscreen = false, ready = false;
  function wait(ms) {
    var my = token;
    return new Promise(function (res, rej) { waiters.push({ at: sim + ms, res: res, rej: rej, tok: my }); });
  }
  function guard(my) { if (my !== token) throw new Error('reset'); }
  function cancelAll() {
    token++;
    var w = waiters; waiters = [];
    w.forEach(function (x) { x.rej(new Error('reset')); });
    Object.keys(actors).forEach(function (k) { actors[k].onArrive = null; actors[k].path = []; });
  }

  var stageStart = 0, stage = 0;
  function setStep(i) {
    stage = i; stageStart = sim;
    stepEls.forEach(function (el, k) { el.classList.toggle('is-active', k === i); var bar = el.querySelector('.bar i'); if (bar) bar.style.width = k < i ? '100%' : '0'; });
    if (caption) caption.textContent = 'Step ' + (i + 1) + ' \u00b7 ' + STEP_NAMES[i];
  }
  function stateFor(i) {
    resetWorld();
    var A = actors;
    if (i >= 1) { place(A.player, [12, 5], 'up'); }
    if (i >= 2) { place(A.player, [14, 10], 'left'); wbLines = wbTarget = 4; }
    if (i >= 3) { ['rae', 'wren', 'ana', 'eddie'].forEach(function (k) { A[k].pose = 'type'; }); }
  }

  async function stage0(my) {
    var A = actors; setStep(0);
    await wait(300); guard(my);
    await walkTo(A.player, [12, 5]); guard(my);
    A.player.dir = 'up';
    say('player', 'Write a launch plan for my coffee shop &#9749;', 2200);
    await wait(700); guard(my);
    A.max.dir = 'down';
    await wait(1500); guard(my);
    say('max', 'On it! Let me plan.', 1200);
    await wait(1300); guard(my);
  }
  async function stage1(my) {
    var A = actors; setStep(1);
    A.max.dir = 'up'; A.max.pose = 'type';
    wbTarget = 4;
    say('max', 'Plan: research &rarr; write &rarr; review &rarr; deliver', 3000);
    walkTo(A.player, [14, 10]).then(function () { A.player.dir = 'left'; });
    await wait(3200); guard(my);
    A.max.pose = 'idle'; A.max.dir = 'down';
    say('max', 'Team, you\u2019re up!', 1000);
    await wait(1000); guard(my);
  }
  async function stage2(my) {
    var A = actors; setStep(2);
    A.max.dir = 'up';
    A.wren.pose = 'type'; A.ana.pose = 'type';
    say('wren', 'Writing <code>plan.md</code>&hellip;', 2600);
    await walkTo(A.rae, [8, 4]); guard(my);
    A.rae.dir = 'up';
    say('rae', 'Reading cafe market notes&hellip;', 1500);
    say('ana', 'Pricing the menu', 1500);
    await wait(1600); guard(my);
    await walkTo(A.rae, SEATS.rae); guard(my);
    A.rae.dir = 'up'; A.rae.pose = 'type';
    A.eddie.pose = 'idle';
    say('eddie', 'May I run <code>wc -w plan.md</code>?', 2400);
    await wait(1100); guard(my);
    say('eddie', 'May I run <code>wc -w plan.md</code>?<br><span class="ok">&#10003; Allowed</span>', 1300);
    await wait(1200); guard(my);
    A.eddie.pose = 'type';
    say('eddie', 'Reviewed. Looks great!', 1200);
    await wait(1200); guard(my);
  }
  async function stage3(my) {
    var A = actors; setStep(3);
    await walkTo(A.max, [17, 11]); guard(my);
    A.max.dir = 'up';
    boxGlow = 1;
    await wait(400); guard(my);
    A.max.pose = 'cheer';
    ['rae', 'wren', 'ana', 'eddie'].forEach(function (k) { A[k].dir = 'down'; A[k].pose = 'cheer'; });
    A.player.pose = 'cheer';
    say('max', 'Delivered! &#128230;', 2200);
    coin(A.max.x, A.max.y - 8);
    await wait(2400); guard(my);
    boxGlow = 0;
    ['rae', 'wren', 'ana', 'eddie'].forEach(function (k) { A[k].dir = 'up'; A[k].pose = 'idle'; });
    A.player.pose = 'idle';
    walkTo(A.player, [11, 13]);
    await walkTo(A.max, SEATS.max); guard(my);
    A.max.dir = 'up';
    await wait(600); guard(my);
  }
  var STAGES = [stage0, stage1, stage2, stage3];
  async function run(from) {
    cancelAll();
    var my = token;
    stateFor(from);
    try {
      var i = from;
      for (;;) {
        await STAGES[i](my);
        i = (i + 1) % 4;
        if (i === 0) stateFor(0);
      }
    } catch (e) { /* reset by a newer run */ }
  }

  var last = 0;
  function tick(now) {
    var dt = last ? Math.min(now - last, 60) : 16; last = now;
    if (!paused && !offscreen && !document.hidden) {
      sim += dt;
      for (var k in actors) update(actors[k], dt);
      if (wbLines < wbTarget) wbLines = Math.min(wbTarget, wbLines + dt / 900);
      var due = waiters.filter(function (w) { return w.at <= sim; });
      if (due.length) { waiters = waiters.filter(function (w) { return w.at > sim; }); due.forEach(function (w) { w.res(); }); }
      Object.keys(bubbles).forEach(function (id) { if (bubbles[id].until <= sim) hush(id); });
      var el = stepEls[stage], bar = el && el.querySelector('.bar i');
      if (bar) bar.style.width = Math.min(100, (sim - stageStart) / STEP_MS[stage] * 100) + '%';
      draw();
    }
    requestAnimationFrame(tick);
  }

  /* static frames for reduced motion */
  var STATIC_SAY = [
    ['player', 'Write a launch plan for my coffee shop &#9749;'],
    ['max', 'Plan: research &rarr; write &rarr; review &rarr; deliver'],
    ['eddie', 'May I run <code>wc -w plan.md</code>?<br><span class="ok">&#10003; Allowed</span>'],
    ['max', 'Delivered! &#128230;']
  ];
  function staticFrame(i) {
    stateFor(i);
    var A = actors;
    if (i === 0) { place(A.player, [12, 5], 'up'); A.max.dir = 'down'; }
    if (i === 1) { A.max.pose = 'idle'; wbLines = 2.5; }
    if (i === 2) { ['rae', 'wren', 'ana'].forEach(function (k) { A[k].pose = 'type'; A[k].t = 0; }); }
    if (i === 3) { place(A.max, [17, 11], 'up'); A.max.pose = 'cheer'; A.max.t = 300; boxGlow = 1; }
    setStep(i);
    hideAllBubbles();
    say(STATIC_SAY[i][0], STATIC_SAY[i][1], 0);
    bubbles[STATIC_SAY[i][0]].until = Infinity;
    draw();
    stepEls.forEach(function (el) { var b = el.querySelector('.bar i'); if (b) b.style.width = '0'; });
  }

  function start() {
    ready = true;
    wrap.classList.add('is-ready');
    resize();
    stepEls.forEach(function (el, i) {
      var b = el.querySelector('[data-goto-step]');
      if (b) b.addEventListener('click', function () {
        if (reduce) staticFrame(i); else { run(i); if (paused) setPaused(false); }
      });
    });
    if (reduce) {
      staticFrame(2);
      if (toggleBtn) toggleBtn.hidden = true;
      return;
    }
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en) { offscreen = !en[0].isIntersecting; }, { threshold: 0.05 }).observe(canvas);
    }
    run(0);
    requestAnimationFrame(tick);
  }
  function setPaused(p) {
    paused = p;
    if (toggleBtn) { toggleBtn.textContent = p ? 'Play' : 'Pause'; toggleBtn.setAttribute('aria-pressed', p ? 'true' : 'false'); }
  }
  if (toggleBtn) toggleBtn.addEventListener('click', function () { setPaused(!paused); });
  window.addEventListener('resize', resize);

  var loaded = 0;
  function onLoad() { if (++loaded === 2) start(); }
  imgWorld.onload = onLoad; imgSheet.onload = onLoad;
  imgWorld.onerror = imgSheet.onerror = function () {
    var l = wrap.querySelector('.loading'); if (l) l.textContent = 'The office art couldn\u2019t load. Try refreshing the page.';
  };
  imgWorld.src = 'assets/img/office-world.png';
  imgSheet.src = 'assets/img/bits-sheet.png';
})();
