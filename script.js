// Syclient Neo-Swiss + HyperLocal + Liquid Glass Interactive Controller

const consoleTraces = {
  agent: `<span class="hl-dim">// LOCAL RUNTIME: OMI-740M-Q4_K_M.gguf (984 MB RAM)</span>
<span class="hl-key">[TASK]</span> Inspect local git worktree & patch memory regression
<span class="hl-key">[COT]</span>  1. Parse AST of src/alloc/arena.rs
       2. Identify unfreed buffer in slice reallocation
       3. Dispatch local tool: <span class="hl-ok">fs.apply_unified_diff()</span>
<span class="hl-ok">[EXEC]</span> Tool call completed in 18ms (0 bytes network egress)
<span class="hl-dim">THROUGHPUT: 44.8 tok/sec | KV-CACHE: GQA-OPTIMIZED</span>`,

  diff: `<span class="hl-dim">// ALGORITHMIC REASONING TRACE // DIFF-COT</span>
<span class="hl-key">[INPUT]</span> git diff HEAD~1 -- src/kernel/rope_embed.py
<span class="hl-key">[REASON]</span> Rotary frequency base theta scaling mismatch detected
         under dynamic context extension.
<span class="hl-ok">--- a/src/kernel/rope_embed.py</span>
<span class="hl-ok">+++ b/src/kernel/rope_embed.py</span>
@@ -42,2 +42,2 @@
- inv_freq = 1.0 / (10000 ** (torch.arange(0, dim, 2) / dim))
+ inv_freq = 1.0 / (theta ** (torch.arange(0, dim, 2).float() / dim))`,

  weights: `<span class="hl-dim">// TRUE PRE-TRAINING CHECKPOINT MANIFEST</span>
<span class="hl-key">INIT_MODE:</span>      Random Gaussian (Zero Open-Weight Inheritance)
<span class="hl-key">ARCHITECTURE:</span>   Decoder-Only Transformer (SwiGLU + RoPE)
<span class="hl-key">ATTENTION:</span>      Grouped-Query Attention + FlashAttention-2
<span class="hl-key">PRECISION:</span>      bfloat16 (Train) -> 4-bit Q4_K_M (Edge)
<span class="hl-ok">STATUS:</span>         4.0B Token PoC Convergence Verified on A100`
};

const sandboxScenarios = {
  tool: `> syclient-run --model omi-740m-q4_k_m.gguf --offline
[INIT] Loaded 740M weights into 992 MB Unified Memory.
[USER] "Scan local port bindings and kill any zombie Python worker."

<thought>
User requires local system inspection.
Selecting native tool: system.process_inspector
</thought>

<tool_call>
{"name": "system.process_inspector", "args": {"filter": "python", "state": "zombie"}}
</tool_call>

[LOCAL_TOOL_OUTPUT] PID 48192 (python3 -m worker.daemon) holding :8089
<tool_call>
{"name": "system.terminate_pid", "args": {"pid": 48192, "signal": "SIGTERM"}}
</tool_call>

[DONE] Process 48192 terminated cleanly. Speed: 43.2 tokens/sec (100% On-Device).`,

  refactor: `> syclient-run --model omi-740m-q4_k_m.gguf --mode cot-code
[USER] "Optimize this O(N^2) token deduplication loop into O(N)."

<thought>
1. Current implementation uses nested list comprehension over sequence_ids.
2. Preserve order while achieving O(1) lookup via hash set tracking.
</thought>

def deduplicate_tokens(seq: list[int]) -> list[int]:
    seen = set()
    seen_add = seen.add
    return [tok for tok in seq if not (tok in seen or seen_add(tok))]

[METRICS] Latency: 210ms | Memory Delta: +14MB | Cloud API Calls: 0`,

  offline: `> syclient-run --model omi-740m-q4_k_m.gguf --airgap-strict
[SECURITY] Network interfaces disabled. Zero-Data-Leak guard active.
[USER] "Audit auth_middleware.ts for timing attack vulnerabilities."

<thought>
Comparing HMAC signatures using standard '===' leaks byte-mismatch timing.
Recommend crypto.timingSafeEqual on Buffer representations.
</thought>

[FINDING] Line 84: Replace direct string comparison with constant-time buffer verification.
[VERIFIED] Zero bytes transmitted externally. Full compliance maintained.`
};

// Single Official Technical Report Database for research.html
const technicalReportsDB = {
  tr01: {
    code: 'SYC-TR-2026-01 // TECHNICAL MONOGRAPH',
    cat: 'PRE-TRAINING & TOPOLOGY',
    date: 'OCTOBER 2026 • 34 PAGES',
    title: 'From-Scratch 740M Foundation Model: Convergence Stability, Custom Tokenizer Design, and GQA Edge Scaling on A100 Silicon',
    body: 'Most sub-billion parameter models rely on knowledge distillation or LoRA adapters atop general web checkpoints, inheriting bloated vocabularies and suboptimal attention head ratios. In this monograph, we detail the end-to-end pre-training of our 740M sovereign decoder architecture initialized from scratch. Using a custom byte-level BPE tokenizer optimized for whitespace indentation, multi-file diffs, and JSON tool schemas, we trained on 4B high-signal tokens in bfloat16 precision with zero irrecoverable gradient spikes.',
    telemetry: `[EXPERIMENT_ID]   OMI-740M-POC-A100
[PARAMETERS]      740,418,560 (24 Layers, 1536 Hidden Dim)
[ATTENTION]       Grouped-Query Attention (16 Query / 4 KV Heads) + FlashAttention-2
[ACTIVATION]      SwiGLU + RMSNorm (eps=1e-5) + RoPE (theta=10000.0)
[QUANTIZATION]    4-Bit Q4_K_M GGUF (~984 MB RAM, 42.6+ tokens/sec)
[FINAL_LOSS]      1.842 Cross-Entropy (4.0B Token PoC Horizon)
[NEXT_MILESTONE]  1B Parameters / 100B Tokens on 8x A100/H100 Cluster`,
    bibtex: `@techreport{syclient2026omi740m,
  title       = {From-Scratch 740M Foundation Model: Convergence Stability and GQA Scaling},
  author      = {Syclient AI Research Lab},
  institution = {Syclient Labs},
  number      = {SYC-TR-2026-01},
  year        = {2026},
  month       = {October},
  url         = {https://syclient.ai/research.html}
}`
  }
};

document.addEventListener('DOMContentLoaded', () => {
  // 1. HyperLocal Hardware & Timezone Detection
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'LOCAL-SILICON-ZONE';
  const cores = navigator.hardwareConcurrency || 8;

  const hlNodeCoord = document.getElementById('hlNodeCoord');
  const hlHardwareThreads = document.getElementById('hlHardwareThreads');
  const hlTimezoneStamp = document.getElementById('hlTimezoneStamp');
  const receiptTz = document.getElementById('receiptTz');
  const receiptCores = document.getElementById('receiptCores');
  const hlLocalClock = document.getElementById('hlLocalClock');

  if (hlNodeCoord) hlNodeCoord.textContent = `NODE.ZONE // ${tz.toUpperCase()}`;
  if (hlHardwareThreads) hlHardwareThreads.textContent = `SILICON // ${cores} LOGICAL CORES`;
  if (hlTimezoneStamp) hlTimezoneStamp.textContent = `ZONE // ${tz.toUpperCase()}`;
  if (receiptTz) receiptTz.textContent = tz.toUpperCase();
  if (receiptCores) receiptCores.textContent = `${cores} LOGICAL THREADS`;

  function updateClock() {
    if (!hlLocalClock) return;
    const now = new Date();
    hlLocalClock.textContent = `LOCAL.TIME // ${now.toTimeString().split(' ')[0]}`;
  }
  updateClock();
  setInterval(updateClock, 1000);

  // 1.5 Live 8-Bit Pixel Art Tensor Matrix Animation (Q4_K_M Weight Visualizer)
  const pixelTensorGrid = document.getElementById('pixelTensorGrid');
  if (pixelTensorGrid) {
    const totalCells = 36; // 12x3 pixel matrix
    const cells = [];
    for (let i = 0; i < totalCells; i++) {
      const cell = document.createElement('div');
      cell.className = 'px-cell';
      pixelTensorGrid.appendChild(cell);
      cells.push(cell);
    }

    function stepPixelMatrix() {
      cells.forEach((c) => {
        c.className = 'px-cell';
        const r = Math.random();
        if (r > 0.82) {
          c.classList.add('active-orange');
        } else if (r > 0.55) {
          c.classList.add('active-dark');
        } else if (r > 0.44) {
          c.classList.add('active-green');
        }
      });
    }
    stepPixelMatrix();
    setInterval(stepPixelMatrix, 420);
  }

  // 2. Smooth Scroll Reveal Observer (Spring Stagger)
  const revealSelectors = [
    '.hero-eyebrow',
    '.hero-title',
    '.hero-subtitle',
    '.cta-matrix',
    '.stat-box',
    '.console-panel',
    '.section-sidebar > div',
    '.pillar-row',
    '.hl-radar-col > div',
    '.hyperlocal-ticket',
    '.cap-cell',
    '.spec-row',
    '.phase-col',
    '.featured-paper-main > div',
    '.paper-card',
    '.investor-main > div',
    '.investor-action > div'
  ];

  const elementsToReveal = document.querySelectorAll(revealSelectors.join(', '));
  elementsToReveal.forEach((el, idx) => {
    el.classList.add('reveal-up');
    const staggerMs = (idx % 4) * 65;
    el.style.setProperty('--reveal-delay', `${staggerMs}ms`);
  });

  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in-view');
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -30px 0px' }
    );

    elementsToReveal.forEach((el) => revealObserver.observe(el));
  } else {
    elementsToReveal.forEach((el) => el.classList.add('in-view'));
  }

  // 3. Liquid Glass Dynamic Cursor Specular Sheen
  const glassInteractiveCards = document.querySelectorAll(
    '.cap-cell, .stat-box, .pillar-row, .phase-col, .hyperlocal-ticket, .cta-matrix, .paper-card'
  );

  glassInteractiveCards.forEach((card) => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      card.style.setProperty('--mouse-x', `${x}px`);
      card.style.setProperty('--mouse-y', `${y}px`);
    });
  });

  // 4. Subtle 3D Tilt on HyperLocal Diagnostic Ticket
  const ticket = document.querySelector('.hyperlocal-ticket');
  if (ticket && window.matchMedia('(pointer: fine)').matches) {
    ticket.addEventListener('mousemove', (e) => {
      const rect = ticket.getBoundingClientRect();
      const relX = (e.clientX - rect.left) / rect.width - 0.5;
      const relY = (e.clientY - rect.top) / rect.height - 0.5;
      const rotX = (relY * -7).toFixed(2);
      const rotY = (relX * 7).toFixed(2);
      ticket.style.transform = `perspective(900px) rotateX(${rotX}deg) rotateY(${rotY}deg) translate3d(-2px, -4px, 0)`;
    });

    ticket.addEventListener('mouseleave', () => {
      ticket.style.transform = '';
    });
  }

  // 5. Hero Console Tabs with Smooth Cross-Fade
  const consoleOutput = document.getElementById('consoleOutput');
  const tabs = document.querySelectorAll('.console-tab');

  if (consoleOutput) {
    consoleOutput.innerHTML = consoleTraces.agent;
  }

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      tabs.forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');
      const key = tab.getAttribute('data-trace');
      if (consoleOutput && consoleTraces[key]) {
        consoleOutput.classList.add('switching');
        setTimeout(() => {
          consoleOutput.innerHTML = consoleTraces[key];
          consoleOutput.classList.remove('switching');
        }, 160);
      }
      if (window.syclientTelemetry) {
        window.syclientTelemetry.track('console_tab_switch', { tab: key });
      }
    });
  });

  // 6. Sandbox Modal with Smooth Loading State (#12)
  const modal = document.getElementById('sandboxModal');
  const openBtn = document.getElementById('openSandboxBtn');
  const mobileSandboxBtn = document.getElementById('mobileSandboxBtn');
  const closeBtn = document.getElementById('closeSandboxBtn');
  const terminal = document.getElementById('sandboxTerminal');
  const chips = document.querySelectorAll('.prompt-chip');
  const sandboxLoader = document.getElementById('sandboxLoader');
  const loaderBarFill = document.getElementById('loaderBarFill');
  const loaderPercent = document.getElementById('loaderPercent');

  let typingTimer = null;
  let loadTimer = null;

  function runScenarioWithLoading(text) {
    if (!terminal) return;
    if (typingTimer) clearInterval(typingTimer);
    if (loadTimer) clearInterval(loadTimer);

    terminal.textContent = '';

    if (sandboxLoader && loaderBarFill && loaderPercent) {
      sandboxLoader.classList.add('active');
      let progress = 0;
      loaderBarFill.style.width = '0%';
      loaderPercent.textContent = '0%';

      loadTimer = setInterval(() => {
        progress += 25;
        if (progress > 100) progress = 100;
        loaderBarFill.style.width = `${progress}%`;
        loaderPercent.textContent = `${progress}%`;

        if (progress >= 100) {
          clearInterval(loadTimer);
          setTimeout(() => {
            sandboxLoader.classList.remove('active');
            typeText(text);
          }, 120);
        }
      }, 65);
    } else {
      typeText(text);
    }
  }

  function typeText(text) {
    if (!terminal) return;
    if (typingTimer) clearInterval(typingTimer);
    terminal.textContent = '';
    let idx = 0;
    typingTimer = setInterval(() => {
      terminal.textContent += text.charAt(idx);
      idx++;
      if (idx >= text.length) {
        clearInterval(typingTimer);
      }
    }, 5);
  }

  function openSandboxModal() {
    if (!modal) return;
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    runScenarioWithLoading(sandboxScenarios.tool);
    if (window.syclientTelemetry) {
      window.syclientTelemetry.track('sandbox_opened', { model: 'OMI-740M-Q4_K_M' });
    }
  }

  if (openBtn) openBtn.addEventListener('click', openSandboxModal);
  if (mobileSandboxBtn) mobileSandboxBtn.addEventListener('click', openSandboxModal);

  if (closeBtn && modal) {
    closeBtn.addEventListener('click', () => {
      modal.classList.remove('open');
      modal.setAttribute('aria-hidden', 'true');
      if (typingTimer) clearInterval(typingTimer);
      if (loadTimer) clearInterval(loadTimer);
    });
  }

  // 7. Research Page Filtering, Live Search & Monograph Reader Modal
  const filterBtns = document.querySelectorAll('.filter-btn');
  const searchInput = document.getElementById('researchSearchInput');
  const paperCards = document.querySelectorAll('.paper-card');

  let activeFilter = 'all';
  let searchQuery = '';

  function filterPapers() {
    paperCards.forEach((card) => {
      const cat = card.getAttribute('data-category') || '';
      const keywords = (card.getAttribute('data-keywords') || '') + ' ' + card.textContent.toLowerCase();
      const matchesCat = activeFilter === 'all' || cat === activeFilter;
      const matchesSearch = searchQuery === '' || keywords.includes(searchQuery);

      if (matchesCat && matchesSearch) {
        card.classList.remove('hidden-paper');
      } else {
        card.classList.add('hidden-paper');
      }
    });
  }

  filterBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      filterBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      activeFilter = btn.getAttribute('data-filter') || 'all';
      filterPapers();
    });
  });

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value.trim().toLowerCase();
      filterPapers();
    });
  }

  // Report Reader Modal Logic
  const reportModal = document.getElementById('reportModal');
  const closeReportModalBtn = document.getElementById('closeReportModalBtn');
  const reportBtns = document.querySelectorAll('.open-report-modal');

  const reportModalCode = document.getElementById('reportModalCode');
  const reportModalCat = document.getElementById('reportModalCat');
  const reportModalDate = document.getElementById('reportModalDate');
  const reportModalTitle = document.getElementById('reportModalTitle');
  const reportModalBody = document.getElementById('reportModalBody');
  const reportModalTelemetry = document.getElementById('reportModalTelemetry');
  const reportModalBibtex = document.getElementById('reportModalBibtex');

  reportBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const key = btn.getAttribute('data-report');
      const data = technicalReportsDB[key];
      if (!data || !reportModal) return;

      if (reportModalCode) reportModalCode.textContent = data.code;
      if (reportModalCat) reportModalCat.textContent = data.cat;
      if (reportModalDate) reportModalDate.textContent = data.date;
      if (reportModalTitle) reportModalTitle.textContent = data.title;
      if (reportModalBody) reportModalBody.textContent = data.body;
      if (reportModalTelemetry) reportModalTelemetry.textContent = data.telemetry;
      if (reportModalBibtex) reportModalBibtex.textContent = data.bibtex;

      reportModal.classList.add('open');
      reportModal.setAttribute('aria-hidden', 'false');

      if (btn.getAttribute('data-tab') === 'bibtex' && reportModalBibtex) {
        setTimeout(() => {
          reportModalBibtex.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 120);
      }
    });
  });

  if (closeReportModalBtn && reportModal) {
    closeReportModalBtn.addEventListener('click', () => {
      reportModal.classList.remove('open');
      reportModal.setAttribute('aria-hidden', 'true');
    });
  }

  // Partner Modal Logic (Triggered from Navbar & Footer)
  const partnerModal = document.getElementById('partnerModal');
  const openPartnerModalBtn = document.getElementById('openPartnerModalBtn');
  const footerPartnerBtn = document.getElementById('footerPartnerBtn');
  const closePartnerModalBtn = document.getElementById('closePartnerModalBtn');

  function openPartnerModal() {
    if (!partnerModal) return;
    partnerModal.classList.add('open');
    partnerModal.setAttribute('aria-hidden', 'false');
  }

  if (openPartnerModalBtn) openPartnerModalBtn.addEventListener('click', openPartnerModal);
  if (footerPartnerBtn) footerPartnerBtn.addEventListener('click', openPartnerModal);

  if (closePartnerModalBtn && partnerModal) {
    closePartnerModalBtn.addEventListener('click', () => {
      partnerModal.classList.remove('open');
      partnerModal.setAttribute('aria-hidden', 'true');
    });
  }

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (modal && modal.classList.contains('open')) {
        modal.classList.remove('open');
        modal.setAttribute('aria-hidden', 'true');
        if (typingTimer) clearInterval(typingTimer);
        if (loadTimer) clearInterval(loadTimer);
      }
      if (reportModal && reportModal.classList.contains('open')) {
        reportModal.classList.remove('open');
        reportModal.setAttribute('aria-hidden', 'true');
      }
      if (partnerModal && partnerModal.classList.contains('open')) {
        partnerModal.classList.remove('open');
        partnerModal.setAttribute('aria-hidden', 'true');
      }
    }
  });

  [modal, reportModal, partnerModal].forEach((m) => {
    if (!m) return;
    m.addEventListener('click', (e) => {
      if (e.target === m) {
        m.classList.remove('open');
        m.setAttribute('aria-hidden', 'true');
        if (typingTimer) clearInterval(typingTimer);
        if (loadTimer) clearInterval(loadTimer);
      }
    });
  });

  chips.forEach((chip) => {
    chip.addEventListener('click', () => {
      chips.forEach((c) => c.classList.remove('active'));
      chip.classList.add('active');
      const scenario = chip.getAttribute('data-scenario');
      if (sandboxScenarios[scenario]) {
        runScenarioWithLoading(sandboxScenarios[scenario]);
      }
    });
  });

  // 8. Partnership Form Validation (#13), Loading State (#12) & Redirect to Thank You Page (#14)
  const partnershipForm = document.getElementById('partnershipForm');
  if (partnershipForm) {
    const nameInput = document.getElementById('partnerName');
    const emailInput = document.getElementById('partnerEmail');
    const orgInput = document.getElementById('partnerOrg');
    const trackSelect = document.getElementById('partnerTrack');
    const notesInput = document.getElementById('partnerNotes');

    const errName = document.getElementById('errName');
    const errEmail = document.getElementById('errEmail');
    const errOrg = document.getElementById('errOrg');
    const errTrack = document.getElementById('errTrack');
    const errNotes = document.getElementById('errNotes');
    const formErrorBanner = document.getElementById('formErrorBanner');

    const submitBtn = document.getElementById('submitPartnerBtn');
    const submitBtnText = document.getElementById('submitBtnText');
    const submitBtnIcon = document.getElementById('submitBtnIcon');

    function setFieldError(inputEl, errEl, isInvalid) {
      if (!inputEl || !errEl) return;
      if (isInvalid) {
        inputEl.classList.add('input-error');
        errEl.classList.add('visible');
      } else {
        inputEl.classList.remove('input-error');
        errEl.classList.remove('visible');
      }
    }

    partnershipForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const nameVal = nameInput.value.trim();
      const emailVal = emailInput.value.trim();
      const orgVal = orgInput.value.trim();
      const trackVal = trackSelect.value.trim();
      const notesVal = notesInput.value.trim();

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      const badName = nameVal.length < 2;
      const badEmail = !emailRegex.test(emailVal);
      const badOrg = orgVal.length < 2;
      const badTrack = trackVal === '';
      const badNotes = notesVal.length < 15;

      setFieldError(nameInput, errName, badName);
      setFieldError(emailInput, errEmail, badEmail);
      setFieldError(orgInput, errOrg, badOrg);
      setFieldError(trackSelect, errTrack, badTrack);
      setFieldError(notesInput, errNotes, badNotes);

      if (badName || badEmail || badOrg || badTrack || badNotes) {
        if (formErrorBanner) formErrorBanner.classList.add('visible');
        if (window.syclientTelemetry) {
          window.syclientTelemetry.track('form_validation_error', {
            badName,
            badEmail,
            badOrg,
            badTrack,
            badNotes
          });
        }
        return;
      }

      if (formErrorBanner) formErrorBanner.classList.remove('visible');

      if (submitBtn && submitBtnText && submitBtnIcon) {
        submitBtn.disabled = true;
        submitBtnText.textContent = 'ENCRYPTING & DISPATCHING DOSSIER...';
        submitBtnIcon.innerHTML = '<span class="loader-spinner"></span>';
      }

      try {
        sessionStorage.setItem(
          'syclient_last_dispatch',
          JSON.stringify({
            name: nameVal,
            email: emailVal,
            org: orgVal,
            track: trackVal,
            timestamp: new Date().toISOString()
          })
        );
      } catch (_) {}

      setTimeout(() => {
        window.location.href = 'thank-you.html';
      }, 950);
    });
  }

  // 9. Cookie & Telemetry Banner (#17)
  const cookieBanner = document.getElementById('cookieBanner');
  const cookieAcceptAll = document.getElementById('cookieAcceptAll');
  const cookieEssentialOnly = document.getElementById('cookieEssentialOnly');

  try {
    const savedConsent = localStorage.getItem('syclient_cookie_consent');
    if (!savedConsent && cookieBanner) {
      cookieBanner.classList.add('visible');
    }
  } catch (_) {
    if (cookieBanner) cookieBanner.classList.add('visible');
  }

  function handleCookieChoice(choice) {
    try {
      localStorage.setItem('syclient_cookie_consent', choice);
    } catch (_) {}
    if (cookieBanner) cookieBanner.classList.remove('visible');
    if (window.syclientTelemetry) {
      window.syclientTelemetry.track('cookie_consent_updated', { level: choice });
    }
  }

  if (cookieAcceptAll) {
    cookieAcceptAll.addEventListener('click', () => handleCookieChoice('all'));
  }
  if (cookieEssentialOnly) {
    cookieEssentialOnly.addEventListener('click', () => handleCookieChoice('essential'));
  }
});
