// Client-side navigation keeps the player (outside #main) alive between pages.
(() => {
  const pageCleanups = [];

  function initPage() {
    document.querySelectorAll(".site-header nav a").forEach((a) => {
      if (location.pathname.startsWith(a.getAttribute("href"))) a.setAttribute("aria-current", "page");
      else a.removeAttribute("aria-current");
    });
    const cp = document.querySelector("[data-centerpiece]");
    if (cp) pageCleanups.push(centerpiece(cp));
    window.player?.markCurrent();
  }

  function cleanupPage() {
    while (pageCleanups.length) pageCleanups.pop()?.();
  }

  // Placeholder centerpiece: a dot field that swells around the pointer.
  function centerpiece(el) {
    const canvas = el.querySelector("canvas");
    const ctx = canvas.getContext("2d");
    const GAP = 22;
    const RADIUS = 120;
    let dots = [];
    let w = 0, h = 0, raf = 0;
    const pointer = { x: -1e4, y: -1e4 };

    const color = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

    function resize() {
      const r = el.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = r.width; h = r.height;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      dots = [];
      const ox = (w % GAP) / 2 + GAP / 2, oy = (h % GAP) / 2 + GAP / 2;
      for (let y = oy; y < h; y += GAP) for (let x = ox; x < w; x += GAP) dots.push({ x, y, s: 0 });
      draw(true);
    }

    function draw(settle) {
      const muted = color("--faint"), accent = color("--accent");
      ctx.clearRect(0, 0, w, h);
      let moving = false;
      for (const d of dots) {
        const dist = Math.hypot(d.x - pointer.x, d.y - pointer.y);
        const target = Math.max(0, 1 - dist / RADIUS);
        d.s = settle ? target : d.s + (target - d.s) * 0.18;
        if (Math.abs(target - d.s) > 0.002) moving = true;
        const r = 1.5 + d.s * 3;
        ctx.globalAlpha = 1;
        ctx.fillStyle = muted;
        ctx.beginPath(); ctx.arc(d.x, d.y, r, 0, Math.PI * 2); ctx.fill();
        if (d.s > 0.01) {
          ctx.globalAlpha = d.s;
          ctx.fillStyle = accent;
          ctx.beginPath(); ctx.arc(d.x, d.y, r, 0, Math.PI * 2); ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
      return moving;
    }

    function loop() {
      raf = draw(false) ? requestAnimationFrame(loop) : 0;
    }
    function kick() { if (!raf) raf = requestAnimationFrame(loop); }

    function move(e) {
      const r = canvas.getBoundingClientRect();
      pointer.x = e.clientX - r.left; pointer.y = e.clientY - r.top;
      kick();
    }
    function leave() { pointer.x = pointer.y = -1e4; kick(); }

    const ro = new ResizeObserver(resize);
    ro.observe(el);
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerdown", move);
    el.addEventListener("pointerleave", leave);
    el.addEventListener("pointercancel", leave);
    const scheme = matchMedia("(prefers-color-scheme: dark)");
    const redraw = () => draw(true);
    scheme.addEventListener("change", redraw);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      scheme.removeEventListener("change", redraw);
    };
  }

  initPage();

  if (window.Swup) {
    const swup = new Swup({
      containers: ["#main"],
      plugins: window.SwupHeadPlugin ? [new SwupHeadPlugin()] : [],
      // Leave feeds and other files to the browser.
      ignoreVisit: (url, { el } = {}) => el?.closest("[data-no-swup]") || /\.[a-z0-9]+$/i.test(new URL(url, location.href).pathname),
    });
    swup.hooks.before("content:replace", cleanupPage);
    swup.hooks.on("page:view", () => {
      initPage();
      document.getElementById("main")?.focus({ preventScroll: true });
    });
  }
})();
