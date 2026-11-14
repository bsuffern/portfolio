// People and cars as small low-poly rigs. A person faces local +z; pivots sit at the hips, shoulders and knees
// so poses are just joint angles.
import * as THREE from "three";
import { mat } from "./palette.js";
import { rand, pick } from "./build.js";

const SKINS = ["skin1", "skin2", "skin3"], HAIRS = ["hair1", "hair2", "hair3", "hair1"], COATS = ["coatA", "coatB", "coatC", "coatD", "coatE"];
const mesh = (geo, m, x, y, z, parent, o = {}) => {
  const me = new THREE.Mesh(geo, typeof m === "string" ? mat(m, o.mat) : m);
  me.position.set(x, y, z); if (o.rot) me.rotation.set(...o.rot); if (o.scale) me.scale.set(...o.scale);
  me.castShadow = true; me.receiveShadow = true; parent.add(me); return me;
};

export function makePerson(scene, { umbrella = false, cup = false, coat = pick(COATS), skin = pick(SKINS), hair = pick(HAIRS), height = 0.95 + rand() * 0.1 } = {}) {
  const root = new THREE.Group(), hips = new THREE.Group();
  root.scale.setScalar(height); root.add(hips); hips.position.y = 0.92;
  mesh(new THREE.CylinderGeometry(0.17, 0.2, 0.62, 6), coat, 0, 0.3, 0, hips, { scale: [1, 1, 0.68] });
  mesh(new THREE.CylinderGeometry(0.045, 0.05, 0.08, 5), skin, 0, 0.65, 0, hips);
  mesh(new THREE.IcosahedronGeometry(0.115, 0), skin, 0, 0.78, 0, hips, { scale: [0.95, 1.08, 1] });
  mesh(new THREE.SphereGeometry(0.125, 6, 4, 0, Math.PI * 2, 0, Math.PI * 0.55), hair, 0, 0.8, -0.015, hips, { rot: [-0.35, 0, 0] });
  const limb = (x, y, r1, r2, len, role, endRole) => {
    const g = new THREE.Group(); g.position.set(x, y, 0); hips.add(g);
    mesh(new THREE.CylinderGeometry(r1, r2, len, 5), role, 0, -len / 2, 0, g);
    if (endRole) mesh(new THREE.IcosahedronGeometry(0.045, 0), endRole, 0, -len - 0.03, 0, g);
    return g;
  };
  const armL = limb(-0.235, 0.56, 0.05, 0.042, 0.56, coat, skin), armR = limb(0.235, 0.56, 0.05, 0.042, 0.56, coat, skin);
  const leg = (x) => {
    const thigh = limb(x, 0.0, 0.078, 0.065, 0.46, "pants");
    const shin = new THREE.Group(); shin.position.y = -0.46; thigh.add(shin);
    mesh(new THREE.CylinderGeometry(0.063, 0.055, 0.44, 5), "pants", 0, -0.22, 0, shin);
    mesh(new THREE.BoxGeometry(0.11, 0.07, 0.25), "shoe", 0, -0.46, 0.05, shin);
    return { thigh, shin };
  };
  const L = leg(-0.1), R = leg(0.1);
  let cupG = null, umb = null;
  if (cup) {
    cupG = new THREE.Group(); cupG.position.set(0, -0.6, 0.04); armR.add(cupG);
    mesh(new THREE.CylinderGeometry(0.042, 0.034, 0.11, 7), "cup", 0, 0, 0, cupG);
    mesh(new THREE.CylinderGeometry(0.044, 0.04, 0.04, 7), "coatC", 0, 0, 0, cupG);
  }
  if (umbrella) {
    umb = new THREE.Group(); umb.position.set(0.12, 1.12, 0.05); hips.add(umb);
    mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.75, 4), "metal", 0, -0.18, 0, umb);
    mesh(new THREE.ConeGeometry(0.58, 0.24, 8, 1, true), rand() < 0.75 ? "umbrella" : "umbrella2", 0, 0.3, 0, umb, { mat: { side: THREE.DoubleSide } });
  }
  scene.add(root);
  return { root, hips, armL, armR, L, R, cupG, umb, phase: rand() * 6, heading: 0, sipT: 3 + rand() * 6, sipping: 0 };
}

// mode "walk" uses p.phase; mode "sit" takes k from 0 (standing) to 1 (seated).
export function pose(p, mode, k = 1) {
  const { hips, armL, armR, L, R } = p;
  if (mode === "walk") {
    const s = Math.sin(p.phase);
    L.thigh.rotation.x = -s * 0.45; R.thigh.rotation.x = s * 0.45;
    L.shin.rotation.x = Math.max(0, s) * 0.7; R.shin.rotation.x = Math.max(0, -s) * 0.7;
    armL.rotation.x = s * 0.35;
    armR.rotation.x = p.cupG ? -0.9 : p.umb ? -2.6 : -s * 0.35;
    hips.position.y = 0.92 + Math.abs(Math.cos(p.phase)) * 0.025;
    hips.rotation.z = Math.sin(p.phase) * 0.02;
  } else {
    const e = k * k * (3 - 2 * k);
    L.thigh.rotation.x = R.thigh.rotation.x = -1.45 * e;
    L.shin.rotation.x = R.shin.rotation.x = 1.4 * e;
    hips.position.y = 0.92 - 0.14 * e; hips.rotation.z = 0;
    armL.rotation.x = -0.6 * e;
    const sip = p.sipping > 0 ? Math.sin(Math.min(1, p.sipping) * Math.PI) : 0;
    armR.rotation.x = p.cupG ? -0.9 - 1.3 * sip : -0.6 * e;
  }
  if (p.cupG) p.cupG.rotation.x = -armR.rotation.x;
}

export function face(p, dx, dz, dt) {
  let d = Math.atan2(dx, dz) - p.heading; d = Math.atan2(Math.sin(d), Math.cos(d));
  p.heading += d * Math.min(1, dt * 6); p.root.rotation.y = p.heading;
}

export function removeRig(scene, r) { r.root.traverse((o) => o.geometry?.dispose()); scene.remove(r.root); }

export function makeCar(scene, dir) {
  const g = new THREE.Group(), body = pick(["car1", "car2", "car3"]);
  mesh(new THREE.BoxGeometry(3.9, 0.55, 1.7), body, 0, 0.5, 0, g);
  mesh(new THREE.BoxGeometry(2.1, 0.5, 1.56), "carDark", -0.25, 1.0, 0, g, { mat: { rough: 0.3 } });
  for (const x of [-1.25, 1.25]) for (const z of [-0.8, 0.8]) mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.2, 8), "shoe", x, 0.3, z, g, { rot: [Math.PI / 2, 0, 0] });
  for (const z of [-0.6, 0.6]) {
    mesh(new THREE.BoxGeometry(0.05, 0.12, 0.3), "headlight", 1.96, 0.55, z, g, { mat: { emit: "headlight", emitI: 4 } });
    mesh(new THREE.BoxGeometry(0.05, 0.1, 0.3), "tail", -1.96, 0.55, z, g, { mat: { emit: "tail", emitI: 3 } });
  }
  g.rotation.y = dir > 0 ? 0 : Math.PI;
  scene.add(g);
  return { root: g, dir, v: 7 + rand() * 4 };
}
