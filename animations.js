(() => {
  const start = () => {
    const root = document.documentElement;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const reveals = Array.from(document.querySelectorAll("[data-reveal]"));
    const mobileNav = document.querySelector("[data-mobile-nav]");
    const mobileLinks = Array.from(mobileNav?.querySelectorAll("a") || []);
    const closeMenu = () => {
      mobileNav?.removeAttribute("open");
      document.body.classList.remove("mobile-menu-open");
    };
    mobileNav?.addEventListener("toggle", () => {
      document.body.classList.toggle("mobile-menu-open", Boolean(mobileNav.open));
    });
    mobileLinks.forEach((link) => link.addEventListener("click", closeMenu));
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeMenu();
    });

    root.classList.add("motion-ready");
    if (reduced) {
      reveals.forEach((element) => element.classList.add("is-visible"));
      return;
    }

    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      });
    }, { threshold: 0.13, rootMargin: "0px 0px -8% 0px" });
    reveals.forEach((element) => revealObserver.observe(element));

    const sectionObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) entry.target.classList.add("section-active");
      });
    }, { threshold: 0.08 });
    document.querySelectorAll("[data-section-active]").forEach((element) => {
      sectionObserver.observe(element);
    });

    const parallaxElements = Array.from(document.querySelectorAll("[data-parallax]"));
    let frame = 0;
    const update = () => {
      frame = 0;
      const viewport = window.innerHeight;
      const scrollable = document.documentElement.scrollHeight - viewport;
      root.style.setProperty("--scroll-progress", String(scrollable > 0 ? window.scrollY / scrollable : 0));
      parallaxElements.forEach((element) => {
        const rect = element.getBoundingClientRect();
        if (rect.bottom < -160 || rect.top > viewport + 160) return;
        const offset = (rect.top + rect.height / 2 - viewport / 2) / viewport;
        const distance = Math.max(-22, Math.min(22, offset * -34));
        element.style.setProperty("--parallax-y", distance.toFixed(2) + "px");
      });
    };
    const requestUpdate = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    addEventListener("scroll", requestUpdate, { passive: true });
    addEventListener("resize", () => {
      if (innerWidth > 1040) closeMenu();
      requestUpdate();
    });
    update();

    const tilt = document.querySelector("[data-tilt]");
    tilt?.addEventListener("pointermove", (event) => {
      if (event.pointerType === "touch") return;
      const rect = tilt.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      tilt.style.setProperty("--tilt-x", (-y * 5).toFixed(2) + "deg");
      tilt.style.setProperty("--tilt-y", (x * 6).toFixed(2) + "deg");
    });
    tilt?.addEventListener("pointerleave", () => {
      tilt.style.setProperty("--tilt-x", "0deg");
      tilt.style.setProperty("--tilt-y", "0deg");
    });
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
