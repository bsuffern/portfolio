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
  headR: 0.105,
};

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
  add(new THREE.IcosahedronGeometry(B.headR, 1), "skin", J.head, 0, B.headR * 0.95, 0, [0.92, 1.1, 1]);
  const hairCap = add(new THREE.SphereGeometry(B.headR * 1.07, 8, 4, 0, Math.PI * 2, 0, Math.PI * 0.52), "hair", J.head, 0, B.headR * 1.02, -0.008);
  hairCap.rotation.x = -0.3;

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
