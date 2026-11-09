// PROTOTYPE scene 2 — Paper: flat cut-paper layers at blue hour, grain on top, pointer parallax by depth.
(window.cafeScenes ||= []).push({
  name: "Paper",
  label: "Flat paper-cut illustration of a café window at dusk, rain outside and a person with a red umbrella passing by",
  create(canvas, env) {
    const ctx = canvas.getContext("2d");
    const VW = 1600, VH = 1000;
    let w = 0, h = 0, dpr = 1;

    let seed = 11;
    const rand = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;

    // Arched window: centre (800, 430), radius 370, bottom 790.
    const WIN = { cx: 800, cy: 430, r: 370, bottom: 790 };
    const windowPath = (p = new Path2D()) => {
      p.moveTo(WIN.cx - WIN.r, WIN.bottom);
      p.lineTo(WIN.cx - WIN.r, WIN.cy);
      p.arc(WIN.cx, WIN.cy, WIN.r, Math.PI, 0);
      p.lineTo(WIN.cx + WIN.r, WIN.bottom);
      p.closePath();
      return p;
    };
    const glass = windowPath();

    // Skyline, seeded once.
    const skyline = (y0, yv, minW, maxW, prob) => {
      const out = [];
      for (let x = WIN.cx - WIN.r - 120; x < WIN.cx + WIN.r + 120;) {
        const bw = minW + rand() * (maxW - minW), top = y0 + rand() * yv;
        const wins = [];
        for (let wy = top + 24; wy < 700; wy += 34) for (let wx = x + 14; wx < x + bw - 22; wx += 28) if (rand() < prob) wins.push([wx, wy]);
        out.push({ x, w: bw, top, wins, roof: rand() < 0.3 });
        x += bw + 6;
      }
      return out;
    };
    const far = skyline(250, 160, 60, 130, 0.22);
    const near = skyline(330, 140, 120, 220, 0.3);
    const rainLayers = [
      { depth: 0.55, n: 70, len: 26, a: 0.28, v: 900 },
      { depth: 0.8, n: 45, len: 44, a: 0.5, v: 1400 },
    ].map((l) => ({ ...l, drops: Array.from({ length: l.n }, () => ({ x: rand() * 1100 + 200, y: rand() * 900 })) }));
    const leaves = Array.from({ length: 11 }, (_, i) => ({ a: -0.3 + i * 0.32 + rand() * 0.2, len: 90 + rand() * 120, s: rand() * 6, dark: i % 2 }));
    const ripples = [];

    // Grain tile, drawn once.
    const grain = document.createElement("canvas");
    grain.width = grain.height = 160;
    const g = grain.getContext("2d"), gi = g.createImageData(160, 160);
    for (let i = 0; i < gi.data.length; i += 4) { const v = rand() * 255; gi.data[i] = gi.data[i + 1] = gi.data[i + 2] = v; gi.data[i + 3] = 34; }
    g.putImageData(gi, 0, 0);
    let grainPattern = null;

    // Parallax: pointer on fine pointers, a slow drift otherwise.
    const target = { x: 0, y: 0 }, cam = { x: 0, y: 0 };
    let usingPointer = false;
    const onMove = (e) => {
      if (e.pointerType !== "mouse") return;
      const r = canvas.getBoundingClientRect();
      target.x = ((e.clientX - r.left) / r.width - 0.5) * 2;
      target.y = ((e.clientY - r.top) / r.height - 0.5) * 2;
      usingPointer = true;
    };
    const onLeave = () => { usingPointer = false; };
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerleave", onLeave);

    const disc = (x, y, r, col) => { ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); };
    const at = (depth, fn) => { ctx.save(); ctx.translate(-cam.x * 40 * depth, -cam.y * 18 * depth); fn(); ctx.restore(); };

    let walker = { x: -200, dir: 1, wait: 1.5 };

    function drawOutside(t, dt) {
      // Sky in flat bands.
      const bands = ["#223259", "#2a3c69", "#344a7a", "#41598b", "#506a9a"];
      bands.forEach((c, i) => { ctx.fillStyle = c; ctx.fillRect(0, i * 130, VW, 140); });
      at(0.15, () => {
        for (const b of far) {
          ctx.fillStyle = "#1f2c4e"; ctx.fillRect(b.x, b.top, b.w, 800 - b.top);
          if (b.roof) { ctx.beginPath(); ctx.moveTo(b.x, b.top); ctx.lineTo(b.x + b.w / 2, b.top - 30); ctx.lineTo(b.x + b.w, b.top); ctx.fill(); }
          ctx.fillStyle = "#e8b871"; for (const [x, y] of b.wins) ctx.fillRect(x, y, 10, 14);
        }
      });
      at(0.35, () => {
        for (const b of near) {
          ctx.fillStyle = "#18223f"; ctx.fillRect(b.x, b.top, b.w, 800 - b.top);
          ctx.fillStyle = "#f2c47c"; for (const [x, y] of b.wins) ctx.fillRect(x, y + 10, 16, 20);
        }
        // Café across the street: awning and a warm window.
        ctx.fillStyle = "#f4c983"; ctx.fillRect(930, 560, 200, 110);
        ctx.fillStyle = "#2d3a5e"; ctx.fillRect(1020, 560, 8, 110);
        ctx.fillStyle = "#b9503d";
        ctx.beginPath(); ctx.moveTo(910, 530); ctx.lineTo(1150, 530); ctx.lineTo(1170, 570);
        for (let i = 0; i <= 8; i++) ctx.arc(1170 - i * 32.5, 570, 16.25, 0, Math.PI);
        ctx.closePath(); ctx.fill();
      });
      // Street.
      at(0.45, () => {
        ctx.fillStyle = "#151e38"; ctx.fillRect(0, 690, VW, 200);
        ctx.fillStyle = "#1c2747"; ctx.fillRect(0, 690, VW, 10);
        // Lamp reflection: flat bars that wobble.
        for (let i = 0; i < 6; i++) {
          const y = 712 + i * 13, wob = Math.sin(t * 1.8 + i * 1.3) * 10, ww = 26 - i * 2.5;
          ctx.fillStyle = `rgba(255, 206, 133, ${0.55 - i * 0.07})`;
          ctx.beginPath(); ctx.roundRect(560 - ww + wob, y, ww * 2, 6, 3); ctx.fill();
        }
        for (let i = 0; i < 4; i++) {
          const y = 712 + i * 15, wob = Math.sin(t * 1.5 + i) * 14;
          ctx.fillStyle = `rgba(244, 201, 131, ${0.3 - i * 0.06})`;
          ctx.beginPath(); ctx.roundRect(950 + wob, y, 160, 6, 3); ctx.fill();
        }
        for (let i = ripples.length - 1; i >= 0; i--) {
          const r = ripples[i]; r.age += dt;
          if (r.age > 0.8) { ripples.splice(i, 1); continue; }
          ctx.strokeStyle = `rgba(169, 189, 224, ${0.5 * (1 - r.age / 0.8)})`; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.ellipse(r.x, r.y, 4 + r.age * 30, 1.5 + r.age * 6, 0, 0, Math.PI * 2); ctx.stroke();
        }
      });
      // Street lamp with stepped halo.
      at(0.5, () => {
        [[120, 0.1], [82, 0.14], [50, 0.22]].forEach(([r, a]) => disc(560, 448, r, `rgba(255, 206, 130, ${a})`));
        ctx.fillStyle = "#0f1629"; ctx.fillRect(552, 440, 14, 260); ctx.fillRect(530, 432, 58, 12);
        disc(560, 450, 14, "#ffe2a8");
      });
      // Someone walking past with a red umbrella.
      at(0.55, () => {
        if (walker.wait > 0) { walker.wait -= dt; return; }
        walker.x += walker.dir * 70 * dt;
        if (walker.x > 1300 || walker.x < 300) { walker.dir = -walker.dir; walker.wait = 9 + rand() * 6; walker.x = walker.dir > 0 ? 300 : 1300; return; }
        const x = walker.x, step = Math.sin(t * 6), bob = Math.abs(Math.cos(t * 6)) * 3;
        ctx.strokeStyle = "#0d1426"; ctx.lineWidth = 10; ctx.lineCap = "round";
        ctx.beginPath(); ctx.moveTo(x, 660 - bob); ctx.lineTo(x + step * 14, 700); ctx.moveTo(x, 660 - bob); ctx.lineTo(x - step * 14, 700); ctx.stroke();
        ctx.fillStyle = "#0d1426"; ctx.beginPath(); ctx.roundRect(x - 16, 590 - bob, 32, 76, 12); ctx.fill();
        ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x + 4 * walker.dir, 600 - bob); ctx.lineTo(x + 4 * walker.dir, 540 - bob); ctx.stroke();
        ctx.fillStyle = "#c8553d"; ctx.beginPath(); ctx.ellipse(x + 4 * walker.dir, 545 - bob, 62, 34, 0, Math.PI, 0); ctx.fill();
        ctx.fillStyle = "#a8432f"; ctx.beginPath(); ctx.ellipse(x + 4 * walker.dir, 545 - bob, 62, 8, 0, 0, Math.PI); ctx.fill();
      });
      // Rain.
      for (const l of rainLayers) at(l.depth, () => {
        ctx.strokeStyle = `rgba(190, 208, 240, ${l.a})`; ctx.lineWidth = l.depth > 0.7 ? 3 : 2; ctx.lineCap = "round";
        ctx.beginPath();
        for (const d of l.drops) {
          d.y += l.v * dt; d.x -= l.v * dt * 0.18;
          if (d.y > 880) {
            if (l.depth > 0.7 && rand() < 0.4) ripples.push({ x: d.x, y: 720 + rand() * 60, age: 0 });
            d.y = -40 - rand() * 200; d.x = 250 + rand() * 1150;
          }
          ctx.moveTo(d.x, d.y); ctx.lineTo(d.x + l.len * 0.18, d.y - l.len);
        }
        ctx.stroke();
      });
    }

    function drawInside(t) {
      // Wall with the window cut out, then a stepped pool of lamplight.
      at(1, () => {
        const wall = new Path2D();
        wall.rect(-100, -100, VW + 200, VH + 200);
        windowPath(wall);
        ctx.save(); ctx.clip(wall, "evenodd");
        ctx.fillStyle = "#b9694a"; ctx.fillRect(-100, -100, VW + 200, VH + 200);
        [[620, 0.07], [440, 0.08], [270, 0.1]].forEach(([r, a]) => disc(1330, 170, r, `rgba(255, 196, 130, ${a})`));
        ctx.fillStyle = "#7c3f2c"; ctx.fillRect(-100, 820, VW + 200, 300);
        ctx.restore();
        // Frame, mullions and sill.
        ctx.strokeStyle = "#4a2a1d"; ctx.lineWidth = 30; ctx.stroke(glass);
        ctx.save(); ctx.clip(glass);
        ctx.fillStyle = "#4a2a1d"; ctx.fillRect(WIN.cx - 8, 0, 16, WIN.bottom); ctx.fillRect(0, WIN.cy - 8, VW, 16);
        ctx.restore();
        ctx.fillStyle = "#5c3424"; ctx.fillRect(WIN.cx - WIN.r - 50, WIN.bottom - 6, WIN.r * 2 + 100, 36);
        ctx.fillStyle = "#7d4a33"; ctx.fillRect(WIN.cx - WIN.r - 50, WIN.bottom - 6, WIN.r * 2 + 100, 8);
        // Plant pot on the sill.
        ctx.fillStyle = "#d07a4f"; ctx.beginPath(); ctx.moveTo(1040, 700); ctx.lineTo(1110, 700); ctx.lineTo(1100, 784); ctx.lineTo(1050, 784); ctx.fill();
        ctx.fillStyle = "#b5623d"; ctx.fillRect(1032, 692, 86, 18);
        for (let i = 0; i < 7; i++) {
          const a = -Math.PI / 2 + (i - 3) * 0.32 + Math.sin(t * 0.8 + i) * 0.03;
          ctx.save(); ctx.translate(1075, 700); ctx.rotate(a + Math.PI / 2);
          ctx.fillStyle = i % 2 ? "#4d6b3f" : "#5f8250"; ctx.beginPath(); ctx.ellipse(0, -60, 16, 60, 0, 0, Math.PI * 2); ctx.fill();
          ctx.restore();
        }
      });
      // Hanging plant, top left, swaying.
      at(1.15, () => {
        ctx.strokeStyle = "#3b2418"; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(250, -10); ctx.lineTo(215, 170); ctx.moveTo(250, -10); ctx.lineTo(285, 170); ctx.stroke();
        for (const l of leaves) {
          const a = l.a + Math.sin(t * 0.7 + l.s) * 0.04;
          ctx.save(); ctx.translate(250, 200); ctx.rotate(a);
          ctx.fillStyle = l.dark ? "#3f5c35" : "#56784a";
          ctx.beginPath(); ctx.ellipse(0, l.len * 0.55, 13, l.len * 0.55, 0, 0, Math.PI * 2); ctx.fill();
          ctx.restore();
        }
        ctx.fillStyle = "#e7d8c0"; ctx.beginPath(); ctx.moveTo(205, 165); ctx.lineTo(295, 165); ctx.lineTo(282, 230); ctx.lineTo(218, 230); ctx.fill();
      });
      // Pendant lamp, top right.
      at(1.15, () => {
        ctx.fillStyle = "#24170f"; ctx.fillRect(1328, -10, 4, 150);
        ctx.fillStyle = "#ffdd9e"; ctx.beginPath(); ctx.ellipse(1330, 205, 78, 14, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#2f4b44"; ctx.beginPath(); ctx.moveTo(1330, 132); ctx.bezierCurveTo(1395, 132, 1410, 185, 1410, 205); ctx.lineTo(1250, 205); ctx.bezierCurveTo(1250, 185, 1265, 132, 1330, 132); ctx.fill();
        ctx.fillStyle = "#3b5d54"; ctx.beginPath(); ctx.moveTo(1330, 132); ctx.bezierCurveTo(1300, 140, 1278, 175, 1275, 205); ctx.lineTo(1250, 205); ctx.bezierCurveTo(1250, 185, 1265, 132, 1330, 132); ctx.fill();
      });
      // Table, cup and notebook.
      at(1.3, () => {
        ctx.fillStyle = "#6b3b28"; ctx.fillRect(-100, 880, VW + 200, 220);
        ctx.fillStyle = "#8a5236"; ctx.fillRect(-100, 880, VW + 200, 12);
        // Notebook and pencil.
        ctx.save(); ctx.translate(980, 945); ctx.rotate(-0.08);
        ctx.fillStyle = "#2f4b44"; ctx.fillRect(-122, -46, 244, 92);
        ctx.fillStyle = "#efe3cb"; ctx.fillRect(-116, -42, 232, 84);
        ctx.fillStyle = "#d7c8ad"; ctx.fillRect(-2, -42, 4, 84);
        ctx.fillStyle = "#cdbd9f"; for (let i = 0; i < 4; i++) { ctx.fillRect(-98, -22 + i * 16, 80, 3); ctx.fillRect(18, -22 + i * 16, 80, 3); }
        ctx.rotate(0.5); ctx.fillStyle = "#e2b13c"; ctx.fillRect(40, -110, 150, 12); ctx.fillStyle = "#2a1c12"; ctx.beginPath(); ctx.moveTo(190, -110); ctx.lineTo(210, -104); ctx.lineTo(190, -98); ctx.fill();
        ctx.restore();
        // Saucer and cup.
        ctx.fillStyle = "#e3d4ba"; ctx.beginPath(); ctx.ellipse(640, 952, 120, 24, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#f4ead8"; ctx.beginPath(); ctx.ellipse(640, 946, 104, 18, 0, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = "#f4ead8"; ctx.lineWidth = 16; ctx.beginPath(); ctx.ellipse(722, 885, 30, 26, 0, -1.3, 1.3); ctx.stroke();
        ctx.fillStyle = "#f4ead8"; ctx.beginPath(); ctx.moveTo(570, 840); ctx.lineTo(710, 840); ctx.bezierCurveTo(706, 905, 690, 940, 640, 942); ctx.bezierCurveTo(590, 940, 574, 905, 570, 840); ctx.fill();
        ctx.fillStyle = "#ddcdb0"; ctx.beginPath(); ctx.moveTo(660, 840); ctx.lineTo(710, 840); ctx.bezierCurveTo(706, 905, 690, 940, 645, 942); ctx.bezierCurveTo(675, 920, 668, 880, 660, 840); ctx.fill();
        ctx.fillStyle = "#4a2b1c"; ctx.beginPath(); ctx.ellipse(640, 841, 70, 12, 0, 0, Math.PI * 2); ctx.fill();
        // Steam: three soft ribbons.
        ctx.lineCap = "round"; ctx.lineWidth = 12;
        for (let i = 0; i < 3; i++) {
          const ph = t * 0.9 + i * 2.1, x0 = 610 + i * 30;
          ctx.strokeStyle = `rgba(255, 246, 230, ${0.22 + 0.1 * Math.sin(ph)})`;
          ctx.beginPath(); ctx.moveTo(x0, 820);
          ctx.bezierCurveTo(x0 + Math.sin(ph) * 30, 770, x0 - Math.sin(ph + 1) * 34, 730, x0 + Math.sin(ph + 2) * 20, 680 - i * 12);
          ctx.stroke();
        }
      });
    }

    return {
      resize(cw, ch, d) {
        w = cw; h = ch; dpr = d;
        canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
        grainPattern = ctx.createPattern(grain, "repeat");
      },
      draw(t, dt) {
        if (!env.reduced) {
          const tx = usingPointer ? target.x : Math.sin(t * 0.13) * 0.5, ty = usingPointer ? target.y : Math.sin(t * 0.09) * 0.3;
          cam.x += (tx - cam.x) * Math.min(1, dt * 3); cam.y += (ty - cam.y) * Math.min(1, dt * 3);
        }
        const s = Math.max(w / VW, h / VH) * dpr * 1.04;
        ctx.setTransform(s, 0, 0, s, (canvas.width - VW * s) / 2, (canvas.height - VH * s) / 2);
        // Clip to the window where the wall (depth 1) puts it, then draw the outside with its own depths.
        ctx.save();
        ctx.translate(-cam.x * 40, -cam.y * 18); ctx.clip(glass); ctx.translate(cam.x * 40, cam.y * 18);
        drawOutside(t, dt);
        ctx.restore();
        drawInside(t);
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.fillStyle = grainPattern; ctx.fillRect(0, 0, canvas.width, canvas.height);
      },
      destroy() {
        canvas.removeEventListener("pointermove", onMove);
        canvas.removeEventListener("pointerleave", onLeave);
      },
    };
  },
});
