import assert from "node:assert/strict";
import { load } from "./loader.mjs";
const { Flower } = load("flower");
const { Practice } = load("practice");
const { tuning: T } = load("data");
const { updateSpecial } = load("special-system");
const { castFlower, updateWaves } = load("flower-system");
const { snapshot } = load("game-state");
const f = new Flower();
for (let i = 0; i < 5; i++) assert.equal(f.absorb("water"), false);
assert.equal(f.stage, 2);
assert.equal(f.absorb("water"), true);
assert.equal(f.phase, "blooming");
assert.equal(f.remaining, 20000);
f.absorb("fertilizer");
assert.equal(f.damage(10), 16);
assert.equal(f.useWave(), true);
assert.equal(f.useWave(), false);
f.tick(2399);
assert.equal(f.useWave(), false);
f.tick(1);
assert.equal(f.useWave(), true);
f.absorb("water");
assert.equal(f.remaining, 19600);
f.absorb("water");
assert.equal(f.remaining, 20000);
assert.equal(f.tick(19999), false);
assert.equal(f.tick(1), true);
assert.equal(f.tick(1), false);
assert.equal(f.water, 0);
assert.equal(f.stage, 0);
assert.equal(f.fertilizer, 1);
assert.equal(f.damage(10), 12);
assert.equal(f.useWave(), false);
for (let i = 0; i < 5; i++) assert.equal(f.absorb("water"), false);
assert.equal(f.absorb("water"), true);
assert.equal(f.remaining, 20000);
f.reset();
assert.equal(f.remaining, 0);
assert.equal(f.waveCooldown, 0);
assert.equal(f.fertilizer, 0);
const game = () => {
  const g = new Practice();
  g.begin();
  g.drainEvents();
  g.x = 630;
  return g;
};
const a = game();
a.flower.water = 5;
a.parryAt = 0;
a.projectiles = [{ x: a.x + 10, y: 412, kind: "water" }];
updateSpecial(a, 0);
assert.equal(a.flower.blooming, true);
assert.equal(
  a.events.filter((e) => e.type === "sound" && e.kind === "bloom").length,
  1,
);
a.drainEvents();
a.projectiles = [{ x: a.x + 10, y: 412, kind: "water" }];
a.parryAt = 0;
updateSpecial(a, 0);
assert.equal(
  a.events.filter((e) => e.type === "sound" && e.kind === "bloom").length,
  0,
);
a.parryAt = -9999;
a.clock = 2000;
a.projectiles = [{ x: a.x + 10, y: 412, kind: "water" }];
const before = a.flower.remaining;
updateSpecial(a, 0);
assert.equal(a.hp, 4);
assert.equal(a.flower.remaining, before);
a.pause(true);
a.update({ attack: true }, 1000);
assert.equal(a.flower.remaining, before);
assert.equal(a.waves.length, 0);
a.pause(false);
a.freeze = 200;
a.update({}, 34);
assert.equal(a.flower.remaining, before);
a.freeze = 0;
a.debug.stopAI = true;
a.update({}, 34);
assert.equal(a.flower.remaining, before - 34);
const b = game();
b.flower.setStage(3);
castFlower(b);
assert.equal(b.waves.length, 1);
castFlower(b);
assert.equal(b.waves.length, 1);
assert.equal(b.flower.waveCooldown, 2400);
for (let i = 0; i < 20; i++) updateWaves(b, 20);
assert.equal(b.dummyHP, 82);
assert.equal(b.waves.length, 0);
assert.equal(b.breakMeter.value, 8);
for (let i = 0; i < 20; i++) updateWaves(b, 20);
assert.equal(b.dummyHP, 82);
const back = game();
back.flower.setStage(3);
back.face = -1;
back.attackFace = -1;
castFlower(back);
for (let i = 0; i < 40; i++) updateWaves(back, 20);
assert.equal(back.dummyHP, 100);
assert.equal(back.waves.length, 0);
const air = game();
air.flower.setStage(3);
air.y = 250;
castFlower(air);
for (let i = 0; i < 40; i++) updateWaves(air, 20);
assert.equal(air.dummyHP, 100);
const blocked = game();
blocked.flower.setStage(3);
blocked.update({ attack: true, parry: true }, 10);
assert.equal(blocked.waves.length, 0);
assert.equal(blocked.flower.waveCooldown, 0);
blocked.finisherAt = blocked.clock;
blocked.update({ attack: true }, 10);
assert.equal(blocked.waves.length, 0);
blocked.reset(false);
assert.equal(blocked.flower.blooming, false);
assert.equal(blocked.waves.length, 0);
const reset = game();
reset.flower.setStage(3);
castFlower(reset);
reset.hp = 0;
reset.deadAt = 0;
for (let i = 0; i < 29; i++) reset.update({}, 34);
assert.equal(reset.flower.blooming, false);
assert.equal(reset.waves.length, 0);
const view = game();
view.flower.setStage(3);
castFlower(view);
const copy = snapshot(view);
copy.waves[0].damage = 999;
assert.equal(view.waves[0].damage, 18);
const g = new Proxy({}, { get: () => () => g });
const resources = { g };
for (const key of [
  "hud",
  "hint",
  "readout",
  "label",
  "breakText",
  "flowerText",
])
  resources[key] = { setText() {} };
load("scene-view").drawScene(
  snapshot(view),
  resources,
  new (load("effects").Sparks)(),
);
console.log(
  "PASS: bloom lifecycle/boundaries, water extension cap, re-bloom, fertilizer retention, pause/hitstop/death, wave single-hit/range/facing/height/cooldown/input priority, bloom draw path.",
);

const auto = game();
auto.debug.stopAI = true;
auto.flower.setStage(3);
auto.update({ attack: true }, 1);
assert.equal(auto.waves.length, 1);
assert.equal(auto.attackAt, auto.clock);
for (let i = 0; i < 20; i++) auto.update({}, 20);
auto.drainEvents();
auto.update({ attack: true }, 1);
assert.equal(
  auto.events.some((e) => e.type === "sound" && e.kind === "flowerWave"),
  false,
);
const seed = game();
seed.flower.setStage(3);
seed.flower.remaining = 1;
seed.debug.stopAI = true;
seed.update({}, 2);
assert.equal(seed.flower.stage, 0);
assert.equal(seed.events.filter((e) => e.type === "seed").length, 1);
seed.update({}, 2);
assert.equal(seed.events.filter((e) => e.type === "seed").length, 1);
console.log(
  "PASS: normal attack automatically adds wind; cooldown suppresses repeated wind; expiry emits seed once and resets water.",
);
