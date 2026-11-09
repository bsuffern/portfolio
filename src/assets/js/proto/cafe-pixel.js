// PROTOTYPE scene 1 — Pixel: a 192×120 pixel-art café, limited palette, ordered dithering, scaled up crisp.
(window.cafeScenes ||= []).push({
  name: "Pixel",
  pixel: true,
  label: "Pixel art of a rainy night seen from a warm café table, with steam rising from a mug",
  create(canvas) {
    const W = 192, H = 120;
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");

    // Glass opening and street line.
    const GX0 = 23, GY0 = 13, GX1 = 169, GY1 = 80, STREET = 63;
    const LAMP = { x: 73, y: 39 };
    const SIGN = { x: 146, y: 46, w: 12 };

    let seed = 7;
    const rand = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
    const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
    const dith = (x, y, v) => v * 16 > BAYER[(y & 3) * 4 + (x & 3)] + 0.5;
    const rect = (c, x, y, w, h, col) => { c.fillStyle = col; c.fillRect(x, y, w, h); };
    const px = (c, x, y, col) => { c.fillStyle = col; c.fillRect(x | 0, y | 0, 1, 1); };
    const layer = () => { const c = document.createElement("canvas"); c.width = W; c.height = H; return c.getContext("2d"); };

    // ---------- Outside, static ----------
    const out = layer();
    const sky = ["#0b1122", "#111a31", "#192642", "#243455"];
    for (let y = GY0; y < STREET; y++) {
      const v = ((y - GY0) / (STREET - GY0)) * (sky.length - 1);
      const i = Math.floor(v), f = v - i;
      for (let x = GX0; x < GX1; x++) px(out, x, y, dith(x, y, f) ? sky[Math.min(i + 1, sky.length - 1)] : sky[i]);
    }
    // Far skyline with scattered lit windows.
    for (let x = GX0; x < GX1;) {
      const w = 6 + Math.floor(rand() * 9), top = 34 + Math.floor(rand() * 16);
      rect(out, x, top, w, STREET - top, "#141c31");
      for (let wy = top + 2; wy < STREET - 2; wy += 3)
        for (let wx = x + 1; wx < x + w - 1; wx += 2) {
          const r = rand();
          if (r < 0.16) px(out, wx, wy, "#d9a85c");
          else if (r < 0.3) px(out, wx, wy, "#222b45");
        }
      x += w + (rand() < 0.3 ? 1 : 0);
    }
    // Near buildings left and right.
    const nearWins = [];
    const near = (x0, x1, top) => {
      rect(out, x0, top, x1 - x0, STREET - top, "#0b1120");
      for (let wy = top + 3; wy < STREET - 4; wy += 5)
        for (let wx = x0 + 2; wx < x1 - 2; wx += 5) {
          if (rand() < 0.35) { rect(out, wx, wy, 2, 2, "#efc070"); nearWins.push({ x: wx, y: wy }); }
          else rect(out, wx, wy, 2, 2, "#161e33");
        }
    };
    near(GX0, 42, 28);
    near(138, GX1, 24);
    // Neon sign and its halo.
    for (let y = SIGN.y - 6; y < SIGN.y + 9; y++)
      for (let x = SIGN.x - 6; x < SIGN.x + SIGN.w + 6; x++) {
        const dx = Math.max(0, SIGN.x - x, x - (SIGN.x + SIGN.w)), dy = Math.max(0, SIGN.y - y, y - (SIGN.y + 3));
        if (dith(x, y, (1 - Math.hypot(dx, dy) / 6) * 0.55)) px(out, x, y, "#4a2436");
      }
    rect(out, SIGN.x, SIGN.y, SIGN.w, 3, "#d4544f");
    rect(out, SIGN.x + 1, SIGN.y + 1, SIGN.w - 2, 1, "#ff9d8c");
    // Street lamp, halo, pole.
    for (let y = LAMP.y - 10; y < LAMP.y + 11; y++)
      for (let x = LAMP.x - 10; x < LAMP.x + 11; x++)
        if (dith(x, y, (1 - Math.hypot(x - LAMP.x - 0.5, y - LAMP.y) / 10) * 0.6)) px(out, x, y, "#4f4a52");
    rect(out, LAMP.x - 3, LAMP.y - 1, 1, STREET - LAMP.y + 1, "#070b16");
    rect(out, LAMP.x - 3, LAMP.y - 1, 4, 1, "#070b16");
    rect(out, LAMP.x, LAMP.y, 2, 1, "#ffe3a8");
    // Wet street.
    for (let y = STREET; y < GY1; y++)
      for (let x = GX0; x < GX1; x++) px(out, x, y, dith(x, y, 0.5 - (y - STREET) / 34) ? "#141c30" : "#0c1220");
    rect(out, GX0, STREET, GX1 - GX0, 1, "#1d2843");

    // ---------- Inside, static (glass left transparent) ----------
    const ins = layer();
    rect(ins, 0, 0, W, H, "#3b2219");
    ins.clearRect(GX0, GY0, GX1 - GX0, GY1 - GY0);
    // Window frame.
    rect(ins, 20, 10, 152, 3, "#5a3520"); rect(ins, 20, 80, 152, 3, "#5a3520");
    rect(ins, 20, 10, 3, 73, "#5a3520"); rect(ins, 169, 10, 3, 73, "#5a3520");
    rect(ins, 20, 10, 152, 1, "#7a4a2a"); rect(ins, 22, 13, 1, 67, "#3a2216"); rect(ins, 23, 12, 146, 1, "#3a2216");
    rect(ins, 95, GY0, 2, GY1 - GY0, "#5a3520"); rect(ins, 95, GY0, 1, GY1 - GY0, "#7a4a2a");
    // Sill and wainscot.
    rect(ins, 16, 83, 160, 3, "#7a4a2a"); rect(ins, 16, 83, 160, 1, "#9a6236"); rect(ins, 16, 86, 160, 1, "#2a170f");
    rect(ins, 0, 87, W, 10, "#2b1914");
    for (let x = 8; x < W; x += 24) rect(ins, x, 88, 1, 9, "#3b2219");
    // Table with grain.
    rect(ins, 0, 97, W, 16, "#5a3520"); rect(ins, 0, 97, W, 1, "#9a6236");
    for (let i = 0; i < 26; i++) rect(ins, Math.floor(rand() * W), 99 + Math.floor(rand() * 13), 6 + Math.floor(rand() * 12), 1, "#4a2b1a");
    rect(ins, 0, 113, W, 3, "#3a2216"); rect(ins, 0, 116, W, 4, "#170d09");
    // Warm light pass on the room (before the props): banded tones, dithered only where bands meet.
    const img = ins.getImageData(0, 0, W, H), d = img.data;
    const tones = [[0.6, 0.58, 0.64], [0.8, 0.78, 0.8], [1, 1, 1], null];
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++) {
        const i = (y * W + x) * 4;
        if (!d[i + 3]) continue;
        const l = Math.max(0, 1 - Math.hypot(x - 120, (y - 12) * 1.2) / 85) * 0.8 + Math.max(0, 1 - Math.hypot((x - 92) * 0.55, y - 103) / 30) * 0.7;
        const v = Math.min(2.99, l * 3.4), b = Math.floor(v), f = Math.min(1, Math.max(0, (v - b - 0.42) / 0.16));
        const tone = tones[Math.min(3, b + (dith(x, y, f) ? 1 : 0))];
        if (tone) { d[i] *= tone[0]; d[i + 1] *= tone[1]; d[i + 2] *= tone[2]; }
        else { d[i] += (255 - d[i]) * 0.22; d[i + 1] += (200 - d[i + 1]) * 0.18; d[i + 2] += (120 - d[i + 2]) * 0.1; }
      }
    ins.putImageData(img, 0, 0);
    // Mug and saucer.
    rect(ins, 54, 97, 18, 1, "#efe1c6"); rect(ins, 55, 98, 16, 1, "#a8946f");
    rect(ins, 58, 88, 10, 1, "#fff4dd");
    rect(ins, 58, 89, 10, 8, "#efe1c6"); rect(ins, 66, 89, 2, 8, "#c9b48f"); rect(ins, 58, 90, 1, 6, "#fff4dd");
    rect(ins, 59, 89, 7, 1, "#4a2b1a");
    [[68, 91], [69, 91], [70, 92], [70, 93], [70, 94], [69, 95], [68, 95]].forEach(([x, y]) => px(ins, x, y, "#c9b48f"));
    // Open book.
    rect(ins, 96, 101, 32, 8, "#e6d6b8"); rect(ins, 111, 101, 2, 8, "#b9a47f"); rect(ins, 96, 109, 32, 1, "#a8936e");
    for (const row of [103, 105, 107])
      for (const [a, b] of [[98, 110], [114, 126]])
        for (let x = a; x < b; x++) if (rand() > 0.18) px(ins, x, row, "#b3a07c");
    // Plant on the sill.
    rect(ins, 145, 77, 10, 1, "#b8643a"); rect(ins, 146, 78, 8, 5, "#a5532e"); rect(ins, 152, 78, 2, 5, "#7a3a20");
    for (let i = 0; i < 16; i++) {
      const a = -Math.PI / 2 + (rand() - 0.5) * 2.6, len = 4 + rand() * 6, col = rand() < 0.5 ? "#2f4a2c" : "#4f7340";
      for (let s = 0; s < len; s++) px(ins, 150 + Math.cos(a) * s, 76 + Math.sin(a) * s + s * s * 0.03, col);
    }
    // Pendant lamp.
    rect(ins, 120, 0, 1, 7, "#1a0f0b");
    rect(ins, 117, 7, 7, 1, "#2a3a33"); rect(ins, 116, 8, 9, 1, "#2f413a"); rect(ins, 115, 9, 11, 1, "#354a41"); rect(ins, 114, 10, 13, 1, "#3d544a");
    rect(ins, 114, 11, 13, 1, "#ffcf7a"); rect(ins, 119, 12, 3, 1, "#fff1c9");

    // ---------- Moving parts ----------
    const rain = Array.from({ length: 150 }, () => {
      const nearDrop = rand() < 0.35;
      return { x: GX0 + rand() * (GX1 - GX0 + 20), y: GY0 + rand() * (GY1 - GY0), near: nearDrop, v: nearDrop ? 150 + rand() * 30 : 85 + rand() * 25 };
    });
    const ripples = [];
    const beads = Array.from({ length: 8 }, () => ({ x: GX0 + 3 + Math.floor(rand() * (GX1 - GX0 - 6)), y: GY0 + 2 + rand() * 40, v: 0, wait: 1 + rand() * 8 }));
    const steam = Array.from({ length: 18 }, () => ({ x: 59 + rand() * 7, age: rand() * 3, s: rand() * 6 }));
    let flick = null, flickT = 4;

    return {
      resize() {},
      draw(t, dt) {
        ctx.drawImage(out.canvas, 0, 0);
        ctx.save();
        ctx.beginPath(); ctx.rect(GX0, GY0, GX1 - GX0, GY1 - GY0); ctx.clip();

        // A window across the street switching on and off now and then.
        if ((flickT -= dt) < 0 && nearWins.length) { flick = nearWins[Math.floor(rand() * nearWins.length)]; flick.off = !flick.off; flickT = 5 + rand() * 6; }
        for (const w of nearWins) if (w.off) rect(ctx, w.x, w.y, 2, 2, "#161e33");

        // Shimmering reflections of the lamp and the sign.
        for (let y = STREET + 1; y < GY1; y++) {
          const k = (y - STREET) / (GY1 - STREET), wob = Math.round(Math.sin(t * 2.4 + y * 0.9) * k * 1.6);
          for (let x = -1; x <= 1; x++) if (dith(LAMP.x + x, y, (x ? 0.4 : 0.9) - k * 0.6)) px(ctx, LAMP.x + x + wob, y, "#a8875a");
          for (let x = 1; x < SIGN.w - 1; x++) if (dith(SIGN.x + x, y, 0.3 - k * 0.3)) px(ctx, SIGN.x + x + wob, y, "#6e3040");
        }

        // Rain.
        for (const r of rain) {
          r.y += r.v * dt; r.x -= r.v * dt * 0.22;
          if (r.y > GY1) {
            if (r.near && rand() < 0.5) ripples.push({ x: Math.round(r.x), y: STREET + 3 + Math.floor(rand() * (GY1 - STREET - 4)), age: 0 });
            r.y = GY0 - rand() * 14; r.x = GX0 + rand() * (GX1 - GX0 + 20);
          }
          const len = r.near ? 4 : 2, col = r.near ? "#8aa3cc" : "#3f5682";
          for (let k = 0; k < len; k++) px(ctx, r.x + k * 0.22, r.y - k, col);
        }
        for (let i = ripples.length - 1; i >= 0; i--) {
          const p = ripples[i]; p.age += dt;
          if (p.age > 0.6) { ripples.splice(i, 1); continue; }
          const w = 1 + Math.floor(p.age * 7), col = p.age < 0.25 ? "#6d86b3" : "#33466e";
          px(ctx, p.x - w, p.y, col); px(ctx, p.x + w, p.y, col);
        }

        // Beads on the glass that sometimes run.
        for (const b of beads) {
          if ((b.wait -= dt) < 0) { b.v = Math.min(b.v + 40 * dt, 24); b.y += b.v * dt; if (rand() < dt * 0.6) { b.v = 0; b.wait = 2 + rand() * 7; } }
          if (b.y > GY1 - 1) { b.y = GY0 + 2 + rand() * 20; b.x = GX0 + 3 + Math.floor(rand() * (GX1 - GX0 - 6)); b.v = 0; b.wait = 2 + rand() * 6; }
          px(ctx, b.x, b.y - 1, "#c9d8ef"); px(ctx, b.x, b.y, "#7f97c0");
        }
        ctx.restore();

        ctx.drawImage(ins.canvas, 0, 0);

        // Steam from the mug.
        for (const s of steam) {
          s.age += dt;
          if (s.age > 3) { s.age = 0; s.x = 59 + rand() * 7; s.s = rand() * 6; }
          const x = Math.round(s.x + Math.sin(s.age * 2.2 + s.s) * 1.4 * s.age), y = Math.round(87 - s.age * 6);
          if (!dith(x, y, 1.05 - s.age / 3)) continue;
          px(ctx, x, y, s.age < 1 ? "#ddd1bb" : s.age < 2 ? "#a19380" : "#6f6052");
        }
      },
    };
  },
});
