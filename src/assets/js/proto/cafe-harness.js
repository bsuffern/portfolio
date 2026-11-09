// PROTOTYPE harness for /proto/cafe/. Each scene file pushes { name, label, pixel?, create(canvas, env) }
// onto window.cafeScenes; create returns { resize(w, h, dpr), draw(t, dt), destroy?() }.
(() => {
  const scenes = window.cafeScenes || [];
  const stage = document.querySelector("[data-proto-stage]");
  const picker = document.querySelector(".proto-picker");
  if (!stage || !picker) return;
  const highlight = picker.querySelector(".proto-picker-highlight");
  const items = [...picker.querySelectorAll(".proto-picker-item:not(.proto-picker-replay)")];
  const replay = picker.querySelector(".proto-picker-replay");
  const reduce = matchMedia("(prefers-reduced-motion: reduce)");

  let current = 0, inst = null, raf = 0, last = 0, t0 = 0, onScreen = true;

  const now = () => (performance.now() - t0) / 1000;

  function frame(ts) {
    raf = 0;
    if (!inst) return;
    const dt = Math.min(0.05, (ts - last) / 1000 || 0);
    last = ts;
    inst.draw(now(), dt);
    if (!reduce.matches && onScreen && !document.hidden) raf = requestAnimationFrame(frame);
  }
  function start() {
    if (raf) return;
    last = performance.now();
    raf = requestAnimationFrame(frame);
  }
  function stop() { cancelAnimationFrame(raf); raf = 0; }
  // Reduced motion: no loop, but scenes can ask for a single redraw after user input.
  function requestDraw() { if (!raf) raf = requestAnimationFrame(frame); }

  function resize() {
    if (!inst) return;
    const r = stage.getBoundingClientRect();
    inst.resize(r.width, r.height, Math.min(window.devicePixelRatio || 1, 2));
    inst.draw(now(), 0);
  }

  function mount(i) {
    stop();
    inst?.destroy?.();
    inst = null;
    stage.innerHTML = "";
    const canvas = document.createElement("canvas");
    stage.append(canvas);
    stage.toggleAttribute("data-pixel", !!scenes[i].pixel);
    stage.setAttribute("aria-label", scenes[i].label);
    t0 = performance.now();
    inst = scenes[i].create(canvas, { reduced: reduce.matches, requestDraw });
    resize();
    start();
  }

  function moveHighlight() {
    const el = items[current];
    highlight.style.width = el.offsetWidth + "px";
    highlight.style.transform = `translateX(${el.offsetLeft}px)`;
  }

  function setActive(i) {
    if (i < 0 || i >= scenes.length) return;
    current = i;
    items.forEach((el, j) => {
      el.toggleAttribute("data-active", j === i);
      if (j === i) el.setAttribute("aria-current", "true");
      else el.removeAttribute("aria-current");
    });
    moveHighlight();
    const url = new URL(location);
    url.searchParams.set("v", i + 1);
    history.replaceState(history.state, "", url);
    mount(i);
  }

  items.forEach((el, i) => el.addEventListener("click", () => setActive(i)));
  replay?.addEventListener("click", () => mount(current));
  window.addEventListener("resize", moveHighlight);

  document.addEventListener("keydown", (e) => {
    if (/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName) || e.target.isContentEditable) return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const num = parseInt(e.key, 10);
    if (num >= 1 && num <= scenes.length) setActive(num - 1);
    else if (e.key === "ArrowRight") setActive((current + 1) % scenes.length);
    else if (e.key === "ArrowLeft") setActive((current - 1 + scenes.length) % scenes.length);
    else if (e.key === "r" || e.key === "R") mount(current);
  });

  new ResizeObserver(resize).observe(stage);
  new IntersectionObserver(([e]) => {
    onScreen = e.isIntersecting;
    if (onScreen && !reduce.matches) start(); else stop();
  }).observe(stage);
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden && onScreen && !reduce.matches) start(); else stop();
  });

  setActive((parseInt(new URLSearchParams(location.search).get("v"), 10) || 1) - 1);
  requestAnimationFrame(() => requestAnimationFrame(() => picker.setAttribute("data-ready", "")));
})();
