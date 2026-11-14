// Colours and materials. Every surface in the scene asks for a material by colour name, so the whole look
// can be re-tuned here. Materials are cached and shared.
import * as THREE from "three";

export const COLORS = {
  // Outside: cold
  sky: "#0b1320", fog: "#1f3448", kerb: "#4a5a6b", street: "#18222e", building1: "#2c3e52", building2: "#24364a",
  building3: "#34495e", buildingFar: "#1a2838", winCold: "#a9cfe6", winWarm: "#f0b867", winOff: "#152030", lampCold: "#e6f4ff",
  tree: "#26312f", awning: "#8e3b30", rain: "#9fb6c8",
  // Inside: warm
  wall: "#b8937a", wallShade: "#6d5442", ceiling: "#5a4334", floor: "#8a5b3a", floorDark: "#6a4329", wood: "#b47a46",
  woodDark: "#6b4429", metal: "#25272c", steel: "#8a9097", cream: "#efe2cb", cup: "#f6efe4", coffee: "#3b2416",
  lampShade: "#2c2f2a", bulb: "#ffd9a0", plant: "#557a40", plantDark: "#34522c", pot: "#c96f45", menu: "#2a2d31",
  chalk: "#e9e4d6", screen: "#cfe6f2", rug: "#7a3b2e",
  // People and cars
  skin1: "#e3b591", skin2: "#b07a52", skin3: "#6e4a33", hair1: "#2a1d17", hair2: "#6b4a2e", hair3: "#b8a48a",
  coatA: "#2f4060", coatB: "#7d3a2e", coatC: "#c7a26a", coatD: "#3e5a4a", coatE: "#b9b2a6", pants: "#2a2d35", shoe: "#141518",
  umbrella: "#1f2c44", umbrella2: "#8a2f2f", car1: "#3a4656", car2: "#6b2e2a", car3: "#c9c2b4", carDark: "#14181e",
  headlight: "#fff6e0", tail: "#ff4a3a",
};

const cache = new Map();
// o: { emit: colourName, emitI, rough, metal, opacity, side }
export function mat(name, o = {}) {
  const key = name + JSON.stringify(o);
  if (cache.has(key)) return cache.get(key);
  const m = new THREE.MeshStandardMaterial({
    color: COLORS[name] ?? name,
    flatShading: true,
    roughness: o.rough ?? 0.85,
    metalness: o.metal ?? 0,
    emissive: o.emit ? new THREE.Color(COLORS[o.emit] ?? o.emit) : new THREE.Color(0),
    emissiveIntensity: o.emitI ?? 1,
    transparent: o.opacity != null,
    opacity: o.opacity ?? 1,
    side: o.side ?? THREE.FrontSide,
  });
  cache.set(key, m);
  return m;
}
