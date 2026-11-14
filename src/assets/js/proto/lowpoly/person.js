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

export const BODY = {
  legLen: 0.98,     // hip height when standing
  legR: 0.042,      // leg thickness
  torsoH: 0.52,
  shoulderW: 0.42,  // across the shoulders
  waistW: 0.24,     // across the waist
  depth: 0.5,       // torso depth relative to its width
  armLen: 0.58,
  armR: 0.032,
  headW: 0.15,      // the head is a long rectangle: width,
  headH: 0.27,      // height,
  headD: 0.17,      // depth,
  jaw: 0.82,        // jaw width as a fraction of the cheeks
  // Face: each 0..1-ish, varied per person.
  nose: 1, chin: 0.5, brow: 0.5, cheek: 0.5, ears: 1, browTilt: 0, hair: "crop",
};

// Every person shares the style but gets their own body: taller or shorter, broader or slighter, a longer or wider
// head, and a slight posture of their own. amount 0 = all identical, 1 = full variety.
export function varyBody(base = BODY, amount = 0.6, r = rand) {
  const v = (spread) => 1 + (r() * 2 - 1) * spread * amount;
  const height = v(0.12), build = v(0.22);
  return {
    ...base,
    legLen: base.legLen * height * v(0.03), torsoH: base.torsoH * height * v(0.05), armLen: base.armLen * height * v(0.03),
    shoulderW: base.shoulderW * build * v(0.06), waistW: base.waistW * build * v(0.2), depth: base.depth * v(0.12),
    legR: base.legR * build * v(0.15), armR: base.armR * build * v(0.12),
    headW: base.headW * v(0.12), headH: base.headH * v(0.15), headD: base.headD * v(0.08), jaw: Math.min(1, base.jaw * v(0.1)),
    nose: base.nose * v(0.35), chin: clamp01(base.chin + (r() - 0.5) * amount), brow: clamp01(base.brow + (r() - 0.5) * amount),
    cheek: clamp01(base.cheek + (r() - 0.5) * amount), ears: base.ears * v(0.25), browTilt: (r() - 0.5) * 0.5 * amount,
    hair: amount > 0 ? ["crop", "crop", "fringe", "volume", "short"][Math.floor(r() * 5)] : base.hair,
    posture: { spine: [(r() - 0.4) * 0.12 * amount, 0, (r() - 0.5) * 0.04 * amount], neck: [(r() - 0.5) * 0.18 * amount, 0, (r() - 0.5) * 0.08 * amount] },
    pace: v(0.1),
  };
}

export function createPerson(colors = randomColors(), body = {}) {
  const B = { ...BODY, ...body }, C = colors;
  const mats = {};
  const derived = { eyes: "#17110e", lips: new THREE.Color(C.skin).multiplyScalar(0.72) };
  const mat = (slot) => (mats[slot] ||= new THREE.MeshStandardMaterial({ color: C[slot] ?? derived[slot], flatShading: true, roughness: 0.85 }));
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
  buildHead(add, J.head, B, C);

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
    paint(slot, color) { C[slot] = color; mats[slot]?.color.set(color); if (slot === "skin") mats.lips?.color.set(color).multiplyScalar(0.72); },
    dispose() { root.traverse((x) => { x.geometry?.dispose(); if (x.material && !Object.values(mats).includes(x.material)) x.material.dispose(); }); Object.values(mats).forEach((m) => m.dispose()); },
  };
}

const clamp01 = (v) => Math.max(0, Math.min(1, v));

// ---------- Head ----------
// A long face, sculpted from a subdivided box: rounded skull, brow ridge, cheekbones, tapering jaw, chin.
// Features are separate low-poly pieces so they stay crisp: wedge nose, ears, eyes, brows, mouth.
function buildHead(add, head, B, C) {
  const w = B.headW, h = B.headH, d = B.headD, cy = h / 2 - 0.01;
  const g = new THREE.BoxGeometry(w, h, d, 4, 6, 3), p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    let x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const u = x / (w / 2), v = y / (h / 2), s = z / (d / 2);
    if (v < 0) x *= 1 + (B.jaw - 1) * Math.min(1, -v * 1.3);                                // jaw narrows downward
    if (Math.abs(v) < 0.25 && Math.abs(u) > 0.9) x *= 1 + B.cheek * 0.07;                   // cheekbones
    if (v > 0.6) { const k = (v - 0.6) / 0.4; x *= 1 - 0.16 * k; z *= 1 - 0.12 * k; }        // crown rounds off
    if (s < -0.5) { x *= 1 - 0.1 * Math.abs(u) ** 2; y *= v > 0 ? 1.02 : 0.97; }            // back of the skull
    if (s > 0.9 && v > 0.2 && v < 0.5) z += B.brow * 0.012;                                 // brow ridge
    if (s > 0.9 && v < -0.75) z += (B.chin - 0.3) * 0.025;                                  // chin
    if (s > 0.9 && v > -0.2 && v < 0.2 && Math.abs(u) > 0.3 && Math.abs(u) < 0.7) z -= 0.006; // eye sockets
    if (s > 0.5 && Math.abs(u) > 0.9 && v < 0) z *= 0.9;                                    // face narrows at the sides
    p.setXYZ(i, x, y, z);
  }
  g.computeVertexNormals();
  add(g, "skin", head, 0, cy, 0.005);
  const front = d / 2 + 0.005;
  // Nose: a three-sided wedge pointing forward and a little down.
  const nl = h * 0.25 * B.nose, nw = w * 0.13 * Math.sqrt(B.nose);
  const nose = new THREE.ConeGeometry(nw, nl, 3, 1); nose.rotateX(Math.PI / 2 + 0.5); nose.rotateZ(Math.PI);
  add(nose, "skin", head, 0, cy - h * 0.04, front + nl * 0.28);
  // Ears.
  for (const sx of [-1, 1]) add(new THREE.BoxGeometry(0.018, h * 0.2 * B.ears, d * 0.24), "skin", head, sx * (w / 2 * (1 + B.cheek * 0.05) + 0.004), cy + h * 0.02, -d * 0.05);
  // Eyes and brows; the brow angle reads as expression.
  for (const sx of [-1, 1]) {
    add(new THREE.BoxGeometry(w * 0.16, h * 0.035, 0.008), "eyes", head, sx * w * 0.22, cy + h * 0.07, front - 0.004);
    const brow = add(new THREE.BoxGeometry(w * 0.24, h * 0.032, 0.016), "hair", head, sx * w * 0.22, cy + h * 0.15, front + B.brow * 0.008);
    brow.rotation.z = sx * B.browTilt;
  }
  add(new THREE.BoxGeometry(w * 0.32, h * 0.025, 0.008), "lips", head, 0, cy - h * 0.25, front - 0.002 + (B.chin - 0.3) * 0.01);
  // Hair.
  const style = B.hair;
  if (style !== "short") add(new THREE.BoxGeometry(w * 0.98, h * (style === "volume" ? 0.3 : 0.17), d * 0.98), "hair", head, 0, h * (style === "volume" ? 0.98 : 0.93), -0.004);
  else add(new THREE.BoxGeometry(w * 0.9, h * 0.06, d * 0.9), "hair", head, 0, h * 0.97, -0.004);
  if (style !== "short") add(new THREE.BoxGeometry(w * 1.04, h * 0.6, d * 0.2), "hair", head, 0, h * 0.62, -d * 0.45);
  if (style === "fringe") add(new THREE.BoxGeometry(w * 0.85, h * 0.12, d * 0.12), "hair", head, -w * 0.06, h * 0.84, d * 0.44);
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
