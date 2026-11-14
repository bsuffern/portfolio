import * as THREE from "three";
// Animation for the person model. A pose is { joint: [rx, ry, rz], hipsY?: metres }. A clip is a few poses on a
// timeline. An Animator plays one full-body clip on the "base" layer and blends upper-body or head clips on top
// ("arms", "head" layers), crossfading whenever a layer changes clip.
//
//   const anim = new Animator(person);
//   anim.play("base", "walk");            // full body
//   anim.play("arms", "holdCup");         // overrides just the right arm
//   anim.play("arms", "sip", { then: "holdCup" });   // one-shot, then back
//   anim.update(dt);
//
// Adding a clip: write its key poses in clips() below. Joints missing from a key stay at rest (0).

const MASKS = {
  base: null, // all joints
  arms: ["shoulderR", "elbowR", "handR", "shoulderL", "elbowL", "handL"],
  armR: ["shoulderR", "elbowR", "handR"],
  head: ["neck", "head"],
};

// Clips depend on the body (sitting height uses leg length), so they are built per person.
export function clips(B) {
  const sit = (seatH) => {
    const y = seatH + 0.02 - B.legLen;
    return { hipsY: y, hipL: [-1.42, 0.05, 0], hipR: [-1.42, -0.05, 0], kneeL: [1.5, 0, 0], kneeR: [1.5, 0, 0], spine: [0.08, 0, 0], shoulderL: [-0.35, 0, 0], elbowL: [-0.5, 0, 0], shoulderR: [-0.35, 0, 0], elbowR: [-0.5, 0, 0] };
  };
  const stand = {};
  const stride = (s) => ({ // one side forward (s = 1 left, -1 right)
    hipL: [-0.42 * s, 0, 0], hipR: [0.38 * s, 0, 0], kneeL: [s > 0 ? 0.08 : 0.3, 0, 0], kneeR: [s > 0 ? 0.3 : 0.08, 0, 0],
    shoulderL: [0.32 * s, 0, 0], shoulderR: [-0.32 * s, 0, 0], elbowL: [-0.25, 0, 0], elbowR: [-0.25, 0, 0], spine: [0.05, 0.05 * s, 0], hipsY: -0.015,
  });
  const pass = (s) => ({
    hipL: [s > 0 ? 0.05 : -0.15, 0, 0], hipR: [s > 0 ? -0.15 : 0.05, 0, 0], kneeL: [s > 0 ? 0.15 : 0.95, 0, 0], kneeR: [s > 0 ? 0.95 : 0.15, 0, 0],
    elbowL: [-0.2, 0, 0], elbowR: [-0.2, 0, 0], spine: [0.05, 0, 0], hipsY: 0.02,
  });
  return {
    idle: { dur: 4, loop: true, keys: [[0, { spine: [0.0, 0, 0] }], [2, { spine: [0.025, 0, 0.01], neck: [-0.02, 0, 0] }], [4, { spine: [0, 0, 0] }]] },
    walk: { dur: 1.0, loop: true, keys: [[0, stride(1)], [0.25, pass(1)], [0.5, stride(-1)], [0.75, pass(-1)], [1, stride(1)]] },
    sitStool: { dur: 4, loop: true, keys: [[0, sit(0.78)], [2, { ...sit(0.78), spine: [0.12, 0, 0] }], [4, sit(0.78)]] },
    sitChair: { dur: 4, loop: true, keys: [[0, sit(0.48)], [2, { ...sit(0.48), spine: [0.12, 0, 0] }], [4, sit(0.48)]] },
    sitDownStool: { dur: 0.9, keys: [[0, stand], [0.35, { ...stand, spine: [0.25, 0, 0], kneeL: [0.4, 0, 0], kneeR: [0.4, 0, 0], hipL: [-0.4, 0, 0], hipR: [-0.4, 0, 0], hipsY: -0.08 }], [0.9, sit(0.78)]] },
    standUpStool: { dur: 0.9, keys: [[0, sit(0.78)], [0.5, { spine: [0.3, 0, 0], kneeL: [0.5, 0, 0], kneeR: [0.5, 0, 0], hipL: [-0.5, 0, 0], hipR: [-0.5, 0, 0], hipsY: -0.08 }], [0.9, stand]] },
    // Arm layers.
    holdCup: { dur: 1, loop: true, mask: "armR", keys: [[0, { shoulderR: [-0.3, 0, 0.12], elbowR: [-1.35, 0, 0] }]] },
    sip: { dur: 2.4, mask: "armR", keys: [[0, { shoulderR: [-0.3, 0, 0.12], elbowR: [-1.35, 0, 0] }], [0.7, { shoulderR: [-0.75, -0.2, 0.25], elbowR: [-2.35, 0, 0] }], [1.6, { shoulderR: [-0.75, -0.2, 0.25], elbowR: [-2.35, 0, 0] }], [2.4, { shoulderR: [-0.3, 0, 0.12], elbowR: [-1.35, 0, 0] }]] },
    umbrella: { dur: 1, loop: true, mask: "armR", keys: [[0, { shoulderR: [-0.45, 0, 0.2], elbowR: [-1.75, 0, 0] }]] },
    type: { dur: 0.6, loop: true, mask: "arms", keys: [[0, { shoulderL: [-0.55, 0, -0.1], elbowL: [-1.0, 0, 0], shoulderR: [-0.55, 0, 0.1], elbowR: [-1.05, 0, 0] }], [0.3, { shoulderL: [-0.58, 0, -0.1], elbowL: [-1.05, 0, 0], shoulderR: [-0.52, 0, 0.1], elbowR: [-1.0, 0, 0] }], [0.6, { shoulderL: [-0.55, 0, -0.1], elbowL: [-1.0, 0, 0], shoulderR: [-0.55, 0, 0.1], elbowR: [-1.05, 0, 0] }]] },
    pocket: { dur: 1, loop: true, mask: "arms", keys: [[0, { shoulderL: [0.05, 0, -0.15], elbowL: [-0.2, 0, 0], shoulderR: [0.05, 0, 0.15], elbowR: [-0.2, 0, 0] }]] },
    wave: { dur: 2, mask: "armR", keys: [[0, {}], [0.4, { shoulderR: [-0.2, 0, 2.5], elbowR: [-0.6, 0, 0] }], [0.8, { shoulderR: [-0.2, 0, 2.3], elbowR: [-0.9, 0, 0] }], [1.2, { shoulderR: [-0.2, 0, 2.5], elbowR: [-0.6, 0, 0] }], [2, {}]] },
    // Head layer.
    lookAround: { dur: 9, loop: true, mask: "head", keys: [[0, { neck: [0, 0, 0] }], [2, { neck: [0, 0.45, 0] }], [3.5, { neck: [0, 0.45, 0] }], [5, { neck: [0.1, -0.2, 0] }], [7.5, { neck: [0.1, -0.25, 0] }], [9, { neck: [0, 0, 0] }]] },
    lookOutside: { dur: 6, loop: true, mask: "head", keys: [[0, { neck: [-0.08, 0, 0] }], [3, { neck: [-0.1, 0.15, 0] }], [6, { neck: [-0.08, 0, 0] }]] },
  };
}

const ease = (t) => t * t * (3 - 2 * t);
const lerp3 = (a, b, f) => [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f];
const ZERO = [0, 0, 0];
function sample(clip, t) {
  const keys = clip.keys, T = clip.loop ? ((t % clip.dur) + clip.dur) % clip.dur : Math.min(t, clip.dur);
  let i = 0; while (i < keys.length - 1 && keys[i + 1][0] <= T) i++;
  const [t0, a] = keys[i], [t1, b] = keys[Math.min(i + 1, keys.length - 1)];
  const f = t1 > t0 ? ease((T - t0) / (t1 - t0)) : 0, out = {};
  for (const j of new Set([...Object.keys(a), ...Object.keys(b)])) {
    if (j === "hipsY") out.hipsY = (a.hipsY ?? 0) + ((b.hipsY ?? 0) - (a.hipsY ?? 0)) * f;
    else out[j] = lerp3(a[j] || ZERO, b[j] || ZERO, f);
  }
  return out;
}

export class Animator {
  constructor(person) {
    this.p = person; this.clips = clips(person.body); this.layers = {}; this.speed = person.body.pace || 1;
    this.joints = Object.keys(person.J).filter((j) => j !== "hips");
    this.shown = {}; // the pose on screen last frame; every change blends from here
  }
  // opts: { fade (seconds), then (clip to play when a one-shot ends), speed (playback rate), restart }
  play(layer, name, opts = {}) {
    const L = this.layers[layer];
    if (L && L.name === name && !opts.restart) { if ("then" in opts) L.then = opts.then; return; }
    const clip = name ? this.clips[name] : null;
    if (name && !clip) throw new Error(`No clip "${name}"`);
    const mask = MASKS[clip?.mask ?? L?.mask ?? layer] ?? null;
    this.layers[layer] = { name, clip, mask: clip?.mask ?? L?.mask ?? layer, t: 0, rate: opts.speed ?? 1, then: opts.then, from: { ...this.shown }, f: 0, fade: opts.fade ?? 0.35, joints: mask };
  }
  stop(layer, opts = {}) { if (this.layers[layer]?.name) this.play(layer, null, opts); }
  playing(layer) { return this.layers[layer]?.name ?? null; }
  done(layer) { const L = this.layers[layer]; return !L?.clip || (!L.clip.loop && L.t >= L.clip.dur); }

  update(dt) {
    for (const [name, L] of Object.entries(this.layers)) {
      L.t += dt * L.rate * this.speed;
      L.f = L.fade > 0 ? Math.min(1, L.f + dt / L.fade) : 1;
      if (L.clip && !L.clip.loop && L.t >= L.clip.dur && L.then !== undefined) this.play(name, L.then, { fade: 0.3 });
    }
    // Base layer: blend from what was shown into the clip.
    const pose = {}, B = this.layers.base;
    const bp = B?.clip ? sample(B.clip, B.t) : {}, bf = B ? ease(B.f) : 1;
    for (const j of this.joints) pose[j] = lerp3(B?.from[j] || ZERO, bp[j] || ZERO, bf);
    pose.hipsY = (B?.from.hipsY ?? 0) + ((bp.hipsY ?? 0) - (B?.from.hipsY ?? 0)) * bf;
    // Overlay layers replace their joints; with no clip they blend back to the base.
    for (const layer of ["arms", "head"]) {
      const L = this.layers[layer]; if (!L || !L.joints) continue;
      const lp = L.clip ? sample(L.clip, L.t) : null, f = ease(L.f);
      if (!lp && L.f >= 1) { delete this.layers[layer]; continue; }
      for (const j of L.joints) pose[j] = lerp3(L.from[j] || pose[j], lp ? lp[j] || ZERO : pose[j], f);
    }
    const J = this.p.J, post = this.p.body.posture || {};
    for (const j of this.joints) { const v = pose[j], o = post[j]; J[j].rotation.set(v[0] + (o?.[0] || 0), v[1] + (o?.[1] || 0), v[2] + (o?.[2] || 0)); }
    J.hips.position.y = this.p.body.legLen + pose.hipsY;
    this.shown = pose;
    // Keep held props upright whatever the arm is doing.
    this.p.root.updateMatrixWorld(true);
    const rootQ = new THREE.Quaternion(), parentQ = new THREE.Quaternion();
    this.p.root.getWorldQuaternion(rootQ);
    for (const prop of Object.values(this.p.props)) { prop.parent.getWorldQuaternion(parentQ); prop.quaternion.copy(parentQ.invert().multiply(rootQ)); }
  }
}
