// PROTOTYPE: rainy café as a low-poly 3D scene, rendered small and pushed through a woodblock-print shader.
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.min.js";

const stage = document.querySelector("[data-proto-stage]");
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

// ---------- Settings on sliders ----------
const S = { pixel: 3, palette: 1, dither: 0.2, ink: 0.6, grain: 0.5, rain: 0.6, warmth: 1, speed: 1 };
const pct = (v) => Math.round(v * 100) + "%";
const CONTROLS = [
  { key: "pixel", label: "Pixel size", min: 1, max: 8, step: 1, fmt: (v) => v + "px" },
  { key: "palette", label: "Woodblock palette", min: 0, max: 1, step: 0.05, fmt: pct },
  { key: "dither", label: "Dither", min: 0, max: 1, step: 0.05, fmt: pct },
  { key: "ink", label: "Ink lines", min: 0, max: 1, step: 0.05, fmt: pct },
  { key: "grain", label: "Paper grain", min: 0, max: 1, step: 0.05, fmt: pct },
  { key: "rain", label: "Rain", min: 0, max: 1, step: 0.05, fmt: pct },
  { key: "warmth", label: "Lamp warmth", min: 0.3, max: 2, step: 0.05, fmt: (v) => v.toFixed(2) + "×" },
];

const panelBody = document.getElementById("proto-panel-body");
const toggle = document.querySelector(".proto-panel-toggle");
panelBody.innerHTML =
  CONTROLS.map((c) => `<div class="pp-row"><label for="pp-${c.key}">${c.label}<output id="ppo-${c.key}">${c.fmt(S[c.key])}</output></label>
    <input type="range" id="pp-${c.key}" min="${c.min}" max="${c.max}" step="${c.step}" value="${S[c.key]}"></div>`).join("") +
  `<div class="pp-row"><span>Motion speed</span><div class="pp-seg" role="group" aria-label="Motion speed">${[1, 0.5, 0.25].map((v) => `<button type="button" data-speed="${v}" aria-pressed="${v === 1}">${v}×</button>`).join("")}</div></div>
   <button type="button" class="pp-copy" id="pp-copy">Copy settings</button>`;
for (const c of CONTROLS) {
  const input = document.getElementById("pp-" + c.key);
  input.addEventListener("input", () => {
    S[c.key] = parseFloat(input.value);
    document.getElementById("ppo-" + c.key).textContent = c.fmt(S[c.key]);
    apply();
  });
}
panelBody.querySelectorAll("[data-speed]").forEach((b) => b.addEventListener("click", () => {
  S.speed = parseFloat(b.dataset.speed);
  panelBody.querySelectorAll("[data-speed]").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
}));
document.getElementById("pp-copy").addEventListener("click", async (e) => {
  const text = CONTROLS.map((c) => `${c.label.toLowerCase()}: ${c.fmt(S[c.key])}`).join(" · ") + ` · speed: ${S.speed}×`;
  try { await navigator.clipboard.writeText(text); e.target.textContent = "Copied"; }
  catch { e.target.textContent = text; }
  setTimeout(() => (e.target.textContent = "Copy settings"), 1500);
});
const setOpen = (open) => { panelBody.hidden = !open; toggle.setAttribute("aria-expanded", String(open)); };
toggle.addEventListener("click", () => setOpen(panelBody.hidden));
if (innerWidth < 640) setOpen(false);

// ---------- Renderer and render targets ----------
const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: "low-power" });
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
stage.append(renderer.domElement);

const low = new THREE.WebGLRenderTarget(64, 40, {
  type: THREE.HalfFloatType,
  minFilter: THREE.NearestFilter,
  magFilter: THREE.NearestFilter,
  depthTexture: new THREE.DepthTexture(64, 40),
});

const scene = new THREE.Scene();
// Graded dusk sky, darker overhead (bokashi), and fog of the same blue for depth.
scene.background = (() => {
  const c = document.createElement("canvas"); c.width = 2; c.height = 256;
  const g = c.getContext("2d"), l = g.createLinearGradient(0, 0, 0, 256);
  l.addColorStop(0, "#141a2e"); l.addColorStop(0.55, "#2c3d63"); l.addColorStop(1, "#5a6f96");
  g.fillStyle = l; g.fillRect(0, 0, 2, 256);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
})();
scene.fog = new THREE.Fog("#3d5078", 5, 30);
const camera = new THREE.PerspectiveCamera(50, 1.6, 0.1, 60);
const camBase = new THREE.Vector3(0, 1.6, 1.75);
const camTarget = new THREE.Vector3(0, 1.38, -1.5);

// ---------- Materials and helpers ----------
const grad = new THREE.DataTexture(new Uint8Array([70, 150, 255]), 3, 1, THREE.RedFormat);
grad.minFilter = grad.magFilter = THREE.NearestFilter;
grad.needsUpdate = true;
const toon = (c, o = {}) => new THREE.MeshToonMaterial({ color: c, gradientMap: grad, ...o });
const flat = (c, o = {}) => new THREE.MeshBasicMaterial({ color: c, ...o });
const add = (geo, mat, x, y, z, parent = scene) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); parent.add(m); return m; };
const box = (w, h, d, mat, x, y, z) => add(new THREE.BoxGeometry(w, h, d), mat, x, y, z);

let seed = 5;
const rand = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;

// ---------- Inside ----------
const M = {
  wall: toon("#7a3b28"), wood: toon("#6b3a22"), woodLight: toon("#8a5232"), frame: toon("#4a2818"),
  cream: toon("#efe1c6"), coffee: toon("#3a2015"), pot: toon("#b8603c"), leaf: toon("#3f5e44"), leaf2: toon("#56784f"),
  shade: toon("#1f3a3a", { side: THREE.DoubleSide }), book: toon("#2c3d63"), page: toon("#e8dcc0"),
};
const WX = 1.7, WY0 = 0.9, WY1 = 2.75, WZ = -1.5, WD = 0.2;
box(6.3, 3.6, WD, M.wall, -WX - 3.15, 1.8, WZ);
box(6.3, 3.6, WD, M.wall, WX + 3.15, 1.8, WZ);
box(WX * 2, 3.6 - WY1, WD, M.wall, 0, (WY1 + 3.6) / 2, WZ);
box(WX * 2, WY0, WD, M.wall, 0, WY0 / 2, WZ);
box(16, 0.1, 6, M.wood, 0, 3.6, 1.4); // ceiling
box(0.18, 0.16, 6, M.frame, -1.1, 3.5, 1.4); box(0.18, 0.16, 6, M.frame, 1.1, 3.5, 1.4); // beams
// Window frame, mullion, transom, sill.
box(WX * 2, 0.08, 0.26, M.frame, 0, WY1 - 0.04, WZ);
box(0.08, WY1 - WY0, 0.26, M.frame, -WX + 0.04, (WY0 + WY1) / 2, WZ);
box(0.08, WY1 - WY0, 0.26, M.frame, WX - 0.04, (WY0 + WY1) / 2, WZ);
box(0.06, WY1 - WY0, 0.12, M.frame, 0, (WY0 + WY1) / 2, WZ);
box(WX * 2, 0.05, 0.12, M.frame, 0, 2.2, WZ);
box(WX * 2 + 0.4, 0.06, 0.4, M.woodLight, 0, WY0, WZ + 0.12);
// Table.
box(3.2, 0.06, 1.5, M.woodLight, 0, 0.78, -0.55);
box(3.2, 0.1, 0.06, M.wood, 0, 0.72, 0.2);
// Mug, saucer, steam source.
const MUG = new THREE.Vector3(-0.42, 0.81, -0.3);
add(new THREE.CylinderGeometry(0.12, 0.1, 0.02, 24), M.cream, MUG.x, MUG.y + 0.01, MUG.z);
add(new THREE.CylinderGeometry(0.065, 0.055, 0.12, 20), M.cream, MUG.x, MUG.y + 0.08, MUG.z);
add(new THREE.CylinderGeometry(0.058, 0.058, 0.01, 20), M.coffee, MUG.x, MUG.y + 0.137, MUG.z);
const handle = add(new THREE.TorusGeometry(0.035, 0.011, 8, 16), M.cream, MUG.x + 0.072, MUG.y + 0.085, MUG.z);
handle.rotation.y = 0.2;
// Book, open.
const bookL = box(0.26, 0.025, 0.34, M.page, 0.32, 0.825, -0.5); bookL.rotation.set(0, -0.25, 0.04);
const bookR = box(0.26, 0.025, 0.34, M.page, 0.57, 0.825, -0.56); bookR.rotation.set(0, -0.25, -0.04);
const cover = box(0.54, 0.012, 0.36, M.book, 0.445, 0.807, -0.53); cover.rotation.y = -0.25;
// Plant on the sill.
add(new THREE.CylinderGeometry(0.12, 0.09, 0.2, 16), M.pot, 1.2, WY0 + 0.13, WZ + 0.12);
for (let i = 0; i < 9; i++) {
  const leaf = add(new THREE.SphereGeometry(0.1, 8, 6), i % 2 ? M.leaf : M.leaf2, 1.2, WY0 + 0.32, WZ + 0.12);
  leaf.scale.set(0.35, 1.6, 0.35);
  leaf.rotation.set((rand() - 0.5) * 1.2, rand() * 6, (rand() - 0.5) * 1.4);
  leaf.position.x += (rand() - 0.5) * 0.12; leaf.position.y += rand() * 0.1;
}
// Pendant lamp.
const LAMP = new THREE.Vector3(-0.75, 2.3, -0.75);
add(new THREE.CylinderGeometry(0.006, 0.006, 3.6 - LAMP.y, 6), M.frame, LAMP.x, (3.6 + LAMP.y) / 2 + 0.08, LAMP.z);
add(new THREE.ConeGeometry(0.24, 0.2, 20, 1, true), M.shade, LAMP.x, LAMP.y + 0.08, LAMP.z);
add(new THREE.SphereGeometry(0.055, 12, 8), flat("#ffe2a6"), LAMP.x, LAMP.y, LAMP.z);
const lampLight = new THREE.PointLight("#ffb35c", 4, 8, 1.4);
lampLight.position.set(LAMP.x, LAMP.y - 0.06, LAMP.z);
scene.add(lampLight);
const ambient = new THREE.AmbientLight("#ffcf9a", 0.18);
scene.add(ambient);
scene.add(new THREE.HemisphereLight("#8fa6cc", "#1f2a46", 2.0));

// ---------- Outside ----------
const O = {
  pave: toon("#4a5a80"), road: toon("#2c3d63"), curb: toon("#6c84a8"),
  bldg: ["#1f2a46", "#243152", "#1b2440", "#26304d", "#2a2f4c"].map((c) => toon(c)),
  winOn: flat("#f2c46d"), winWarm: flat("#e89a4a"), winOff: toon("#1a2238"),
  awning: toon("#b8573a"), pole: toon("#141a2e"), lampHead: flat("#ffe6b0"), shopWin: flat("#f4c983"),
};
box(40, 0.1, 1.7, O.pave, 0, -0.05, -2.45);
box(40, 0.12, 0.15, O.curb, 0, -0.04, -3.3);
box(40, 0.1, 4.8, O.road, 0, -0.1, -5.7);
box(40, 0.12, 1.5, O.pave, 0, -0.04, -8.85);

const glow = [];
function building(x, w, h, z, depth, mat, lit) {
  box(w, h, depth, mat, x + w / 2, h / 2, z - depth / 2);
  for (let fy = 1.1; fy < h - 0.6; fy += 1.15)
    for (let fx = x + 0.45; fx < x + w - 0.45; fx += 0.85) {
      const on = rand() < lit;
      const win = add(new THREE.PlaneGeometry(0.42, 0.62), on ? (rand() < 0.3 ? O.winWarm : O.winOn) : O.winOff, fx + 0.21, fy, z + 0.01);
      if (on && z > -12 && fy < 2.6) glow.push({ x: fx + 0.21, z, w: 0.3, strength: 0.25 });
      win.userData.toggle = on;
    }
}
for (let x = -16; x < 16;) {
  const w = 2.2 + rand() * 1.6, h = 2.8 + rand() * 2.6;
  if (x > 0.8 && x < 4) { x = 4.6; continue; } // leave room for the shop
  building(x, w, h, -9.6, 4, O.bldg[Math.floor(rand() * O.bldg.length)], 0.35);
  x += w + 0.05;
}
for (let x = -24; x < 24;) {
  const w = 3 + rand() * 3, h = 4.5 + rand() * 5;
  building(x, w, h, -19, 5, O.bldg[Math.floor(rand() * O.bldg.length)], 0.22);
  x += w + 0.4;
}
// Café across the street, mirroring ours.
box(3.6, 3.4, 4, O.bldg[2], 2.7, 1.7, -11.6);
add(new THREE.PlaneGeometry(2.6, 1.5), O.shopWin, 2.7, 1.0, -9.59);
const awning = box(3.2, 0.06, 0.9, O.awning, 2.7, 2.0, -9.2);
awning.rotation.x = 0.35;
glow.push({ x: 2.7, z: -9.6, w: 1.6, strength: 0.4 });
// Street lamps.
function streetLamp(x, z) {
  add(new THREE.CylinderGeometry(0.045, 0.06, 3.2, 8), O.pole, x, 1.6, z);
  add(new THREE.SphereGeometry(0.12, 12, 8), O.lampHead, x, 3.2, z);
  const l = new THREE.PointLight("#ffc27a", 4, 8, 1.4);
  l.position.set(x, 3.0, z);
  scene.add(l);
  glow.push({ x, z, w: 0.35, strength: 0.6 });
}
streetLamp(-2.6, -3.5);
streetLamp(5.4, -8.4);
// Reflections on the wet road: long warm strips that shimmer.
const reflMat = (s) => new THREE.MeshBasicMaterial({ color: "#f2b45a", transparent: true, opacity: s, blending: THREE.AdditiveBlending, depthWrite: false });
const reflections = glow.map((g) => {
  const len = Math.min(5, -1.7 - g.z); // towards the viewer, stopping at our wall
  const m = add(new THREE.PlaneGeometry(g.w, len), reflMat(g.strength), g.x, 0.01, g.z + len / 2);
  m.rotation.x = -Math.PI / 2;
  m.userData.phase = rand() * 6;
  return m;
});

// Someone walking past under a vermilion umbrella.
const walker = new THREE.Group();
add(new THREE.CylinderGeometry(0.17, 0.2, 1.15, 10), toon("#10141f"), 0, 0.62, 0, walker);
add(new THREE.SphereGeometry(0.13, 10, 8), toon("#10141f"), 0, 1.33, 0, walker);
add(new THREE.CylinderGeometry(0.012, 0.012, 0.6, 5), O.pole, 0.06, 1.55, 0, walker);
add(new THREE.ConeGeometry(0.62, 0.28, 16), O.awning, 0.06, 1.88, 0, walker);
walker.position.set(-14, 0, -8.7);
scene.add(walker);
const walk = { dir: 1, wait: 2 };

// Rain: line segments falling outside.
const RAIN = 1600, rainPos = new Float32Array(RAIN * 6), rainV = new Float32Array(RAIN);
for (let i = 0; i < RAIN; i++) {
  const x = -10 + rand() * 20, y = rand() * 10, z = -1.8 - rand() * 13;
  rainPos.set([x, y, z, x + 0.03, y + 0.32, z], i * 6);
  rainV[i] = 7 + rand() * 3;
}
const rainGeo = new THREE.BufferGeometry();
rainGeo.setAttribute("position", new THREE.BufferAttribute(rainPos, 3));
const rain = new THREE.LineSegments(rainGeo, new THREE.LineBasicMaterial({ color: "#a9bde0", transparent: true, opacity: 0.55, depthWrite: false }));
rain.frustumCulled = false;
scene.add(rain);

// Steam from the mug.
const steamTex = (() => {
  const c = document.createElement("canvas"); c.width = c.height = 32;
  const g = c.getContext("2d"), r = g.createRadialGradient(16, 16, 0, 16, 16, 16);
  r.addColorStop(0, "rgba(255,255,255,1)"); r.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = r; g.fillRect(0, 0, 32, 32);
  return new THREE.CanvasTexture(c);
})();
const steam = Array.from({ length: 10 }, (_, i) => {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: steamTex, color: "#f6e8d2", transparent: true, depthWrite: false }));
  s.userData = { age: (i / 10) * 3, seed: rand() * 6 };
  scene.add(s);
  return s;
});

// ---------- The print shader ----------
const PALETTE = ["#0e1120", "#141a2e", "#1f2a46", "#2c3d63", "#42577f", "#6c84a8", "#1f3a3a", "#3c5e4e",
  "#4a2519", "#7a3b28", "#b8573a", "#e89a4a", "#f2c46d", "#c9b28a", "#efe2c6", "#5a4a58"];
const srgbToLin = (v) => (v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));
function oklab(r, g, b) {
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return new THREE.Vector3(0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s, 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s, 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s);
}
const palSrgb = PALETTE.map((h) => { const n = parseInt(h.slice(1), 16); return new THREE.Vector3(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255); });
const palLab = palSrgb.map((v) => oklab(srgbToLin(v.x), srgbToLin(v.y), srgbToLin(v.z)));

const post = new THREE.ShaderMaterial({
  uniforms: {
    tColor: { value: low.texture }, tDepth: { value: low.depthTexture }, uLow: { value: new THREE.Vector2(64, 40) },
    uPal: { value: palSrgb }, uPalLab: { value: palLab }, uPaletteMix: { value: 1 }, uDither: { value: 0.5 },
    uInk: { value: 0.6 }, uGrain: { value: 0.5 }, uNear: { value: camera.near }, uFar: { value: camera.far },
  },
  vertexShader: `varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`,
  fragmentShader: `
    uniform sampler2D tColor; uniform sampler2D tDepth; uniform vec2 uLow;
    uniform vec3 uPal[16]; uniform vec3 uPalLab[16];
    uniform float uPaletteMix, uDither, uInk, uGrain, uNear, uFar;
    varying vec2 vUv;
    vec3 toSRGB(vec3 c) { c = max(c, 0.0); return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c)); }
    vec3 oklab(vec3 c) {
      c = max(c, 0.0);
      float l = pow(0.4122214708 * c.r + 0.5363325363 * c.g + 0.0514459929 * c.b, 1.0 / 3.0);
      float m = pow(0.2119034982 * c.r + 0.6806995451 * c.g + 0.1073969566 * c.b, 1.0 / 3.0);
      float s = pow(0.0883024619 * c.r + 0.2817188376 * c.g + 0.6299787005 * c.b, 1.0 / 3.0);
      return vec3(0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s, 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s, 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s);
    }
    float depthAt(vec2 uv) { float z = texture2D(tDepth, uv).r * 2.0 - 1.0; return (2.0 * uNear * uFar) / (uFar + uNear - z * (uFar - uNear)); }
    float bayer(vec2 p) {
      int x = int(mod(p.x, 4.0)), y = int(mod(p.y, 4.0)), i = x + y * 4;
      int b[16] = int[16](0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5);
      return (float(b[i]) + 0.5) / 16.0;
    }
    float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
    void main() {
      vec2 cell = floor(vUv * uLow), px = 1.0 / uLow, uv = (cell + 0.5) * px;
      vec3 lin = texture2D(tColor, uv).rgb;

      // Ink lines where depth jumps.
      float d0 = depthAt(uv);
      float e = abs(depthAt(uv + vec2(px.x, 0.0)) - d0) + abs(depthAt(uv - vec2(px.x, 0.0)) - d0)
              + abs(depthAt(uv + vec2(0.0, px.y)) - d0) + abs(depthAt(uv - vec2(0.0, px.y)) - d0);
      float edge = smoothstep(0.06, 0.2, e / max(d0, 0.05));

      // Nearest two palette colours in OKLab, ordered dither between them.
      vec3 lab = oklab(lin);
      float b1 = 1e9, b2 = 1e9; int i1 = 0, i2 = 0;
      for (int i = 0; i < 16; i++) {
        float d = distance(lab, uPalLab[i]);
        if (d < b1) { b2 = b1; i2 = i1; b1 = d; i1 = i; } else if (d < b2) { b2 = d; i2 = i; }
      }
      float t = b1 / (b1 + b2 + 1e-5);
      vec3 q = (t * 2.0 * uDither > bayer(cell)) ? uPal[i2] : uPal[i1];
      vec3 col = mix(toSRGB(lin), q, uPaletteMix);
      col = mix(col, uPal[0], edge * uInk);

      // Paper: fine grain plus long fibres, at screen resolution.
      vec2 fp = gl_FragCoord.xy;
      float n = hash(fp), fib = hash(floor(fp * vec2(0.5, 0.08)));
      col *= 1.0 - uGrain * 0.14 * (n - 0.5) * 2.0;
      col = mix(col, vec3(0.94, 0.89, 0.78), uGrain * 0.07 * fib);
      vec2 v = vUv - 0.5;
      col *= 1.0 - dot(v, v) * 0.55;
      gl_FragColor = vec4(col, 1.0);
    }`,
  depthTest: false,
  depthWrite: false,
});
const postScene = new THREE.Scene();
postScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), post));
const postCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

function apply() {
  post.uniforms.uPaletteMix.value = S.palette;
  post.uniforms.uDither.value = S.dither;
  post.uniforms.uInk.value = S.ink;
  post.uniforms.uGrain.value = S.grain;
  lampLight.intensity = 4 * S.warmth;
  ambient.intensity = 0.18 * S.warmth;
  rainGeo.setDrawRange(0, Math.round(RAIN * S.rain) * 2);
  resize();
}

let W = 0, H = 0;
function resize() {
  const r = stage.getBoundingClientRect();
  if (!r.width) return;
  W = r.width; H = r.height;
  renderer.setSize(W, H, false);
  const lw = Math.max(48, Math.round(W / S.pixel)), lh = Math.max(30, Math.round(H / S.pixel));
  low.setSize(lw, lh);
  post.uniforms.uLow.value.set(lw, lh);
  camera.aspect = W / H;
  camera.updateProjectionMatrix();
  if (!running) render(clock, 0);
}

// ---------- Motion ----------
const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
stage.addEventListener("pointermove", (e) => {
  if (e.pointerType !== "mouse") return;
  const r = stage.getBoundingClientRect();
  pointer.tx = ((e.clientX - r.left) / r.width - 0.5) * 2;
  pointer.ty = ((e.clientY - r.top) / r.height - 0.5) * 2;
});
stage.addEventListener("pointerleave", () => { pointer.tx = pointer.ty = 0; });

let clock = 0;
function update(t, dt) {
  // Camera breathes a little and leans toward the pointer.
  pointer.x += (pointer.tx - pointer.x) * Math.min(1, dt * 2);
  pointer.y += (pointer.ty - pointer.y) * Math.min(1, dt * 2);
  camera.position.set(camBase.x + Math.sin(t * 0.13) * 0.03 + pointer.x * 0.12, camBase.y + Math.sin(t * 0.21) * 0.015 - pointer.y * 0.05, camBase.z);
  camera.lookAt(camTarget);

  for (let i = 0; i < RAIN; i++) {
    const o = i * 6, dy = rainV[i] * dt;
    rainPos[o + 1] -= dy; rainPos[o + 4] -= dy; rainPos[o] -= dy * 0.08; rainPos[o + 3] -= dy * 0.08;
    if (rainPos[o + 1] < -0.1) { const x = -10 + rand() * 20; rainPos[o] = x; rainPos[o + 3] = x + 0.03; rainPos[o + 1] = 9.5 + rand(); rainPos[o + 4] = rainPos[o + 1] + 0.32; }
  }
  rainGeo.attributes.position.needsUpdate = true;

  for (const r of reflections) r.scale.x = 1 + Math.sin(t * 2.2 + r.userData.phase) * 0.25;

  if (walk.wait > 0) walk.wait -= dt;
  else {
    walker.position.x += walk.dir * 1.1 * dt;
    walker.position.y = Math.abs(Math.sin(t * 6)) * 0.03;
    if (Math.abs(walker.position.x) > 14) { walk.dir *= -1; walk.wait = 8 + rand() * 8; }
  }

  for (const s of steam) {
    const u = s.userData; u.age += dt;
    if (u.age > 3) { u.age = 0; u.seed = rand() * 6; }
    const k = u.age / 3;
    s.position.set(MUG.x + Math.sin(u.age * 1.8 + u.seed) * 0.03 * (1 + u.age), MUG.y + 0.16 + u.age * 0.12, MUG.z + Math.cos(u.age * 1.3 + u.seed) * 0.02);
    s.scale.setScalar(0.04 + k * 0.1);
    s.material.opacity = Math.sin(Math.PI * k) * 0.16;
  }
}

function render() {
  renderer.setRenderTarget(low);
  renderer.render(scene, camera);
  renderer.setRenderTarget(null);
  renderer.render(postScene, postCam);
}

let running = false, last = 0, onScreen = true;
function frame(ts) {
  if (!running) return;
  const dt = Math.min(0.05, (ts - last) / 1000 || 0) * S.speed;
  last = ts; clock += dt;
  update(clock, dt);
  render();
  requestAnimationFrame(frame);
}
function start() { if (running || reduce) return; running = true; last = performance.now(); requestAnimationFrame(frame); }
function stop() { running = false; }

new ResizeObserver(resize).observe(stage);
new IntersectionObserver(([e]) => { onScreen = e.isIntersecting; onScreen && !document.hidden ? start() : stop(); }).observe(stage);
document.addEventListener("visibilitychange", () => (document.hidden || !onScreen ? stop() : start()));

clock = 6; // start mid-scene so the first frame isn't empty
update(clock, 0);
apply();
render();
start();
