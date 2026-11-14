// The one person model. Every character shares this body: long thin legs, a torso that tapers from broad
// shoulders to the waist, proportionate arms. For now a person is just coloured regions (skin, top, bottom,
// shoes, hair); clothing layers come later.
//
// Joints (THREE.Group pivots, rotations in radians, local +z is forward):
//   root → hips → spine → neck → head
//                       → shoulderL → elbowL → handL      (arms hang along -y; -x swings forward)
//                       → shoulderR → elbowR → handR
//               → hipL → kneeL                            (legs hang along -y; -x swings forward, +x bends the knee)
//               → hipR → kneeR
import * as THREE from "three";
import { rand, pick } from "./build.js";

// Tuned by Broden in the character lab, 2026-11-14 (with variety 0.85).
export const BODY = {
  legLen: 0.98,     // hip height when standing
  legR: 0.042,      // leg thickness
  torsoH: 0.48,
  shoulderW: 0.46,  // across the shoulders
  waistW: 0.18,     // across the waist
  depth: 0.48,       // torso depth relative to its width
  armLen: 0.54,
  armR: 0.03,
  headW: 0.125,      // the head is a long rectangle: width,
  headH: 0.27,      // height,
  headD: 0.14,      // depth,
  jaw: 0.85,        // jaw width relative to the temples: <1 narrows to the chin, >1 widens (pear)
  crown: 0.45,      // 0 = flat top, 1 = domed
  skull: 0.1,      // how far the back of the skull extends
  forehead: 0.3,    // how much the forehead slopes back
  chin: 0.1,        // how far the chin comes forward
  hair: "crop",     // crop | volume | short | none
};

// Every person shares the style but gets their own body: taller or shorter, broader or slighter, a longer or wider
// head, and a slight posture of their own. amount 0 = all identical, 1 = full variety.
export const VARIETY = 0.85;
export function varyBody(base = BODY, amount = VARIETY, r = rand) {
  const v = (spread) => 1 + (r() * 2 - 1) * spread * amount;
  const height = v(0.12), build = v(0.22);
  return {
    ...base,
    legLen: base.legLen * height * v(0.03), torsoH: base.torsoH * height * v(0.05), armLen: base.armLen * height * v(0.03),
    shoulderW: base.shoulderW * build * v(0.06), waistW: base.waistW * build * v(0.2), depth: base.depth * v(0.12),
    legR: base.legR * build * v(0.15), armR: base.armR * build * v(0.12),
    ...headShape(base, amount, r),
    hair: amount > 0 ? ["crop", "crop", "volume", "short", "none"][Math.floor(r() * 5)] : base.hair,
    posture: { spine: [(r() - 0.4) * 0.12 * amount, 0, (r() - 0.5) * 0.04 * amount], neck: [(r() - 0.5) * 0.18 * amount, 0, (r() - 0.5) * 0.08 * amount] },
    pace: v(0.1),
  };
}

export function createPerson(colors = randomColors(), body = {}) {
  const B = { ...BODY, ...body }, C = colors;
  const mats = {};
  const mat = (slot) => (mats[slot] ||= new THREE.MeshStandardMaterial({ color: C[slot], flatShading: true, roughness: 0.85 }));
  const add = (g, slot, parent, x = 0, y = 0, z = 0, scale) => {
    const m = new THREE.Mesh(g, mat(slot)); m.position.set(x, y, z); if (scale) m.scale.set(...scale);
    m.castShadow = m.receiveShadow = true; parent.add(m); return m;
  };
  const J = {};
  const joint = (name, parent, x, y, z) => { const g = new THREE.Group(); g.name = name; g.position.set(x, y, z); parent.add(g); J[name] = g; return g; };
  const limb = (r1, r2, len, segs = 6) => { const g = new THREE.CylinderGeometry(r1, r2, len, segs, 1); g.translate(0, -len / 2, 0); return g; };

  const root = new THREE.Group();
  joint("hips", root, 0, B.legLen, 0);
  joint("spine", J.hips, 0, 0, 0);

  // Torso: six-sided, tapering from the shoulders to the waist, flattened front to back.
  add(new THREE.CylinderGeometry(B.shoulderW / 2, B.waistW / 2, B.torsoH, 6, 1), "top", J.spine, 0, B.torsoH / 2, 0, [1, 1, B.depth]);
  // Pelvis in the bottom colour, joining legs to torso.
  add(new THREE.CylinderGeometry(B.waistW / 2, B.waistW / 2 * 0.8, 0.12, 6, 1), "bottom", J.hips, 0, -0.04, 0, [1, 1, B.depth * 1.1]);

  joint("neck", J.spine, 0, B.torsoH, 0);
  add(limb(0.03, 0.034, 0.07), "skin", J.neck, 0, 0.07, 0);
  joint("head", J.neck, 0, 0.07, 0);
  buildHead(add, J.head, B);

  const upper = B.armLen * 0.52, fore = B.armLen * 0.48;
  for (const side of ["L", "R"]) {
    const s = side === "L" ? -1 : 1;
    const sh = joint("shoulder" + side, J.spine, s * (B.shoulderW / 2 - 0.025), B.torsoH - 0.04, 0);
    add(limb(B.armR * 1.15, B.armR, upper), "top", sh);
    const el = joint("elbow" + side, sh, 0, -upper, 0);
    add(limb(B.armR, B.armR * 0.85, fore), "top", el);
    const hand = joint("hand" + side, el, 0, -fore, 0);
    add(new THREE.IcosahedronGeometry(B.armR * 1.25, 0), "skin", hand, 0, -B.armR, 0);
  }

  const thigh = B.legLen * 0.5, shin = B.legLen * 0.5 - 0.04;
  for (const side of ["L", "R"]) {
    const s = side === "L" ? -1 : 1;
    const hip = joint("hip" + side, J.hips, s * (B.waistW / 2 - 0.05), 0, 0);
    add(limb(B.legR * 1.15, B.legR, thigh), "bottom", hip);
    const knee = joint("knee" + side, hip, 0, -thigh, 0);
    add(limb(B.legR, B.legR * 0.8, shin), "bottom", knee);
    add(new THREE.BoxGeometry(0.075, 0.055, 0.19), "shoes", knee, 0, -shin - 0.012, 0.045);
  }

  // Props hang off the right hand; the animator keeps them upright.
  const props = {};
  const prop = (name, build) => { const g = new THREE.Group(); J.handR.add(g); props[name] = g; g.visible = false; build(g); };
  const pmat = (c) => new THREE.MeshStandardMaterial({ color: c, flatShading: true, roughness: 0.7 });
  prop("cup", (g) => {
    g.position.set(0, -0.06, 0.03);
    const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.029, 0.1, 7), pmat("#f6efe4")), band = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.034, 0.035, 7), pmat("#c7a26a"));
    cup.castShadow = band.castShadow = true; g.add(cup, band);
  });
  prop("umbrella", (g) => {
    g.position.set(0, -0.03, 0);
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.007, 0.007, 0.85, 4), pmat("#25272c")); pole.position.y = 0.35;
    const canopy = new THREE.Mesh(new THREE.ConeGeometry(0.56, 0.22, 8, 1, true), pmat(C.umbrella || "#1f2c44")); canopy.position.y = 0.82; canopy.material.side = THREE.DoubleSide;
    canopy.castShadow = true; g.add(pole, canopy);
  });

  return {
    root, J, props, body: B, colors: C,
    show(name, on = true) { if (props[name]) props[name].visible = on; },
    paint(slot, color) { C[slot] = color; mats[slot]?.color.set(color); },
    dispose() { root.traverse((x) => { x.geometry?.dispose(); if (x.material && !Object.values(mats).includes(x.material)) x.material.dispose(); }); Object.values(mats).forEach((m) => m.dispose()); },
  };
}

const clamp01 = (v) => Math.max(0, Math.min(1, v));

// ---------- Head ----------
// Faceless on purpose: all the character is in the silhouette of the head. Head types blend into the base
// proportions, then everything gets a little randomness.
const HEAD_TYPES = {
  oblong: { headH: 1.08, headW: 0.95, jaw: 0.9, crown: 0.45, skull: 0.3, forehead: 0.25, chin: 0.3 },
  square: { headH: 0.92, headW: 1.12, jaw: 1.02, crown: 0.1, skull: 0.2, forehead: 0.1, chin: 0.45 },
  egg: { headH: 1.02, headW: 0.98, jaw: 0.68, crown: 0.95, skull: 0.45, forehead: 0.35, chin: 0.15 },
  pear: { headH: 0.97, headW: 0.95, jaw: 1.16, crown: 0.55, skull: 0.25, forehead: 0.45, chin: 0.25 },
  wedge: { headH: 1.0, headW: 1.08, jaw: 0.62, crown: 0.25, skull: 0.3, forehead: 0.15, chin: 0.6 },
  longSkull: { headH: 1.0, headW: 0.94, jaw: 0.85, crown: 0.6, skull: 0.95, forehead: 0.65, chin: 0.2 },
};
function headShape(base, amount, r) {
  const t = Object.values(HEAD_TYPES)[Math.floor(r() * Object.keys(HEAD_TYPES).length)], j = (s) => (r() * 2 - 1) * s * amount;
  const mix = (a, b) => a + (b - a) * amount;
  return {
    headH: base.headH * mix(1, t.headH) * (1 + j(0.05)), headW: base.headW * mix(1, t.headW) * (1 + j(0.05)), headD: base.headD * (1 + j(0.06)),
    jaw: mix(base.jaw, t.jaw) + j(0.05), crown: clamp01(mix(base.crown, t.crown) + j(0.1)), skull: clamp01(mix(base.skull, t.skull) + j(0.1)),
    forehead: clamp01(mix(base.forehead, t.forehead) + j(0.1)), chin: clamp01(mix(base.chin, t.chin) + j(0.1)),
  };
}
// Shape a point given in head space (origin at the centre of the head).
function sculpt(x, y, z, B) {
  const u = x / (B.headW / 2), v = y / (B.headH / 2), s = z / (B.headD / 2);
  if (v < 0) { const k = Math.min(1, -v * 1.2); x *= 1 + (B.jaw - 1) * k; z *= 1 + (B.jaw - 1) * 0.35 * k; }       // jaw
  if (v > 0.3) { const k = ((v - 0.3) / 0.7) ** 2; x *= 1 - B.crown * 0.34 * k; z *= 1 - B.crown * 0.24 * k;        // crown
    y -= B.crown * 0.08 * (B.headH / 2) * k * Math.min(1, u * u + s * s); }
  if (s < 0 && v > -0.35) z -= B.skull * 0.05 * Math.min(1, (v + 0.35) / 1.0);                                     // back of the skull
  if (s > 0 && v > 0.15) z -= B.forehead * 0.04 * ((v - 0.15) / 0.85);                                             // forehead slope
  if (s > 0.4 && v < -0.55) z += B.chin * 0.022 * ((-v - 0.55) / 0.45);                                            // chin
  if (s < 0 && v < -0.45) z *= 0.85;                                                                                // tuck under at the neck
  return [x, y, z];
}
// Box → sculpted solid. ty/tz place the box in head space; scale grows it slightly (hair over skin).
function sculpted(g, B, ty = 0, tz = 0, scale = 1) {
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const [x, y, z] = sculpt(p.getX(i) * scale, p.getY(i) * scale + ty, p.getZ(i) * scale + tz, B);
    p.setXYZ(i, x, y - ty, z - tz);
  }
  g.computeVertexNormals();
  return g;
}
function buildHead(add, head, B) {
  const w = B.headW, h = B.headH, d = B.headD, cy = h / 2 - 0.01;
  add(sculpted(new THREE.BoxGeometry(w, h, d, 3, 6, 3), B), "skin", head, 0, cy, 0.005);
  if (B.hair === "none") return;
  const capH = h * ({ crop: 0.3, volume: 0.42, short: 0.16 }[B.hair] ?? 0.3), lift = B.hair === "volume" ? 0.02 : 0.006;
  const capY = h / 2 - capH / 2 + lift;
  add(sculpted(new THREE.BoxGeometry(w, capH, d, 3, 2, 3), B, capY, 0, 1.06), "hair", head, 0, cy + capY, 0.005);
  if (B.hair !== "short") add(sculpted(new THREE.BoxGeometry(w, h * 0.5, d * 0.3, 3, 3, 1), B, h * 0.08, -d * 0.36, 1.06), "hair", head, 0, cy + h * 0.08, 0.005 - d * 0.36);
}

// ---------- Colours ----------
const SKIN = ["#f1c9a5", "#e3b591", "#c68e63", "#a06a45", "#6e4a33", "#4a3022"];
const HAIR = ["#1d1512", "#2a1d17", "#4a3020", "#6b4a2e", "#a3784a", "#c9b18a", "#8a8580"];
const TOP = ["#2f4060", "#7d3a2e", "#c7a26a", "#3e5a4a", "#b9b2a6", "#e7dccb", "#5a4a6b", "#a6553a", "#2a2d35", "#1f2a3c"];
const BOTTOM = ["#2a2d35", "#3a4656", "#4a3a2e", "#1f2024", "#6b5a48", "#2f4060"];
const SHOES = ["#141518", "#2a2d35", "#e7dccb", "#5a3a24"];
export function randomColors() {
  return { skin: pick(SKIN), hair: pick(HAIR), top: pick(TOP), bottom: pick(BOTTOM), shoes: pick(SHOES), umbrella: pick(["#1f2c44", "#1f2c44", "#8a2f2f", "#2b2f36"]) };
}
export const PRESETS = [
  { skin: "#e3b591", hair: "#2a1d17", top: "#1f2a3c", bottom: "#2a2d35", shoes: "#141518" },
  { skin: "#a06a45", hair: "#1d1512", top: "#c7a26a", bottom: "#3a4656", shoes: "#e7dccb" },
  { skin: "#f1c9a5", hair: "#a3784a", top: "#7d3a2e", bottom: "#1f2024", shoes: "#1f2024" },
  { skin: "#6e4a33", hair: "#1d1512", top: "#3e5a4a", bottom: "#6b5a48", shoes: "#2a2d35" },
  { skin: "#c68e63", hair: "#4a3020", top: "#b9b2a6", bottom: "#1f2024", shoes: "#5a3a24" },
];
export { rand };
