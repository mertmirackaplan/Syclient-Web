/* GoBits landing: navigation, consent + analytics, early-access form, gallery, small delights. */
(function () {
  'use strict';
  var CFG = window.GOBITS_CONFIG || {};
  var EMAIL = CFG.CONTACT_EMAIL || 'hello@gobits.example';
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ---------- contact email from config ---------- */
  $$('[data-contact-email]').forEach(function (a) { a.href = 'mailto:' + EMAIL; a.textContent = EMAIL; });

  /* ---------- header + mobile nav ---------- */
  var header = $('.site-header');
  var onScroll = function () { if (header) header.classList.toggle('is-scrolled', window.scrollY > 8); };
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();

  var toggle = $('.nav-toggle'), nav = $('#site-nav');
  function setNav(open) {
    if (!toggle || !nav) return;
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    nav.classList.toggle('is-open', open);
  }
  if (toggle && nav) {
    toggle.addEventListener('click', function () { setNav(toggle.getAttribute('aria-expanded') !== 'true'); });
    nav.addEventListener('click', function (e) { if (e.target.closest('a')) setNav(false); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) { setNav(false); toggle.focus(); }
    });
    document.addEventListener('click', function (e) {
      if (nav.classList.contains('is-open') && !nav.contains(e.target) && !toggle.contains(e.target)) setNav(false);
    });
  }

  /* ---------- reveal on scroll ---------- */
  var reveals = $$('.reveal');
  if ('IntersectionObserver' in window && !reduceMotion) {
    var ro = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('is-in'); ro.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    reveals.forEach(function (el) { ro.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* ---------- CTA sparkles ---------- */
  if (!reduceMotion) {
    $$('[data-sparkle]').forEach(function (btn) {
      var last = 0;
      var burst = function () {
        var now = Date.now(); if (now - last < 450) return; last = now;
        for (var i = 0; i < 5; i++) {
          var s = document.createElement('span');
          s.className = 'sparkle'; s.setAttribute('aria-hidden', 'true');
          var ang = Math.random() * Math.PI * 2, dist = 14 + Math.random() * 18;
          s.style.left = (10 + Math.random() * 80) + '%';
          s.style.top = (Math.random() < 0.5 ? -4 : 70) + '%';
          s.style.setProperty('--dx', Math.round(Math.cos(ang) * dist) + 'px');
          s.style.setProperty('--dy', Math.round(Math.sin(ang) * dist - 8) + 'px');
          s.style.animationDelay = (i * 60) + 'ms';
          btn.appendChild(s);
          setTimeout(function (n) { return function () { n.remove(); }; }(s), 1000);
        }
      };
      btn.addEventListener('mouseenter', burst);
      btn.addEventListener('focus', burst);
    });
  }

  /* ---------- analytics (only after consent) ---------- */
  var CONSENT_KEY = 'gobits_consent';
  var analyticsLoaded = false;
  function readConsent() {
    try { var v = JSON.parse(localStorage.getItem(CONSENT_KEY) || 'null'); return v && v.v === 1 ? v : null; } catch (e) { return null; }
  }
  function writeConsent(analytics) {
    var v = { v: 1, analytics: !!analytics, ts: new Date().toISOString() };
    try { localStorage.setItem(CONSENT_KEY, JSON.stringify(v)); } catch (e) { /* storage blocked: choice lasts for this page */ }
    return v;
  }
  function loadAnalytics() {
    var A = CFG.ANALYTICS || {};
    if (analyticsLoaded || !A.provider || !A.src) return;
    if (!/^https:\/\//.test(A.src)) return;
    var s = document.createElement('script');
    s.defer = true; s.src = A.src;
    if (A.provider === 'plausible' && A.domain) s.setAttribute('data-domain', A.domain);
    document.head.appendChild(s);
    analyticsLoaded = true;
    window.plausible = window.plausible || function () { (window.plausible.q = window.plausible.q || []).push(arguments); };
  }
  window.gbTrack = function (name, props) {
    var c = readConsent();
    if (!c || !c.analytics || !analyticsLoaded) return;
    try { if (typeof window.plausible === 'function') window.plausible(name, props ? { props: props } : undefined); } catch (e) { /* ignore */ }
  };
  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-track]'); if (t) window.gbTrack(t.getAttribute('data-track'));
  });

  /* ---------- cookie banner ---------- */
  var banner = $('#cookie-banner');
  var prefs = $('#cookie-prefs');
  var chk = $('#consent-analytics');
  var lastOpener = null;
  function showBanner(withPrefs, opener) {
    if (!banner) return;
    lastOpener = opener || null;
    var c = readConsent();
    if (chk) chk.checked = !!(c && c.analytics);
    setPrefs(!!withPrefs);
    banner.hidden = false;
    document.body.classList.add('cookie-open');
    updateMobileCta();
    if (opener) { var first = withPrefs ? chk : $('[data-consent="accept"]', banner); if (first) first.focus(); }
  }
  function hideBanner() {
    if (!banner) return;
    banner.hidden = true;
    document.body.classList.remove('cookie-open');
    updateMobileCta();
    if (lastOpener && document.contains(lastOpener)) lastOpener.focus();
    lastOpener = null;
  }
  function setPrefs(open) {
    if (!prefs) return;
    prefs.hidden = !open;
    var sBtn = $('[data-consent="settings"]', banner), save = $('[data-consent="save"]', banner);
    if (sBtn) { sBtn.setAttribute('aria-expanded', open ? 'true' : 'false'); sBtn.hidden = open; }
    if (save) save.hidden = !open;
  }
  function decide(analytics) {
    var before = readConsent();
    writeConsent(analytics);
    hideBanner();
    if (analytics) loadAnalytics();
    else if (analyticsLoaded || (before && before.analytics && CFG.ANALYTICS && CFG.ANALYTICS.provider)) {
      // Analytics was running in this page: reload so it is fully gone.
      if (analyticsLoaded) location.reload();
    }
  }
  if (banner) {
    banner.addEventListener('click', function (e) {
      var b = e.target.closest('[data-consent]'); if (!b) return;
      var k = b.getAttribute('data-consent');
      if (k === 'accept') decide(true);
      else if (k === 'reject') decide(false);
      else if (k === 'settings') { setPrefs(true); if (chk) chk.focus(); }
      else if (k === 'save') decide(chk && chk.checked);
    });
    banner.addEventListener('keydown', function (e) { if (e.key === 'Escape' && readConsent()) hideBanner(); });
  }
  $$('[data-cookie-settings]').forEach(function (b) {
    b.addEventListener('click', function () { showBanner(true, b); });
  });
  var consent = readConsent();
  if (!consent) showBanner(false);
  else if (consent.analytics) loadAnalytics();

  /* ---------- mobile sticky CTA ---------- */
  var mcta = $('#mobile-cta');
  var heroCta = $('.hero .cta-row');
  var formSec = $('#early-access');
  var heroVisible = true, formVisible = false;
  function updateMobileCta() {
    if (!mcta) return;
    var show = !heroVisible && !formVisible && !(banner && !banner.hidden);
    mcta.classList.toggle('is-visible', show);
    mcta.setAttribute('aria-hidden', show ? 'false' : 'true');
    var a = $('a', mcta); if (a) a.tabIndex = show ? 0 : -1;
  }
  if (mcta && 'IntersectionObserver' in window) {
    document.body.classList.add('has-mobile-cta');
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.target === heroCta) heroVisible = en.isIntersecting;
        if (en.target === formSec) formVisible = en.isIntersecting;
      });
      updateMobileCta();
    }, { threshold: 0 });
    if (heroCta) io.observe(heroCta);
    if (formSec) io.observe(formSec);
  }

  /* ---------- gallery: loading state + lightbox ---------- */
  $$('.shot .media img').forEach(function (img) {
    var m = img.closest('.media');
    var done = function () { m.classList.remove('is-loading'); };
    if (img.complete && img.naturalWidth) done(); else { img.addEventListener('load', done); img.addEventListener('error', done); }
  });
  var lb = $('#lightbox');
  if (lb && typeof lb.showModal === 'function') {
    var lbImg = $('#lightbox-img'), lbCap = $('#lightbox-cap');
    $$('[data-lightbox]').forEach(function (b) {
      b.addEventListener('click', function () {
        lbImg.src = b.getAttribute('data-lightbox');
        lbImg.alt = b.getAttribute('data-alt') || '';
        lbCap.textContent = b.getAttribute('data-caption') || '';
        lb.showModal();
        window.gbTrack('screenshot_open', { name: b.getAttribute('data-caption') || '' });
      });
    });
    lb.addEventListener('click', function (e) { if (e.target === lb || e.target.closest('[data-close]')) lb.close(); });
    lb.addEventListener('close', function () { lbImg.src = 'data:,'; });
  } else {
    $$('[data-lightbox]').forEach(function (b) { b.addEventListener('click', function () { window.open(b.getAttribute('data-lightbox'), '_blank', 'noopener'); }); });
  }

  /* ---------- early-access form ---------- */
  var form = $('#waitlist-form');
  if (!form) return;
  var F = form.elements;
  var ENDPOINT = (CFG.WAITLIST_ENDPOINT || '').trim();
  var ROLES = ['developer', 'founder', 'designer', 'writer', 'researcher', 'student', 'other'];
  var btn = $('#submit-btn'), label = $('.label', btn);
  var errBox = $('#form-error'), modeBox = $('#form-mode'), mailNote = $('#mailto-note');
  var note = $('#note'), count = $('#note-count');
  var submitted = false;
  var EMAIL_RE = /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[A-Za-z]{2,}$/;

  if (!ENDPOINT) {
    modeBox.innerHTML = '';
    modeBox.appendChild(document.createTextNode('Heads up: our sign-up server isn\u2019t connected yet. This button opens your email app with your request filled in, ready to send to '));
    var a = document.createElement('a'); a.href = 'mailto:' + EMAIL; a.textContent = EMAIL; modeBox.appendChild(a);
    modeBox.appendChild(document.createTextNode('.'));
    modeBox.classList.add('show');
    label.textContent = 'Email my request';
  }
  if (note && count) note.addEventListener('input', function () { count.textContent = String(note.value.length); });

  function fieldEl(name) { return $('#f-' + name); }
  function setError(name, msg) {
    var f = fieldEl(name); if (!f) return;
    var input = $('input, select, textarea', f), e = $('.error', f);
    f.classList.toggle('has-error', !!msg);
    if (e) e.textContent = msg || '';
    if (input) { if (msg) input.setAttribute('aria-invalid', 'true'); else input.removeAttribute('aria-invalid'); }
  }
  function values() {
    return {
      email: F.email.value.trim(),
      name: F.name.value.trim(),
      role: F.role.value,
      note: F.note.value.trim(),
      website: F.website.value
    };
  }
  function validate(v) {
    var errs = {};
    if (!v.email) errs.email = 'Please enter your email address.';
    else if (v.email.length > 254 || !EMAIL_RE.test(v.email)) errs.email = 'That doesn\u2019t look like an email address. Try something like you@example.com.';
    if (v.name.length > 100) errs.name = 'Please keep your name under 100 characters.';
    if (!v.role) errs.role = 'Please pick the option that fits you best.';
    else if (ROLES.indexOf(v.role) === -1) errs.role = 'Please pick one of the listed options.';
    if (v.note.length > 1000) errs.note = 'Please keep this under 1000 characters.';
    return errs;
  }
  function showErrors(errs) {
    ['email', 'name', 'role', 'note'].forEach(function (k) { setError(k, errs[k]); });
  }
  ['email', 'name', 'role', 'note'].forEach(function (k) {
    var el = F[k];
    var ev = el.tagName === 'SELECT' ? 'change' : 'input';
    el.addEventListener(ev, function () { if (submitted) { var e = validate(values()); setError(k, e[k]); } });
    el.addEventListener('blur', function () { if (submitted || (k === 'email' && el.value)) { var e = validate(values()); setError(k, e[k]); } });
  });
  function alertError(msg) {
    errBox.textContent = msg;
    errBox.classList.add('show');
    errBox.focus();
  }
  function clearAlert() { errBox.textContent = ''; errBox.classList.remove('show'); }
  function setLoading(on) {
    btn.disabled = on;
    btn.setAttribute('aria-busy', on ? 'true' : 'false');
    form.setAttribute('aria-busy', on ? 'true' : 'false');
    if (on) {
      btn.dataset.label = label.textContent;
      label.textContent = 'Sending\u2026';
      var sp = document.createElement('span'); sp.className = 'spinner'; sp.setAttribute('aria-hidden', 'true'); btn.insertBefore(sp, label);
    } else {
      label.textContent = btn.dataset.label || label.textContent;
      var s = $('.spinner', btn); if (s) s.remove();
    }
  }
  function mailtoHref(v) {
    var lines = ['Hi GoBits team,', '', 'I\u2019d like an invite to GoBits early access.', '', 'Email: ' + v.email];
    if (v.name) lines.push('Name: ' + v.name);
    lines.push('Role: ' + (F.role.options[F.role.selectedIndex] || {}).text);
    if (v.note) { lines.push('', 'What I\u2019d have my Bits do:', v.note); }
    return 'mailto:' + EMAIL + '?subject=' + encodeURIComponent('GoBits early access request') + '&body=' + encodeURIComponent(lines.join('\n'));
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (btn.disabled) return;
    submitted = true;
    clearAlert();
    var v = values();
    var errs = validate(v);
    showErrors(errs);
    var firstBad = ['email', 'role', 'name', 'note'].filter(function (k) { return errs[k]; })[0];
    if (firstBad) { F[firstBad].focus(); return; }

    if (v.website) { location.href = 'thank-you.html'; return; } // honeypot: quietly drop bots

    if (!ENDPOINT) {
      var href = mailtoHref(v);
      window.gbTrack('signup_mailto');
      mailNote.hidden = false;
      mailNote.textContent = 'Your email app should open with the request ready. Nothing is sent until you press Send there. ';
      var again = document.createElement('a'); again.href = href; again.id = 'mailto-again'; again.textContent = 'Didn\u2019t open? Try again';
      mailNote.appendChild(again);
      location.href = href;
      return;
    }

    setLoading(true);
    var ctrl = 'AbortController' in window ? new AbortController() : null;
    var timer = setTimeout(function () { if (ctrl) ctrl.abort(); }, 15000);
    fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ email: v.email, name: v.name, role: v.role, note: v.note, website: v.website, source: 'landing' }),
      signal: ctrl ? ctrl.signal : undefined,
      credentials: 'omit',
      mode: 'cors'
    }).then(function (res) {
      return res.json().catch(function () { return {}; }).then(function (data) { return { res: res, data: data }; });
    }).then(function (r) {
      clearTimeout(timer);
      if (r.res.ok && r.data && r.data.ok) {
        window.gbTrack('signup');
        location.href = 'thank-you.html';
        return;
      }
      setLoading(false);
      var d = r.data || {};
      if (r.res.status === 429) return alertError('Whoa, that was fast. Please wait a minute and try again.');
      if (r.res.status === 400 && d.field && fieldEl(d.field)) { setError(d.field, d.error || 'Please check this field.'); F[d.field].focus(); return; }
      alertError((d.error && r.res.status < 500 ? d.error + ' ' : 'Something went wrong on our side. ') + 'Please try again, or email ' + EMAIL + '.');
    }).catch(function () {
      clearTimeout(timer);
      setLoading(false);
      alertError('We couldn\u2019t reach the sign-up server. Check your connection and try again, or email ' + EMAIL + '.');
    });
  });
})();
