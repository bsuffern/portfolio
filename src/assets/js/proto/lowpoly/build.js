// Low-poly builders. Shapes go into named layers (THREE.Group); static layers are merged by material at the end
// so the scene stays at a few dozen draw calls.
import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { mat } from "./palette.js";

let seed = 7;
export const rand = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
export const pick = (a) => a[Math.floor(rand() * a.length)];

// Nudge vertices for an organic, hand-made feel. Shared positions move together so faces stay closed.
export function jitter(geo, amount) {
  const p = geo.attributes.position, moved = new Map();
  for (let i = 0; i < p.count; i++) {
    const key = `${p.getX(i).toFixed(3)},${p.getY(i).toFixed(3)},${p.getZ(i).toFixed(3)}`;
    if (!moved.has(key)) moved.set(key, [(rand() - 0.5) * amount, (rand() - 0.5) * amount, (rand() - 0.5) * amount]);
    const d = moved.get(key);
    p.setXYZ(i, p.getX(i) + d[0], p.getY(i) + d[1], p.getZ(i) + d[2]);
  }
  geo.computeVertexNormals();
  return geo;
}

export class Builder {
  constructor(root) { this.root = root; this.layers = {}; this.cur = null; }
  layer(name) {
    if (!this.layers[name]) { const g = new THREE.Group(); g.name = name; this.root.add(g); this.layers[name] = g; }
    this.cur = this.layers[name];
    return this;
  }
  // o: { mat: material options, rot: [x,y,z], scale: [x,y,z], cast, receive, parent, jitter }
  add(geo, m, x, y, z, o = {}) {
    if (o.jitter) jitter(geo, o.jitter);
    const mesh = new THREE.Mesh(geo, typeof m === "string" ? mat(m, o.mat) : m);
    mesh.position.set(x, y, z);
    if (o.rot) mesh.rotation.set(...o.rot);
    if (o.scale) mesh.scale.set(...o.scale);
    mesh.castShadow = o.cast ?? true;
    mesh.receiveShadow = o.receive ?? true;
    (o.parent || this.cur).add(mesh);
    return mesh;
  }
  box(x, y, z, w, h, d, m, o) { return this.add(new THREE.BoxGeometry(w, h, d), m, x, y, z, o); }
  cyl(x, y, z, r, h, m, o = {}) { return this.add(new THREE.CylinderGeometry(r, o.r2 ?? r, h, o.seg ?? 8, 1, o.open ?? false), m, x, y, z, o); }
  cone(x, y, z, r, h, m, o = {}) { return this.add(new THREE.ConeGeometry(r, h, o.seg ?? 8, 1, o.open ?? false), m, x, y, z, o); }
  ico(x, y, z, r, m, o = {}) { return this.add(new THREE.IcosahedronGeometry(r, o.detail ?? 0), m, x, y, z, o); }
  plane(x, y, z, w, h, m, o) { return this.add(new THREE.PlaneGeometry(w, h), m, x, y, z, o); }
  tube(points, r, m, o = {}) { // a thin low-poly tube through points (pipes, branches, wires)
    const curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)));
    return this.add(new THREE.TubeGeometry(curve, o.segs ?? points.length * 4, r, o.seg ?? 4, false), m, 0, 0, 0, o);
  }

  // Merge every mesh in a layer that shares a material into one mesh.
  merge(name) {
    const layer = this.layers[name];
    if (!layer) return;
    layer.updateMatrixWorld(true);
    const groups = new Map();
    for (const mesh of [...layer.children]) {
      if (!mesh.isMesh) continue;
      const g = mesh.geometry.index ? mesh.geometry.toNonIndexed() : mesh.geometry.clone();
      g.applyMatrix4(mesh.matrix);
      for (const k of Object.keys(g.attributes)) if (!["position", "normal", "uv"].includes(k)) g.deleteAttribute(k);
      if (!g.attributes.uv) g.setAttribute("uv", new THREE.Float32BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
      const key = mesh.material.uuid + (mesh.castShadow ? "c" : "") + (mesh.receiveShadow ? "r" : "");
      if (!groups.has(key)) groups.set(key, { m: mesh.material, cast: mesh.castShadow, receive: mesh.receiveShadow, geos: [] });
      groups.get(key).geos.push(g);
      layer.remove(mesh);
      mesh.geometry.dispose();
    }
    for (const { m, cast, receive, geos } of groups.values()) {
      const merged = new THREE.Mesh(mergeGeometries(geos), m);
      merged.castShadow = cast; merged.receiveShadow = receive;
      layer.add(merged);
    }
  }
}
