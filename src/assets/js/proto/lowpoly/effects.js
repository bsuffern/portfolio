// Effects layers: rain outside, drops running down the glass, steam from my cup, and the post-processing
// stack (bloom → tone mapping → finishing pass with grain, vignette and optional pixelation).
import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";
import { COLORS } from "./palette.js";
import { rand } from "./build.js";
import { WZ, MY_CUP } from "./layout.js";

export function createRain(scene, count = 4000) {
  const pos = new Float32Array(count * 6);
  for (let i = 0; i < count; i++) {
    const x = -11 + rand() * 22, y = rand() * 8, z = -3.15 - rand() * 7.5, len = 0.18 + rand() * 0.12;
    pos.set([x, y, z, x + 0.02, y + len, z], i * 6);
  }
  const geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  const m = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uColor: { value: new THREE.Color(COLORS.rain) } },
    vertexShader: `uniform float uTime; void main() { vec3 p = position; float fall = mod(uTime * 6.5, 8.0); p.y = mod(p.y - fall, 8.0) - 0.2; p.x -= 0.05 * fall; gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0); }`,
    fragmentShader: `uniform vec3 uColor; void main() { gl_FragColor = vec4(uColor, 0.35); }`,
    transparent: true, depthWrite: false,
  });
  const rain = new THREE.LineSegments(geo, m); rain.frustumCulled = false; scene.add(rain);
  return { set amount(v) { geo.setDrawRange(0, Math.round(count * v) * 2); }, update(t) { m.uniforms.uTime.value = t; } };
}

export function createGlass(scene) {
  // A faint glass pane that catches the pendants' highlights, and a canvas of drops that slide down it.
  const pane = new THREE.Mesh(new THREE.PlaneGeometry(6.4, 2.46), new THREE.MeshStandardMaterial({ color: "#8fb0c8", transparent: true, opacity: 0.07, roughness: 0.05, metalness: 0.6, depthWrite: false }));
  pane.position.set(0, 1.5, WZ + 0.02); scene.add(pane);
  const W = 1024, H = 400, c = document.createElement("canvas"); c.width = W; c.height = H;
  const g = c.getContext("2d"), tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace; tex.minFilter = THREE.LinearFilter;
  const drops = Array.from({ length: 180 }, () => ({ x: rand() * W, y: rand() * H, r: 1.5 + rand() * 3, v: 0, wait: rand() * 8 }));
  const trails = document.createElement("canvas"); trails.width = W; trails.height = H; const tg = trails.getContext("2d");
  const film = new THREE.Mesh(new THREE.PlaneGeometry(6.4, 2.46), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, toneMapped: false, opacity: 0.85 }));
  film.position.set(0, 1.5, WZ + 0.03); scene.add(film);
  return {
    set amount(v) { film.visible = v > 0.02; film.material.opacity = 0.85 * Math.min(1, v * 1.4); },
    update(dt) {
      tg.globalCompositeOperation = "destination-out"; tg.fillStyle = `rgba(0,0,0,${Math.min(1, dt * 0.25)})`; tg.fillRect(0, 0, W, H);
      tg.globalCompositeOperation = "source-over";
      g.clearRect(0, 0, W, H); g.drawImage(trails, 0, 0);
      for (const d of drops) {
        if ((d.wait -= dt) < 0) {
          d.v = Math.min(d.v + 160 * dt, 90); const y0 = d.y; d.y += d.v * dt; d.x += Math.sin(d.y * 0.05) * 0.3;
          tg.strokeStyle = "rgba(190,215,235,0.28)"; tg.lineWidth = d.r * 0.7; tg.beginPath(); tg.moveTo(d.x, y0); tg.lineTo(d.x, d.y); tg.stroke();
          if (rand() < dt * 0.7) { d.v = 0; d.wait = 1 + rand() * 6; }
        }
        if (d.y > H + 5) { d.y = -5 - rand() * 40; d.x = rand() * W; d.v = 0; d.wait = rand() * 4; }
        g.fillStyle = "rgba(200,222,240,0.45)"; g.beginPath(); g.ellipse(d.x, d.y, d.r * 0.8, d.r, 0, 0, Math.PI * 2); g.fill();
        g.fillStyle = "rgba(255,255,255,0.55)"; g.beginPath(); g.arc(d.x - d.r * 0.25, d.y - d.r * 0.35, d.r * 0.3, 0, Math.PI * 2); g.fill();
      }
      tex.needsUpdate = true;
    },
  };
}

export function createSteam(scene) {
  const puffs = Array.from({ length: 12 }, (_, i) => {
    const m = new THREE.Mesh(new THREE.IcosahedronGeometry(0.009, 0), new THREE.MeshBasicMaterial({ color: COLORS.cream, transparent: true, depthWrite: false, toneMapped: false }));
    m.userData = { age: (i / 12) * 3, s: rand() * 6 }; scene.add(m); return m;
  });
  return {
    update(dt) {
      for (const m of puffs) {
        const u = m.userData; u.age += dt; if (u.age > 3) { u.age = 0; u.s = rand() * 6; }
        const k = u.age / 3;
        m.position.set(MY_CUP[0] + Math.sin(u.age * 1.7 + u.s) * 0.03 * (1 + u.age), MY_CUP[1] + 0.12 + u.age * 0.11, MY_CUP[2] + Math.cos(u.age * 1.2 + u.s) * 0.02);
        m.scale.setScalar(0.7 + k * 1.6); m.rotation.y = u.age; m.material.opacity = Math.sin(Math.PI * k) * 0.12;
      }
    },
  };
}

const FINISH = {
  uniforms: { tDiffuse: { value: null }, uRes: { value: new THREE.Vector2(1, 1) }, uPixel: { value: 1 }, uGrain: { value: 0.05 }, uVignette: { value: 0.35 }, uTime: { value: 0 } },
  vertexShader: `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: `
    uniform sampler2D tDiffuse; uniform vec2 uRes; uniform float uPixel, uGrain, uVignette, uTime; varying vec2 vUv;
    float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
    void main() {
      vec2 uv = vUv;
      if (uPixel > 1.0) { vec2 cell = uRes / uPixel; uv = (floor(uv * cell) + 0.5) / cell; }
      vec3 c = texture2D(tDiffuse, uv).rgb;
      c += (hash(gl_FragCoord.xy + fract(uTime) * 100.0) - 0.5) * uGrain;
      vec2 v = vUv - 0.5; c *= 1.0 - dot(v, v) * uVignette * 2.0;
      gl_FragColor = vec4(c, 1.0);
    }`,
};

export function createPost(renderer, scene, camera) {
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.6, 0.55, 0.82);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());
  const finish = new ShaderPass(FINISH);
  composer.addPass(finish);
  return {
    composer, bloom, finish,
    setSize(w, h, dpr) { composer.setPixelRatio(dpr); composer.setSize(w, h); finish.uniforms.uRes.value.set(w * dpr, h * dpr); },
    render(t) { finish.uniforms.uTime.value = t; composer.render(); },
  };
}
