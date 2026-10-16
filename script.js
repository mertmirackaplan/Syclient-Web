// Syclient Labs — Canonical Telemetry, Recorded Trace Viewer & Audit-Compliant Controller

const consoleTraces = {
  agent: `<span class="hl-dim">// MODEL: OMI-740M-v1.0-PoC (Q4_K_M) + HOST HARNESS v0.4</span>
<span class="hl-key">[MODEL_OUT]</span> Emits structured JSON tool call (GBNF-constrained):
            {"tool": "fs.apply_diff", "target": "src/alloc/arena.rs"}
<span class="hl-key">[HARNESS]</span>   Host runtime validates schema & executes local patch
<span class="hl-ok">[METRICS]</span>   Prefill (512 tok): 185ms | Decode: 42.6 tok/s (Apple M2 Max)
<span class="hl-dim">STATUS: Internal Evaluation Trace (Zero External Network I/O)</span>`,

  diff: `<span class="hl-dim">// RECORDED TRACE // SINGLE-FILE AST DIFF SYNTHESIS</span>
<span class="hl-key">[INPUT]</span>     git diff HEAD~1 -- src/kernel/rope_embed.py (384 tokens)
<span class="hl-key">[MODEL_COT]</span> Detected rotary base theta float-cast omission in slice.
<span class="hl-ok">--- a/src/kernel/rope_embed.py</span>
<span class="hl-ok">+++ b/src/kernel/rope_embed.py</span>
@@ -42,2 +42,2 @@
- inv_freq = 1.0 / (10000 ** (torch.arange(0, dim, 2) / dim))
+ inv_freq = 1.0 / (theta ** (torch.arange(0, dim, 2).float() / dim))`,

  weights: `<span class="hl-dim">// CANONICAL CHECKPOINT METADATA // OMI-740M v1.0-PoC</span>
<span class="hl-key">RELEASE_STATE:</span>  Validated PoC Checkpoint (Oct 2026)
<span class="hl-key">PARAMETERS:</span>     740,418,560 Dense (Random Gaussian Init on A100)
<span class="hl-key">CORPUS_SIZE:</span>    4.0 Billion Tokens (Code, AST Diffs, Tool Schemas)
<span class="hl-key">PRECISION:</span>      bfloat16 (Master) / 4-bit Q4_K_M GGUF (984 MB RSS)
<span class="hl-ok">NEXT_PHASE:</span>     OMI-1B v2.0 (100B Tokens Planned on 8x A100/H100)`
};

const sandboxScenarios = {
  tool: `[TRACE_TYPE] Recorded Evaluation Transcript (Not Live Browser Inference)
[ENVIRONMENT] Apple M2 Max (64GB) • llama.cpp b3840 • OMI-740M-v1.0-PoC-Q4_K_M.gguf
[PROMPT] "Inspect local port 8089 and terminate any stalled Python worker."

--- LAYER 1: MODEL WEIGHT OUTPUT (OMI-740M) ---
<thought>
User wants to free port 8089. I should invoke system.process_inspector first.
</thought>
<tool_call>
{"name": "system.process_inspector", "args": {"port": 8089, "filter": "python"}}
</tool_call>

--- LAYER 3: HOST HARNESS EXECUTION (Syclient Harness v0.4) ---
[HARNESS_SCHEMA_CHECK] Valid JSON (GBNF enforced). Executing read-only probe...
[HOST_STDOUT] PID 48192 (python3 -m worker.daemon) listening on 127.0.0.1:8089

[BENCHMARK] TTFT: 178ms | Decode Velocity: 43.2 tok/s | Peak RSS: 984 MB`,

  refactor: `[TRACE_TYPE] Recorded Evaluation Transcript — Single-File Refactoring
[ENVIRONMENT] NVIDIA RTX 4060 Laptop GPU • OMI-740M-v1.0-PoC-Q4_K_M.gguf
[PROMPT] "Convert this O(N^2) list deduplication function into O(N) preserving order."

--- LAYER 1: MODEL WEIGHT OUTPUT (OMI-740M) ---
<thought>
1. Input function iterates over list inside list comprehension: O(N^2).
2. Track seen elements with a local hash set binding seen.add for O(1) lookup.
</thought>

def deduplicate_tokens(seq: list[int]) -> list[int]:
    seen = set()
    seen_add = seen.add
    return [tok for tok in seq if not (tok in seen or seen_add(tok))]

[BENCHMARK] TTFT: 142ms | Decode Velocity: 46.8 tok/s | Syntax Check: PASS`,

  offline: `[TRACE_TYPE] Documented Model Limitation & Boundary Case (Audit Disclosure)
[ENVIRONMENT] OMI-740M-v1.0-PoC-Q4_K_M.gguf (8K Active Context Window)
[PROMPT] "Refactor cross-module dependency graph across 18 repository files simultaneously."

--- LAYER 1: MODEL WEIGHT OUTPUT & BOUNDARY ---
<thought>
Context contains 18 files (~26,400 tokens). At 740M parameter scale trained on
4B PoC tokens, long-range cross-file symbol resolution beyond 8K tokens degrades.
</thought>

[HARNESS_GUARD_TRIGGERED]
Warning: Multi-file dependency graph exceeds OMI-740M v1.0-PoC reliable edit horizon
(recommended <= 3 files / 8K context per pass).
Action: Host harness automatically chunks task into sequential single-file AST passes.
Note: Full 32K multi-file repository synthesis is targeted for OMI-1B v2.0 (100B tokens).`
};

// Single Official Technical Report Database for research.html
const technicalReportsDB = {
  tr01: {
    code: 'SYC-TR-2026-01 // PRELIMINARY TECHNICAL REPORT',
    cat: 'OMI-740M v1.0-PoC EVALUATION',
    date: 'OCTOBER 2026 • REVISION 1.2',
    title: 'From-Scratch 740M Foundation Model (OMI-740M v1.0-PoC): Pre-Training Convergence, Layer Separation, and Hardware Benchmark Protocol',
    body: 'This technical report documents the completed Phase-1 Proof-of-Concept (OMI-740M v1.0-PoC) developed at Syclient Labs. We strictly distinguish between capabilities learned by the 740M neural weights during 4B-token pre-training on single-node A100 silicon, memory efficiency provided by 4-bit GGUF quantization in the local runtime, and deterministic schema validation enforced by the external host agent harness.',
    telemetry: `[MODEL_IDENTIFIER]  OMI-740M v1.0-PoC (740,418,560 Dense Parameters)
[RELEASE_STATUS]    Completed PoC Checkpoint (Internal Evaluation Verified)
[TRAINING_CORPUS]   4.0 Billion Tokens (Code, AST Diffs, CoT, Tool Schemas)
[HARDWARE_TESTBED]  Apple M2 Max (64GB Metal) & NVIDIA RTX 4060 Mobile
[MEASURED_TTFT]     185ms (at 512-token prompt context, batch=1)
[DECODE_THROUGHPUT] 42.6 tokens/sec (Q4_K_M GGUF, 984 MB Resident RAM)
[KNOWN_BOUNDARIES]  Optimal at <=8K context (1-3 files); 32K via dynamic RoPE scaling
[PHASE_2_ROADMAP]   OMI-1B v2.0 (1.0B Params / 100B Tokens on 8x A100/H100)`,
    bibtex: `@techreport{syclient2026omi740m,
  title       = {From-Scratch 740M Foundation Model (OMI-740M v1.0-PoC): Pre-Training Convergence and Benchmark Protocol},
  author      = {Syclient Labs Research},
  institution = {Syclient Labs},
  number      = {SYC-TR-2026-01},
  year        = {2026},
  month       = {October},
  note        = {Preliminary Internal Evaluation Report},
  url         = {https://syclient.ai/research.html}
}`
  }
};

document.addEventListener('DOMContentLoaded', () => {
  // 1.Smooth Scroll Reveal Observer (Spring Stagger)
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
    '.cap-cell',
    '.spec-row',
    '.phase-col',
    '.featured-paper-main > div',
    '.paper-card'
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

  // 2. Liquid Glass Dynamic Cursor Specular Sheen
  const glassInteractiveCards = document.querySelectorAll(
    '.cap-cell, .stat-box, .pillar-row, .phase-col, .cta-matrix, .paper-card'
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

  // 3. Hero Console Tabs with Smooth Cross-Fade
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

  // 4. Sandbox Modal with Transparent Recorded Trace Viewer (#8 & #12)
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
      window.syclientTelemetry.track('sandbox_opened', { model: 'OMI-740M-v1.0-PoC' });
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

  // 5. Report Reader Modal Logic (research.html)
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

  // 6. Partner Modal Logic (Triggered from Model Registry & Footer)
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

  // 7. Partnership Form Validation (#13), Loading State (#12) & Redirect to Thank You Page (#14)
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
        submitBtnText.textContent = 'SUBMITTING INQUIRY...';
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

  // 8. Cookie & Storage Banner (#17)
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
