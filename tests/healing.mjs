import assert from "node:assert/strict";
import { load, windowTarget } from "./loader.mjs";
const { Practice } = load("practice");
const { tuning: T } = load("data");

function make() {
  const g = new Practice("boss");
  g.begin();
  g.debug.stopAI = true;
  g.hp = 1;
  return g;
}
const g = make();
g.update({ heal: true }, 10);
const start = g.clock,
  x = g.x;
for (let i = 0; i < 119; i++)
  g.update({ move: 1, roll: true, attack: true, parry: true, jump: true }, 10);
assert.equal(g.hp, 1);
assert.equal(g.healsLeft, 3);
assert.equal(g.x, x);
assert.equal(g.playerAction, "heal");
assert(!g.rolling);
g.pause(true);
g.update({}, 34);
assert.equal(g.clock, start + 1190);
g.pause(false);
g.update({}, 10);
assert.equal(g.hp, 3);
assert.equal(g.healsLeft, 2);
assert(!g.healing);
for (let use = 0; use < 2; use++) {
  g.hp = 4;
  g.update({ heal: true }, 10);
  for (let i = 0; i < 120; i++) g.update({}, 10);
  assert.equal(g.hp, 5);
}
assert.equal(g.healsLeft, 0);
g.hp = 1;
g.update({ heal: true }, 10);
assert(!g.healing);
g.command({ type: "reset" });
assert.equal(g.healsLeft, 3);
g.update({ heal: true }, 10);
assert(!g.healing, "full HP cannot consume a heal");
for (const kind of ["metal", "quake", "pellet", "water", "fertilizer"]) {
  const h = make();
  h.hp = 3;
  h.x = h.enemyX - 120;
  h.update({ heal: true }, 10);
  for (let i = 0; i < 119; i++) h.update({}, 10);
  h.debug.stopAI = false;
  h.boss.selected = {
    name: "test",
    windup: 900,
    stationary: true,
    events: [{ at: 0, kind }],
  };
  h.cycle = 890;
  if (["pellet", "water", "fertilizer"].includes(kind)) {
    h.boss.selected = {
      name: "wait",
      windup: 99999,
      events: [{ at: 0, kind: "metal" }],
    };
    h.projectiles = [{ x: h.x + 5, y: h.y - 40, kind, direction: -1 }];
  }
  h.update({}, 10);
  assert.equal(h.hp, 2, kind + " interrupts even at completion boundary");
  assert.equal(h.healsLeft, 3);
  assert(!h.healing);
}
const death = make();
death.healsLeft = 1;
death.healAt = death.clock;
death.hp = 0;
death.deadAt = death.clock;
for (let i = 0; i < 29; i++) death.update({}, 34);
assert.equal(death.healsLeft, 3);
assert(!death.healing);
const { Controls } = load("input");
const controls = new Controls();
const e = new Event("keydown");
Object.defineProperty(e, "code", { value: "KeyE" });
windowTarget.dispatchEvent(e);
assert(controls.sample().heal);
assert(!controls.sample().heal);
controls.dispose();
console.log(
  "PASS: healing duration/charges/cap/input lock/pause/deadline interruption/reset.",
);
