import assert from "node:assert/strict";
import { load } from "./loader.mjs";
const { tuning: T, parryGrade } = load("data"),
  { BreakMeter, attackRect, dummyRect, overlaps } = load("combat");
for (const [age, grade] of [
  [-1, "miss"],
  [0, "perfect"],
  [60, "perfect"],
  [61, "parry"],
  [180, "parry"],
  [181, "miss"],
])
  assert.equal(parryGrade(age, 180), grade);
const b = new BreakMeter();
assert.equal(b.add(28), false);
b.add(28);
b.add(28);
assert.equal(b.add(28), true);
assert.equal(b.value, 100);
assert.equal(b.damage(10), 10);
assert.equal(b.add(100), false);
b.tick(2999);
assert.equal(b.broken, true);
assert.equal(b.tick(1), true);
assert.equal(b.value, 0);
assert.equal(b.damage(10), 10);
b.add(38);
b.tick(3500);
assert.equal(b.value, 38);
b.tick(1000);
assert.equal(b.value, 32);
b.reset();
b.add(38);
b.add(38);
assert.equal(b.add(38), true);
assert.equal(overlaps(attackRect(623, 454, 1), dummyRect()), true);
assert.equal(overlaps(attackRect(621, 454, 1), dummyRect()), false);
assert.equal(overlaps(attackRect(610, 454, -1), dummyRect()), false);
assert.equal(overlaps(attackRect(887, 454, -1), dummyRect()), true);
assert.equal(overlaps(attackRect(610, 300, 1), dummyRect()), false);
const { Practice } = load("practice");
const { updateSpecial } = load("special-system");
const { snapshot } = load("game-state");
function scene() {
  const s = new Practice();
  s.started = true;
  s.x = 630;
  return s;
}
const s = scene();
s.pattern = "triple";
s.cycle = 845;
s.breakMeter.add(76);
s.parryAt = 0;
s.update({}, 10);
assert.equal(s.breakMeter.broken, true);
assert.equal(s.success, 1);
const hp = s.hp;
assert.equal(s.resolved.size, 3);
s.freeze = 0;
for (let i = 0; i < 70; i++) s.update({}, 20);
assert.equal(s.hp, hp);
s.breakMeter.remaining = 1;
s.update({}, 10);
assert.equal(s.breakMeter.broken, false);
assert(s.cycle < 0);
assert.equal(s.resolved.size, 0);
const a = scene();
a.debug.stopAI = true;
a.clock = 100;
a.attackAt = 35;
a.update({}, 10);
assert.equal(a.dummyHP, 90);
a.freeze = 0;
a.update({}, 10);
assert.equal(a.dummyHP, 90);
a.breakMeter.add(100);
a.attackAt = a.clock;
a.attackHit = false;
a.clock += 70;
a.update({}, 10);
assert.equal(a.dummyHP, 80);
a.reset(true);
assert.equal(a.breakMeter.value, 0);
assert.equal(a.breakMeter.broken, false);
assert.equal(a.dummyHP, 100);
console.log(
  "PASS: parry boundaries; normal/perfect BREAK thresholds; duration, decay and damage; attack reach/facing/height; triple interruption and fresh recovery; one hit per swing; reset.",
);

const { Flower } = load("flower");
const f = new Flower();
f.absorb("fertilizer");
assert.equal(f.stage, 0);
assert.equal(f.damage(10), 12);
for (let i = 0; i < 1; i++) f.absorb("water");
assert.equal(f.stage, 1);
for (let i = 0; i < 10; i++) f.absorb("water");
assert.equal(f.water, 3);
assert.equal(f.stage, 3);
f.setStage(-1);
assert.equal(f.stage, 3);
const w = scene();
w.debug.stopAI = false;
w.parryAt = 0;
w.projectiles = [{ x: w.x + 10, y: 412, kind: "water" }];
updateSpecial(w, 10);
assert.equal(w.flower.water, 1);
assert.equal(w.hp, 5);
assert.equal(w.projectiles.length, 0);
w.parryAt = -9999;
w.clock = 2000;
w.projectiles = [{ x: w.x + 10, y: 412, kind: "water" }];
updateSpecial(w, 10);
assert.equal(w.hp, 4);
assert.equal(w.flower.water, 1);
const fin = scene();
fin.breakMeter.add(100);
fin.update({ attack: true }, 10);
assert.equal(fin.finisherDone, false);
assert.equal(fin.dummyHP, 100);
for (let i = 0; i < 24; i++) fin.update({}, 10);
assert.equal(fin.dummyHP, 62);
assert.equal(fin.breakMeter.broken, false);
fin.freeze = 0;
for (let i = 0; i < 30; i++) fin.update({}, 10);
assert.equal(fin.dummyHP, 62);
assert.equal(fin.cycle, -500);
console.log(
  "PASS: separate water/fertilizer progression and caps, absorption vs damage, growth survives damage, finisher single hit and BREAK consumption.",
);
const { Sparks } = load("effects");
const fx = new Sparks();
fx.burst(0, 0, "parry");
const axis = fx.lastAxis;
fx.burst(0, 0, "break");
assert.notEqual(fx.lastAxis, axis);
assert.equal(fx.flashes[0].kind, "parry");
assert.equal(fx.flashes[1].kind, "break");
fx.clear();
fx.growth(0, 0);
assert(fx.particles.every((p) => p.vy < 0));
for (let i = 0; i < 20; i++) {
  fx.update(20);
  assert(fx.particles.every((p) => p.y <= p.originY));
}
const { finisherPose } = load("motion");
assert.equal(finisherPose(-1).active, false);
assert(finisherPose(120).offset < 0);
assert(finisherPose(220).offset > 0);
assert.equal(finisherPose(650).active, false);
const growth = scene();
growth.flower.water = 0;
growth.parryAt = 0;
growth.projectiles = [{ x: growth.x + 10, y: 412, kind: "water" }];
updateSpecial(growth, 10);
assert.equal(growth.flower.stage, 1);
assert(growth.events.some((event) => event.type === "growth"));
const view = scene();
const graphics = new Proxy({}, { get: () => () => graphics });
view.g = graphics;
for (const key of [
  "hud",
  "readout",
  "hint",
  "label",
  "breakText",
  "flowerText",
])
  view[key] = { setText: () => {} };
load("scene-view").drawScene(snapshot(view), view, fx);
view.finisherAt = 0;
view.clock = 220;
load("scene-view").drawScene(snapshot(view), view, fx);
console.log(
  "PASS: separated impact axes, growth upper hemisphere, finisher pose phases, growth transition effect, scene draw smoke.",
);

// Model runs without browser globals; events drain exactly once.
const detached = scene();
detached.addBreak(100);
const events = detached.drainEvents();
assert.equal(
  events.filter((e) => e.type === "sound" && e.kind === "break").length,
  1,
);
assert.equal(detached.drainEvents().length, 0);
const copy = snapshot(detached);
copy.flower.water = 999;
copy.projectiles.push({ x: 1, y: 1, kind: "water" });
assert.equal(detached.flower.water, 0);
assert.equal(detached.projectiles.length, 0);
assert.equal(detached.enemyStatus, "broken");
detached.finisherAt = detached.clock;
detached.finisherDone = false;
detached.buffer = 999;
detached.recoil = 20;
detached.reset(false);
assert.equal(detached.playerAction, "idle");
assert.equal(detached.enemyStatus, "active");
assert.equal(detached.finisherDone, true);
assert.equal(detached.buffer, -9999);
assert.equal(detached.recoil, 0);
const paused = scene();
paused.pause(true);
paused.update({ attack: true }, 1000);
assert.equal(paused.clock, 0);
paused.pause(false);
paused.hp = 0;
paused.deadAt = 0;
paused.flower.water = 4;
for (let i = 0; i < 29; i++) paused.update({}, 34);
assert.equal(paused.hp, 5);
assert.equal(paused.flower.water, 0);
assert.equal(paused.sessionStatus, "running");
for (const pattern of Object.values(load("data").patterns)) {
  assert(pattern.events.length > 0);
  assert(
    pattern.events.every(
      (e, i) => e.at >= 0 && (!i || e.at >= pattern.events[i - 1].at),
    ),
  );
}
console.log(
  "PASS: isolated state snapshots, single event delivery, interrupted-action reset, pause/death retry, typed enemy timelines.",
);
