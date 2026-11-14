// The scene description: where everything is. Units are metres; y is up; the window wall is at z = WZ and the
// viewer's corner table is at the back right. Each function builds one layer.
import { rand, pick } from "./build.js";
import * as THREE from "three";

export const WZ = -3.0;
export const ROOM = { x0: -3.4, x1: 3.4, z1: 3.0, h: 3.2 };
export const STOOLS = [-2.4, -1.2, 0, 1.2, 2.4];
export const STOOL_Z = -2.2;
export const BAR_Y = 1.05;
export const PENDANTS = [-2.0, 0, 2.0].map((x) => [x, 2.45, -2.5]);
export const STREETLAMPS = [[-3.6, 4.1, -4.6], [4.2, 4.1, -4.6]];
export const DOOR = [-4.1, -1.4];
export const MY_CUP = [2.25, 0.78, 1.75];
export const READER_SEAT = [-0.6, 0.95];
export const SEAT_CAMERA = { pos: [2.55, 1.22, 2.35], target: [-0.9, 1.3, -3.0] };

export function buildRoom(b) {
  b.layer("room");
  // Floor planks, slightly varied.
  for (let z = -3.0; z < 3.0; z += 0.24) b.box(-0.5, -0.03, z + 0.12, 7.8, 0.06, 0.235, rand() < 0.3 ? "floorDark" : "floor", { cast: false });
  b.box(1.9, 0.003, 1.6, 2.2, 0.01, 1.6, "rug", { cast: false });
  // Window wall: kick plate, header, end columns.
  b.box(0, 0.12, WZ, 6.8, 0.24, 0.15, "wallShade");
  b.box(0, 2.98, WZ, 6.8, 0.44, 0.15, "wall");
  b.box(-3.3, 1.6, WZ, 0.2, 3.2, 0.15, "wall");
  b.box(3.3, 1.6, WZ, 0.2, 3.2, 0.15, "wall");
  // Left wall with a doorway to the counter (warm, glimpsed), menu board, shelf of cups.
  b.box(ROOM.x0, 1.6, -2.5, 0.12, 3.2, 1.0, "wall");
  b.box(ROOM.x0, 1.6, 1.1, 0.12, 3.2, 3.8, "wall");
  b.box(ROOM.x0, 2.75, -1.4, 0.12, 0.9, 1.2, "wall");
  b.box(-4.6, 1.4, -1.4, 0.1, 2.8, 2.0, "wallShade");
  b.box(-4.2, 0.5, -0.9, 0.7, 1.0, 0.5, "woodDark");
  b.box(-4.2, 1.02, -0.9, 0.74, 0.04, 0.54, "wood");
  b.box(-4.0, -0.03, -1.4, 1.2, 0.06, 2.0, "floor", { cast: false });
  b.box(ROOM.x0 + 0.08, 1.92, 1.15, 0.04, 0.8, 1.5, "menu");
  for (let i = 0; i < 7; i++) b.box(ROOM.x0 + 0.105, 2.2 - i * 0.09, 0.75 + rand() * 0.15, 0.01, 0.025, 0.3 + rand() * 0.5, "chalk", { cast: false });
  b.box(ROOM.x0 + 0.15, 1.3, 1.2, 0.2, 0.035, 1.2, "wood");
  for (let i = 0; i < 6; i++) b.cyl(ROOM.x0 + 0.15, 1.36, 0.7 + i * 0.2, 0.04, 0.08, i % 3 ? "cup" : "pot", { seg: 7 });
}

export function buildBar(b) {
  b.layer("bar");
  b.box(0, BAR_Y, -2.72, 6.3, 0.05, 0.5, "wood");
  for (const x of [-2.9, -1.0, 1.0, 2.9]) b.box(x, BAR_Y / 2, -2.85, 0.04, BAR_Y, 0.04, "metal");
  b.tube([[-3.1, 0.26, -2.55], [3.1, 0.26, -2.55]], 0.015, "steel", { segs: 2, seg: 5 });
  for (const x of STOOLS) {
    b.cyl(x, 0.765, STOOL_Z, 0.18, 0.04, "wood", { seg: 10 });
    for (let k = 0; k < 3; k++) {
      const a = k * 2.094 + 0.5;
      b.tube([[x + Math.cos(a) * 0.08, 0.745, STOOL_Z + Math.sin(a) * 0.08], [x + Math.cos(a) * 0.17, 0, STOOL_Z + Math.sin(a) * 0.17]], 0.012, "metal", { segs: 2 });
    }
    b.add(new THREE.TorusGeometry(0.14, 0.01, 4, 10), "steel", x, 0.3, STOOL_Z, { rot: [Math.PI / 2, 0, 0] });
  }
  // A couple of cups and a tray left on the bar.
  b.cyl(-1.75, BAR_Y + 0.06, -2.75, 0.04, 0.09, "cup", { seg: 7 });
  b.box(1.75, BAR_Y + 0.03, -2.78, 0.3, 0.015, 0.22, "woodDark");
  // Pendant lights: cord, shade (lit inside), bulb.
  for (const [x, y, z] of PENDANTS) {
    b.cyl(x, (y + 3.2) / 2 + 0.1, z, 0.006, 3.2 - y - 0.2, "metal", { seg: 4, cast: false });
    b.cone(x, y + 0.08, z, 0.2, 0.2, "lampShade", { seg: 10, open: true, mat: { side: THREE.DoubleSide }, cast: false });
    b.ico(x, y - 0.02, z, 0.055, "bulb", { detail: 1, mat: { emit: "bulb", emitI: 3 }, cast: false });
  }
}

export function buildWindow(b) {
  b.layer("window");
  for (const x of [-1.6, 0, 1.6]) b.box(x, 1.5, WZ, 0.06, 2.52, 0.08, "metal");
  b.box(0, 2.2, WZ, 6.4, 0.05, 0.08, "metal");
  b.box(0, 0.26, WZ, 6.4, 0.04, 0.1, "metal");
  b.box(0, 2.74, WZ, 6.4, 0.04, 0.1, "metal");
}

export function buildFurniture(b) {
  b.layer("furniture");
  table(b, READER_SEAT[0], 0.4);
  chair(b, READER_SEAT[0], READER_SEAT[1], 0);
  chair(b, READER_SEAT[0], -0.2, Math.PI);
  table(b, 2.3, 1.9);
  chair(b, 1.7, 2.3, 0.6);
  table(b, 0.9, -0.4);
  chair(b, 1.4, -0.4, -Math.PI / 2); chair(b, 0.4, -0.4, Math.PI / 2);
}
function table(b, x, z) {
  b.cyl(x, 0.74, z, 0.38, 0.04, "wood", { seg: 12 });
  b.cyl(x, 0.37, z, 0.035, 0.72, "metal", { seg: 6 });
  b.cyl(x, 0.015, z, 0.22, 0.03, "metal", { seg: 10 });
}
function chair(b, x, z, rot) {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = rot; b.cur.add(g);
  b.box(0, 0.46, 0, 0.42, 0.04, 0.42, "woodDark", { parent: g });
  for (const [dx, dz] of [[-0.18, -0.18], [0.18, -0.18], [-0.18, 0.18], [0.18, 0.18]]) b.box(dx, 0.22, dz, 0.03, 0.44, 0.03, "metal", { parent: g });
  b.box(0, 0.74, 0.2, 0.42, 0.4, 0.03, "woodDark", { parent: g });
}

export function buildProps(b) {
  b.layer("props");
  // Laptop on the reader's table, screen glowing.
  b.box(READER_SEAT[0], 0.77, 0.35, 0.32, 0.015, 0.22, "steel");
  b.box(READER_SEAT[0], 0.88, 0.25, 0.32, 0.2, 0.012, "screen", { rot: [-0.25, 0, 0], mat: { emit: "screen", emitI: 0.6 } });
  // My cup and a notebook.
  b.cyl(MY_CUP[0], 0.765, MY_CUP[2], 0.075, 0.01, "cup", { seg: 10 });
  b.cyl(MY_CUP[0], 0.815, MY_CUP[2], 0.045, 0.09, "cup", { seg: 8, r2: 0.04 });
  b.cyl(MY_CUP[0], 0.861, MY_CUP[2], 0.04, 0.002, "coffee", { seg: 8 });
  b.box(2.55, 0.765, 1.85, 0.22, 0.015, 0.3, "cream", { rot: [0, 0.3, 0] });
  // Tall plant in the window corner, and a smaller one by the door.
  plant(b, -2.95, -2.55, 1.6);
  plant(b, -3.05, 2.4, 1.0);
}
function plant(b, x, z, h) {
  b.cyl(x, 0.22, z, 0.2, 0.44, "pot", { seg: 8, r2: 0.16 });
  for (let i = 0; i < 14; i++) {
    const a = rand() * 6.28, y = 0.6 + rand() * (h - 0.4), r = 0.12 + rand() * 0.22;
    b.ico(x + Math.cos(a) * r, y, z + Math.sin(a) * r * 0.8, 0.12 + rand() * 0.07, rand() < 0.5 ? "plant" : "plantDark", { scale: [1.2, 0.5, 0.8], rot: [rand(), rand() * 6, rand()], jitter: 0.03 });
  }
}

export function buildCutaway(b) {
  b.layer("cutaway"); // hidden in the diorama view
  b.box(ROOM.x1, 1.6, 0, 0.12, 3.2, 6.0, "wall");
  b.box(-0.5, ROOM.h + 0.05, 0, 7.8, 0.1, 6.0, "ceiling");
  for (const z of [-2.0, -0.5, 1.0, 2.5]) b.box(-0.5, ROOM.h - 0.08, z, 7.8, 0.14, 0.14, "woodDark");
}

export function buildOutsideNear(b) {
  b.layer("outsideNear");
  b.box(0, -0.06, -3.9, 24, 0.12, 1.8, "kerb", { cast: false });
  b.box(0, -0.1, -6.6, 24, 0.1, 3.6, "street", { cast: false, mat: { rough: 0.25, metal: 0.2 } });
  b.box(0, -0.06, -9.0, 24, 0.12, 1.2, "kerb", { cast: false });
  for (const x of [-6, -3, 0, 3, 6]) b.box(x, -0.045, -6.6, 1.2, 0.01, 0.1, "chalk", { cast: false });
  for (const p of STREETLAMPS) {
    b.cyl(p[0], p[1] / 2, p[2], 0.05, p[1], "metal", { seg: 6 });
    b.box(p[0] + 0.25, p[1], p[2], 0.6, 0.06, 0.12, "metal");
    b.box(p[0] + 0.45, p[1] - 0.05, p[2], 0.25, 0.03, 0.1, "lampCold", { mat: { emit: "lampCold", emitI: 3 } });
  }
  tree(b, 0.8, -4.5); tree(b, -6.5, -4.5); tree(b, 7.5, -4.5);
}
function tree(b, x, z) {
  b.cyl(x, 1.1, z, 0.07, 2.2, "tree", { seg: 5, r2: 0.1 });
  for (let i = 0; i < 8; i++) {
    const a = rand() * 6.28, y = 1.7 + rand() * 1.2, L = 0.6 + rand() * 0.8;
    b.tube([[x, y, z], [x + Math.cos(a) * L * 0.5, y + 0.4, z + Math.sin(a) * L * 0.3], [x + Math.cos(a) * L, y + 0.7 + rand() * 0.5, z + Math.sin(a) * L * 0.5]], 0.025, "tree", { segs: 4 });
  }
}

export function buildOutsideFar(b) {
  b.layer("outsideFar");
  const windows = [];
  for (let x = -12; x < 12;) {
    const w = 2.4 + rand() * 1.8, h = 5 + rand() * 5;
    b.box(x + w / 2, h / 2, -10.2, w, h, 0.8, pick(["building1", "building2", "building3"]), { cast: false });
    b.box(x + w / 2, h + 0.08, -10.2, w + 0.1, 0.16, 0.9, "buildingFar", { cast: false });
    for (let wy = 3.2; wy < h - 0.8; wy += 1.3) for (let wx = x + 0.45; wx < x + w - 0.6; wx += 0.9) {
      const r = rand();
      windows.push({ x: wx + 0.25, y: wy + 0.35, kind: r < 0.28 ? "winCold" : r < 0.4 ? "winWarm" : "winOff" });
    }
    x += w + 0.1;
  }
  for (const w of windows) b.plane(w.x, w.y, -9.79, 0.5, 0.7, w.kind, { cast: false, receive: false, mat: w.kind === "winOff" ? {} : { emit: w.kind, emitI: 1.4 } });
  // Bakery (warm) and a corner store (cold) at street level, with an awning.
  for (const [x, kind] of [[-2.0, "winWarm"], [2.6, "winCold"]]) b.plane(x, 1.0, -9.78, 2.2, 1.6, kind, { cast: false, receive: false, mat: { emit: kind, emitI: 1.6 } });
  b.box(-2.0, 2.0, -9.5, 2.6, 0.06, 0.8, "awning", { rot: [0.25, 0, 0], cast: false });
  // Distant skyline in the fog.
  for (let x = -18; x < 18;) { const w = 3 + rand() * 4, h = 9 + rand() * 9; b.box(x + w / 2, h / 2, -16, w, h, 1, "buildingFar", { cast: false, receive: false }); x += w + 0.6; }
}
