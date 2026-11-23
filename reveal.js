(() => {
  "use strict";
  const root = document.documentElement;
  if (!window.matchMedia || !window.requestAnimationFrame) return;
  const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const narrow = window.matchMedia("(max-width: 51rem)");
  const hero = document.querySelector(".hero");
  const model = hero?.querySelector(".model");
  const intro = hero?.querySelector(".intro");
  const heroHead = hero?.querySelector(".hero-head");
  const work = document.querySelector(".work");
  const elements = Array.from(document.querySelectorAll(
    ".section-head,.project,.design-board,.design-note,.appsec-note,.workspace-promo,.catalogue-link,.capability,.about-grid,.contact-row"
  ));
  const seen = new WeakSet();
  let observer, raf = 0, range = 1, maxFlight = 0, maxIntro = 0, small = false;
  const enabled = () => !motion.matches && root.dataset.motionPreference !== "off";

  function forget(item) { item.classList.remove("reveal-enter"); }
  function arm() {
    if (!enabled() || !("IntersectionObserver" in window)) return;
    observer ||= new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting || !enabled()) continue;
        const item = entry.target;
        seen.add(item);
        observer.unobserve(item);
        if (item.matches(":focus-within,:target")) continue;
        const group = item.closest(".projects,.catalogue-grid,.capability-grid");
        const columns = group ? (getComputedStyle(group).gridTemplateColumns.match(/[^\s]+/g) || []).length : 0;
        const index = group ? Array.prototype.indexOf.call(group.children, item) : 0;
        item.style.setProperty("--reveal-delay", (columns > 1 ? (index % columns) * 62 : 0) + "ms");
        item.style.setProperty("--reveal-rise", (item.matches(".section-head") ? (small ? 13 : 20) : (small ? 17 : 27)) + "px");
        item.classList.add("reveal-enter");
      }
    }, { rootMargin: "0px 0px -8% 0px", threshold: .06 });
    for (const item of elements) {
      if (seen.has(item)) continue;
      if (item.getBoundingClientRect().top < window.innerHeight - 12) seen.add(item);
      else observer.observe(item);
    }
  }
  for (const item of elements) {
    item.addEventListener("animationend", (event) => {
      if (event.target === item && event.animationName === "portfolio-arrival") forget(item);
    });
    item.addEventListener("focusin", () => forget(item));
  }

  const clamp = (value, max = 1) => Math.max(0, Math.min(max, value));
  function measure() {
    if (!hero || !model) return;
    small = narrow.matches;
    range = Math.min(hero.offsetHeight * .86, window.innerHeight * .85);
    // offsetTop ignores visual transforms. The floating figure must not cross the next section.
    const setback = hero.offsetHeight - model.offsetTop - model.offsetHeight;
    maxFlight = clamp(setback - 10, small ? 48 : 104);
    // At narrow/zoomed widths, keep the moving introduction below the kicker.
    maxIntro = intro && heroHead && intro.offsetParent === heroHead.offsetParent
      ? clamp(intro.offsetTop - heroHead.offsetTop - heroHead.offsetHeight - 8, small ? 19 : 63)
      : 0;
  }
  function paint() {
    raf = 0;
    if (!hero || !model || !work || !enabled()) return;
    const progress = clamp(window.scrollY / Math.max(1, range));
    const drift = 1 - Math.pow(1 - progress, 1.65);
    const distance = small ? .075 : .155;
    const edge = clamp((window.innerHeight - work.getBoundingClientRect().top) / (window.innerHeight * .48));
    const figureHeight = model.offsetHeight;
    hero.classList.add("hero-scrub");
    hero.style.setProperty("--intro-flight", (-maxIntro * drift).toFixed(1) + "px");
    hero.style.setProperty("--model-flight", ((maxFlight + figureHeight * distance * .34) * drift).toFixed(1) + "px");
    hero.style.setProperty("--model-distance", (1 - distance * drift).toFixed(3));
    hero.style.setProperty("--flight-edge", (.16 + Math.sin(Math.PI * progress) * .56).toFixed(3));
    work.style.setProperty("--orbit-line", (.14 + edge * .86).toFixed(3));
    work.style.setProperty("--orbit-light", (.25 + edge * .68).toFixed(3));
  }
  function queue() { if (enabled() && !raf) raf = window.requestAnimationFrame(paint); }
  function resize() { measure(); queue(); }
  function configure() {
    if (enabled()) {
      resize();
      arm();
    } else {
      if (raf) window.cancelAnimationFrame(raf);
      raf = 0;
      observer?.disconnect();
      elements.forEach(forget);
      hero?.classList.remove("hero-scrub");
      work?.style.removeProperty("--orbit-line");
      work?.style.removeProperty("--orbit-light");
    }
  }
  // Native anchors stay in charge. Never obscure the destination during a hash jump or restoration.
  function settleAnchor(hash = window.location.hash) {
    if (!hash || hash === "#") return;
    let id;
    try { id = decodeURIComponent(hash.slice(1)); } catch { return; }
    const target = document.getElementById(id);
    if (!target) return;
    const nearTarget = target.getBoundingClientRect().top + window.innerHeight * .74;
    for (const item of elements) {
      if (target === item || item.contains(target) || (target.contains(item) && item.getBoundingClientRect().top < nearTarget)) {
        seen.add(item);
        observer?.unobserve(item);
        forget(item);
      }
    }
  }
  document.addEventListener("click", (event) => {
    if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;
    const anchor = event.target.closest?.('a[href^="#"]');
    if (anchor) settleAnchor(anchor.hash);
  });
  window.addEventListener("hashchange", () => settleAnchor());
  window.addEventListener("pageshow", () => { settleAnchor(); resize(); });
  window.addEventListener("scroll", queue, {passive:true});
  window.addEventListener("resize", resize, {passive:true});
  window.addEventListener("portfolio:motion-change", configure);
  if (motion.addEventListener) motion.addEventListener("change", configure);
  else motion.addListener(configure);
  settleAnchor();
  configure();
})();
