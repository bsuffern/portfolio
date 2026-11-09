// PROTOTYPE scene 3 — Fogged glass: out-of-focus city lights through a misted window you can wipe clear.
(window.cafeScenes ||= []).push({
  name: "Fogged glass",
  label: "Out-of-focus city lights through a fogged café window; move across it to wipe the glass clear",
  create(canvas, env) {
    const ctx = canvas.getContext("2d");
    const TAU = Math.PI * 2;
    const mk = () => { const c = document.createElement("canvas"); return { c, x: c.getContext("2d") }; };
    const fog = mk(), layer = mk(), small = mk();
    let w = 0, h = 0, dpr = 1, W = 0, H = 0, FW = 0, FH = 0;

    let seed = 23;
    const rand = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;

    // Lights in normalised coordinates; r is a fraction of height.
    const lights = [];
    const add = (n, rgb, x0, x1, y0, y1, r0, r1, a0, a1) => {
      for (let i = 0; i < n; i++) lights.push({ x: x0 + rand() * (x1 - x0), y: y0 + rand() * (y1 - y0), r: r0 + rand() * (r1 - r0), rgb, a: a0 + rand() * (a1 - a0), ph: rand() * TAU, sp: 0.3 + rand() * 0.8 });
    };
    add(16, "255, 206, 150", 0, 1, 0.08, 0.5, 0.02, 0.045, 0.25, 0.45); // windows
    add(7, "255, 176, 92", 0.02, 0.98, 0.32, 0.5, 0.07, 0.12, 0.35, 0.55); // street lamps
    add(4, "86, 214, 205", 0.66, 0.8, 0.24, 0.34, 0.04, 0.07, 0.35, 0.5); // teal neon
    add(4, "255, 96, 132", 0.14, 0.26, 0.38, 0.46, 0.04, 0.07, 0.35, 0.5); // pink neon
    const signal = { x: 0.56, y: 0.42, r: 0.05 };
    const cars = [];
    let carT = 1.5;
    const streaks = Array.from({ length: 45 }, () => ({ x: rand(), y: rand(), v: 1.4 + rand() * 0.8, l: 0.04 + rand() * 0.05 }));
    const drips = [];
    let dripT = 0.5, refog = 0;
    const beads = Array.from({ length: 260 }, () => [rand(), rand(), rand()]);

    function bokeh(x, y, r, rgb, a) {
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, `rgba(${rgb}, ${a * 0.5})`);
      g.addColorStop(0.8, `rgba(${rgb}, ${a * 0.62})`);
      g.addColorStop(0.93, `rgba(${rgb}, ${a * 0.85})`);
      g.addColorStop(1, `rgba(${rgb}, 0)`);
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
    }

    // Wiping: stamp a soft brush along the pointer path into the fog mask.
    let last = null;
    function wipe(x, y, r) {
      const f = fog.x;
      f.globalCompositeOperation = "destination-out";
      const from = last || { x, y };
      const dist = Math.hypot(x - from.x, y - from.y), steps = Math.max(1, Math.ceil(dist / (r * 0.3)));
      for (let i = 1; i <= steps; i++) {
        const px = from.x + ((x - from.x) * i) / steps, py = from.y + ((y - from.y) * i) / steps;
        const g = f.createRadialGradient(px, py, 0, px, py, r);
        g.addColorStop(0, "rgba(0,0,0,0.9)"); g.addColorStop(0.6, "rgba(0,0,0,0.6)"); g.addColorStop(1, "rgba(0,0,0,0)");
        f.fillStyle = g; f.beginPath(); f.arc(px, py, r, 0, TAU); f.fill();
      }
      f.globalCompositeOperation = "source-over";
      last = { x, y };
    }
    const brush = () => FH * 0.11;
    const onMove = (e) => {
      const r = canvas.getBoundingClientRect();
      wipe(((e.clientX - r.left) / r.width) * FW, ((e.clientY - r.top) / r.height) * FH, brush());
      if (env.reduced) env.requestDraw();
    };
    const onEnd = () => { last = null; };
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerdown", onMove);
    ["pointerleave", "pointerup", "pointercancel"].forEach((t) => canvas.addEventListener(t, onEnd));

    // A first wipe on its own, so the glass shows what it does.
    const hint = (s) => [FW * (0.3 + s * 0.4), FH * (0.42 + Math.sin(s * TAU) * 0.07)];
    let hintS = 0;
    function runHint(t) {
      if (hintS >= 1) return;
      const s = env.reduced ? 1 : Math.min(1, Math.max(0, (t - 0.6) / 1.3));
      if (s <= hintS) return;
      const saved = last;
      last = null;
      for (let k = hintS; k <= s; k += 0.01) { const [x, y] = hint(1 - Math.pow(1 - k, 2)); wipe(x, y, brush() * 0.9); }
      hintS = s;
      last = saved;
    }

    function drawScene(t, dt) {
      const bg = ctx.createLinearGradient(0, 0, 0, H);
      bg.addColorStop(0, "#060914"); bg.addColorStop(0.45, "#111530"); bg.addColorStop(0.62, "#1b1a33"); bg.addColorStop(0.8, "#100e1a"); bg.addColorStop(1, "#08070b");
      ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
      ctx.globalCompositeOperation = "lighter";
      for (const l of lights) {
        const a = l.a * (0.85 + 0.15 * Math.sin(t * l.sp + l.ph));
        bokeh(l.x * W, l.y * H, l.r * H, l.rgb, a);
        // Smeared reflection on the wet street.
        if (l.r > 0.06) bokeh(l.x * W, (1.3 - l.y) * H * 0.98, l.r * H * 0.7, l.rgb, a * 0.18);
      }
      // Traffic signal: green, amber, red on a slow cycle.
      const cyc = (t / 6) % 3, sig = cyc < 1.6 ? "110, 240, 150" : cyc < 1.9 ? "255, 190, 70" : "255, 70, 60";
      bokeh(signal.x * W, signal.y * H, signal.r * H, sig, 0.5);
      // Cars: headlights one way, tail lights the other.
      if ((carT -= dt) < 0) { const dir = rand() < 0.5 ? 1 : -1; cars.push({ x: dir > 0 ? -0.15 : 1.15, dir, v: 0.1 + rand() * 0.06 }); carT = 4 + rand() * 6; }
      for (let i = cars.length - 1; i >= 0; i--) {
        const c = cars[i]; c.x += c.dir * c.v * dt;
        if (c.x < -0.3 || c.x > 1.3) { cars.splice(i, 1); continue; }
        const head = c.dir > 0, rgb = head ? "255, 236, 210" : "255, 64, 52", y = head ? 0.63 : 0.6, r = head ? 0.09 : 0.065;
        bokeh(c.x * W, y * H, r * H, rgb, 0.55); bokeh((c.x - 0.09 * c.dir) * W, y * H, r * H, rgb, 0.55);
      }
      // Rain falling outside, barely there.
      ctx.strokeStyle = "rgba(200, 215, 255, 0.07)"; ctx.lineWidth = 1 * dpr; ctx.beginPath();
      for (const s of streaks) {
        s.y += s.v * dt; s.x -= s.v * dt * 0.08;
        if (s.y > 1.05) { s.y = -0.1; s.x = rand() * 1.1; }
        ctx.moveTo(s.x * W, s.y * H); ctx.lineTo((s.x + s.l * 0.08) * W, (s.y - s.l) * H);
      }
      ctx.stroke();
      ctx.globalCompositeOperation = "source-over";
    }

    function drawFog() {
      // Blur by downscaling twice and back up; then milk it and mask it with the fog.
      const L = layer.x, S = small.x;
      L.globalCompositeOperation = "source-over";
      L.clearRect(0, 0, FW, FH); L.drawImage(canvas, 0, 0, FW, FH);
      S.clearRect(0, 0, small.c.width, small.c.height); S.drawImage(layer.c, 0, 0, small.c.width, small.c.height);
      L.clearRect(0, 0, FW, FH); L.drawImage(small.c, 0, 0, FW, FH);
      L.fillStyle = "rgba(168, 178, 200, 0.1)"; L.fillRect(0, 0, FW, FH);
      const warm = L.createLinearGradient(0, FH * 0.5, 0, FH);
      warm.addColorStop(0, "rgba(255, 170, 110, 0)"); warm.addColorStop(1, "rgba(255, 170, 110, 0.16)");
      L.fillStyle = warm; L.fillRect(0, 0, FW, FH);
      L.fillStyle = "rgba(235, 240, 255, 0.1)";
      for (const [bx, by, br] of beads) { L.beginPath(); L.arc(bx * FW, by * FH, 0.25 + br * 0.45, 0, TAU); L.fill(); }
      L.globalCompositeOperation = "destination-in";
      L.drawImage(fog.c, 0, 0);
      L.globalCompositeOperation = "source-over";
      ctx.drawImage(layer.c, 0, 0, W, H);
    }

    function drawDrips(dt) {
      if (!env.reduced && (dripT -= dt) < 0) { drips.push({ x: 0.05 + rand() * 0.9, y: 0.05 + rand() * 0.45, v: 0, run: 1 + rand() * 2, life: 1 }); dripT = 1.5 + rand() * 2.5; }
      const f = fog.x;
      for (let i = drips.length - 1; i >= 0; i--) {
        const d = drips[i];
        if (d.run > 0) {
          d.v = Math.min(d.v + 0.5 * dt, 0.22); d.y += d.v * dt; d.x += Math.sin(d.y * 40) * 0.0006; d.run -= dt;
          f.globalCompositeOperation = "destination-out"; f.fillStyle = "rgba(0,0,0,0.85)";
          f.beginPath(); f.arc(d.x * FW, d.y * FH, FH * 0.008, 0, TAU); f.fill();
          f.globalCompositeOperation = "source-over";
        } else d.life -= dt * 0.25;
        if (d.life <= 0 || d.y > 1.02) { drips.splice(i, 1); continue; }
        const x = d.x * W, y = d.y * H, r = H * 0.011;
        ctx.globalAlpha = Math.max(0, d.life);
        ctx.fillStyle = "rgba(8, 10, 18, 0.45)"; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
        ctx.fillStyle = "rgba(230, 236, 255, 0.55)"; ctx.beginPath(); ctx.arc(x - r * 0.3, y - r * 0.35, r * 0.32, 0, TAU); ctx.fill();
        ctx.globalAlpha = 1;
      }
    }

    function drawInside(t) {
      // Warm lamplight from inside, low and to the left.
      ctx.globalCompositeOperation = "lighter";
      const lamp = ctx.createRadialGradient(W * 0.08, H * 1.1, 0, W * 0.08, H * 1.1, H * 0.95);
      lamp.addColorStop(0, "rgba(255, 150, 70, 0.28)"); lamp.addColorStop(1, "rgba(255, 150, 70, 0)");
      ctx.fillStyle = lamp; ctx.fillRect(0, 0, W, H);
      ctx.globalCompositeOperation = "source-over";
      // Sill in focus, its edge catching the light.
      const sy = H * 0.9;
      ctx.fillStyle = "#0b0706"; ctx.fillRect(0, sy, W, H - sy);
      const edge = ctx.createLinearGradient(0, 0, W, 0);
      edge.addColorStop(0, "rgba(255, 176, 110, 0.7)"); edge.addColorStop(0.6, "rgba(255, 176, 110, 0.15)"); edge.addColorStop(1, "rgba(255, 176, 110, 0.05)");
      ctx.fillStyle = edge; ctx.fillRect(0, sy, W, Math.max(1, 1.5 * dpr));
      // Mug on the sill, rim lit from the left.
      const mx = W * 0.8, mw = H * 0.17, top = H * 0.7;
      ctx.fillStyle = "#120a07";
      ctx.beginPath(); ctx.moveTo(mx - mw / 2, top); ctx.lineTo(mx + mw / 2, top); ctx.lineTo(mx + mw * 0.46, sy - H * 0.01);
      ctx.quadraticCurveTo(mx + mw * 0.44, sy + 1, mx + mw * 0.36, sy + 1); ctx.lineTo(mx - mw * 0.36, sy + 1); ctx.quadraticCurveTo(mx - mw * 0.44, sy + 1, mx - mw * 0.46, sy - H * 0.01); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = "#120a07"; ctx.lineWidth = H * 0.025;
      ctx.beginPath(); ctx.ellipse(mx + mw * 0.58, top + H * 0.08, mw * 0.17, H * 0.05, 0, -1.4, 1.4); ctx.stroke();
      ctx.strokeStyle = "rgba(255, 180, 115, 0.65)"; ctx.lineWidth = Math.max(1, 1.5 * dpr);
      ctx.beginPath(); ctx.ellipse(mx, top, mw / 2, H * 0.018, 0, Math.PI * 0.55, Math.PI * 1.15); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(mx - mw / 2, top + 2); ctx.lineTo(mx - mw * 0.46, sy - H * 0.02); ctx.strokeStyle = "rgba(255, 170, 105, 0.3)"; ctx.stroke();
      // Steam catching the lamp.
      ctx.lineCap = "round"; ctx.lineWidth = H * 0.018;
      for (let i = 0; i < 3; i++) {
        const ph = t * 0.7 + i * 2.2, x0 = mx - mw * 0.2 + i * mw * 0.2;
        ctx.strokeStyle = `rgba(255, 222, 190, ${0.07 + 0.04 * Math.sin(ph)})`;
        ctx.beginPath(); ctx.moveTo(x0, top - H * 0.02);
        ctx.bezierCurveTo(x0 + Math.sin(ph) * H * 0.04, top - H * 0.1, x0 - Math.sin(ph + 1) * H * 0.05, top - H * 0.17, x0 + Math.sin(ph + 2) * H * 0.03, top - H * 0.26);
        ctx.stroke();
      }
      // Vignette.
      const v = ctx.createRadialGradient(W / 2, H * 0.45, H * 0.3, W / 2, H * 0.45, Math.hypot(W, H) * 0.6);
      v.addColorStop(0, "rgba(0,0,0,0)"); v.addColorStop(1, "rgba(0,0,0,0.5)");
      ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
    }

    return {
      resize(cw, ch, d) {
        w = cw; h = ch; dpr = Math.min(d, 1.5);
        W = canvas.width = Math.round(w * dpr); H = canvas.height = Math.round(h * dpr);
        const old = FW ? (() => { const c = document.createElement("canvas"); c.width = FW; c.height = FH; c.getContext("2d").drawImage(fog.c, 0, 0); return c; })() : null;
        FW = fog.c.width = layer.c.width = Math.ceil(W / 4); FH = fog.c.height = layer.c.height = Math.ceil(H / 4);
        small.c.width = Math.max(8, Math.ceil(W / 18)); small.c.height = Math.max(5, Math.ceil(H / 18));
        fog.x.fillStyle = "#000"; fog.x.fillRect(0, 0, FW, FH);
        if (old) { fog.x.clearRect(0, 0, FW, FH); fog.x.drawImage(old, 0, 0, FW, FH); }
        for (const o of [layer.x, small.x]) { o.imageSmoothingEnabled = true; o.imageSmoothingQuality = "high"; }
      },
      draw(t, dt) {
        runHint(t);
        if (!env.reduced && (refog += dt) > 0.12) {
          fog.x.fillStyle = "rgba(0,0,0,0.035)";
          while (refog > 0.12) { fog.x.fillRect(0, 0, FW, FH); refog -= 0.12; }
        }
        drawScene(t, dt);
        drawFog();
        drawDrips(dt);
        drawInside(t);
      },
      destroy() {
        canvas.removeEventListener("pointermove", onMove);
        canvas.removeEventListener("pointerdown", onMove);
        ["pointerleave", "pointerup", "pointercancel"].forEach((t) => canvas.removeEventListener(t, onEnd));
      },
    };
  },
});
