// PROTOTYPE: the rainy café as a layered woodblock print. One composition, four colour combinations.
// Each colour is a "block": flat fills, printed slightly off-register, with an ink key block on top,
// graded (bokashi) sky, street and lamplight, then paper and woodgrain over everything.
(() => {
  // ---------- Palettes: one per picker button ----------
  const PALETTES = [
    { name: "Indigo night", label: "Yoshida's night after rain: Prussian blue, amber shoji light, vermilion",
      skyTop: "#14223f", skyBottom: "#41618c", cloud: "#2a4470", moon: "#f3e6c4", far: "#1f2d4c", mid: "#2b3a5a", midShadow: "#1a2440",
      light: "#f4cf82", lightHot: "#fff0c6", accent: "#b8403a", accent2: "#e58a3c", street: "#22304f", streetWet: "#4f6b96",
      ink: "#11151f", rain: "#a9bddc", interior: "#2e1c14", interiorLit: "#8c5a34", wall: "#4e2f22", cup: "#efe2c6",
      lampGlow: "#f6c06a", curtain: "#25407a", crest: "#efe2c6" },
    { name: "Teal dusk", label: "Hasui's dusk at Ushibori: teal water, peach sky, one warm light",
      skyTop: "#285a70", skyBottom: "#f1c4a0", cloud: "#e3a289", moon: "#fff3df", far: "#3d6e7c", mid: "#2f5866", midShadow: "#21414d",
      light: "#ffd59a", lightHot: "#fff4dc", accent: "#c2533d", accent2: "#ef9555", street: "#2e5864", streetWet: "#93b9b8",
      ink: "#132730", rain: "#d6e6e3", interior: "#2a2426", interiorLit: "#86604a", wall: "#4a3a38", cup: "#f3e8d4",
      lampGlow: "#ffca8c", curtain: "#1f4a58", crest: "#f3e8d4" },
    { name: "Moonlit gold", label: "Grimshaw's moonlit street: olive-gold sky, umber walls, gold windows",
      skyTop: "#2a3226", skyBottom: "#aea56c", cloud: "#6e734d", moon: "#f6edc4", far: "#3a3b2b", mid: "#2f2b21", midShadow: "#1e1c16",
      light: "#f3c55e", lightHot: "#fff1b8", accent: "#8e3a22", accent2: "#d98d2c", street: "#34301f", streetWet: "#bda965",
      ink: "#14120d", rain: "#cfcba8", interior: "#271b12", interiorLit: "#7d5730", wall: "#45301f", cup: "#ece0bf",
      lampGlow: "#f2b24b", curtain: "#3d3a28", crest: "#ece0bf" },
    { name: "Diner green", label: "Hopper's Nighthawks: deep teal night, cream-yellow light, brick red",
      skyTop: "#0d2526", skyBottom: "#24524e", cloud: "#1d4441", moon: null, far: "#173535", mid: "#6e3226", midShadow: "#47201a",
      light: "#f1e8a6", lightHot: "#fcf8dc", accent: "#2f7c6b", accent2: "#cf5139", street: "#183432", streetWet: "#467a70",
      ink: "#0a1413", rain: "#a9cbc3", interior: "#1c2926", interiorLit: "#8b7d4c", wall: "#2c3b36", cup: "#f1ead2",
      lampGlow: "#ece49e", curtain: "#143a37", crest: "#f1ead2" },
  ];

  // ---------- Print settings (sliders) ----------
  const S = (window.woodblockSettings = { keyline: 0.7, registration: 0.4, texture: 0.6, rain: 0.6, version: 0 });
  const pct = (v) => Math.round(v * 100) + "%";
  const CONTROLS = [["keyline", "Ink key lines"], ["registration", "Off-register"], ["texture", "Paper & woodgrain"], ["rain", "Rain"]];
  const body = document.getElementById("proto-panel-body");
  const toggle = document.querySelector(".proto-panel-toggle");
  if (body) {
    body.innerHTML = CONTROLS.map(([k, l]) => `<div class="pp-row"><label for="pp-${k}">${l}<output id="ppo-${k}">${pct(S[k])}</output></label>
      <input type="range" id="pp-${k}" min="0" max="1" step="0.05" value="${S[k]}"></div>`).join("") +
      `<button type="button" class="pp-copy" id="pp-copy">Copy settings</button>`;
    for (const [k] of CONTROLS) {
      const input = document.getElementById("pp-" + k);
      input.addEventListener("input", () => { S[k] = parseFloat(input.value); document.getElementById("ppo-" + k).textContent = pct(S[k]); S.version++; });
    }
    document.getElementById("pp-copy").addEventListener("click", async (e) => {
      const active = document.querySelector(".proto-picker-item[data-active]")?.textContent || "";
      const text = `palette: ${active} · ` + CONTROLS.map(([k, l]) => `${l.toLowerCase()}: ${pct(S[k])}`).join(" · ");
      try { await navigator.clipboard.writeText(text); e.target.textContent = "Copied"; } catch { e.target.textContent = text; }
      setTimeout(() => (e.target.textContent = "Copy settings"), 1500);
    });
    const setOpen = (open) => { body.hidden = !open; toggle.setAttribute("aria-expanded", String(open)); };
    toggle.addEventListener("click", () => setOpen(body.hidden));
    if (innerWidth < 640) setOpen(false);
  }

  // ---------- Composition (virtual 1600×1000), seeded so every palette shares it ----------
  const VW = 1600, VH = 1000;
  const WIN = { x0: 160, x1: 1440, y0: 70, y1: 690 };
  const STREET = 560;
  let seed = 41;
  const rand = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;

  const shops = [];
  for (let x = 120; x < 1480;) {
    const w = 150 + rand() * 100, top = 352 + rand() * 56;
    const cafe = x > 820 && x < 1010 && !shops.some((s) => s.cafe);
    shops.push({
      x, w: cafe ? 250 : w, top: cafe ? 380 : top, cafe,
      groundLit: cafe || rand() < 0.72, upperLit: rand() < 0.5,
      banner: !cafe && rand() < 0.45, lantern: !cafe && rand() < 0.5, lanternPhase: rand() * 6,
    });
    x += (cafe ? 250 : w) + 4;
  }
  const roofs = [];
  for (let x = 100; x < 1500;) { const w = 90 + rand() * 120; roofs.push({ x, w, h: 300 + rand() * 70 }); x += w - 10; }

  const hash = (s) => { let h = 7; for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h; };

  function scene(P) {
    return {
      name: P.name,
      label: `Woodblock print, ${P.label}: a rainy street of glowing shop fronts seen from inside a café`,
      create(canvas, env) {
        const ctx = canvas.getContext("2d");
        const mk = () => document.createElement("canvas");
        const outside = mk(), inside = mk(), texture = mk();
        let W = 0, H = 0, s = 1, builtVersion = -1;

        // Each colour block lands slightly off-register, the same way every time.
        const reg = (role) => { const h = hash(role), a = (h % 360) * (Math.PI / 180), m = S.registration * 3.2 * ((h >> 9) % 100 / 100 * 0.6 + 0.4); return [Math.cos(a) * m, Math.sin(a) * m]; };
        const block = (c, role, path, style) => { const [dx, dy] = reg(role); c.save(); c.translate(dx, dy); c.fillStyle = style || P[role]; c.fill(path); c.restore(); };
        const keyline = (c, path, w = 2.6) => { if (S.keyline <= 0) return; c.save(); c.globalAlpha = S.keyline; c.lineWidth = w; c.lineJoin = "round"; c.lineCap = "round"; c.strokeStyle = P.ink; c.stroke(path); c.restore(); };
        const R = (x, y, w, h) => { const p = new Path2D(); p.rect(x, y, w, h); return p; };
        const poly = (pts) => { const p = new Path2D(); pts.forEach(([x, y], i) => (i ? p.lineTo(x, y) : p.moveTo(x, y))); p.closePath(); return p; };
        const E = (x, y, rx, ry) => { const p = new Path2D(); p.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); return p; };
        const lin = (c, y0, y1, a, b) => { const g = c.createLinearGradient(0, y0, 0, y1); g.addColorStop(0, a); g.addColorStop(1, b); return g; };

        function drawOutside(c) {
          c.clearRect(0, 0, VW, VH);
          // Sky, graded; long flat cloud bands; moon.
          block(c, "skyTop", R(0, 0, VW, STREET), lin(c, WIN.y0, 470, P.skyTop, P.skyBottom));
          if (P.moon) block(c, "moon", E(760, 128, 30, 30));
          for (const [x, y, w, h] of [[120, 132, 760, 22], [620, 176, 900, 18], [980, 118, 520, 16], [200, 222, 520, 14]]) {
            const p = new Path2D(); p.roundRect(x, y, w, h, h / 2); block(c, "cloud", p);
          }
          // Far rooftops and a watchtower.
          const far = new Path2D(); far.moveTo(0, STREET);
          for (const r of roofs) { far.lineTo(r.x, r.h + 26); far.lineTo(r.x + r.w / 2, r.h); far.lineTo(r.x + r.w, r.h + 26); }
          far.lineTo(VW, STREET); far.closePath();
          block(c, "far", far);
          const tower = poly([[388, STREET], [388, 250], [376, 250], [400, 226], [424, 250], [412, 250], [412, STREET]]);
          block(c, "far", tower); keyline(c, tower, 1.6);
          // Shop fronts.
          for (const sh of shops) {
            const { x, w, top } = sh;
            const facade = R(x, top, w, STREET - top);
            block(c, "mid", facade); keyline(c, facade);
            const roof = poly([[x - 12, top + 4], [x + 8, top - 22], [x + w - 8, top - 22], [x + w + 12, top + 4]]);
            block(c, "midShadow", roof); keyline(c, roof);
            // Upper window.
            const up = R(x + 28, top + 26, w - 56, 40);
            block(c, sh.upperLit ? "light" : "midShadow", up); keyline(c, up, 2);
            if (sh.upperLit) { c.save(); c.globalAlpha = 0.55 * Math.max(0.3, S.keyline); c.strokeStyle = P.ink; c.lineWidth = 1.4; c.beginPath(); for (let lx = x + 28 + 18; lx < x + w - 28; lx += 18) { c.moveTo(lx, top + 26); c.lineTo(lx, top + 66); } c.stroke(); c.restore(); }
            // Eave over the ground floor.
            const eave = poly([[x - 10, 452], [x + w + 10, 452], [x + w + 4, 466], [x - 4, 466]]);
            block(c, "midShadow", eave); keyline(c, eave, 2);
            // Ground floor: glowing shoji or dark.
            const g = R(x + 14, 474, w - 28, STREET - 476);
            block(c, sh.groundLit ? "light" : "midShadow", g, sh.groundLit ? lin(c, 474, STREET, P.lightHot, P.light) : null); keyline(c, g, 2);
            if (sh.groundLit) {
              c.save(); c.globalAlpha = 0.6 * Math.max(0.3, S.keyline); c.strokeStyle = P.ink; c.lineWidth = 1.5; c.beginPath();
              for (let lx = x + 14 + 22; lx < x + w - 14; lx += 22) { c.moveTo(lx, 474); c.lineTo(lx, STREET - 2); }
              c.moveTo(x + 14, 506); c.lineTo(x + w - 14, 506); c.stroke(); c.restore();
            }
            if (sh.cafe) { // the café across the street: vermilion awning
              const aw = poly([[x - 6, 446], [x + w + 6, 446], [x + w + 22, 486], [x - 22, 486]]);
              block(c, "accent", aw); keyline(c, aw);
            }
            if (sh.banner) { const b = R(x + w - 34, 470, 20, 78); block(c, "accent", b); keyline(c, b, 2); }
          }
          // Telegraph pole and sagging wires.
          const pole = R(1102, 140, 12, STREET - 140);
          block(c, "ink", pole);
          for (const y of [168, 196]) block(c, "ink", R(1066, y, 84, 7));
          c.save(); c.strokeStyle = P.ink; c.lineWidth = 2; c.globalAlpha = 0.85; c.beginPath();
          for (const [y, sag] of [[168, 70], [196, 56]]) {
            c.moveTo(1066, y); c.quadraticCurveTo(600, y + sag * 1.6, 100, y + sag * 0.4);
            c.moveTo(1150, y); c.quadraticCurveTo(1320, y + sag * 0.7, 1500, y + sag * 0.2);
          }
          c.stroke(); c.restore();
          // Wet street, graded, with a kerb and a few puddles.
          block(c, "street", R(0, STREET, VW, VH - STREET), lin(c, STREET, WIN.y1, P.street, P.streetWet));
          const kerb = R(0, STREET, VW, 6); block(c, "midShadow", kerb);
          for (const [x, y, rx] of [[300, 640, 90], [760, 664, 130], [1240, 630, 70]]) block(c, "streetWet", E(x, y, rx, 7));
        }

        function drawInside(c) {
          c.clearRect(0, 0, VW, VH);
          const hole = R(WIN.x0, WIN.y0, WIN.x1 - WIN.x0, WIN.y1 - WIN.y0);
          // Wall, lit from the lantern, with the window cut out.
          const wall = new Path2D(); wall.rect(-20, -20, VW + 40, VH + 40); wall.addPath(hole);
          const g = c.createRadialGradient(1290, 180, 40, 1290, 180, 1150);
          g.addColorStop(0, P.interiorLit); g.addColorStop(0.45, P.wall); g.addColorStop(1, P.interior);
          c.save(); c.fillStyle = g; c.fill(wall, "evenodd"); c.restore();
          // Frame, mullions, transom and lattice.
          const frame = new Path2D(); frame.rect(WIN.x0 - 28, WIN.y0 - 28, WIN.x1 - WIN.x0 + 56, WIN.y1 - WIN.y0 + 56); frame.addPath(hole);
          c.save(); const [fx, fy] = reg("interior"); c.translate(fx, fy); c.fillStyle = P.interior; c.fill(frame, "evenodd"); c.restore();
          keyline(c, frame);
          const bars = [R(580, WIN.y0, 18, WIN.y1 - WIN.y0), R(1002, WIN.y0, 18, WIN.y1 - WIN.y0), R(WIN.x0, 206, WIN.x1 - WIN.x0, 14)];
          for (const b of bars) { block(c, "interior", b); keyline(c, b, 2); }
          c.save(); c.strokeStyle = P.interior; c.lineWidth = 5; c.beginPath();
          for (let x = WIN.x0 + 46; x < WIN.x1; x += 46) { c.moveTo(x, WIN.y0); c.lineTo(x, 206); }
          for (let y = WIN.y0 + 46; y < 206; y += 46) { c.moveTo(WIN.x0, y); c.lineTo(WIN.x1, y); }
          c.stroke(); c.restore();
          // Sill, counter and its front panel.
          const sill = R(118, WIN.y1, VW - 236, 24); block(c, "interiorLit", sill); keyline(c, sill);
          const top = R(-20, 770, VW + 40, 30); block(c, "interiorLit", top); keyline(c, top);
          const front = R(-20, 800, VW + 40, 220); block(c, "interior", front);
          c.save(); c.globalAlpha = 0.35; c.strokeStyle = P.ink; c.lineWidth = 2; c.beginPath();
          for (let x = 40; x < VW; x += 96) { c.moveTo(x, 806); c.lineTo(x, VH); } c.stroke(); c.restore();
          // Iron kettle.
          const kettle = E(330, 716, 72, 54); block(c, "interior", kettle); keyline(c, kettle);
          const spout = poly([[262, 712], [214, 682], [206, 690], [252, 728]]); block(c, "interior", spout); keyline(c, spout, 2);
          c.save(); c.strokeStyle = P.ink; c.lineWidth = 6; c.globalAlpha = Math.max(0.6, S.keyline); c.beginPath(); c.ellipse(330, 668, 56, 40, 0, Math.PI, 0); c.stroke(); c.restore();
          c.save(); c.strokeStyle = P.lampGlow; c.lineWidth = 5; c.globalAlpha = 0.8; c.beginPath(); c.ellipse(330, 716, 64, 46, 0, -1.0, 0.5); c.stroke(); c.restore();
          // Cup and saucer.
          const saucer = E(560, 770, 72, 12); block(c, "cup", saucer); keyline(c, saucer, 2);
          const cup = poly([[526, 712], [594, 712], [586, 764], [534, 764]]); block(c, "cup", cup); keyline(c, cup);
          c.save(); c.globalAlpha = 0.22; c.fillStyle = P.ink; c.fill(poly([[526, 712], [548, 712], [544, 764], [534, 764]])); c.restore();
          const tea = E(560, 712, 34, 6); block(c, "interior", tea);
          // Vase with a branch against the window.
          const vase = poly([[1214, 770], [1206, 724], [1222, 700], [1238, 700], [1254, 724], [1246, 770]]); block(c, "accent", vase); keyline(c, vase, 2);
          c.save(); c.strokeStyle = P.ink; c.lineCap = "round";
          const branch = [[1230, 700, 1200, 600, 1150, 520, 3.5], [1200, 600, 1250, 540, 1290, 470, 2.5], [1150, 520, 1110, 470, 1090, 430, 2], [1230, 700, 1270, 640, 1320, 610, 2]];
          for (const [x0, y0, cx, cy, x1, y1, w] of branch) { c.lineWidth = w * 1.4; c.beginPath(); c.moveTo(x0, y0); c.quadraticCurveTo(cx, cy, x1, y1); c.stroke(); }
          c.restore();
          for (const [x, y] of [[1150, 518], [1092, 432], [1290, 470], [1262, 520], [1320, 610], [1206, 580], [1124, 482]]) {
            const b = E(x, y, 9, 9); block(c, "accent2", b); keyline(c, b, 1.5);
          }
          // Noren curtain, top left, with a crest.
          for (let i = 0; i < 3; i++) {
            const x = i * 156 - 10, p = poly([[x, -10], [x + 150, -10], [x + 150, 226 + (i % 2) * 8], [x, 230 - (i % 2) * 6]]);
            block(c, "curtain", p); keyline(c, p);
          }
          c.save(); c.strokeStyle = P.crest; c.lineWidth = 8; c.beginPath(); c.arc(224, 118, 36, 0, Math.PI * 2); c.stroke();
          c.lineWidth = 6; c.beginPath(); c.moveTo(224, 90); c.lineTo(224, 146); c.stroke(); c.restore();
          // Paper lantern, top right.
          c.save(); c.strokeStyle = P.ink; c.lineWidth = 3; c.beginPath(); c.moveTo(1290, 0); c.lineTo(1290, 112); c.stroke(); c.restore();
          const lantern = E(1290, 180, 58, 66); block(c, "lampGlow", lantern, (() => { const r = c.createRadialGradient(1278, 170, 6, 1290, 180, 70); r.addColorStop(0, P.lightHot); r.addColorStop(1, P.lampGlow); return r; })());
          keyline(c, lantern);
          c.save(); c.globalAlpha = 0.45 * Math.max(0.4, S.keyline); c.strokeStyle = P.ink; c.lineWidth = 1.6;
          for (let k = -3; k <= 3; k++) { c.beginPath(); c.ellipse(1290, 180 + k * 17, 58 * Math.sqrt(1 - (k * 17 / 66) ** 2), 6, 0, 0, Math.PI * 2); c.stroke(); }
          c.restore();
          for (const y of [108, 244]) { const cap = R(1262, y, 56, 10); block(c, "interior", cap); keyline(c, cap, 2); }
        }

        function drawTexture() {
          const c = texture.getContext("2d");
          texture.width = W; texture.height = H;
          c.clearRect(0, 0, W, H);
          // Woodgrain: long horizontal streaks of the block.
          for (let i = 0; i < H * 0.9; i++) {
            const y = rand() * H, x = rand() * W, len = 80 + rand() * W * 0.5;
            c.fillStyle = rand() < 0.5 ? "rgba(0,0,0,0.05)" : "rgba(255,248,230,0.05)";
            c.fillRect(x - len / 2, y, len, 1 + rand() * 1.5);
          }
          // Paper fibre speckle.
          const img = c.getImageData(0, 0, W, H), d = img.data;
          for (let i = 0; i < d.length; i += 4) {
            const n = rand();
            if (n < 0.08) { d[i] = d[i + 1] = d[i + 2] = 250; d[i + 3] = Math.max(d[i + 3], 18); }
            else if (n > 0.94) { d[i] = d[i + 1] = d[i + 2] = 10; d[i + 3] = Math.max(d[i + 3], 14); }
          }
          c.putImageData(img, 0, 0);
        }

        function build() {
          for (const [cv, fn] of [[outside, drawOutside], [inside, drawInside]]) {
            cv.width = W; cv.height = H;
            const c = cv.getContext("2d");
            c.setTransform(s, 0, 0, s, 0, 0);
            fn(c);
          }
          builtVersion = S.version;
        }

        // ---------- Moving parts ----------
        const drops = Array.from({ length: 260 }, () => ({ x: rand() * 1700, y: rand() * 700, v: 900 + rand() * 300, l: 26 + rand() * 30 }));
        const walker = { x: -100, dir: 1, wait: 1.5 };

        function drawDynamicOutside(t, dt) {
          ctx.save();
          ctx.beginPath(); ctx.rect(WIN.x0, WIN.y0, WIN.x1 - WIN.x0, WIN.y1 - WIN.y0); ctx.clip();
          // Reflections of the lit shop fronts, broken by ripples (Yoshida's vertical streaks).
          shops.forEach((sh, i) => {
            if (!sh.groundLit) return;
            const cx = sh.x + sh.w / 2, half = (sh.w - 28) / 2;
            for (let y = STREET + 8, k = 0; y < WIN.y1; y += 8, k++) {
              const f = (y - STREET) / (WIN.y1 - STREET), wob = Math.sin(t * 1.4 + k * 0.9 + i) * 6 * f;
              const w = half * (0.85 - f * 0.45) * (0.75 + 0.25 * Math.sin(t * 2.1 + k * 1.7 + i * 2));
              ctx.globalAlpha = 0.55 * (1 - f * 0.7);
              ctx.fillStyle = P.light;
              ctx.fillRect(cx - w + wob, y, w * 2, 4);
            }
          });
          ctx.globalAlpha = 1;
          // Lanterns under the eaves, swaying a little, glowing.
          shops.forEach((sh) => {
            if (!sh.lantern) return;
            const ax = sh.x + 26, ay = 466, sway = Math.sin(t * 1.1 + sh.lanternPhase) * 0.06;
            ctx.save(); ctx.translate(ax, ay); ctx.rotate(sway);
            ctx.globalAlpha = 0.18 + 0.05 * Math.sin(t * 3 + sh.lanternPhase);
            ctx.fillStyle = P.accent2; ctx.beginPath(); ctx.arc(0, 30, 30, 0, Math.PI * 2); ctx.fill();
            ctx.globalAlpha = 1;
            ctx.strokeStyle = P.ink; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 16); ctx.stroke();
            const p = new Path2D(); p.ellipse(0, 30, 12, 15, 0, 0, Math.PI * 2);
            ctx.fillStyle = P.accent2; ctx.fill(p); keyline(ctx, p, 1.8);
            ctx.restore();
          });
          // Someone crossing under an umbrella.
          if (walker.wait > 0) walker.wait -= dt;
          else {
            walker.x += walker.dir * 55 * dt;
            if (walker.x > 1500 || walker.x < 100) { walker.dir *= -1; walker.wait = 7 + rand() * 7; walker.x = walker.dir > 0 ? 100 : 1500; }
            const x = walker.x, y = 612, step = Math.sin(t * 5), bob = Math.abs(Math.cos(t * 5)) * 2;
            ctx.globalAlpha = 0.35; ctx.fillStyle = P.ink; ctx.fillRect(x - 10, y + 30, 20, 40); ctx.globalAlpha = 1;
            ctx.strokeStyle = P.ink; ctx.lineWidth = 7; ctx.lineCap = "round";
            ctx.beginPath(); ctx.moveTo(x, y - bob); ctx.lineTo(x + step * 9, y + 28); ctx.moveTo(x, y - bob); ctx.lineTo(x - step * 9, y + 28); ctx.stroke();
            const body = new Path2D(); body.roundRect(x - 12, y - 54 - bob, 24, 58, 8);
            ctx.fillStyle = P.ink; ctx.fill(body);
            const um = new Path2D(); um.moveTo(x - 46, y - 62 - bob); um.quadraticCurveTo(x, y - 112 - bob, x + 46, y - 62 - bob); um.closePath();
            ctx.fillStyle = P.accent; ctx.fill(um); keyline(ctx, um, 2);
            ctx.save(); ctx.globalAlpha = 0.6; ctx.strokeStyle = P.ink; ctx.lineWidth = 1.3; ctx.beginPath();
            for (let k = -2; k <= 2; k++) { ctx.moveTo(x, y - 87 - bob); ctx.lineTo(x + k * 20, y - 62 - bob); }
            ctx.stroke(); ctx.restore();
          }
          // Rain as fine straight lines, Hiroshige-style.
          const n = Math.round(drops.length * S.rain);
          ctx.strokeStyle = P.rain; ctx.globalAlpha = 0.6; ctx.lineWidth = 1.6; ctx.lineCap = "butt";
          ctx.beginPath();
          for (let i = 0; i < n; i++) {
            const d = drops[i];
            d.y += d.v * dt; d.x -= d.v * dt * 0.12;
            if (d.y > WIN.y1 + 40) { d.y = WIN.y0 - 60 - rand() * 100; d.x = WIN.x0 + rand() * (WIN.x1 - WIN.x0 + 120); }
            ctx.moveTo(d.x, d.y); ctx.lineTo(d.x + d.l * 0.12, d.y - d.l);
          }
          ctx.stroke(); ctx.globalAlpha = 1;
          ctx.restore();
        }

        function drawDynamicInside(t) {
          // Stepped lamplight, like overprinted blocks.
          ctx.save();
          for (const [r, a] of [[300, 0.06], [200, 0.07], [120, 0.08]]) {
            ctx.globalAlpha = a * (0.92 + 0.08 * Math.sin(t * 2.3));
            ctx.fillStyle = P.lampGlow; ctx.beginPath(); ctx.arc(1290, 180, r, 0, Math.PI * 2); ctx.fill();
          }
          // Steam from the cup.
          ctx.globalAlpha = 0.35; ctx.strokeStyle = P.cup; ctx.lineWidth = 5; ctx.lineCap = "round";
          for (let i = 0; i < 2; i++) {
            const ph = t * 0.9 + i * 2.4, x0 = 548 + i * 22;
            ctx.beginPath(); ctx.moveTo(x0, 700);
            ctx.bezierCurveTo(x0 + Math.sin(ph) * 16, 668, x0 - Math.sin(ph + 1) * 18, 640, x0 + Math.sin(ph + 2) * 10, 606);
            ctx.stroke();
          }
          ctx.restore();
        }

        return {
          resize(cw, ch, dpr) {
            W = Math.round(cw * dpr); H = Math.round(ch * dpr);
            canvas.width = W; canvas.height = H;
            s = Math.max(W / VW, H / VH);
            seed = 977; drawTexture(); seed = 4242;
            build();
          },
          draw(t, dt) {
            if (builtVersion !== S.version) build();
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.drawImage(outside, 0, 0);
            ctx.setTransform(s, 0, 0, s, 0, 0);
            drawDynamicOutside(t, dt);
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.drawImage(inside, 0, 0);
            ctx.setTransform(s, 0, 0, s, 0, 0);
            drawDynamicInside(t);
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.globalAlpha = S.texture; ctx.drawImage(texture, 0, 0); ctx.globalAlpha = 1;
          },
        };
      },
    };
  }

  (window.cafeScenes ||= []).push(...PALETTES.map(scene));
})();
