// The style pass: the last full-screen step of the post stack, where the whole scene gets its look.
// A style is a set of numbers for one shader; set(name, amount) blends from the plain look ("none") to that
// style, so every style can be faded in and every number can go on a slider.
// To add a style: add an entry to STYLES. To add a new kind of effect: add a uniform, use it in the shader,
// and give it a "none" value that does nothing.
import * as THREE from "three";
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";

const C = (h) => new THREE.Color(h);
export const STYLES = {
  // Plain: only grain and vignette, as before.
  none: { pixel: 1, wave: 0, aberration: 0, saturation: 1, mapMix: 0, map: ["#000000", "#555555", "#aaaaaa", "#ffffff"], posterize: 0, scanlines: 0, grain: 0.05, vignette: 0.35 },
  // A first sketch toward the brief: 80s neon, chunky pixels, a VHS/CRT feel, a slow woozy wave.
  neonVHS: { pixel: 3, wave: 1, aberration: 1, saturation: 1.5, mapMix: 0.55, map: ["#12062a", "#5a1a7a", "#ff2f8f", "#ffd36b"], posterize: 7, scanlines: 0.6, grain: 0.08, vignette: 0.7 },
};

const shader = {
  uniforms: {
    tDiffuse: { value: null }, uRes: { value: new THREE.Vector2(1, 1) }, uTime: { value: 0 },
    uPixel: { value: 1 }, uWave: { value: 0 }, uAberration: { value: 0 }, uSaturation: { value: 1 },
    uMapMix: { value: 0 }, uMap: { value: [C("#000"), C("#555"), C("#aaa"), C("#fff")] }, uPosterize: { value: 0 },
    uScan: { value: 0 }, uGrain: { value: 0.05 }, uVignette: { value: 0.35 },
  },
  vertexShader: `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: `
    uniform sampler2D tDiffuse; uniform vec2 uRes; uniform float uTime;
    uniform float uPixel, uWave, uAberration, uSaturation, uMapMix, uPosterize, uScan, uGrain, uVignette;
    uniform vec3 uMap[4];
    varying vec2 vUv;
    float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
    vec3 gradientMap(float l) {
      return l < 0.333 ? mix(uMap[0], uMap[1], l / 0.333) : l < 0.666 ? mix(uMap[1], uMap[2], (l - 0.333) / 0.333) : mix(uMap[2], uMap[3], (l - 0.666) / 0.334);
    }
    void main() {
      vec2 uv = vUv;
      uv.x += sin(uv.y * 9.0 + uTime * 1.3) * 0.004 * uWave;
      uv.y += sin(uv.x * 7.0 - uTime * 0.9) * 0.002 * uWave;
      if (uPixel > 1.0) { vec2 cell = uRes / uPixel; uv = (floor(uv * cell) + 0.5) / cell; }
      vec2 dir = (uv - 0.5) * uAberration * 0.012;
      vec3 c = vec3(texture2D(tDiffuse, uv + dir).r, texture2D(tDiffuse, uv).g, texture2D(tDiffuse, uv - dir).b);
      float l = dot(c, vec3(0.299, 0.587, 0.114));
      c = mix(vec3(l), c, uSaturation);
      c = mix(c, gradientMap(clamp(l, 0.0, 1.0)) + c * 0.35, uMapMix);
      if (uPosterize > 1.0) c = floor(c * uPosterize + 0.5) / uPosterize;
      c *= 1.0 - uScan * 0.3 * (0.5 + 0.5 * sin(gl_FragCoord.y * 3.14159 / max(1.0, uPixel * 0.5)));
      c += (hash(gl_FragCoord.xy + fract(uTime) * 100.0) - 0.5) * uGrain;
      vec2 v = vUv - 0.5; c *= 1.0 - dot(v, v) * uVignette * 2.0;
      gl_FragColor = vec4(clamp(c, 0.0, 1.0), 1.0);
    }`,
};

export function createStylePass() {
  const pass = new ShaderPass(shader), u = pass.uniforms;
  return {
    pass,
    // Blend from "none" to the named style; base lets the page's own sliders set the plain values.
    set(name = "none", amount = 1, base = {}) {
      const a = { ...STYLES.none, ...base }, b = STYLES[name] || a, k = name === "none" ? 0 : amount;
      const mix = (key) => a[key] + (b[key] - a[key]) * k;
      u.uPixel.value = Math.max(a.pixel, Math.round(mix("pixel"))) * (base.dpr || 1);
      u.uWave.value = mix("wave"); u.uAberration.value = mix("aberration"); u.uSaturation.value = mix("saturation");
      u.uMapMix.value = mix("mapMix"); u.uPosterize.value = k > 0.5 ? b.posterize : a.posterize;
      u.uScan.value = mix("scanlines"); u.uGrain.value = mix("grain"); u.uVignette.value = mix("vignette");
      u.uMap.value.forEach((col, i) => col.set(b.map[i]));
    },
    setSize(w, h) { u.uRes.value.set(w, h); },
    tick(t) { u.uTime.value = t; },
  };
}
