// Character lab: a lineup of the shared person model to tune its proportions and try every animation clip.
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { createPerson, BODY, PRESETS, randomColors, varyBody } from "./person.js";
import { Animator } from "./anim.js";

const stage = document.querySelector("[data-proto-stage]");
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

// ---------- Scene ----------
const renderer = new THREE.WebGLRenderer({ antialias: true });
const dpr = Math.min(devicePixelRatio || 1, 2);
renderer.setPixelRatio(dpr);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
stage.append(renderer.domElement);
const scene = new THREE.Scene();
scene.background = new THREE.Color("#1a1512");
const camera = new THREE.PerspectiveCamera(32, 1.6, 0.1, 60);
const controls = new OrbitControls(camera, renderer.domElement);
renderer.domElement.style.touchAction = "pan-y";
controls.enableDamping = true; controls.enablePan = false; controls.minDistance = 2.5; controls.maxDistance = 12;
controls.target.set(0, 0.85, 0); camera.position.set(0.6, 1.5, 6.2); controls.update();

const floor = new THREE.Mesh(new THREE.CylinderGeometry(3.4, 3.4, 0.06, 24), new THREE.MeshStandardMaterial({ color: "#8a5b3a", flatShading: true, roughness: 0.9 }));
floor.position.y = -0.03; floor.receiveShadow = true; scene.add(floor);
scene.add(new THREE.HemisphereLight("#ffe2c0", "#2a2018", 0.9));
const key = new THREE.SpotLight("#ffc890", 40, 14, 0.7, 0.6, 1.2); key.position.set(-2.5, 4.5, 3.5); key.castShadow = true; key.shadow.mapSize.set(1024, 1024); key.shadow.bias = -0.0015; scene.add(key, key.target);
const rim = new THREE.DirectionalLight("#9fc0e0", 1.2); rim.position.set(3, 3, -4); scene.add(rim);

// ---------- Lineup ----------
const SLOTS = [-1.6, -0.8, 0, 0.8, 1.6];
const body = { ...BODY };
let colors = PRESETS.map((c) => ({ ...c }));
let people = [];
const state = { base: "idle", arms: null, head: null, speed: 1, facing: "turn", variety: 0.85, cam: "full" };
// Each slot keeps its own random draws, so sliders reshape everyone without reshuffling who is who.
let seeds = SLOTS.map(() => Math.random() * 1e9);
const seeded = (s) => () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
const furniture = new THREE.Group(); scene.add(furniture);
const wood = new THREE.MeshStandardMaterial({ color: "#b47a46", flatShading: true }), metal = new THREE.MeshStandardMaterial({ color: "#25272c", flatShading: true });
function seat(x, kind) {
  const g = new THREE.Group(); g.position.x = x; furniture.add(g);
  const h = kind === "stool" ? 0.78 : 0.48;
  const top = new THREE.Mesh(kind === "stool" ? new THREE.CylinderGeometry(0.17, 0.17, 0.04, 10) : new THREE.BoxGeometry(0.42, 0.04, 0.42), wood);
  top.position.y = h - 0.02; top.castShadow = top.receiveShadow = true; g.add(top);
  const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.03, h - 0.04, 5), metal); leg.position.y = (h - 0.04) / 2; leg.castShadow = true; g.add(leg);
  if (kind === "chair") { const back = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.42, 0.03), wood); back.position.set(0, h + 0.22, -0.2); back.castShadow = true; g.add(back); }
}
function rebuild() {
  for (const p of people) { scene.remove(p.root); p.dispose(); }
  people = SLOTS.map((x, i) => {
    const p = createPerson({ ...colors[i] }, varyBody(body, state.variety, seeded(Math.floor(seeds[i]) + 1)));
    p.root.position.x = x; scene.add(p.root);
    p.anim = new Animator(p);
    return p;
  });
  furniture.clear();
  const kind = state.base.includes("Chair") ? "chair" : state.base.toLowerCase().includes("stool") ? "stool" : null;
  if (kind) SLOTS.forEach((x) => seat(x, kind));
  for (const p of people) {
    p.anim.play("base", state.base, { fade: 0 });
    if (state.arms) p.anim.play("arms", state.arms, { fade: 0 });
    if (state.head) p.anim.play("head", state.head, { fade: 0 });
    p.show("cup", ["holdCup", "sip"].includes(state.arms)); p.show("umbrella", state.arms === "umbrella");
  }
}

// ---------- Panel ----------
const SLIDERS = [
  ["legLen", "Leg length", 0.75, 1.2, 0.01], ["legR", "Leg thickness", 0.022, 0.07, 0.002], ["torsoH", "Torso height", 0.38, 0.66, 0.01],
  ["shoulderW", "Shoulder width", 0.28, 0.56, 0.01], ["waistW", "Waist width", 0.12, 0.42, 0.01], ["depth", "Torso depth", 0.3, 0.8, 0.02],
  ["armLen", "Arm length", 0.42, 0.72, 0.01], ["armR", "Arm thickness", 0.018, 0.05, 0.001],
  ["headH", "Head length", 0.18, 0.36, 0.005], ["headW", "Head width", 0.1, 0.2, 0.005], ["headD", "Head depth", 0.12, 0.24, 0.005],
  ["jaw", "Jaw (narrow ↔ wide)", 0.55, 1.25, 0.01], ["crown", "Crown (flat ↔ domed)", 0, 1, 0.05], ["skull", "Back of skull", 0, 1, 0.05],
  ["forehead", "Forehead slope", 0, 1, 0.05], ["chin", "Chin", 0, 1, 0.05],
];
const BASE = [["idle", "Stand"], ["walk", "Walk"], ["sitDownStool", "Sit down"], ["sitStool", "On stool"], ["standUpStool", "Stand up"], ["sitChair", "On chair"]];
const ARMS = [[null, "None"], ["holdCup", "Hold cup"], ["sip", "Sip"], ["umbrella", "Umbrella"], ["type", "Type"], ["pocket", "Pockets"], ["wave", "Wave"]];
const HEAD = [[null, "None"], ["lookAround", "Look around"], ["lookOutside", "Gaze"]];
const FACING = [["front", "Front"], ["side", "Side"], ["turn", "Turn"]];
const CAM = [["full", "Full body"], ["faces", "Faces"]];
const body$ = document.getElementById("proto-panel-body");
const seg = (group, items) => `<div class="pp-grid" role="group" aria-label="${group}">${items.map(([v, l]) => `<button type="button" data-${group}="${v ?? ""}">${l}</button>`).join("")}</div>`;
body$.innerHTML =
  `<p class="pp-h">Body</p><div class="pp-row"><label for="pp-variety">Variety between people<output id="ppo-variety">85%</output></label><input type="range" id="pp-variety" min="0" max="1" step="0.05" value="0.85"></div>` + SLIDERS.map(([k, l, mn, mx, st]) => `<div class="pp-row"><label for="pp-${k}">${l}<output id="ppo-${k}">${body[k].toFixed(3)}</output></label><input type="range" id="pp-${k}" min="${mn}" max="${mx}" step="${st}" value="${body[k]}"></div>`).join("") +
  `<p class="pp-h">Body animation</p>${seg("base", BASE)}<p class="pp-h">Arms</p>${seg("arms", ARMS)}<p class="pp-h">Head</p>${seg("head", HEAD)}` +
  `<p class="pp-h">View</p>${seg("facing", FACING)}${seg("cam", CAM)}` +
  `<div class="pp-row"><label for="pp-speed">Speed<output id="ppo-speed">1.00×</output></label><input type="range" id="pp-speed" min="0.1" max="2" step="0.05" value="1"></div>` +
  `<div class="pp-grid pp-grid-2"><button type="button" class="pp-btn" id="pp-new">New people</button><button type="button" class="pp-btn" id="pp-colours">Shuffle colours</button></div><button type="button" class="pp-btn" id="pp-copy">Copy body</button>`;
document.getElementById("pp-variety").addEventListener("input", (e) => { state.variety = parseFloat(e.target.value); document.getElementById("ppo-variety").textContent = Math.round(state.variety * 100) + "%"; rebuild(); });
for (const [k] of SLIDERS) {
  const el = document.getElementById("pp-" + k);
  el.addEventListener("input", () => { body[k] = parseFloat(el.value); document.getElementById("ppo-" + k).textContent = body[k].toFixed(3); rebuild(); });
}
function mark() {
  for (const g of ["base", "arms", "head", "facing", "cam"]) body$.querySelectorAll(`[data-${g}]`).forEach((b) => b.setAttribute("aria-pressed", String((b.dataset[g] || null) === state[g])));
}
body$.addEventListener("click", (e) => {
  const b = e.target.closest("button"); if (!b) return;
  if (b.dataset.base !== undefined) {
    const prevKind = furnitureKind(state.base); state.base = b.dataset.base;
    if (furnitureKind(state.base) !== prevKind) { furniture.clear(); const k = furnitureKind(state.base); if (k) SLOTS.forEach((x) => seat(x, k)); }
    const then = { sitDownStool: "sitStool", standUpStool: "idle" }[state.base];
    for (const p of people) p.anim.play("base", state.base, { then, restart: true });
  } else if (b.dataset.arms !== undefined) {
    state.arms = b.dataset.arms || null;
    for (const p of people) {
      if (state.arms === "sip") p.anim.play("arms", "sip", { then: "holdCup", restart: true }); else if (state.arms === "wave") p.anim.play("arms", "wave", { then: null, restart: true });
      else if (state.arms) p.anim.play("arms", state.arms); else p.anim.stop("arms");
      p.show("cup", ["holdCup", "sip"].includes(state.arms)); p.show("umbrella", state.arms === "umbrella");
    }
  } else if (b.dataset.head !== undefined) {
    state.head = b.dataset.head || null;
    for (const p of people) state.head ? p.anim.play("head", state.head) : p.anim.stop("head");
  } else if (b.dataset.facing !== undefined) state.facing = b.dataset.facing;
  else if (b.dataset.cam !== undefined) {
    state.cam = b.dataset.cam;
    if (state.cam === "faces") { controls.minDistance = 1; controls.target.set(0, 1.55, 0); camera.position.set(0.25, 1.62, 2.6); }
    else { controls.minDistance = 2.5; controls.target.set(0, 0.85, 0); camera.position.set(0.6, 1.5, 6.2); }
    controls.update();
  }
  else if (b.id === "pp-new") { seeds = SLOTS.map(() => Math.random() * 1e9); colors = SLOTS.map(() => randomColors()); rebuild(); }
  else if (b.id === "pp-colours") { colors = SLOTS.map(() => randomColors()); people.forEach((p, i) => Object.entries(colors[i]).forEach(([slot, c]) => p.paint(slot, c))); }
  else if (b.id === "pp-copy") {
    const text = JSON.stringify({ ...Object.fromEntries(SLIDERS.map(([k]) => [k, +body[k].toFixed(3)])), variety: state.variety });
    navigator.clipboard.writeText(text).then(() => (b.textContent = "Copied"), () => { b.textContent = "See console"; console.log(text); });
    setTimeout(() => (b.textContent = "Copy body"), 1500);
  }
  mark();
});
const furnitureKind = (base) => (base.includes("Chair") ? "chair" : base.toLowerCase().includes("stool") ? "stool" : null);
document.getElementById("pp-speed").addEventListener("input", (e) => { state.speed = parseFloat(e.target.value); document.getElementById("ppo-speed").textContent = state.speed.toFixed(2) + "×"; });
const toggle = document.querySelector(".proto-panel-toggle");
toggle.addEventListener("click", () => { body$.hidden = !body$.hidden; toggle.setAttribute("aria-expanded", String(!body$.hidden)); });
if (innerWidth < 640) { body$.hidden = true; toggle.setAttribute("aria-expanded", "false"); }

// ---------- Loop ----------
function resize() {
  const r = stage.getBoundingClientRect(); if (!r.width) return;
  renderer.setSize(r.width, r.height, false); camera.aspect = r.width / r.height; camera.updateProjectionMatrix();
}
let last = 0, t = 0, running = false;
function frame(ts) {
  if (!running) return;
  const dt = Math.min(0.05, (ts - last) / 1000 || 0) * state.speed; last = ts; t += dt;
  const yaw = state.facing === "front" ? 0 : state.facing === "side" ? Math.PI / 2 : t * 0.5;
  for (const p of people) { p.root.rotation.y = yaw; p.anim.update(dt); }
  furniture.rotation.y = 0;
  furniture.children.forEach((g, i) => { g.rotation.y = yaw; });
  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}
function start() { if (running) return; running = true; last = performance.now(); requestAnimationFrame(frame); }
new ResizeObserver(resize).observe(stage);
new IntersectionObserver(([e]) => (e.isIntersecting ? start() : (running = false))).observe(stage);
resize(); rebuild(); mark();
if (reduce) { people.forEach((p) => p.anim.update(0)); renderer.render(scene, camera); } else start();
