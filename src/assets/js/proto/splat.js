// PROTOTYPE: a café written as code, baked to splats, voxel-snapped and palette-snapped.
// The SCENE section is plain data-ish code: shapes with a colour role. That is the seed of a scene tool.
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

THREE.ColorManagement.enabled = false; // work in plain sRGB numbers end to end

const stage = document.querySelector("[data-proto-stage]");
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

// ---------- Palettes (roles shared with /proto/woodblock/) ----------
const PALETTES = [
  { name: "Indigo night", skyTop: "#14223f", skyBottom: "#41618c", far: "#1f2d4c", mid: "#2b3a5a", midShadow: "#1a2440",
    light: "#f4cf82", lightHot: "#fff0c6", accent: "#b8403a", accent2: "#e58a3c", street: "#22304f", streetWet: "#4f6b96",
    ink: "#11151f", rain: "#a9bddc", interior: "#2e1c14", interiorLit: "#8c5a34", wall: "#6e4630", cup: "#efe2c6",
    lampGlow: "#f6c06a", curtain: "#25407a", crest: "#efe2c6", leaf: "#3f5e44", blossom: "#f2b6b0" },
  { name: "Teal dusk", skyTop: "#285a70", skyBottom: "#f1c4a0", far: "#3d6e7c", mid: "#2f5866", midShadow: "#21414d",
    light: "#ffd59a", lightHot: "#fff4dc", accent: "#c2533d", accent2: "#ef9555", street: "#2e5864", streetWet: "#93b9b8",
    ink: "#132730", rain: "#d6e6e3", interior: "#2a2426", interiorLit: "#86604a", wall: "#6a5048", cup: "#f3e8d4",
    lampGlow: "#ffca8c", curtain: "#1f4a58", crest: "#f3e8d4", leaf: "#3d6b5a", blossom: "#f5c1b0" },
  { name: "Moonlit gold", skyTop: "#2a3226", skyBottom: "#aea56c", far: "#3a3b2b", mid: "#2f2b21", midShadow: "#1e1c16",
    light: "#f3c55e", lightHot: "#fff1b8", accent: "#8e3a22", accent2: "#d98d2c", street: "#34301f", streetWet: "#bda965",
    ink: "#14120d", rain: "#cfcba8", interior: "#271b12", interiorLit: "#7d5730", wall: "#5e4229", cup: "#ece0bf",
    lampGlow: "#f2b24b", curtain: "#3d3a28", crest: "#ece0bf", leaf: "#4f5a2e", blossom: "#efc9a0" },
  { name: "Diner green", skyTop: "#0d2526", skyBottom: "#24524e", far: "#173535", mid: "#6e3226", midShadow: "#47201a",
    light: "#f1e8a6", lightHot: "#fcf8dc", accent: "#2f7c6b", accent2: "#cf5139", street: "#183432", streetWet: "#467a70",
    ink: "#0a1413", rain: "#a9cbc3", interior: "#1c2926", interiorLit: "#8b7d4c", wall: "#3c4c45", cup: "#f1ead2",
    lampGlow: "#ece49e", curtain: "#143a37", crest: "#f1ead2", leaf: "#2f6a4a", blossom: "#f0b8a8" },
];
const ROLES = Object.keys(PALETTES[0]).filter((k) => k !== "name");
const hex = (h) => { const n = parseInt(h.slice(1), 16); return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]; };

// ---------- Settings ----------
const S = { palette: 0, view: "diorama", voxel: 0.03, splat: 1.4, round: 0.3, paletteMix: 1, dither: 0.3, pixel: 2, warmth: 0.75, rain: 0.6 };
const CONTROLS = [
  { key: "voxel", label: "Voxel snap", min: 0, max: 0.12, step: 0.005, fmt: (v) => (v ? Math.round(v * 1000) / 10 + "cm" : "off") },
  { key: "splat", label: "Splat size", min: 0.5, max: 3, step: 0.1, fmt: (v) => v.toFixed(1) + "×" },
  { key: "round", label: "Square ↔ round", min: 0, max: 1, step: 0.05, fmt: (v) => Math.round(v * 100) + "%" },
  { key: "paletteMix", label: "Palette snap", min: 0, max: 1, step: 0.05, fmt: (v) => Math.round(v * 100) + "%" },
  { key: "dither", label: "Dither", min: 0, max: 1, step: 0.05, fmt: (v) => Math.round(v * 100) + "%" },
  { key: "pixel", label: "Pixel size", min: 1, max: 6, step: 1, fmt: (v) => v + "px" },
  { key: "warmth", label: "Lamp warmth", min: 0.3, max: 2, step: 0.05, fmt: (v) => v.toFixed(2) + "×" },
  { key: "rain", label: "Rain", min: 0, max: 1, step: 0.05, fmt: (v) => Math.round(v * 100) + "%" },
];

// ---------- Scene, written as code ----------
let seed = 1234;
const rand = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
const DENSITY = 1700; // splats per square metre

const P = { pos: [], nrm: [], role: [], emit: [], grain: [], shimmer: [] };
function splat(x, y, z, nx, ny, nz, role, o = {}) {
  P.pos.push(x, y, z); P.nrm.push(nx, ny, nz);
  P.role.push(ROLES.indexOf(typeof role === "function" ? role(x, y, z) : role));
  P.emit.push(o.emit ? 1 : 0); P.grain.push(o.grain ? 1 : 0); P.shimmer.push(o.shimmer ? 1 : 0);
}
// Rectangle from corner c along edges u and v, with outward normal n.
function quad(c, u, v, n, role, o = {}) {
  const lu = Math.hypot(...u), lv = Math.hypot(...v), step = 1 / Math.sqrt(DENSITY * (o.density ?? 1));
  const nu = Math.max(2, Math.round(lu / step)), nv = Math.max(2, Math.round(lv / step));
  for (let i = 0; i < nu; i++) for (let j = 0; j < nv; j++) {
    const a = (i + 0.2 + rand() * 0.6) / nu, b = (j + 0.2 + rand() * 0.6) / nv;
    splat(c[0] + u[0] * a + v[0] * b, c[1] + u[1] * a + v[1] * b, c[2] + u[2] * a + v[2] * b, n[0], n[1], n[2], role, o);
  }
}
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
function box(cx, cy, cz, w, h, d, role, o = {}) {
  const x0 = cx - w / 2, y0 = cy - h / 2, z0 = cz - d / 2, skip = o.skip || "";
  if (!skip.includes("t")) quad([x0, y0 + h, z0], [w, 0, 0], [0, 0, d], [0, 1, 0], role, o);
  if (!skip.includes("b")) quad([x0, y0, z0], [w, 0, 0], [0, 0, d], [0, -1, 0], role, o);
  if (!skip.includes("f")) quad([x0, y0, z0 + d], [w, 0, 0], [0, h, 0], [0, 0, 1], role, o);
  if (!skip.includes("k")) quad([x0, y0, z0], [w, 0, 0], [0, h, 0], [0, 0, -1], role, o);
  if (!skip.includes("l")) quad([x0, y0, z0], [0, 0, d], [0, h, 0], [-1, 0, 0], role, o);
  if (!skip.includes("r")) quad([x0 + w, y0, z0], [0, 0, d], [0, h, 0], [1, 0, 0], role, o);
}
function cyl(cx, cy, cz, r, h, role, o = {}) {
  const side = Math.max(8, Math.round(2 * Math.PI * r * h * DENSITY)), top = Math.max(6, Math.round(Math.PI * r * r * DENSITY));
  for (let i = 0; i < side; i++) { const a = rand() * 6.2832, y = cy - h / 2 + rand() * h; splat(cx + Math.cos(a) * r, y, cz + Math.sin(a) * r, Math.cos(a), 0, Math.sin(a), role, o); }
  for (let i = 0; i < top; i++) { const a = rand() * 6.2832, q = Math.sqrt(rand()) * r; splat(cx + Math.cos(a) * q, cy + h / 2, cz + Math.sin(a) * q, 0, 1, 0, o.topRole || role, o); }
}
function sphere(cx, cy, cz, r, role, o = {}) {
  const [sx, sy, sz] = o.scale || [1, 1, 1];
  const count = Math.max(10, Math.round(4 * Math.PI * r * r * sx * sz * DENSITY * (o.density ?? 1)));
  for (let i = 0; i < count; i++) {
    const u = rand() * 2 - 1, a = rand() * 6.2832, s = Math.sqrt(1 - u * u);
    const nx = s * Math.cos(a), ny = u, nz = s * Math.sin(a);
    const x = cx + nx * r * sx, y = cy + ny * r * sy, z = cz + nz * r * sz;
    if (o.keep && !o.keep(x, y, z)) continue;
    splat(x, y, z, nx, ny, nz, role, o);
  }
}
function stroke(pts, role, o = {}) { // a thin line of splats through points
  for (let i = 0; i < pts.length - 1; i++) {
    const [a, b] = [pts[i], pts[i + 1]], len = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]), n = Math.ceil(len / 0.012);
    for (let k = 0; k < n; k++) { const t = k / n; splat(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t, 0, 1, 0, role, o); }
  }
}
const arc = (x0, y0, z0, x1, y1, z1, sag, n = 24) => Array.from({ length: n + 1 }, (_, i) => { const t = i / n; return [x0 + (x1 - x0) * t, y0 + (y1 - y0) * t - Math.sin(Math.PI * t) * sag, z0 + (z1 - z0) * t]; });

const WALL_Z = -1.5, WIN = { x0: -1.3, x1: 1.3, y0: 0.95, y1: 2.25 };
const LANTERN = [0.95, 2.12, -0.6], STREETLAMP = [1.45, 2.42, -2.0];
const GLOWS = [];
function buildScene() {
  // Floating island underneath everything.
  sphere(0, -0.1, -1.45, 1, "midShadow", { scale: [3.0, 0.75, 3.3], keep: (x, y) => y < -0.12, density: 0.35 });
  // Café floor (wood) and the street behind it.
  box(0, -0.06, 0.05, 4.2, 0.12, 3.1, "interior", { grain: true, skip: "b" });
  box(0, -0.08, -1.95, 4.2, 0.1, 0.8, "mid", { skip: "b" });
  box(0, -0.12, -2.95, 4.2, 0.1, 1.2, (x, y, z) => (Math.sin(x * 3.1 + z * 5) + Math.sin(x * 7.3 - z * 2) > 1.1 ? "streetWet" : "street"), { skip: "b" });
  box(0, -0.08, -3.95, 4.2, 0.1, 0.8, "mid", { skip: "b" });
  // Back wall with the window hole, and the left wall.
  box(-1.7, 1.35, WALL_Z, 0.8, 2.7, 0.12, "wall");
  box(1.7, 1.35, WALL_Z, 0.8, 2.7, 0.12, "wall");
  box(0, WIN.y0 / 2, WALL_Z, 2.6, WIN.y0, 0.12, "wall");
  box(0, (WIN.y1 + 2.7) / 2, WALL_Z, 2.6, 2.7 - WIN.y1, 0.12, "wall");
  box(-2.1, 1.35, 0.05, 0.12, 2.7, 3.1, "wall");
  // Window frame, mullions, lattice strip.
  box(0, WIN.y0, WALL_Z + 0.04, 2.8, 0.06, 0.22, "interior", { grain: true });
  box(0, WIN.y1, WALL_Z, 2.7, 0.06, 0.16, "interior");
  box(WIN.x0, (WIN.y0 + WIN.y1) / 2, WALL_Z, 0.06, WIN.y1 - WIN.y0, 0.16, "interior");
  box(WIN.x1, (WIN.y0 + WIN.y1) / 2, WALL_Z, 0.06, WIN.y1 - WIN.y0, 0.16, "interior");
  for (const x of [-0.43, 0.43]) box(x, (WIN.y0 + WIN.y1) / 2, WALL_Z, 0.04, WIN.y1 - WIN.y0, 0.08, "interior");
  box(0, 2.0, WALL_Z, 2.6, 0.035, 0.06, "interior");
  for (let x = WIN.x0 + 0.13; x < WIN.x1; x += 0.13) box(x, 2.125, WALL_Z, 0.02, 0.25, 0.04, "interior");
  // Counter along the window, and two stools.
  box(0, 0.9, -1.17, 2.8, 0.06, 0.6, "interiorLit", { grain: true });
  box(0, 0.45, -0.89, 2.8, 0.88, 0.04, "interior", { grain: true });
  for (const x of [-0.6, 0.6]) {
    cyl(x, 0.66, -0.5, 0.17, 0.05, "accent");
    for (const [dx, dz] of [[-0.1, -0.08], [0.1, -0.08], [0, 0.11]]) box(x + dx, 0.32, -0.5 + dz, 0.025, 0.64, 0.025, "interior");
  }
  // On the counter: kettle, cup, vase with a blossom branch.
  sphere(-0.55, 1.03, -1.2, 0.11, "ink", { scale: [1, 0.78, 1] });
  stroke(arc(-0.64, 1.1, -1.2, -0.46, 1.1, -1.2, -0.12, 14), "ink");
  stroke([[-0.66, 1.02, -1.2], [-0.74, 1.08, -1.2]], "ink");
  cyl(0.25, 0.936, -1.1, 0.08, 0.012, "cup");
  cyl(0.25, 0.985, -1.1, 0.045, 0.09, "cup", { topRole: "interior" });
  stroke(arc(0.295, 1.01, -1.1, 0.295, 0.96, -1.1, -0.03, 8).map(([x, y, z], i) => [x + Math.sin((i / 8) * Math.PI) * 0.03, y, z]), "cup");
  cyl(0.9, 1.0, -1.25, 0.05, 0.14, "accent");
  const branch = [[0.9, 1.07, -1.25], [0.86, 1.3, -1.27], [0.8, 1.5, -1.28], [0.72, 1.64, -1.3]];
  stroke(branch, "ink"); stroke([[0.86, 1.3, -1.27], [0.98, 1.45, -1.26], [1.04, 1.58, -1.25]], "ink");
  for (const [x, y, z] of [[0.72, 1.64, -1.3], [0.8, 1.5, -1.28], [1.04, 1.58, -1.25], [0.98, 1.45, -1.26], [0.84, 1.4, -1.27], [0.76, 1.56, -1.29]]) sphere(x, y, z, 0.03, "blossom");
  // Paper lantern with ribs, hanging from a cord.
  stroke([[LANTERN[0], LANTERN[1] + 0.24, LANTERN[2]], [LANTERN[0], 2.7, LANTERN[2]]], "ink");
  sphere(...LANTERN, 0.2, (x, y) => ((y * 100) % 6 < 0.9 ? "interiorLit" : "lampGlow"), { scale: [1, 1.12, 1], emit: true });
  for (const dy of [0.23, -0.23]) cyl(LANTERN[0], LANTERN[1] + dy, LANTERN[2], 0.08, 0.03, "ink");
  GLOWS.push({ p: LANTERN, r: 1.5, role: "lampGlow", a: 0.22 });
  // Noren curtain on the wall left of the window, with a crest.
  for (const [x, w] of [[-1.92, 0.34], [-1.55, 0.34]]) quad([x - w / 2 + 0.17, 1.65, WALL_Z + 0.075], [w, 0, 0], [0, 0.62, 0], [0, 0, 1],
    (px, py) => (Math.abs(Math.hypot(px + 1.73, py - 2.0) - 0.11) < 0.022 ? "crest" : "curtain"));
  // Shelf with jars on the left wall, a plant in the corner.
  box(-1.96, 1.6, 0.35, 0.18, 0.035, 1.1, "interiorLit", { grain: true });
  for (const [z, role] of [[-0.05, "cup"], [0.2, "accent2"], [0.45, "cup"], [0.7, "leaf"]]) cyl(-1.96, 1.7, z, 0.045, 0.16, role);
  cyl(-1.75, 0.18, 1.2, 0.16, 0.36, "accent2");
  for (let i = 0; i < 9; i++) { const a = rand() * 6.28, h = 0.45 + rand() * 0.45; sphere(-1.75 + Math.cos(a) * 0.12, h, 1.2 + Math.sin(a) * 0.12, 0.09 + rand() * 0.05, i % 2 ? "leaf" : "midShadow", { scale: [0.8, 1.4, 0.8] }); }

  // ---------- Outside ----------
  // Street lamp.
  cyl(STREETLAMP[0], 1.2, STREETLAMP[2], 0.035, 2.4, "ink");
  box(STREETLAMP[0] - 0.08, 2.4, STREETLAMP[2], 0.18, 0.03, 0.03, "ink");
  sphere(...STREETLAMP, 0.09, "lightHot", { emit: true });
  GLOWS.push({ p: STREETLAMP, r: 1.1, role: "lightHot", a: 0.25 });
  // Shop row across the street, with lit shoji windows (lattice), an awning and lanterns.
  const FZ = -4.2;
  box(0, 1.5, FZ - 0.15, 4.4, 3.0, 0.3, "mid", { skip: "k" });
  box(0, 3.06, FZ + 0.05, 4.6, 0.1, 0.65, "midShadow");
  for (const x of [-1.4, 0, 1.4]) {
    quad([x - 0.45, 0.25, FZ + 0.01], [0.9, 0, 0], [0, 0.8, 0], [0, 0, 1], (px, py) => (((px - x + 10) % 0.15) < 0.02 || Math.abs(py - 0.65) < 0.015 ? "ink" : "light"), { emit: true });
    GLOWS.push({ p: [x, 0.65, FZ + 0.3], r: 1.0, role: "light", a: 0.18 });
    // Rippling reflection on the wet road.
    for (let i = 0; i < 260; i++) { const z = FZ + 0.5 + rand() * 1.9, f = (z - FZ - 0.5) / 1.9, w = 0.35 * (1 - f * 0.6); splat(x + (rand() - 0.5) * w, -0.065, z, 0, 1, 0, rand() < 0.5 ? "light" : "lightHot", { emit: true, shimmer: true }); }
  }
  for (const [x, lit] of [[-1.6, true], [-0.55, false], [0.55, true], [1.6, false]]) quad([x - 0.3, 1.8, FZ + 0.01], [0.6, 0, 0], [0, 0.5, 0], [0, 0, 1], lit ? "light" : "midShadow", { emit: lit });
  quad([-0.65, 1.28, FZ + 0.02], [1.3, 0, 0], [0, -0.22, 0.45], [0, 0.9, 0.4], (px) => (Math.floor((px + 0.65) / 0.13) % 2 ? "accent" : "cup"));
  for (const x of [-0.9, 0.9]) { sphere(x, 1.15, FZ + 0.15, 0.07, "accent2", { emit: true }); GLOWS.push({ p: [x, 1.15, FZ + 0.2], r: 0.45, role: "accent2", a: 0.25 }); }
  // Taller buildings behind, a telegraph pole and its wires.
  box(-1.3, 2.3, FZ - 0.55, 1.8, 4.6, 0.3, "far", { skip: "k", density: 0.6 });
  box(1.25, 2.0, FZ - 0.55, 1.9, 4.0, 0.3, "far", { skip: "k", density: 0.6 });
  for (let i = 0; i < 9; i++) { const x = -2 + rand() * 4, y = 3.2 + rand() * 0.9; quad([x, y, FZ - 0.39], [0.16, 0, 0], [0, 0.22, 0], [0, 0, 1], "light", { emit: true }); }
  cyl(-1.55, 1.6, -3.75, 0.04, 3.3, "ink");
  box(-1.55, 3.05, -3.75, 0.6, 0.04, 0.04, "ink");
  for (const [dx, sag] of [[-0.28, 0.35], [0.28, 0.25]]) stroke(arc(-1.55 + dx, 3.07, -3.75, 2.2, 2.8, -3.5, sag, 40), "ink");
}
buildScene();

const N = P.pos.length / 3;
const rnd = new Float32Array(N * 3);
for (let i = 0; i < N; i++) { const a = rand() * 6.2832, u = rand() * 2 - 1, s = Math.sqrt(1 - u * u), m = 0.6 + rand() * 2.4; rnd.set([s * Math.cos(a) * m, Math.abs(u) * m + 0.5, s * Math.sin(a) * m], i * 3); }

// ---------- Bake lighting into colours ----------
const colors = new Float32Array(N * 3);
function bake() {
  const pal = PALETTES[S.palette], C = Object.fromEntries(ROLES.map((r) => [r, hex(pal[r])]));
  const lights = [
    { p: LANTERN, c: C.lampGlow, k: 1.0 * S.warmth, r: 1.8 },
    { p: STREETLAMP, c: C.lightHot, k: 0.8, r: 1.6 },
    ...[-1.4, 0, 1.4].map((x) => ({ p: [x, 0.7, -3.9], c: C.light, k: 0.7, r: 1.4 })),
  ];
  const ambIn = C.skyBottom.map((v) => v * 0.22 + 0.08), ambOut = C.skyBottom.map((v) => v * 0.4 + 0.05);
  for (let i = 0; i < N; i++) {
    const o = i * 3, base = C[ROLES[P.role[i]]];
    let c;
    if (P.emit[i]) c = base.slice();
    else {
      const x = P.pos[o], y = P.pos[o + 1], z = P.pos[o + 2], inside = z > WALL_Z - 0.07;
      const amb = inside ? ambIn : ambOut, acc = [amb[0], amb[1], amb[2]];
      for (const L of lights) {
        const dx = L.p[0] - x, dy = L.p[1] - y, dz = L.p[2] - z, d = Math.hypot(dx, dy, dz) || 1;
        let diff = Math.max(0, (dx * P.nrm[o] + dy * P.nrm[o + 1] + dz * P.nrm[o + 2]) / d) * 0.7 + 0.3;
        const att = L.k / (1 + (d / L.r) ** 2 * 4);
        diff = Math.ceil(diff * att * 3) / 3; // toon bands
        for (let k = 0; k < 3; k++) acc[k] += L.c[k] * diff * 0.9;
      }
      const g = P.grain[i] ? 0.9 + 0.12 * Math.sin(x * 38 + Math.sin(z * 9) * 2) : 1;
      c = [0, 1, 2].map((k) => Math.min(1, base[k] * acc[k] * 1.2 * g));
    }
    colors.set(c, o);
  }
  geo.attributes.color.needsUpdate = true;
  // Palette for the shader to snap to, and glow colours.
  const pv = ROLES.map((r) => C[r]);
  palU.value = Array.from({ length: 32 }, (_, i) => new THREE.Vector3(...(pv[i] || pv[0])));
  palLabU.value = palU.value.map((v) => oklab(v));
  palN.value = pv.length;
  glowGeo.attributes.color.array.set(GLOWS.flatMap((g) => C[g.role]));
  glowGeo.attributes.color.needsUpdate = true;
  rainMat.uniforms.uColor.value.set(...C.rain);
  steamMat.uniforms.uColor.value.set(...C.cup);
  renderer.setClearColor(new THREE.Color(...C.skyTop));
}
function oklab([r, g, b]) {
  const lin = (v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  [r, g, b] = [lin(r), lin(g), lin(b)];
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b), m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b), s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return new THREE.Vector3(0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s, 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s, 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s);
}

// ---------- Renderer ----------
const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: "high-performance" });
renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
stage.append(renderer.domElement);
const low = new THREE.WebGLRenderTarget(64, 40, { minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, depthBuffer: true });
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(42, 1.6, 0.05, 80);

const BAYER = `float bayer(vec2 p) { int x = int(mod(p.x, 4.0)), y = int(mod(p.y, 4.0)); int b[16] = int[16](0,8,2,10,12,4,14,6,3,11,1,9,15,7,13,5); return (float(b[x + y * 4]) + 0.5) / 16.0; }`;
const palU = { value: [] }, palLabU = { value: [] }, palN = { value: 1 };
const shared = { uScatter: { value: 0 }, uVoxel: { value: S.voxel }, uSplat: { value: 0.035 }, uScale: { value: 400 }, uTime: { value: 0 } };

const geo = new THREE.BufferGeometry();
geo.setAttribute("position", new THREE.Float32BufferAttribute(P.pos, 3));
geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
geo.setAttribute("aRand", new THREE.BufferAttribute(rnd, 3));
geo.setAttribute("aShimmer", new THREE.Float32BufferAttribute(P.shimmer, 1));
const mat = new THREE.ShaderMaterial({
  uniforms: { ...shared, uRound: { value: S.round }, uMix: { value: 1 }, uDither: { value: 0.3 }, uPal: palU, uPalLab: palLabU, uPalN: palN },
  vertexShader: `
    attribute vec3 aRand; attribute float aShimmer;
    uniform float uScatter, uVoxel, uSplat, uScale, uTime;
    varying vec3 vColor;
    void main() {
      vec3 p = position;
      if (uVoxel > 0.0) p = floor(p / uVoxel + 0.5) * uVoxel;
      p.x += aShimmer * sin(uTime * 2.3 + p.z * 23.0) * 0.03;
      p += aRand * uScatter;
      vec4 mv = modelViewMatrix * vec4(p, 1.0);
      gl_Position = projectionMatrix * mv;
      gl_PointSize = max(1.0, uSplat * uScale / -mv.z);
      vColor = color;
    }`,
  fragmentShader: `
    uniform float uRound, uMix, uDither; uniform vec3 uPal[32]; uniform vec3 uPalLab[32]; uniform int uPalN;
    varying vec3 vColor;
    ${BAYER}
    vec3 oklab(vec3 c) {
      c = mix(c / 12.92, pow((c + 0.055) / 1.055, vec3(2.4)), step(0.04045, c));
      float l = pow(0.4122214708*c.r + 0.5363325363*c.g + 0.0514459929*c.b, 1.0/3.0);
      float m = pow(0.2119034982*c.r + 0.6806995451*c.g + 0.1073969566*c.b, 1.0/3.0);
      float s = pow(0.0883024619*c.r + 0.2817188376*c.g + 0.6299787005*c.b, 1.0/3.0);
      return vec3(0.2104542553*l + 0.793617785*m - 0.0040720468*s, 1.9779984951*l - 2.428592205*m + 0.4505937099*s, 0.0259040371*l + 0.7827717662*m - 0.808675766*s);
    }
    void main() {
      vec2 c = gl_PointCoord - 0.5;
      if (mix(max(abs(c.x), abs(c.y)), length(c), uRound) > 0.5) discard;
      vec3 lab = oklab(vColor);
      float b1 = 1e9, b2 = 1e9; int i1 = 0, i2 = 0;
      for (int i = 0; i < 32; i++) {
        if (i >= uPalN) break;
        float d = distance(lab, uPalLab[i]);
        if (d < b1) { b2 = b1; i2 = i1; b1 = d; i1 = i; } else if (d < b2) { b2 = d; i2 = i; }
      }
      float t = b1 / (b1 + b2 + 1e-5);
      vec3 q = (t * 2.0 * uDither > bayer(gl_FragCoord.xy)) ? uPal[i2] : uPal[i1];
      gl_FragColor = vec4(mix(vColor, q, uMix), 1.0);
    }`,
  vertexColors: true,
});
scene.add(new THREE.Points(geo, mat));

// Soft glows, added on top.
const glowGeo = new THREE.BufferGeometry();
glowGeo.setAttribute("position", new THREE.Float32BufferAttribute(GLOWS.flatMap((g) => g.p), 3));
glowGeo.setAttribute("color", new THREE.Float32BufferAttribute(new Array(GLOWS.length * 3).fill(1), 3));
glowGeo.setAttribute("aSize", new THREE.Float32BufferAttribute(GLOWS.map((g) => g.r), 1));
glowGeo.setAttribute("aAlpha", new THREE.Float32BufferAttribute(GLOWS.map((g) => g.a), 1));
const glowMat = new THREE.ShaderMaterial({
  uniforms: { uScale: shared.uScale, uTime: shared.uTime, uWarm: { value: 1 } },
  vertexShader: `attribute float aSize, aAlpha; uniform float uScale, uTime, uWarm; varying vec3 vColor; varying float vA;
    void main() { vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mv; gl_PointSize = aSize * uScale / -mv.z; vColor = color;
      vA = aAlpha * uWarm * (0.93 + 0.07 * sin(uTime * 2.7 + position.x * 9.0)); }`,
  fragmentShader: `${BAYER} varying vec3 vColor; varying float vA;
    void main() { float r = length(gl_PointCoord - 0.5) * 2.0; float a = vA * exp(-r * r * 3.0);
      a = floor(a * 6.0 + bayer(gl_FragCoord.xy)) / 6.0; if (r > 1.0 || a <= 0.0) discard; gl_FragColor = vec4(vColor * a, 1.0); }`,
  vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
});
scene.add(new THREE.Points(glowGeo, glowMat));

// Rain: thin pixel streaks falling outside.
const RAIN = 2200, rainPos = new Float32Array(RAIN * 3);
for (let i = 0; i < RAIN; i++) rainPos.set([-2.1 + rand() * 4.2, rand() * 3.8, -1.65 - rand() * 2.6], i * 3);
const rainGeo = new THREE.BufferGeometry();
rainGeo.setAttribute("position", new THREE.BufferAttribute(rainPos, 3));
const rainMat = new THREE.ShaderMaterial({
  uniforms: { uScale: shared.uScale, uTime: shared.uTime, uColor: { value: new THREE.Vector3(1, 1, 1) } },
  vertexShader: `uniform float uScale, uTime; void main() { vec3 p = position; p.y = mod(p.y - uTime * 3.2, 3.8) - 0.1; p.x -= mod(uTime * 3.2, 3.8) * 0.0;
    vec4 mv = modelViewMatrix * vec4(p, 1.0); gl_Position = projectionMatrix * mv; gl_PointSize = max(2.0, 0.09 * uScale / -mv.z); }`,
  fragmentShader: `uniform vec3 uColor; void main() { if (abs(gl_PointCoord.x - 0.5) > 0.09) discard; gl_FragColor = vec4(uColor, 1.0); }`,
});
const rain = new THREE.Points(rainGeo, rainMat);
rain.frustumCulled = false;
scene.add(rain);

// Steam from the cup, fading by screen-door dither.
const STEAM = 40, steamPos = new Float32Array(STEAM * 3);
for (let i = 0; i < STEAM; i++) steamPos.set([0.25, 1.03, -1.1 + rand() * 0.0001 + i * 0], i * 3);
const steamGeo = new THREE.BufferGeometry();
steamGeo.setAttribute("position", new THREE.BufferAttribute(steamPos, 3));
steamGeo.setAttribute("aPhase", new THREE.Float32BufferAttribute(Array.from({ length: STEAM }, () => rand()), 1));
const steamMat = new THREE.ShaderMaterial({
  uniforms: { uScale: shared.uScale, uTime: shared.uTime, uColor: { value: new THREE.Vector3(1, 1, 1) }, uVoxel: shared.uVoxel },
  vertexShader: `attribute float aPhase; uniform float uScale, uTime; varying float vLife;
    void main() { float life = fract(uTime * 0.22 + aPhase); vec3 p = position + vec3(sin(life * 7.0 + aPhase * 20.0) * 0.035 * life, life * 0.5, cos(aPhase * 30.0) * 0.02);
      vec4 mv = modelViewMatrix * vec4(p, 1.0); gl_Position = projectionMatrix * mv; gl_PointSize = max(1.0, (0.02 + life * 0.04) * uScale / -mv.z); vLife = life; }`,
  fragmentShader: `${BAYER} uniform vec3 uColor; varying float vLife;
    void main() { if (length(gl_PointCoord - 0.5) > 0.5 || bayer(gl_FragCoord.xy) > (1.0 - vLife) * 0.7) discard; gl_FragColor = vec4(uColor, 1.0); }`,
});
const steam = new THREE.Points(steamGeo, steamMat);
steam.frustumCulled = false;
scene.add(steam);

// Pixel-size blit.
const blit = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({
  uniforms: { t: { value: low.texture } },
  vertexShader: `varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`,
  fragmentShader: `uniform sampler2D t; varying vec2 vUv; void main() { vec3 c = texture2D(t, vUv).rgb; vec2 v = vUv - 0.5; gl_FragColor = vec4(c * (1.0 - dot(v, v) * 0.5), 1.0); }`,
  depthTest: false, depthWrite: false,
}));
const blitScene = new THREE.Scene(); blitScene.add(blit);
const blitCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

// ---------- Camera and views ----------
const controls = new OrbitControls(camera, renderer.domElement);
renderer.domElement.style.touchAction = "pan-y";
controls.enableDamping = true; controls.enablePan = false;
const VIEWS = {
  diorama: { pos: [5.4, 3.6, 5.2], target: [0, 0.9, -1.2], auto: true, zoom: [4, 12], polar: [0.5, 1.45], az: [-Infinity, Infinity] },
  seat: { pos: [0.15, 1.4, 1.45], target: [0, 1.3, -3.4], auto: false, zoom: [4.8, 4.9], polar: [1.45, 1.66], az: [-0.4, 0.4] },
};
function setView(v) {
  S.view = v; const V = VIEWS[v];
  camera.position.set(...V.pos); controls.target.set(...V.target);
  controls.autoRotate = V.auto && !reduce; controls.autoRotateSpeed = 0.45;
  controls.minDistance = V.zoom[0]; controls.maxDistance = V.zoom[1];
  controls.minPolarAngle = V.polar[0]; controls.maxPolarAngle = V.polar[1];
  controls.minAzimuthAngle = V.az[0]; controls.maxAzimuthAngle = V.az[1];
  controls.update();
  document.querySelectorAll("[data-view]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.view === v)));
}

// Tap (not drag) scatters the scene into its splats; it flies home.
let scatterT = reduce ? 99 : 0; // also plays once on load
const scatter = () => { if (!reduce) scatterT = 0; };
let down = null;
renderer.domElement.addEventListener("pointerdown", (e) => (down = { x: e.clientX, y: e.clientY, t: performance.now() }));
renderer.domElement.addEventListener("pointerup", (e) => { if (down && Math.hypot(e.clientX - down.x, e.clientY - down.y) < 8 && performance.now() - down.t < 350) scatter(); down = null; });

// ---------- Panel and palette picker ----------
const body = document.getElementById("proto-panel-body");
body.innerHTML = `<div class="pp-seg" role="group" aria-label="View"><button type="button" data-view="seat">Seat</button><button type="button" data-view="diorama">Diorama</button></div>` +
  CONTROLS.map((c) => `<div class="pp-row"><label for="pp-${c.key}">${c.label}<output id="ppo-${c.key}">${c.fmt(S[c.key])}</output></label><input type="range" id="pp-${c.key}" min="${c.min}" max="${c.max}" step="${c.step}" value="${S[c.key]}"></div>`).join("") +
  `<div class="pp-seg"><button type="button" class="pp-btn" id="pp-scatter">Scatter</button><button type="button" class="pp-btn" id="pp-copy">Copy settings</button></div>`;
body.querySelectorAll("[data-view]").forEach((b) => b.addEventListener("click", () => setView(b.dataset.view)));
for (const c of CONTROLS) {
  const el = document.getElementById("pp-" + c.key);
  el.addEventListener("input", () => { S[c.key] = parseFloat(el.value); document.getElementById("ppo-" + c.key).textContent = c.fmt(S[c.key]); apply(c.key); });
}
document.getElementById("pp-scatter").addEventListener("click", scatter);
document.getElementById("pp-copy").addEventListener("click", async (e) => {
  const text = `palette: ${PALETTES[S.palette].name} · view: ${S.view} · ` + CONTROLS.map((c) => `${c.label.toLowerCase()}: ${c.fmt(S[c.key])}`).join(" · ");
  try { await navigator.clipboard.writeText(text); e.target.textContent = "Copied"; } catch { e.target.textContent = "See console"; console.log(text); }
  setTimeout(() => (e.target.textContent = "Copy settings"), 1500);
});
const toggle = document.querySelector(".proto-panel-toggle");
const setOpen = (open) => { body.hidden = !open; toggle.setAttribute("aria-expanded", String(open)); };
toggle.addEventListener("click", () => setOpen(body.hidden));
if (innerWidth < 640) setOpen(false);

const picker = document.querySelector(".proto-picker"), hl = picker.querySelector(".proto-picker-highlight");
const items = [...picker.querySelectorAll(".proto-picker-item")];
function setPalette(i) {
  S.palette = i;
  items.forEach((el, j) => { el.toggleAttribute("data-active", j === i); if (j === i) el.setAttribute("aria-current", "true"); else el.removeAttribute("aria-current"); });
  hl.style.width = items[i].offsetWidth + "px"; hl.style.transform = `translateX(${items[i].offsetLeft}px)`;
  const url = new URL(location); url.searchParams.set("v", i + 1); history.replaceState(history.state, "", url);
  bake();
}
items.forEach((el, i) => el.addEventListener("click", () => setPalette(i)));
document.addEventListener("keydown", (e) => {
  if (/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName) || e.metaKey || e.ctrlKey || e.altKey) return;
  const n = parseInt(e.key, 10);
  if (n >= 1 && n <= PALETTES.length) setPalette(n - 1);
  else if (e.key === "ArrowRight") setPalette((S.palette + 1) % PALETTES.length);
  else if (e.key === "ArrowLeft") setPalette((S.palette + PALETTES.length - 1) % PALETTES.length);
});
addEventListener("resize", () => setPalette(S.palette));

function apply(key) {
  shared.uVoxel.value = S.voxel;
  mat.uniforms.uRound.value = S.round; mat.uniforms.uMix.value = S.paletteMix; mat.uniforms.uDither.value = S.dither;
  glowMat.uniforms.uWarm.value = S.warmth;
  rainGeo.setDrawRange(0, Math.round(RAIN * S.rain));
  if (key === "warmth") bake();
  if (key === "pixel") resize();
  shared.uSplat.value = (1 / Math.sqrt(DENSITY)) * S.splat;
}

let W = 0, H = 0;
function resize() {
  const r = stage.getBoundingClientRect(); if (!r.width) return;
  W = r.width; H = r.height;
  renderer.setSize(W, H, false);
  const lw = Math.max(64, Math.round(W / S.pixel)), lh = Math.max(40, Math.round(H / S.pixel));
  low.setSize(lw, lh);
  shared.uScale.value = lh / (2 * Math.tan((camera.fov * Math.PI) / 360));
  camera.aspect = W / H; camera.updateProjectionMatrix();
}

// ---------- Loop ----------
let running = false, last = 0, time = 4;
function frame(ts) {
  if (!running) return;
  const dt = Math.min(0.05, (ts - last) / 1000 || 0); last = ts;
  time += dt; scatterT += dt;
  shared.uTime.value = time;
  const k = Math.min(1, scatterT / 1.8); shared.uScatter.value = Math.pow(1 - k, 3) * 1.2;
  controls.update();
  renderer.setRenderTarget(low); renderer.render(scene, camera);
  renderer.setRenderTarget(null); renderer.render(blitScene, blitCam);
  requestAnimationFrame(frame);
}
function start() { if (running) return; running = true; last = performance.now(); requestAnimationFrame(frame); }
function stop() { running = false; }
new ResizeObserver(resize).observe(stage);
new IntersectionObserver(([e]) => (e.isIntersecting && !document.hidden ? start() : stop())).observe(stage);
document.addEventListener("visibilitychange", () => (document.hidden ? stop() : start()));

resize();
apply();
setView(S.view);
setPalette(Math.min(PALETTES.length - 1, (parseInt(new URLSearchParams(location.search).get("v"), 10) || 1) - 1));
requestAnimationFrame(() => requestAnimationFrame(() => picker.setAttribute("data-ready", "")));
if (reduce) { shared.uScatter.value = 0; renderer.setRenderTarget(low); renderer.render(scene, camera); renderer.setRenderTarget(null); renderer.render(blitScene, blitCam); }
start();
console.log("splats:", N);
