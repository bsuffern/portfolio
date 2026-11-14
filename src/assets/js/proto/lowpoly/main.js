// Wires the layers together: renderer and camera, scene layers, lights, life, effects, views, the panel, the loop.
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { COLORS } from "./palette.js";
import { Builder } from "./build.js";
import * as L from "./layout.js";
import { createLights } from "./lights.js";
import { createLife } from "./life.js";
import { createRain, createGlass, createSteam, createPost } from "./effects.js";

const stage = document.querySelector("[data-proto-stage]");
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

// ---------- Settings ----------
const S = { view: "seat", warmth: 1, cold: 1, rain: 0.7, busy: 1, speed: 1, bloom: 0.6, fog: 1, pixel: 1, grain: 0.05, shadows: true, style: "none", styleAmount: 1 };
const pct = (v) => Math.round(v * 100) + "%", x = (v) => v.toFixed(2) + "×";
const CONTROLS = [
  { key: "warmth", label: "Warmth inside", min: 0.2, max: 2, step: 0.05, fmt: x },
  { key: "cold", label: "Cold outside", min: 0.2, max: 2, step: 0.05, fmt: x },
  { key: "rain", label: "Rain", min: 0, max: 1, step: 0.05, fmt: pct },
  { key: "busy", label: "How busy", min: 0, max: 2, step: 0.1, fmt: (v) => v.toFixed(1) + "×" },
  { key: "speed", label: "Time speed", min: 0.25, max: 2, step: 0.05, fmt: x },
  { key: "bloom", label: "Glow", min: 0, max: 1.5, step: 0.05, fmt: (v) => v.toFixed(2) },
  { key: "fog", label: "Fog outside", min: 0, max: 2, step: 0.05, fmt: x },
  { key: "pixel", label: "Pixel size", min: 1, max: 6, step: 1, fmt: (v) => (v === 1 ? "off" : v + "px") },
  { key: "grain", label: "Grain", min: 0, max: 0.2, step: 0.01, fmt: (v) => v.toFixed(2) },
  { key: "styleAmount", label: "Style amount", min: 0, max: 1, step: 0.05, fmt: pct },
];

// ---------- Renderer, scene, camera ----------
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
const dpr = Math.min(devicePixelRatio || 1, 2);
renderer.setPixelRatio(dpr);
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
stage.append(renderer.domElement);
const scene = new THREE.Scene();
scene.background = new THREE.Color(COLORS.sky);
const fog = new THREE.Fog(COLORS.fog, 7.5, 34); scene.fog = fog;
const camera = new THREE.PerspectiveCamera(50, 1.6, 0.05, 120);

// ---------- Layers ----------
const b = new Builder(scene);
L.buildRoom(b); L.buildBar(b); L.buildWindow(b); L.buildFurniture(b); L.buildProps(b); L.buildCutaway(b); L.buildOutsideNear(b); L.buildOutsideFar(b);
for (const name of ["room", "bar", "window", "furniture", "props", "cutaway", "outsideNear", "outsideFar"]) b.merge(name);
const lights = createLights(scene);
const life = createLife(scene);
const rain = createRain(scene), glass = createGlass(scene), steam = createSteam(scene);
const post = createPost(renderer, scene, camera);

// ---------- Views ----------
const controls = new OrbitControls(camera, renderer.domElement);
renderer.domElement.style.touchAction = "pan-y";
controls.enableDamping = true; controls.enablePan = false;
const VIEWS = {
  seat: { ...L.SEAT_CAMERA, auto: false, polar: [1.47, 1.66], spread: 0.3, cut: true },
  diorama: { pos: [11, 8.5, 11], target: [0, 1.0, -2.5], auto: true, zoom: [8, 26], polar: [0.45, 1.42], cut: false },
};
function setView(v) {
  S.view = v; const V = VIEWS[v];
  camera.position.set(...V.pos); controls.target.set(...V.target);
  const dist = camera.position.distanceTo(controls.target);
  controls.minDistance = V.zoom ? V.zoom[0] : dist - 0.01; controls.maxDistance = V.zoom ? V.zoom[1] : dist + 0.01;
  controls.minPolarAngle = V.polar[0]; controls.maxPolarAngle = V.polar[1];
  if (V.spread) { const a = Math.atan2(V.pos[0] - V.target[0], V.pos[2] - V.target[2]); controls.minAzimuthAngle = a - V.spread; controls.maxAzimuthAngle = a + V.spread; }
  else { controls.minAzimuthAngle = -Infinity; controls.maxAzimuthAngle = Infinity; }
  controls.autoRotate = V.auto && !reduce; controls.autoRotateSpeed = 0.4;
  controls.update();
  b.layers.cutaway.visible = V.cut;
  document.querySelectorAll("[data-view]").forEach((el) => el.setAttribute("aria-pressed", String(el.dataset.view === v)));
}

// ---------- Panel ----------
const body = document.getElementById("proto-panel-body");
body.innerHTML = `<div class="pp-seg" role="group" aria-label="View"><button type="button" data-view="seat">Corner table</button><button type="button" data-view="diorama">Diorama</button></div>` +
  CONTROLS.map((c) => `<div class="pp-row"><label for="pp-${c.key}">${c.label}<output id="ppo-${c.key}">${c.fmt(S[c.key])}</output></label><input type="range" id="pp-${c.key}" min="${c.min}" max="${c.max}" step="${c.step}" value="${S[c.key]}"></div>`).join("") +
  `<div class="pp-seg" role="group" aria-label="Style"><button type="button" data-style="none">No style</button><button type="button" data-style="neonVHS">Neon VHS</button></div>
   <div class="pp-seg" role="group" aria-label="Shadows"><button type="button" data-shadows="on">Shadows on</button><button type="button" data-shadows="off">Shadows off</button></div>
   <button type="button" class="pp-btn" id="pp-copy">Copy settings</button>`;
body.querySelectorAll("[data-view]").forEach((el) => el.addEventListener("click", () => setView(el.dataset.view)));
body.querySelectorAll("[data-shadows]").forEach((el) => el.addEventListener("click", () => { S.shadows = el.dataset.shadows === "on"; apply(); }));
body.querySelectorAll("[data-style]").forEach((el) => el.addEventListener("click", () => { S.style = el.dataset.style; apply(); }));
for (const c of CONTROLS) {
  const el = document.getElementById("pp-" + c.key);
  el.addEventListener("input", () => { S[c.key] = parseFloat(el.value); document.getElementById("ppo-" + c.key).textContent = c.fmt(S[c.key]); apply(); });
}
document.getElementById("pp-copy").addEventListener("click", async (e) => {
  const text = `view: ${S.view} · style: ${S.style} · shadows: ${S.shadows ? "on" : "off"} · ` + CONTROLS.map((c) => `${c.label.toLowerCase()}: ${c.fmt(S[c.key])}`).join(" · ");
  try { await navigator.clipboard.writeText(text); e.target.textContent = "Copied"; } catch { e.target.textContent = "See console"; console.log(text); }
  setTimeout(() => (e.target.textContent = "Copy settings"), 1500);
});
const toggle = document.querySelector(".proto-panel-toggle");
const setOpen = (open) => { body.hidden = !open; toggle.setAttribute("aria-expanded", String(open)); };
toggle.addEventListener("click", () => setOpen(body.hidden));
if (innerWidth < 640) setOpen(false);

function apply() {
  lights.setWarmth(S.warmth); lights.setCold(S.cold); lights.setShadows(S.shadows);
  body.querySelectorAll("[data-shadows]").forEach((el) => el.setAttribute("aria-pressed", String((el.dataset.shadows === "on") === S.shadows)));
  rain.amount = S.rain; glass.amount = S.rain;
  post.bloom.strength = S.bloom;
  fog.near = 7.5; fog.far = S.fog > 0 ? 12 + 44 / S.fog : 1e6;
  post.style.set(S.style, S.styleAmount, { pixel: S.pixel, grain: S.grain, dpr });
  body.querySelectorAll("[data-style]").forEach((el) => el.setAttribute("aria-pressed", String(el.dataset.style === S.style)));
}
function resize() {
  const r = stage.getBoundingClientRect(); if (!r.width) return;
  renderer.setSize(r.width, r.height, false); post.setSize(r.width, r.height, dpr);
  camera.aspect = r.width / r.height; camera.updateProjectionMatrix();
}

// ---------- Loop ----------
let running = false, last = 0, time = 0;
function frame(ts) {
  if (!running) return;
  const dt = Math.min(0.05, (ts - last) / 1000 || 0) * S.speed; last = ts; time += dt;
  life.update(dt, S.busy); rain.update(time); glass.update(dt); steam.update(dt);
  controls.update();
  post.render(time);
  requestAnimationFrame(frame);
}
function start() { if (running || reduce) return; running = true; last = performance.now(); requestAnimationFrame(frame); }
function stop() { running = false; }
new ResizeObserver(() => { resize(); if (!running) post.render(time); }).observe(stage);
new IntersectionObserver(([e]) => (e.isIntersecting && !document.hidden ? start() : stop())).observe(stage);
document.addEventListener("visibilitychange", () => (document.hidden ? stop() : start()));

resize(); apply(); setView(S.view);
if (reduce) { life.update(0, 0); glass.update(0); steam.update(0); post.render(0); }
start();
renderer.info.autoReset = true;
console.log("draw calls (first frame follows):", scene.children.length, "top-level objects");
