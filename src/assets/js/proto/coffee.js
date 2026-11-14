// The coffee shop scene: written as code, baked to splats, with people who come and go.
// Sections: palette → splat builder → static scene → people and cars → renderer → behaviour → UI → loop.
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

THREE.ColorManagement.enabled = false;
const stage = document.querySelector("[data-proto-stage]");
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

// ---------- Palette: warm inside, cold outside ----------
const PAL = {
  skyTop: "#0c141f", skyBottom: "#2a4560", far: "#182637", mid: "#22354a", midShadow: "#121c28", facadeLit: "#8fb1c6",
  winWarm: "#dca865", street: "#172231", streetWet: "#355470", kerb: "#34465a", coldLight: "#d8ecf5", rain: "#9db4c6", tree: "#1b2a2c",
  wall: "#9a7b63", wallShade: "#5e4738", ceiling: "#4a372c", floor: "#7a5236", wood: "#a8703f", woodDark: "#5c3a22",
  metal: "#1a1c21", steel: "#6d7278", cream: "#efe2cb", cup: "#f6efe4", coffee: "#3b2416", lamp: "#ffcf87", lampHot: "#fff2d4",
  plant: "#4d6c3a", plantDark: "#2c4527", pot: "#c96f45", menu: "#22262b", chalk: "#e9e4d6", screen: "#cfe0ea",
  skin1: "#e3b591", skin2: "#b07a52", skin3: "#6e4a33", hair1: "#2a1d17", hair2: "#6b4a2e",
  coatA: "#2f4060", coatB: "#7d3a2e", coatC: "#c7a26a", coatD: "#3e5a4a", coatE: "#b9b2a6", pants: "#23262d", shoe: "#121316",
  umbrella: "#1f2c44", umbrella2: "#8a2f2f", car: "#2a3340", carDark: "#151a22", headlight: "#fff6e0", tail: "#ff4a3a",
};
const ROLES = Object.keys(PAL);
const RGB = Object.fromEntries(ROLES.map((r) => { const n = parseInt(PAL[r].slice(1), 16); return [r, [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]]; }));

// ---------- Settings ----------
const S = { view: "seat", voxel: 0.02, splat: 1.7, round: 0.35, paletteMix: 1, dither: 0.12, pixel: 2, warmth: 1, cold: 1, rain: 0.6, people: 1, speed: 1 };
const pct = (v) => Math.round(v * 100) + "%";
const CONTROLS = [
  { key: "voxel", label: "Voxel snap", min: 0, max: 0.1, step: 0.005, fmt: (v) => (v ? Math.round(v * 1000) / 10 + "cm" : "off") },
  { key: "splat", label: "Splat size", min: 0.5, max: 3, step: 0.1, fmt: (v) => v.toFixed(1) + "×" },
  { key: "round", label: "Square ↔ round", min: 0, max: 1, step: 0.05, fmt: pct },
  { key: "paletteMix", label: "Palette snap", min: 0, max: 1, step: 0.05, fmt: pct },
  { key: "dither", label: "Dither", min: 0, max: 1, step: 0.05, fmt: pct },
  { key: "pixel", label: "Pixel size", min: 1, max: 6, step: 1, fmt: (v) => v + "px" },
  { key: "warmth", label: "Warmth inside", min: 0.3, max: 2, step: 0.05, fmt: (v) => v.toFixed(2) + "×" },
  { key: "cold", label: "Cold outside", min: 0.3, max: 2, step: 0.05, fmt: (v) => v.toFixed(2) + "×" },
  { key: "rain", label: "Rain", min: 0, max: 1, step: 0.05, fmt: pct },
  { key: "people", label: "How busy", min: 0, max: 2, step: 0.1, fmt: (v) => v.toFixed(1) + "×" },
  { key: "speed", label: "Time speed", min: 0.25, max: 2, step: 0.05, fmt: (v) => v.toFixed(2) + "×" },
];

// ---------- Splat builder ----------
let seed = 2024;
const rand = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
const pick = (a) => a[Math.floor(rand() * a.length)];
// Splats are spaced by distance from the corner-table seat, so they land at an even size on screen.
const SEAT = [2.55, 1.22, 2.35], REF_DENSITY = 900, REF_DIST = 4;
const densityAt = (x, y, z) => REF_DENSITY * Math.min(6, Math.max(0.12, (REF_DIST / Math.hypot(x - SEAT[0], y - SEAT[1], z - SEAT[2])) ** 2));

class Cloud {
  // fixed: a density for objects that move (people, cars) instead of the distance rule.
  constructor(fixed = 0) { this.fixed = fixed; this.pos = []; this.nrm = []; this.role = []; this.emit = []; this.grain = []; this.shimmer = []; this.size = []; }
  dens(x, y, z, o) { return (this.fixed || densityAt(x, y, z)) * (o.density ?? 1); }
  splat(x, y, z, nx, ny, nz, role, o = {}, size = 0.03) {
    const r = typeof role === "function" ? role(x, y, z) : role;
    if (!r) return;
    this.pos.push(x, y, z); this.nrm.push(nx, ny, nz); this.role.push(ROLES.indexOf(r)); this.size.push(size);
    this.emit.push(o.emit ? 1 : 0); this.grain.push(o.grain || 0); this.shimmer.push(o.shimmer ? 1 : 0);
  }
  quad(c, u, v, n, role, o = {}) {
    // Split into tiles of at most 0.5m so density can follow distance across big surfaces.
    const lu = Math.hypot(...u), lv = Math.hypot(...v), tu = Math.max(1, Math.ceil(lu / 0.5)), tv = Math.max(1, Math.ceil(lv / 0.5));
    for (let ti = 0; ti < tu; ti++) for (let tj = 0; tj < tv; tj++) {
      const a0 = ti / tu, b0 = tj / tv, cx = c[0] + u[0] * (a0 + 0.5 / tu) + v[0] * (b0 + 0.5 / tv), cy = c[1] + u[1] * (a0 + 0.5 / tu) + v[1] * (b0 + 0.5 / tv), cz = c[2] + u[2] * (a0 + 0.5 / tu) + v[2] * (b0 + 0.5 / tv);
      const step = 1 / Math.sqrt(this.dens(cx, cy, cz, o)), nu = Math.max(1, Math.round(lu / tu / step)), nv = Math.max(1, Math.round(lv / tv / step));
      for (let i = 0; i < nu; i++) for (let j = 0; j < nv; j++) {
        const a = a0 + (i + 0.2 + rand() * 0.6) / nu / tu, b = b0 + (j + 0.2 + rand() * 0.6) / nv / tv;
        this.splat(c[0] + u[0] * a + v[0] * b, c[1] + u[1] * a + v[1] * b, c[2] + u[2] * a + v[2] * b, n[0], n[1], n[2], role, o, step);
      }
    }
  }
  box(cx, cy, cz, w, h, d, role, o = {}) {
    const x0 = cx - w / 2, y0 = cy - h / 2, z0 = cz - d / 2, k = o.skip || "";
    if (!k.includes("t")) this.quad([x0, y0 + h, z0], [w, 0, 0], [0, 0, d], [0, 1, 0], role, o);
    if (!k.includes("b")) this.quad([x0, y0, z0], [w, 0, 0], [0, 0, d], [0, -1, 0], role, o);
    if (!k.includes("f")) this.quad([x0, y0, z0 + d], [w, 0, 0], [0, h, 0], [0, 0, 1], role, o);
    if (!k.includes("k")) this.quad([x0, y0, z0], [w, 0, 0], [0, h, 0], [0, 0, -1], role, o);
    if (!k.includes("l")) this.quad([x0, y0, z0], [0, 0, d], [0, h, 0], [-1, 0, 0], role, o);
    if (!k.includes("r")) this.quad([x0 + w, y0, z0], [0, 0, d], [0, h, 0], [1, 0, 0], role, o);
  }
  cyl(cx, cy, cz, r, h, role, o = {}) {
    const d = this.dens(cx, cy, cz, o), step = 1 / Math.sqrt(d), side = Math.max(10, Math.round(2 * Math.PI * r * h * d)), top = Math.max(8, Math.round(Math.PI * r * r * d));
    for (let i = 0; i < side; i++) { const a = rand() * 6.2832, y = cy - h / 2 + rand() * h; this.splat(cx + Math.cos(a) * r, y, cz + Math.sin(a) * r, Math.cos(a), 0, Math.sin(a), role, o, step); }
    if (o.cap !== false) for (let i = 0; i < top; i++) { const a = rand() * 6.2832, q = Math.sqrt(rand()) * r; this.splat(cx + Math.cos(a) * q, cy + h / 2, cz + Math.sin(a) * q, 0, 1, 0, o.topRole || role, o, step); }
  }
  cone(cx, cy, cz, r0, r1, h, role, o = {}) { // r0 at the top, r1 at the bottom
    const d = this.dens(cx, cy, cz, o), step = 1 / Math.sqrt(d), count = Math.max(12, Math.round(Math.PI * (r0 + r1) * Math.hypot(h, r1 - r0) * d));
    for (let i = 0; i < count; i++) { const a = rand() * 6.2832, t = rand(), r = r0 + (r1 - r0) * t; this.splat(cx + Math.cos(a) * r, cy + h / 2 - t * h, cz + Math.sin(a) * r, Math.cos(a), (r1 - r0) / h, Math.sin(a), role, o, step); }
  }
  sphere(cx, cy, cz, r, role, o = {}) {
    const [sx, sy, sz] = o.scale || [1, 1, 1], d = this.dens(cx, cy, cz, o), step = 1 / Math.sqrt(d);
    const count = Math.max(12, Math.round(4 * Math.PI * r * r * Math.max(sx, sz) * Math.max(sy, 0.6) * d));
    for (let i = 0; i < count; i++) {
      const u = rand() * 2 - 1, a = rand() * 6.2832, s = Math.sqrt(1 - u * u), nx = s * Math.cos(a), ny = u, nz = s * Math.sin(a);
      const x = cx + nx * r * sx, y = cy + ny * r * sy, z = cz + nz * r * sz;
      if (o.keep && !o.keep(x, y, z, nx, ny, nz)) continue;
      this.splat(x, y, z, nx, ny, nz, role, o, step);
    }
  }
  stroke(pts, role, o = {}) {
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i], b = pts[i + 1], gap = o.gap || Math.min(0.03, 0.6 / Math.sqrt(this.dens(a[0], a[1], a[2], {}))), n = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]) / gap));
      for (let k = 0; k <= n; k++) { const t = k / n; this.splat(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t, 0, 1, 0, role, o, gap * 1.4); }
    }
  }
  get count() { return this.role.length; }
}
const arc = (a, b, sag, n = 24) => Array.from({ length: n + 1 }, (_, i) => { const t = i / n; return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t - Math.sin(Math.PI * t) * sag, a[2] + (b[2] - a[2]) * t]; });
const ring = (cx, cy, cz, r, n = 28) => Array.from({ length: n + 1 }, (_, i) => [cx + Math.cos((i / n) * 6.2832) * r, cy, cz + Math.sin((i / n) * 6.2832) * r]);

// ---------- Static scene ----------
const WZ = -3.0;                                   // window wall
const ROOM = { x0: -3.4, x1: 3.4, z1: 3.0, h: 3.2 };
const STOOLS = [-2.4, -1.2, 0, 1.2, 2.4];
const STOOL_Z = -2.2, BAR_Y = 1.05;
const PENDANTS = [-2.0, 0, 2.0].map((x) => [x, 2.5, -2.45]);
const STREETLAMPS = [[-3.6, 4.1, -4.6], [4.2, 4.1, -4.6]];
const DOOR = [-4.1, 0, -1.4];
const MY_CUP = [2.25, 0.8, 1.75];
const LIGHTS = [];
const GLOWS = [];

const room = new Cloud(), cutaway = new Cloud(), outside = new Cloud();
function buildStatic() {
  // Floor, with planks running across.
  room.box(-0.5, -0.05, 0, 7.8, 0.1, 6.0, (x, y, z) => (Math.abs(((z * 5 + 100) % 1) - 0.5) > 0.47 ? "woodDark" : "floor"), { skip: "b", grain: 1 });
  // Window wall: kick plate, header, end columns; steel mullions and a transom.
  room.box(0, 0.12, WZ, 6.8, 0.24, 0.15, "wallShade");
  room.box(0, 2.98, WZ, 6.8, 0.44, 0.15, "wall");
  room.box(-3.3, 1.6, WZ, 0.2, 3.2, 0.15, "wall"); room.box(3.3, 1.6, WZ, 0.2, 3.2, 0.15, "wall");
  for (const x of [-1.6, 0, 1.6]) room.box(x, 1.5, WZ, 0.06, 2.52, 0.08, "metal");
  room.box(0, 2.2, WZ, 6.4, 0.05, 0.08, "metal");
  room.box(0, 0.26, WZ, 6.4, 0.04, 0.1, "metal"); room.box(0, 2.74, WZ, 6.4, 0.04, 0.1, "metal");
  // Bar along the window: wood top, steel brackets, foot rail.
  room.box(0, BAR_Y, -2.72, 6.3, 0.05, 0.5, "wood", { grain: 1 });
  for (const x of [-2.9, -1.0, 1.0, 2.9]) room.box(x, BAR_Y / 2, -2.85, 0.04, BAR_Y, 0.04, "metal");
  room.stroke([[-3.1, 0.26, -2.55], [3.1, 0.26, -2.55]], "steel");
  // Stools: wooden seat, three steel legs, a foot ring.
  for (const x of STOOLS) {
    room.cyl(x, 0.765, STOOL_Z, 0.18, 0.04, "wood", { grain: 1 });
    for (let k = 0; k < 3; k++) { const a = k * 2.094 + 0.5; room.stroke([[x + Math.cos(a) * 0.08, 0.74, STOOL_Z + Math.sin(a) * 0.08], [x + Math.cos(a) * 0.17, 0, STOOL_Z + Math.sin(a) * 0.17]], "metal"); }
    room.stroke(ring(x, 0.3, STOOL_Z, 0.14), "steel");
  }
  // Pendant lights over the bar.
  for (const p of PENDANTS) {
    room.stroke([[p[0], p[1] + 0.2, p[2]], [p[0], ROOM.h, p[2]]], "metal");
    room.cone(p[0], p[1] + 0.08, p[2], 0.05, 0.22, 0.2, "metal");
    room.sphere(p[0], p[1] - 0.04, p[2], 0.06, "lampHot", { emit: true });
    LIGHTS.push({ p: [p[0], p[1] - 0.1, p[2]], c: "lamp", k: 1.0, r: 2.3, inside: true });
    GLOWS.push({ p, r: 1.5, role: "lamp", a: 0.22 });
    GLOWS.push({ p: [p[0], p[1], WZ - (p[2] - WZ)], r: 0.9, role: "lamp", a: 0.06 }); // reflection in the glass
  }
  // Left wall with a doorway to the counter, a menu board and a shelf of cups.
  room.box(ROOM.x0, 1.6, -2.5, 0.12, 3.2, 1.0, "wall");
  room.box(ROOM.x0, 1.6, 1.1, 0.12, 3.2, 3.8, "wall");
  room.box(ROOM.x0, 2.75, -1.4, 0.12, 0.9, 1.2, "wall");
  room.box(-4.5, 1.4, -1.4, 0.1, 2.8, 1.6, "wallShade");
  room.box(-4.0, 0.5, -1.0, 0.6, 1.0, 0.5, "woodDark");
  LIGHTS.push({ p: [-4.0, 2.0, -1.4], c: "lamp", k: 0.7, r: 1.4, inside: true });
  GLOWS.push({ p: [-4.0, 1.6, -1.4], r: 1.6, role: "lamp", a: 0.1 });
  room.quad([ROOM.x0 + 0.07, 1.55, 0.4], [0, 0, 1.5], [0, 0.75, 0], [1, 0, 0],
    (x, y, z) => ((Math.floor(z * 12) + Math.floor(y * 9)) % 3 === 0 && y < 2.22 && y > 1.63 && z > 0.5 && z < 1.8 ? "chalk" : "menu"));
  room.box(ROOM.x0 + 0.15, 1.3, 1.2, 0.2, 0.035, 1.2, "wood", { grain: 1 });
  for (let i = 0; i < 6; i++) room.cyl(ROOM.x0 + 0.15, 1.36, 0.7 + i * 0.2, 0.04, 0.08, i % 3 ? "cup" : "pot");
  // A tall plant in the window corner.
  room.cyl(-2.95, 0.22, -2.55, 0.2, 0.44, "pot");
  for (let i = 0; i < 18; i++) { const a = rand() * 6.28, y = 0.7 + rand() * 1.3, r = 0.15 + rand() * 0.25; room.sphere(-2.95 + Math.cos(a) * r, y, -2.55 + Math.sin(a) * r * 0.7, 0.1 + rand() * 0.06, rand() < 0.5 ? "plant" : "plantDark", { scale: [1, 0.55, 1.2] }); }
  // A middle table with two chairs and a laptop (the reader sits here).
  table(-0.6, 0.4);
  room.box(-0.6, 0.79, 0.35, 0.32, 0.015, 0.22, "steel");
  room.quad([-0.76, 0.8, 0.25], [0.32, 0, 0], [0, 0.2, -0.06], [0, 0.3, 1], "screen", { emit: true, density: 1.5 });
  chair(-0.6, 1.0, 0); chair(-0.6, -0.2, Math.PI);
  // My corner table, foreground right, with a cup and a notebook.
  table(2.3, 1.9);
  room.cyl(MY_CUP[0], 0.765, MY_CUP[2], 0.075, 0.01, "cup");
  room.cyl(MY_CUP[0], 0.815, MY_CUP[2], 0.045, 0.09, "cup", { topRole: "coffee" });
  room.box(2.55, 0.765, 1.85, 0.22, 0.015, 0.3, "cream");
  LIGHTS.push({ p: [0, 2.4, 1.0], c: "lamp", k: 0.45, r: 2.6, inside: true }); // general warm fill
  // Right wall and ceiling: cut away in the diorama view.
  cutaway.box(ROOM.x1, 1.6, 0, 0.12, 3.2, 6.0, "wall");
  cutaway.box(-0.5, ROOM.h + 0.05, 0, 7.8, 0.1, 6.0, "woodDark", { skip: "t", density: 0.6 });

  // ---------- Outside ----------
  outside.box(0, -0.06, -3.9, 20, 0.1, 1.8, "kerb", { skip: "b" });
  outside.box(0, -0.1, -6.6, 20, 0.1, 3.6, (x, y, z) => (Math.sin(x * 1.3 + z * 2.1) + Math.sin(x * 3.7 - z * 1.1) > 0.9 ? "streetWet" : "street"), { skip: "b" });
  outside.box(0, -0.06, -9.0, 20, 0.1, 1.2, "kerb", { skip: "b" });
  // Buildings across the street, with a bakery (warm) and a corner store (cold).
  for (let x = -10; x < 10;) {
    const w = 2.4 + rand() * 1.8, h = 5 + rand() * 5, role = rand() < 0.5 ? "mid" : "far";
    outside.box(x + w / 2, h / 2, -10.0, w, h, 0.4, role, { skip: "k", density: 0.7 });
    for (let wy = 3.2; wy < h - 0.8; wy += 1.3) for (let wx = x + 0.4; wx < x + w - 0.6; wx += 0.9) {
      const r = rand(), lit = r < 0.28 ? "facadeLit" : r < 0.38 ? "winWarm" : null;
      outside.quad([wx, wy, -9.79], [0.5, 0, 0], [0, 0.7, 0], [0, 0, 1], lit || "midShadow", { emit: !!lit, density: 1.2 });
    }
    x += w + 0.1;
  }
  for (const [x, role] of [[-2.0, "winWarm"], [2.6, "facadeLit"]]) {
    outside.quad([x - 1.1, 0.2, -9.78], [2.2, 0, 0], [0, 1.6, 0], [0, 0, 1], role, { emit: true, density: 1.2 });
    LIGHTS.push({ p: [x, 1.0, -9.3], c: role, k: 0.6, r: 2.0 });
    GLOWS.push({ p: [x, 1.0, -9.5], r: 2.2, role, a: 0.12 });
    for (let i = 0; i < 500; i++) { const z = -8.4 + rand() * 3.4, f = (z + 8.4) / 3.4; outside.splat(x + (rand() - 0.5) * 1.8 * (1 - f * 0.5), -0.045, z, 0, 1, 0, role, { emit: true, shimmer: true }); }
  }
  // A distant skyline for depth.
  for (let x = -14; x < 14;) { const w = 3 + rand() * 4, h = 9 + rand() * 8; outside.box(x + w / 2, h / 2, -15, w, h, 0.4, "midShadow", { skip: "k", density: 0.25 }); x += w + 0.5; }
  // Street lamps (cold) with reflections on the road; a bare tree.
  for (const p of STREETLAMPS) {
    outside.cyl(p[0], p[1] / 2, p[2], 0.05, p[1], "metal", { density: 2 });
    outside.box(p[0] + 0.25, p[1], p[2], 0.6, 0.06, 0.12, "metal", { density: 2 });
    outside.box(p[0] + 0.45, p[1] - 0.05, p[2], 0.25, 0.04, 0.1, "coldLight", { emit: true, density: 3 });
    LIGHTS.push({ p: [p[0] + 0.45, p[1] - 0.2, p[2]], c: "coldLight", k: 1.0, r: 3.2 });
    GLOWS.push({ p: [p[0] + 0.45, p[1] - 0.1, p[2]], r: 1.6, role: "coldLight", a: 0.2 });
    for (let i = 0; i < 380; i++) { const z = p[2] - 0.2 - rand() * 3.2; outside.splat(p[0] + 0.45 + (rand() - 0.5) * 0.5, -0.045, z, 0, 1, 0, "coldLight", { emit: true, shimmer: true }); }
  }
  const tree = (x, z) => {
    outside.stroke([[x, 0, z], [x, 2.2, z]], "tree", { gap: 0.02 }); outside.cyl(x, 1.0, z, 0.06, 2.0, "tree", { density: 2 });
    for (let i = 0; i < 9; i++) { const a = rand() * 6.28, y = 1.8 + rand() * 1.2, L = 0.6 + rand() * 0.8; outside.stroke([[x, y, z], [x + Math.cos(a) * L, y + 0.5 + rand() * 0.6, z + Math.sin(a) * L * 0.5]], "tree", { gap: 0.02 }); }
  };
  tree(0.8, -4.5); tree(-6.5, -4.5);
}
function table(x, z) {
  room.cyl(x, 0.74, z, 0.38, 0.04, "wood", { grain: 1 });
  room.cyl(x, 0.37, z, 0.035, 0.72, "metal", { cap: false });
  room.cyl(x, 0.015, z, 0.22, 0.03, "metal");
}
function chair(x, z, rot) {
  const c = Math.cos(rot), s = Math.sin(rot), at = (dx, dz) => [x + dx * c + dz * s, z - dx * s + dz * c];
  const [sx, sz] = at(0, 0); room.box(sx, 0.46, sz, 0.42, 0.04, 0.42, "woodDark");
  for (const [dx, dz] of [[-0.18, -0.18], [0.18, -0.18], [-0.18, 0.18], [0.18, 0.18]]) { const [lx, lz] = at(dx, dz); room.box(lx, 0.22, lz, 0.03, 0.44, 0.03, "metal"); }
  const [bx, bz] = at(0, 0.2); room.box(bx, 0.72, bz, Math.abs(c) * 0.42 + Math.abs(s) * 0.03, 0.42, Math.abs(s) * 0.42 + Math.abs(c) * 0.03, "woodDark");
}
buildStatic();

// ---------- Bake lighting into colours ----------
function bake(cloud, colors) {
  const warm = S.warmth, cold = S.cold;
  const ambIn = RGB.lamp.map((v, i) => v * 0.16 * warm + RGB.skyBottom[i] * 0.08), ambOut = RGB.skyBottom.map((v) => v * 0.62 * cold);
  for (let i = 0; i < cloud.count; i++) {
    const o = i * 3, base = RGB[ROLES[cloud.role[i]]];
    if (cloud.emit[i]) { colors.set(base, o); continue; }
    const x = cloud.pos[o], y = cloud.pos[o + 1], z = cloud.pos[o + 2], inside = z > WZ - 0.08;
    const acc = (inside ? ambIn : ambOut).slice();
    for (const L of LIGHTS) {
      if (!!L.inside !== inside && !(inside && z < WZ + 0.6)) continue; // light stays on its side of the glass
      const dx = L.p[0] - x, dy = L.p[1] - y, dz = L.p[2] - z, d = Math.hypot(dx, dy, dz) || 1;
      const lam = Math.max(0, (dx * cloud.nrm[o] + dy * cloud.nrm[o + 1] + dz * cloud.nrm[o + 2]) / d) * 0.7 + 0.3;
      const band = Math.ceil(lam * (L.k * (L.inside ? warm : cold)) / (1 + (d / L.r) ** 2 * 3) * 3) / 3;
      const c = RGB[L.c];
      for (let k = 0; k < 3; k++) acc[k] += c[k] * band * 0.8;
    }
    const g = cloud.grain[i] ? 0.9 + 0.1 * Math.sin(x * 31 + Math.sin(z * 7 + y * 5) * 2.5) : 1;
    for (let k = 0; k < 3; k++) colors[o + k] = Math.min(1, base[k] * acc[k] * 1.25 * g);
  }
}

// ---------- Renderer, shaders ----------
const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: "high-performance" });
renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
stage.append(renderer.domElement);
renderer.setClearColor(new THREE.Color(...RGB.skyTop));
const low = new THREE.WebGLRenderTarget(64, 40, { minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter });
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(52, 1.6, 0.05, 90);

function oklab([r, g, b]) {
  const lin = (v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  [r, g, b] = [lin(r), lin(g), lin(b)];
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b), m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b), s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return new THREE.Vector3(0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s, 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s, 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s);
}
const PAL_N = ROLES.length;
const U = {
  uScatter: { value: 0 }, uVoxel: { value: S.voxel }, uSplat: { value: 0.04 }, uScale: { value: 400 }, uTime: { value: 0 },
  uRound: { value: S.round }, uMix: { value: 1 }, uDither: { value: 0.3 },
  uPal: { value: ROLES.map((r) => new THREE.Vector3(...RGB[r])) }, uPalLab: { value: ROLES.map((r) => oklab(RGB[r])) },
};
const BAYER = `float bayer(vec2 p) { int x = int(mod(p.x, 4.0)), y = int(mod(p.y, 4.0)); int b[16] = int[16](0,8,2,10,12,4,14,6,3,11,1,9,15,7,13,5); return (float(b[x + y * 4]) + 0.5) / 16.0; }`;
const SPLAT_VS = `
  attribute vec3 aRand; attribute float aShimmer, aSize;
  uniform float uScatter, uVoxel, uSplat, uScale, uTime; uniform vec3 uTint;
  varying vec3 vColor;
  void main() {
    vec3 p = position;
    if (uVoxel > 0.0) p = floor(p / uVoxel + 0.5) * uVoxel;
    p.x += aShimmer * sin(uTime * 2.3 + p.z * 19.0) * 0.04;
    p += aRand * uScatter;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = clamp(aSize * uSplat * uScale / -mv.z, 1.0, 48.0);
    vColor = min(color * uTint, vec3(1.0));
  }`;
const SPLAT_FS = `
  uniform float uRound, uMix, uDither; uniform vec3 uPal[${PAL_N}]; uniform vec3 uPalLab[${PAL_N}];
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
    for (int i = 0; i < ${PAL_N}; i++) {
      float d = distance(lab, uPalLab[i]);
      if (d < b1) { b2 = b1; i2 = i1; b1 = d; i1 = i; } else if (d < b2) { b2 = d; i2 = i; }
    }
    float t = b1 / (b1 + b2 + 1e-5);
    vec3 q = (t * 2.0 * uDither > bayer(gl_FragCoord.xy)) ? uPal[i2] : uPal[i1];
    gl_FragColor = vec4(mix(vColor, q, uMix), 1.0);
  }`;
const splatMaterial = (tint = [1, 1, 1]) => new THREE.ShaderMaterial({ uniforms: { ...U, uTint: { value: new THREE.Vector3(...tint) } }, vertexShader: SPLAT_VS, fragmentShader: SPLAT_FS, vertexColors: true });

function toPoints(cloud, material, bakeIt = true) {
  const g = new THREE.BufferGeometry(), n = cloud.count, rnd = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { const a = rand() * 6.2832, u = rand() * 2 - 1, s = Math.sqrt(1 - u * u), m = 0.6 + rand() * 2.4; rnd.set([s * Math.cos(a) * m, Math.abs(u) * m + 0.4, s * Math.sin(a) * m], i * 3); }
  const colors = new Float32Array(n * 3);
  if (bakeIt) bake(cloud, colors);
  else for (let i = 0; i < n; i++) { const b = RGB[ROLES[cloud.role[i]]], lit = cloud.emit[i] ? 1 : 0.78 + 0.22 * cloud.nrm[i * 3 + 1]; colors.set(b.map((v) => v * lit), i * 3); }
  g.setAttribute("position", new THREE.Float32BufferAttribute(cloud.pos, 3));
  g.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  g.setAttribute("aRand", new THREE.BufferAttribute(rnd, 3));
  g.setAttribute("aShimmer", new THREE.Float32BufferAttribute(cloud.shimmer, 1));
  g.setAttribute("aSize", new THREE.Float32BufferAttribute(cloud.size, 1));
  const pts = new THREE.Points(g, material);
  pts.userData.cloud = cloud;
  pts.frustumCulled = false;
  return pts;
}
const staticMat = splatMaterial();
const staticParts = [toPoints(room, staticMat), toPoints(outside, staticMat), toPoints(cutaway, staticMat)];
staticParts.forEach((p) => scene.add(p));
const cutawayPts = staticParts[2];
function rebake() { for (const p of staticParts) { bake(p.userData.cloud, p.geometry.attributes.color.array); p.geometry.attributes.color.needsUpdate = true; } }

// Soft glows.
const GLOW_VS = `attribute float aSize, aAlpha; uniform float uScale, uTime, uWarm; varying vec3 vColor; varying float vA;
  void main() { vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mv; gl_PointSize = aSize * uScale / -mv.z; vColor = color;
    vA = aAlpha * uWarm * (0.94 + 0.06 * sin(uTime * 2.1 + position.x * 7.0)); }`;
const GLOW_FS = `${BAYER} varying vec3 vColor; varying float vA;
  void main() { float r = length(gl_PointCoord - 0.5) * 2.0; float a = vA * exp(-r * r * 3.0); a = floor(a * 8.0 + bayer(gl_FragCoord.xy)) / 8.0; if (r > 1.0 || a <= 0.0) discard; gl_FragColor = vec4(vColor * a, 1.0); }`;
function glowPoints(list, warmU) {
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(list.flatMap((l) => l.p), 3));
  g.setAttribute("color", new THREE.Float32BufferAttribute(list.flatMap((l) => RGB[l.role]), 3));
  g.setAttribute("aSize", new THREE.Float32BufferAttribute(list.map((l) => l.r), 1));
  g.setAttribute("aAlpha", new THREE.Float32BufferAttribute(list.map((l) => l.a), 1));
  const m = new THREE.ShaderMaterial({ uniforms: { uScale: U.uScale, uTime: U.uTime, uWarm: warmU }, vertexShader: GLOW_VS, fragmentShader: GLOW_FS, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
  const p = new THREE.Points(g, m); p.frustumCulled = false; return p;
}
const glowWarm = { value: 1 };
scene.add(glowPoints(GLOWS, glowWarm));

// Rain outside.
const RAIN = 3500, rainPos = new Float32Array(RAIN * 3);
for (let i = 0; i < RAIN; i++) rainPos.set([-9 + rand() * 18, rand() * 7, -3.15 - rand() * 6.6], i * 3);
const rainGeo = new THREE.BufferGeometry(); rainGeo.setAttribute("position", new THREE.BufferAttribute(rainPos, 3));
const rain = new THREE.Points(rainGeo, new THREE.ShaderMaterial({
  uniforms: { uScale: U.uScale, uTime: U.uTime, uColor: { value: new THREE.Vector3(...RGB.rain) } },
  vertexShader: `uniform float uScale, uTime; void main() { vec3 p = position; p.y = mod(p.y - uTime * 4.0, 7.0) - 0.1; p.x -= 0.15 * mod(uTime * 4.0, 7.0);
    vec4 mv = modelViewMatrix * vec4(p, 1.0); gl_Position = projectionMatrix * mv; gl_PointSize = max(2.0, 0.1 * uScale / -mv.z); }`,
  fragmentShader: `uniform vec3 uColor; void main() { if (abs(gl_PointCoord.x - 0.5) > 0.08) discard; gl_FragColor = vec4(uColor, 1.0); }`,
}));
rain.frustumCulled = false; scene.add(rain);

// Steam from my cup.
const STEAM = 40, steamGeo = new THREE.BufferGeometry();
steamGeo.setAttribute("position", new THREE.Float32BufferAttribute(Array.from({ length: STEAM }, () => [MY_CUP[0], MY_CUP[1] + 0.07, MY_CUP[2]]).flat(), 3));
steamGeo.setAttribute("aPhase", new THREE.Float32BufferAttribute(Array.from({ length: STEAM }, () => rand()), 1));
const steam = new THREE.Points(steamGeo, new THREE.ShaderMaterial({
  uniforms: { uScale: U.uScale, uTime: U.uTime, uColor: { value: new THREE.Vector3(...RGB.cream) } },
  vertexShader: `attribute float aPhase; uniform float uScale, uTime; varying float vLife;
    void main() { float life = fract(uTime * 0.2 + aPhase); vec3 p = position + vec3(sin(life * 6.0 + aPhase * 20.0) * 0.04 * life, life * 0.45, cos(aPhase * 30.0) * 0.02);
      vec4 mv = modelViewMatrix * vec4(p, 1.0); gl_Position = projectionMatrix * mv; gl_PointSize = max(1.0, (0.008 + life * 0.014) * uScale / -mv.z); vLife = life; }`,
  fragmentShader: `${BAYER} uniform vec3 uColor; varying float vLife; void main() { if (length(gl_PointCoord - 0.5) > 0.5 || bayer(gl_FragCoord.xy) > (1.0 - vLife) * 0.6) discard; gl_FragColor = vec4(uColor, 1.0); }`,
}));
steam.frustumCulled = false; scene.add(steam);

// ---------- People ----------
// A person is a small rig of splat parts. Local +z is forward; units are metres.
const INSIDE_TINT = () => [1.0 * (0.8 + 0.2 * S.warmth), 0.9 * (0.82 + 0.18 * S.warmth), 0.78], OUTSIDE_TINT = () => [0.5 / S.cold ** 0.3, 0.6 / S.cold ** 0.3, 0.78];
const SKINS = ["skin1", "skin2", "skin3"], HAIRS = ["hair1", "hair2", "hair1"], COATS = ["coatA", "coatB", "coatC", "coatD", "coatE"];
function part(build, density = 1300) { const c = new Cloud(density); build(c); return c; }
function makePerson({ umbrella = false, cup = false, coat = pick(COATS), skin = pick(SKINS), hair = pick(HAIRS), height = 0.95 + rand() * 0.1 } = {}) {
  const mat = splatMaterial(INSIDE_TINT());
  const P = (cloud) => { const p = toPoints(cloud, mat, false); return p; };
  const root = new THREE.Group(), hips = new THREE.Group();
  root.scale.setScalar(height); root.add(hips); hips.position.y = 0.92;
  hips.add(P(part((c) => { c.box(0, 0.3, 0, 0.38, 0.6, 0.22, coat); c.box(0, 0.02, 0, 0.36, 0.08, 0.2, coat); })));
  hips.add(P(part((c) => {
    c.box(0, 0.64, 0, 0.09, 0.08, 0.09, skin);
    c.sphere(0, 0.76, 0, 0.11, skin, { scale: [0.95, 1.1, 1] });
    c.sphere(0, 0.79, -0.01, 0.118, hair, { scale: [1, 1.05, 1.05], keep: (x, y, z, nx, ny, nz) => ny > 0.1 || nz < -0.3 });
  })));
  const limb = (x, y, len, w, role, end) => { const g = new THREE.Group(); g.position.set(x, y, 0); g.add(P(part((c) => { c.box(0, -len / 2, 0, w, len, w, role); if (end) end(c, len); }))); hips.add(g); return g; };
  const armL = limb(-0.24, 0.56, 0.56, 0.09, coat, (c, l) => c.sphere(0, -l - 0.03, 0, 0.045, skin));
  const armR = limb(0.24, 0.56, 0.56, 0.09, coat, (c, l) => c.sphere(0, -l - 0.03, 0, 0.045, skin));
  const leg = (x) => {
    const thigh = new THREE.Group(); thigh.position.set(x, 0, 0); hips.add(thigh);
    thigh.add(P(part((c) => c.box(0, -0.23, 0, 0.15, 0.46, 0.16, "pants"))));
    const shin = new THREE.Group(); shin.position.y = -0.46; thigh.add(shin);
    shin.add(P(part((c) => { c.box(0, -0.22, 0, 0.13, 0.44, 0.14, "pants"); c.box(0, -0.45, 0.04, 0.12, 0.07, 0.26, "shoe"); })));
    return { thigh, shin };
  };
  const L = leg(-0.1), R = leg(0.1);
  let cupG = null, umb = null;
  if (cup) { cupG = new THREE.Group(); cupG.position.set(0, -0.6, 0.04); armR.add(cupG); cupG.add(P(part((c) => { c.cyl(0, 0, 0, 0.04, 0.11, "cup", { topRole: "coffee" }); c.cyl(0, 0.0, 0, 0.042, 0.04, "coatC", { cap: false }); }))); }
  if (umbrella) {
    umb = new THREE.Group(); umb.position.set(0.12, 1.12, 0.05); hips.add(umb);
    umb.add(P(part((c) => { c.stroke([[0, -0.55, 0], [0, 0.18, 0]], "metal"); c.cone(0, 0.2, 0, 0.03, 0.55, 0.22, rand() < 0.75 ? "umbrella" : "umbrella2", { density: 0.6 }); })));
  }
  scene.add(root);
  return { root, hips, armL, armR, L, R, cupG, umb, mat, phase: rand() * 6, heading: 0, sipT: 3 + rand() * 6, sipping: 0 };
}
function pose(p, mode, t) {
  // mode: "walk" (uses p.phase), "sit" (0..1 blend from standing), "stand"
  const { hips, armL, armR, L, R } = p;
  if (mode === "walk") {
    const s = Math.sin(p.phase);
    L.thigh.rotation.x = -s * 0.45; R.thigh.rotation.x = s * 0.45;
    L.shin.rotation.x = Math.max(0, s) * 0.7; R.shin.rotation.x = Math.max(0, -s) * 0.7;
    armL.rotation.x = s * 0.35; armR.rotation.x = p.cupG ? -0.9 : p.umb ? -2.6 : -s * 0.35;
    hips.position.y = 0.92 + Math.abs(Math.cos(p.phase)) * 0.025;
  } else {
    const k = mode === "sit" ? t : 0, e = k * k * (3 - 2 * k);
    L.thigh.rotation.x = R.thigh.rotation.x = -1.45 * e;
    L.shin.rotation.x = R.shin.rotation.x = 1.4 * e;
    hips.position.y = 0.92 - 0.14 * e;
    armL.rotation.x = -0.55 * e;
    const sip = p.sipping > 0 ? Math.sin(Math.min(1, p.sipping) * Math.PI) : 0;
    armR.rotation.x = p.cupG ? -0.9 - 1.3 * sip : -0.5 * e;
  }
  if (p.cupG) p.cupG.rotation.x = -armR.rotation.x;
}
function tint(p) {
  const outside = p.root.position.z < WZ - 0.1, c = outside ? OUTSIDE_TINT() : INSIDE_TINT();
  p.mat.uniforms.uTint.value.set(...c);
}
function face(p, dx, dz, dt) {
  const target = Math.atan2(dx, dz); let d = target - p.heading;
  d = Math.atan2(Math.sin(d), Math.cos(d)); p.heading += d * Math.min(1, dt * 6); p.root.rotation.y = p.heading;
}
function remove(p) { p.root.traverse((o) => o.geometry?.dispose()); scene.remove(p.root); p.mat.dispose(); }

// Cars.
function makeCar(dir) {
  const g = new THREE.Group(), mat = splatMaterial([0.6, 0.68, 0.82]);
  g.add(toPoints(part((c) => {
    c.box(0, 0.45, 0, 3.9, 0.6, 1.7, (x, y) => (y < 0.25 ? "carDark" : "car"), { density: 0.5 });
    c.box(-0.2, 0.95, 0, 2.0, 0.45, 1.55, (x, y, z) => (y > 0.9 && y < 1.12 && Math.abs(z) > 0.7 ? "facadeLit" : "carDark"), { density: 0.5 });
    for (const z of [-0.55, 0.55]) { c.sphere(1.95, 0.55, z, 0.08, "headlight", { emit: true }); c.sphere(-1.95, 0.55, z, 0.07, "tail", { emit: true }); }
  }, 260), mat, false));
  g.add(glowPoints([{ p: [2.4, 0.55, -0.55], r: 1.2, role: "headlight", a: 0.3 }, { p: [2.4, 0.55, 0.55], r: 1.2, role: "headlight", a: 0.3 }, { p: [-2.1, 0.55, 0], r: 0.9, role: "tail", a: 0.2 }], { value: 1 }));
  g.rotation.y = dir > 0 ? 0 : Math.PI;
  scene.add(g);
  return { root: g, dir, mat, v: 7 + rand() * 4 };
}

// ---------- Behaviour ----------
const customers = [], walkers = [], cars = [];
const seatTaken = STOOLS.map(() => null);
let reader = null;
function spawnCustomer(stoolIndex, seated = false) {
  const p = makePerson({ cup: true });
  const sx = STOOLS[stoolIndex];
  p.stool = stoolIndex; seatTaken[stoolIndex] = p;
  p.path = [[DOOR[0], DOOR[2]], [-2.9, -1.3], [sx, -1.45], [sx, STOOL_Z + 0.25]];
  p.state = seated ? "sit" : "enter"; p.seg = 0; p.t = 0; p.stay = 25 + rand() * 40;
  if (seated) { p.root.position.set(sx, 0, STOOL_Z); p.heading = Math.PI; p.root.rotation.y = Math.PI; p.t = rand() * 10; pose(p, "sit", 1); }
  else p.root.position.set(DOOR[0], 0, DOOR[2]);
  tint(p); customers.push(p);
}
function walkPath(p, dt, pts, speed) {
  const [tx, tz] = pts[p.seg], dx = tx - p.root.position.x, dz = tz - p.root.position.z, d = Math.hypot(dx, dz);
  if (d < 0.05) { p.seg++; return p.seg >= pts.length; }
  const step = Math.min(d, speed * dt);
  p.root.position.x += (dx / d) * step; p.root.position.z += (dz / d) * step;
  face(p, dx, dz, dt); p.phase += dt * speed * 5.2; pose(p, "walk");
  return false;
}
function updateCustomer(p, dt) {
  if (p.state === "enter") { if (walkPath(p, dt, p.path, 1.05)) { p.state = "sitting"; p.t = 0; } }
  else if (p.state === "sitting") { // turn to the window and lower onto the stool
    p.t += dt / 0.9; face(p, 0, -1, dt * 2);
    p.root.position.z += (STOOL_Z - p.root.position.z) * Math.min(1, dt * 4);
    pose(p, "sit", Math.min(1, p.t)); if (p.t >= 1) { p.state = "sit"; p.t = 0; }
  } else if (p.state === "sit") {
    p.t += dt; p.sipT -= dt;
    if (p.sipT < 0 && p.sipping <= 0) { p.sipping = 0.0001; p.sipT = 6 + rand() * 9; }
    if (p.sipping > 0) { p.sipping += dt / 2.2; if (p.sipping >= 1) p.sipping = 0; }
    pose(p, "sit", 1);
    if (p.t > p.stay) { p.state = "standing"; p.t = 0; }
  } else if (p.state === "standing") {
    p.t += dt / 0.9; pose(p, "sit", Math.max(0, 1 - p.t));
    p.root.position.z += (STOOL_Z + 0.3 - p.root.position.z) * Math.min(1, dt * 3);
    if (p.t >= 1) { p.state = "leave"; p.seg = 0; p.path = p.path.slice(0, -1).reverse(); seatTaken[p.stool] = null; }
  } else if (p.state === "leave") { if (walkPath(p, dt, p.path, 1.1)) { p.done = true; } }
}
function spawnWalker() {
  const dir = rand() < 0.5 ? 1 : -1, far = rand() < 0.25, z = far ? -9.0 : pick([-3.6, -4.1]);
  const p = makePerson({ umbrella: rand() < 0.65, coat: pick(["coatA", "coatD", "coatE", "coatA", "coatB"]) });
  p.root.position.set(dir > 0 ? -10 : 10, 0, z); p.dir = dir; p.speed = 1.0 + rand() * 0.45;
  p.heading = dir > 0 ? Math.PI / 2 : -Math.PI / 2; p.root.rotation.y = p.heading; tint(p); walkers.push(p);
}
let nextCustomer = 4, nextWalker = 1, nextCar = 5;
function behave(dt) {
  const busy = Math.max(0.05, S.people);
  if ((nextCustomer -= dt * busy) < 0 && S.people > 0) {
    nextCustomer = 12 + rand() * 18;
    const free = seatTaken.map((s, i) => (s ? -1 : i)).filter((i) => i >= 0);
    if (free.length > 1 && customers.length < 4) spawnCustomer(pick(free));
  }
  if ((nextWalker -= dt * busy) < 0 && S.people > 0) { nextWalker = 3 + rand() * 6; if (walkers.length < 6) spawnWalker(); }
  if ((nextCar -= dt * busy) < 0 && S.people > 0) { nextCar = 7 + rand() * 10; if (cars.length < 2) { const dir = rand() < 0.5 ? 1 : -1; const c = makeCar(dir); c.root.position.set(dir > 0 ? -16 : 16, 0, dir > 0 ? -5.6 : -7.4); cars.push(c); } }
  for (let i = customers.length - 1; i >= 0; i--) { const p = customers[i]; updateCustomer(p, dt); tint(p); if (p.done) { remove(p); customers.splice(i, 1); } }
  for (let i = walkers.length - 1; i >= 0; i--) {
    const p = walkers[i]; p.root.position.x += p.dir * p.speed * dt; p.phase += dt * p.speed * 5.2; pose(p, "walk");
    if (Math.abs(p.root.position.x) > 10.5) { remove(p); walkers.splice(i, 1); }
  }
  for (let i = cars.length - 1; i >= 0; i--) { const c = cars[i]; c.root.position.x += c.dir * c.v * dt; if (Math.abs(c.root.position.x) > 17) { c.root.traverse((o) => { o.geometry?.dispose(); o.material?.dispose?.(); }); scene.remove(c.root); cars.splice(i, 1); } }
  if (reader) { reader.t = (reader.t || 0) + dt; reader.armL.rotation.x = -1.05 + Math.sin(reader.t * 9) * 0.03; reader.armR.rotation.x = -1.05 + Math.sin(reader.t * 8 + 1) * 0.03; }
}
function populate() {
  spawnCustomer(2, true); spawnCustomer(4, true);
  reader = makePerson({ coat: "coatC" }); reader.root.position.set(-0.6, 0, 0.95); reader.heading = Math.PI; reader.root.rotation.y = Math.PI;
  pose(reader, "sit", 1); reader.hips.position.y = 0.92 - 0.44; tint(reader);
}

// Pixel-size blit with a gentle vignette.
const blitScene = new THREE.Scene(), blitCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
blitScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({
  uniforms: { t: { value: low.texture } },
  vertexShader: `varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`,
  fragmentShader: `uniform sampler2D t; varying vec2 vUv; void main() { vec2 v = vUv - 0.5; gl_FragColor = vec4(texture2D(t, vUv).rgb * (1.0 - dot(v, v) * 0.6), 1.0); }`,
  depthTest: false, depthWrite: false,
})));

// ---------- Views ----------
const controls = new OrbitControls(camera, renderer.domElement);
renderer.domElement.style.touchAction = "pan-y";
controls.enableDamping = true; controls.enablePan = false;
const VIEWS = {
  seat: { pos: [2.55, 1.22, 2.35], target: [-0.9, 1.3, -3.0], auto: false, polar: [1.48, 1.64], az: null, spread: 0.32, cut: true },
  diorama: { pos: [11, 8.5, 11], target: [0, 1.0, -2.5], auto: true, zoom: [9, 24], polar: [0.45, 1.4], az: [-Infinity, Infinity], cut: false },
};
function setView(v) {
  S.view = v; const V = VIEWS[v];
  camera.position.set(...V.pos); controls.target.set(...V.target);
  const dist = camera.position.distanceTo(controls.target);
  controls.minDistance = V.zoom ? V.zoom[0] : dist - 0.01; controls.maxDistance = V.zoom ? V.zoom[1] : dist + 0.01;
  controls.minPolarAngle = V.polar[0]; controls.maxPolarAngle = V.polar[1];
  if (V.az) { controls.minAzimuthAngle = V.az[0]; controls.maxAzimuthAngle = V.az[1]; }
  else { const a = Math.atan2(V.pos[0] - V.target[0], V.pos[2] - V.target[2]); controls.minAzimuthAngle = a - V.spread; controls.maxAzimuthAngle = a + V.spread; }
  controls.autoRotate = V.auto && !reduce; controls.autoRotateSpeed = 0.4;
  controls.update();
  cutawayPts.visible = V.cut;
  document.querySelectorAll("[data-view]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.view === v)));
}

// Tap scatters the whole scene into splats; it flies home.
let scatterT = reduce ? 99 : 0, down = null;
const scatter = () => { if (!reduce) scatterT = 0; };
renderer.domElement.addEventListener("pointerdown", (e) => (down = { x: e.clientX, y: e.clientY, t: performance.now() }));
renderer.domElement.addEventListener("pointerup", (e) => { if (down && Math.hypot(e.clientX - down.x, e.clientY - down.y) < 8 && performance.now() - down.t < 350) scatter(); down = null; });

// ---------- Panel ----------
const body = document.getElementById("proto-panel-body");
body.innerHTML = `<div class="pp-seg" role="group" aria-label="View"><button type="button" data-view="seat">Corner table</button><button type="button" data-view="diorama">Diorama</button></div>` +
  CONTROLS.map((c) => `<div class="pp-row"><label for="pp-${c.key}">${c.label}<output id="ppo-${c.key}">${c.fmt(S[c.key])}</output></label><input type="range" id="pp-${c.key}" min="${c.min}" max="${c.max}" step="${c.step}" value="${S[c.key]}"></div>`).join("") +
  `<div class="pp-seg"><button type="button" class="pp-btn" id="pp-scatter">Scatter</button><button type="button" class="pp-btn" id="pp-copy">Copy settings</button></div>`;
body.querySelectorAll("[data-view]").forEach((b) => b.addEventListener("click", () => setView(b.dataset.view)));
for (const c of CONTROLS) {
  const el = document.getElementById("pp-" + c.key);
  el.addEventListener("input", () => { S[c.key] = parseFloat(el.value); document.getElementById("ppo-" + c.key).textContent = c.fmt(S[c.key]); apply(c.key); });
}
document.getElementById("pp-scatter").addEventListener("click", scatter);
document.getElementById("pp-copy").addEventListener("click", async (e) => {
  const text = `view: ${S.view} · ` + CONTROLS.map((c) => `${c.label.toLowerCase()}: ${c.fmt(S[c.key])}`).join(" · ");
  try { await navigator.clipboard.writeText(text); e.target.textContent = "Copied"; } catch { e.target.textContent = "See console"; console.log(text); }
  setTimeout(() => (e.target.textContent = "Copy settings"), 1500);
});
const toggle = document.querySelector(".proto-panel-toggle");
const setOpen = (open) => { body.hidden = !open; toggle.setAttribute("aria-expanded", String(open)); };
toggle.addEventListener("click", () => setOpen(body.hidden));
if (innerWidth < 640) setOpen(false);

let bakeTimer = 0;
function apply(key) {
  U.uVoxel.value = S.voxel; U.uRound.value = S.round; U.uMix.value = S.paletteMix; U.uDither.value = S.dither;
  U.uSplat.value = S.splat;
  glowWarm.value = 0.6 + 0.4 * S.warmth;
  rainGeo.setDrawRange(0, Math.round(RAIN * S.rain));
  if (key === "warmth" || key === "cold") { clearTimeout(bakeTimer); bakeTimer = setTimeout(rebake, 60); }
  if (key === "pixel") resize();
}
function resize() {
  const r = stage.getBoundingClientRect(); if (!r.width) return;
  renderer.setSize(r.width, r.height, false);
  const lw = Math.max(64, Math.round(r.width / S.pixel)), lh = Math.max(40, Math.round(r.height / S.pixel));
  low.setSize(lw, lh);
  U.uScale.value = lh / (2 * Math.tan((camera.fov * Math.PI) / 360));
  camera.aspect = r.width / r.height; camera.updateProjectionMatrix();
}

// ---------- Loop ----------
let running = false, last = 0, time = 0;
function render() { renderer.setRenderTarget(low); renderer.render(scene, camera); renderer.setRenderTarget(null); renderer.render(blitScene, blitCam); }
function frame(ts) {
  if (!running) return;
  const dt = Math.min(0.05, (ts - last) / 1000 || 0) * S.speed; last = ts;
  time += dt; scatterT += dt; U.uTime.value = time;
  const k = Math.min(1, scatterT / 1.8); U.uScatter.value = Math.pow(1 - k, 3) * 1.4;
  behave(dt);
  controls.update();
  render();
  requestAnimationFrame(frame);
}
function start() { if (running || reduce) return; running = true; last = performance.now(); requestAnimationFrame(frame); }
function stop() { running = false; }
new ResizeObserver(() => { resize(); if (!running) render(); }).observe(stage);
new IntersectionObserver(([e]) => (e.isIntersecting && !document.hidden ? start() : stop())).observe(stage);
document.addEventListener("visibilitychange", () => (document.hidden ? stop() : start()));

resize(); apply(); setView(S.view); populate();
if (reduce) { U.uScatter.value = 0; render(); }
start();
console.log("splats:", room.count + outside.count + cutaway.count);
