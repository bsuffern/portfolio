// Lighting: warm inside, cold outside. Each group has a base intensity so the "warmth" and "cold" dials
// scale it without losing the balance.
import * as THREE from "three";
import { COLORS } from "./palette.js";
import { PENDANTS, STREETLAMPS } from "./layout.js";

export function createLights(scene) {
  const warm = [], cold = [], shadowed = [];
  const add = (light, list, base) => { light.userData.base = base; light.intensity = base; list.push(light); scene.add(light); if (light.target) scene.add(light.target); return light; };

  // Pendants: a shadow-casting spot pointing down, plus a soft point for spill.
  for (const [x, y, z] of PENDANTS) {
    const spot = add(new THREE.SpotLight("#ffb46a", 0, 7, 1.05, 0.65, 1.4), warm, 9);
    spot.position.set(x, y - 0.06, z); spot.target.position.set(x, 0, z + 0.1);
    spot.castShadow = true; spot.shadow.mapSize.set(512, 512); spot.shadow.bias = -0.002; spot.shadow.radius = 3;
    shadowed.push(spot);
    const spill = add(new THREE.PointLight("#ffbe7a", 0, 4.5, 1.6), warm, 1.6);
    spill.position.set(x, y + 0.05, z);
  }
  // Warm fill for the room, and the glow from the counter through the doorway.
  const fill = add(new THREE.PointLight("#ffc48a", 0, 11, 1.2), warm, 2.6); fill.position.set(0.5, 2.8, 0.8);
  const door = add(new THREE.PointLight("#ffb060", 0, 4, 1.4), warm, 3.0); door.position.set(-4.1, 2.0, -1.2);
  const corner = add(new THREE.PointLight("#ffcf9a", 0, 3, 1.5), warm, 0.9); corner.position.set(2.4, 1.6, 1.6);
  // Outside: cold sky light and street lamps; the shop windows across the road.
  const sky = add(new THREE.HemisphereLight("#5f7f9c", "#141c26", 0), cold, 0.9);
  for (const p of STREETLAMPS) { const l = add(new THREE.PointLight("#cfe4ff", 0, 11, 1.4), cold, 9); l.position.set(p[0] + 0.45, p[1] - 0.25, p[2]); }
  for (const [x, c] of [[-2.0, "#f0b867"], [2.6, "#a9cfe6"]]) { const l = add(new THREE.PointLight(c, 0, 5, 1.5), cold, 2.5); l.position.set(x, 1.2, -9.2); }
  const moon = add(new THREE.DirectionalLight("#7f9ab8", 0), cold, 0.35); moon.position.set(-4, 10, -14);

  return {
    setWarmth(v) { for (const l of warm) l.intensity = l.userData.base * v; },
    setCold(v) { for (const l of cold) l.intensity = l.userData.base * v; },
    setShadows(on) { for (const l of shadowed) l.castShadow = on; },
    sky, colors: COLORS,
  };
}
