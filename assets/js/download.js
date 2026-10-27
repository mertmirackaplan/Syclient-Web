/* GoBits download page: keeps the three platform builds locked until a valid activation code is entered.
 * Accepted codes are stored as SHA-256 hashes (normalised to A-Z0-9, so case, spaces and dashes do not
 * matter), so the codes themselves never appear in the page source. The unlocked state is remembered in
 * localStorage for this browser only. No account, no server, no cookies. */
(function () {
  'use strict';

  var ACCEPTED = [
    '5fc9db30e0b0f389d24d86d900c67bcdb2a9c4c0ef6a34ce7acb3ec2df988210',
    'c2ebec963c4ad0a45d6d4d6e149b67808c95d3a66242de68edc31f88b8bd839e',
    '16709f78f4c2b98632e3a8ab53205e2bdfa61ce6c9adc44d2061e8b2eb962389'
  ];
  var STORE = 'gobits_downloads_unlocked';
  var MAX_TRIES = 5;
  var LOCKOUT_MS = 30000;

  /* Compact SHA-256 (returns lowercase hex). Only ASCII is ever passed in. */
  function sha256(ascii) {
    function rightRotate(value, amount) {
      return (value >>> amount) | (value << (32 - amount));
    }
    var mathPow = Math.pow;
    var maxWord = mathPow(2, 32);
    var i, j;
    var result = '';
    var words = [];
    var asciiBitLength = ascii.length * 8;
    var hash = sha256.h = sha256.h || [];
    var k = sha256.k = sha256.k || [];
    var primeCounter = k.length;
    var isComposite = {};
    for (var candidate = 2; primeCounter < 64; candidate++) {
      if (!isComposite[candidate]) {
        for (i = 0; i < 313; i += candidate) isComposite[i] = candidate;
        hash[primeCounter] = (mathPow(candidate, .5) * maxWord) | 0;
        k[primeCounter++] = (mathPow(candidate, 1 / 3) * maxWord) | 0;
      }
    }
    ascii += '\x80';
    while (ascii.length % 64 - 56) ascii += '\x00';
    for (i = 0; i < ascii.length; i++) {
      j = ascii.charCodeAt(i);
      if (j >> 8) return '';
      words[i >> 2] |= j << ((3 - i) % 4) * 8;
    }
    words[words.length] = ((asciiBitLength / maxWord) | 0);
    words[words.length] = (asciiBitLength);
    for (j = 0; j < words.length;) {
      var w = words.slice(j, j += 16);
      var oldHash = hash;
      hash = hash.slice(0, 8);
      for (i = 0; i < 64; i++) {
        var w15 = w[i - 15], w2 = w[i - 2];
        var a = hash[0], e = hash[4];
        var temp1 = hash[7]
          + (rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25))
          + ((e & hash[5]) ^ ((~e) & hash[6]))
          + k[i]
          + (w[i] = (i < 16) ? w[i] : (
            w[i - 16]
            + (rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3))
            + w[i - 7]
            + (rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10))
          ) | 0);
        var temp2 = (rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22))
          + ((a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2]));
        hash = [(temp1 + temp2) | 0].concat(hash);
        hash[4] = (hash[4] + temp1) | 0;
      }
      for (i = 0; i < 8; i++) hash[i] = (hash[i] + oldHash[i]) | 0;
    }
    for (i = 0; i < 8; i++) {
      for (j = 3; j + 1; j--) {
        var b = (hash[i] >> (j * 8)) & 255;
        result += ((b < 16) ? '0' : '') + b.toString(16);
      }
    }
    return result;
  }

  function normalize(value) {
    return String(value || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  }

  var form = document.getElementById('unlock-form');
  if (!form) return; // every other page has nothing to unlock

  var input = document.getElementById('code');
  var button = document.getElementById('unlock-btn');
  var field = document.getElementById('f-code');
  var fieldError = document.getElementById('code-error');
  var alertBox = document.getElementById('unlock-error');
  var success = document.getElementById('dl-unlocked');
  var lockedPanel = document.getElementById('dl-locked-panel');
  var relockBtn = document.getElementById('dl-relock');
  var links = Array.prototype.slice.call(document.querySelectorAll('[data-dl]'));
  var states = Array.prototype.slice.call(document.querySelectorAll('[data-dl-state]'));
  var tries = 0;
  var busyUntil = 0;

  function remembered() {
    try { return localStorage.getItem(STORE) === '1'; } catch (e) { return false; }
  }
  function remember(on) {
    try { if (on) localStorage.setItem(STORE, '1'); else localStorage.removeItem(STORE); } catch (e) { /* private mode: lasts for this page */ }
  }
  function setFieldError(msg) {
    if (fieldError) fieldError.textContent = msg || '';
    if (field) field.classList.toggle('has-error', !!msg);
    if (input) { if (msg) input.setAttribute('aria-invalid', 'true'); else input.removeAttribute('aria-invalid'); }
  }
  function setAlert(msg) {
    if (!alertBox) return;
    alertBox.textContent = msg || '';
    alertBox.classList.toggle('show', !!msg);
  }
  function paint(locked) {
    links.forEach(function (a) {
      if (locked) {
        a.classList.add('is-locked');
        a.setAttribute('aria-disabled', 'true');
        a.setAttribute('tabindex', '-1');
      } else {
        a.classList.remove('is-locked');
        a.removeAttribute('aria-disabled');
        a.removeAttribute('tabindex');
      }
    });
    states.forEach(function (s) {
      s.textContent = locked ? 'Locked' : 'Unlocked';
      s.classList.toggle('is-on', !locked);
    });
    if (lockedPanel) lockedPanel.hidden = !locked;
    if (success) success.hidden = locked;
    document.body.classList.toggle('downloads-unlocked', !locked);
  }
  function unlock(focus) {
    paint(false);
    remember(true);
    if (focus && success) success.focus();
    if (window.gbTrack) window.gbTrack('downloads_unlocked');
  }
  function startCooldown() {
    busyUntil = Date.now() + LOCKOUT_MS;
    if (button) button.disabled = true;
    if (input) input.disabled = true;
    setAlert('Too many tries. Wait ' + Math.round(LOCKOUT_MS / 1000) + ' seconds and try again.');
    window.setTimeout(function () {
      if (button) button.disabled = false;
      if (input) input.disabled = false;
      setAlert('');
      setFieldError('');
      tries = 0;
      if (input) input.focus();
    }, LOCKOUT_MS);
  }

  if (remembered()) paint(false);

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (Date.now() < busyUntil) return;
    var raw = input ? input.value : '';
    if (!normalize(raw)) {
      setFieldError('Enter the code from your invite email.');
      if (input) input.focus();
      return;
    }
    if (ACCEPTED.indexOf(sha256(normalize(raw))) !== -1) {
      setFieldError('');
      setAlert('');
      unlock(true);
      return;
    }
    tries++;
    setFieldError('That code doesn\u2019t match. Check your invite email, or ask us and we\u2019ll send a fresh one.');
    if (input) input.select();
    if (tries >= MAX_TRIES) startCooldown();
  });

  if (input) input.addEventListener('input', function () { setFieldError(''); });

  if (relockBtn) relockBtn.addEventListener('click', function () {
    remember(false);
    paint(true);
    setAlert('');
    setFieldError('');
    if (input) { input.value = ''; input.focus(); }
  });

  /* Locked links are inert even if something focuses them (for example, a saved page). */
  document.addEventListener('click', function (e) {
    var a = e.target && e.target.closest ? e.target.closest('[data-dl]') : null;
    if (a && a.classList.contains('is-locked')) e.preventDefault();
  });
})();
