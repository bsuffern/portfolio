// Behaviour: who comes in, where they sit, who walks past outside. Everyone is the shared person model
// (person.js) driven by an Animator (anim.js). update(dt, busy) runs every frame.
import { createPerson, varyBody, randomColors } from "./person.js";
import { Animator } from "./anim.js";
import { makeCar, removeRig } from "./people.js";
import { rand, pick } from "./build.js";
import { STOOLS, STOOL_Z, DOOR, READER_SEAT } from "./layout.js";

const WALK_SPEED = 1.05; // metres per second at clip rate 1

export function createLife(scene) {
  const everyone = new Set(), customers = [], walkers = [], cars = [];
  const taken = STOOLS.map(() => null);
  let nextCustomer = 4, nextWalker = 1, nextCar = 5;

  function person(colors = randomColors()) {
    const p = createPerson(colors, varyBody());
    p.anim = new Animator(p); p.heading = 0;
    scene.add(p.root); everyone.add(p);
    return p;
  }
  function remove(p) { everyone.delete(p); scene.remove(p.root); p.dispose(); }
  function face(p, dx, dz, dt) {
    let d = Math.atan2(dx, dz) - p.heading; d = Math.atan2(Math.sin(d), Math.cos(d));
    p.heading += d * Math.min(1, dt * 6); p.root.rotation.y = p.heading;
  }
  // Move along waypoints at walking pace; returns true on arrival.
  function walk(p, dt, speed) {
    const [tx, tz] = p.path[p.seg], dx = tx - p.root.position.x, dz = tz - p.root.position.z, d = Math.hypot(dx, dz);
    if (d < 0.05) { p.seg++; return p.seg >= p.path.length; }
    const step = Math.min(d, speed * dt);
    p.root.position.x += (dx / d) * step; p.root.position.z += (dz / d) * step;
    face(p, dx, dz, dt);
    return false;
  }

  function spawnCustomer(i, seated = false) {
    const p = person(), sx = STOOLS[i];
    Object.assign(p, { stool: i, seg: 0, t: 0, stay: 25 + rand() * 40, sipIn: 3 + rand() * 6, path: [[DOOR[0], DOOR[1]], [-2.9, -1.3], [sx, -1.45], [sx, STOOL_Z + 0.32]] });
    taken[i] = p; customers.push(p);
    p.show("cup"); p.anim.play("arms", "holdCup", { fade: 0 });
    if (seated) {
      p.state = "sit"; p.root.position.set(sx, 0, STOOL_Z); p.heading = Math.PI; p.root.rotation.y = Math.PI; p.t = rand() * 15;
      p.anim.play("base", "sitStool", { fade: 0 }); p.anim.play("head", "lookOutside", { fade: 0 });
    } else {
      p.state = "enter"; p.root.position.set(DOOR[0], 0, DOOR[1]);
      p.anim.play("base", "walk", { fade: 0 });
    }
  }
  function updateCustomer(p, dt) {
    if (p.state === "enter") {
      if (walk(p, dt, WALK_SPEED * p.anim.speed)) { p.state = "sitting"; p.t = 0; p.anim.play("base", "sitDownStool", { then: "sitStool", fade: 0.25 }); }
    } else if (p.state === "sitting") { // turn to the window and settle back onto the stool
      p.t += dt; face(p, 0, -1, dt * 1.5);
      p.root.position.z += (STOOL_Z - p.root.position.z) * Math.min(1, dt * 3);
      if (p.t > 1.0) { p.state = "sit"; p.t = 0; p.anim.play("head", "lookOutside"); }
    } else if (p.state === "sit") {
      p.t += dt;
      if ((p.sipIn -= dt) < 0) { p.sipIn = 6 + rand() * 9; p.anim.play("arms", "sip", { then: "holdCup", restart: true }); }
      if (p.t > p.stay) { p.state = "standing"; p.t = 0; p.anim.stop("head"); p.anim.play("base", "standUpStool", { fade: 0.2 }); }
    } else if (p.state === "standing") {
      p.t += dt;
      p.root.position.z += (STOOL_Z + 0.32 - p.root.position.z) * Math.min(1, dt * 2.5);
      if (p.t > 0.9) {
        p.state = "leave"; p.seg = 0; p.path = p.path.slice(0, -1).reverse(); taken[p.stool] = null;
        p.anim.play("base", "walk", { fade: 0.25 });
      }
    } else if (p.state === "leave") { if (walk(p, dt, WALK_SPEED * p.anim.speed)) p.done = true; }
  }

  function spawnWalker() {
    const dir = rand() < 0.5 ? 1 : -1, z = rand() < 0.25 ? -9.0 : pick([-3.55, -4.1]);
    const p = person({ ...randomColors(), top: pick(["#2f4060", "#1f2a3c", "#3e5a4a", "#2a2d35", "#7d3a2e", "#b9b2a6"]) });
    p.root.position.set(dir * -12, 0, z); p.dir = dir;
    p.heading = dir > 0 ? Math.PI / 2 : -Math.PI / 2; p.root.rotation.y = p.heading;
    p.anim.play("base", "walk", { fade: 0 });
    const r = rand();
    if (r < 0.6) { p.show("umbrella"); p.anim.play("arms", "umbrella", { fade: 0 }); }
    else if (r < 0.85) p.anim.play("arms", "pocket", { fade: 0 });
    walkers.push(p);
  }

  // Start lived-in: two at the bar, someone on a laptop.
  spawnCustomer(2, true); spawnCustomer(4, true);
  const reader = person();
  reader.root.position.set(READER_SEAT[0], 0, READER_SEAT[1]); reader.heading = Math.PI; reader.root.rotation.y = Math.PI;
  reader.anim.play("base", "sitChair", { fade: 0 }); reader.anim.play("arms", "type", { fade: 0 });

  return {
    update(dt, busy) {
      const b = Math.max(0.05, busy);
      if (busy > 0 && (nextCustomer -= dt * b) < 0) {
        nextCustomer = 12 + rand() * 18;
        const free = taken.map((s, i) => (s ? -1 : i)).filter((i) => i >= 0);
        if (free.length > 1 && customers.length < 4) spawnCustomer(pick(free));
      }
      if (busy > 0 && (nextWalker -= dt * b) < 0) { nextWalker = 3 + rand() * 6; if (walkers.length < 6) spawnWalker(); }
      if (busy > 0 && (nextCar -= dt * b) < 0) {
        nextCar = 7 + rand() * 10;
        if (cars.length < 2) { const dir = rand() < 0.5 ? 1 : -1, c = makeCar(scene, dir); c.root.position.set(dir * -18, 0, dir > 0 ? -5.6 : -7.5); cars.push(c); }
      }
      for (let i = customers.length - 1; i >= 0; i--) { const p = customers[i]; updateCustomer(p, dt); if (p.done) { remove(p); customers.splice(i, 1); } }
      for (let i = walkers.length - 1; i >= 0; i--) {
        const p = walkers[i];
        p.root.position.x += p.dir * WALK_SPEED * p.anim.speed * dt;
        if (Math.abs(p.root.position.x) > 12.5) { remove(p); walkers.splice(i, 1); }
      }
      for (let i = cars.length - 1; i >= 0; i--) { const c = cars[i]; c.root.position.x += c.dir * c.v * dt; if (Math.abs(c.root.position.x) > 19) { removeRig(scene, c); cars.splice(i, 1); } }
      for (const p of everyone) p.anim.update(dt);
    },
  };
}
