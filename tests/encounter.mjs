import assert from "node:assert/strict";
import { load, windowTarget } from "./loader.mjs";
const { Practice } = load("practice");
const { Controls } = load("input");
const { tuning: T } = load("data");
const { updateEnemy } = load("enemy-system");
const { updateSpecial } = load("special-system");
const make = () => {
  const g = new Practice("boss");
  g.begin();
  g.debug.stopAI = true;
  g.x = 640;
  return g;
};
for (const side of [-1, 1]) {
  const g = make();
  g.x = g.enemyX + side * 110;
  for (let i = 0; i < 30; i++) g.update({ move: -side }, 16);
  assert.equal(g.x, g.enemyX + side * 90, "walk must stop at the boss edge");
  g.update({ jump: true, move: -side }, 16);
  for (let i = 0; i < 8; i++) g.update({ move: -side }, 16);
  assert.equal(g.x, g.enemyX + side * 90, "jump cannot pass through tall body");
  g.y = T.world.ground;
  g.vy = 0;
  g.update({ roll: true, move: -side }, 16);
  assert(g.rolling);
  for (let i = 0; i < 27; i++) g.update({}, 16);
  assert((g.x - g.enemyX) * side < -90, "roll crosses to the opposite side");
  const at = g.rollAt;
  g.update({ roll: true }, 16);
  assert.equal(g.rollAt, at, "cooldown rejects another roll");
  g.command({ type: "mode", value: "practice" });
  assert(!g.rolling);
  assert.equal(g.rollReady, 0);
}
const r = make();
r.update({ roll: true }, 16);
const at = r.rollAt,
  x = r.x;
r.pause(true);
r.update({}, 34);
assert.equal(r.rollAt, at);
assert.equal(r.x, x);
r.pause(false);
r.debug.stopAI = false;
r.projectiles = [{ x: r.x + 1, y: r.y - 40, kind: "pellet", direction: -1 }];
updateSpecial(r, 0);
assert.equal(r.hp, 5);
assert.equal(r.flower.water, 0);
r.command({ type: "reset" });
assert(!r.rolling);
const pellet = make();
pellet.debug.stopAI = false;
pellet.parryAt = pellet.clock;
pellet.face = 1;
pellet.projectiles = [
  { x: pellet.x + 5, y: pellet.y - 40, kind: "pellet", direction: -1 },
];
updateSpecial(pellet, 0);
assert.equal(pellet.success, 1);
assert.equal(pellet.flower.water, 0);
assert.equal(pellet.flower.fertilizer, 0);
assert.equal(pellet.breakMeter.value, T.break.perfect);
const hit = make();
hit.debug.stopAI = false;
hit.projectiles = [
  { x: hit.x + 1, y: hit.y - 40, kind: "pellet", direction: -1 },
];
updateSpecial(hit, 0);
assert.equal(hit.hp, 4);
const charge = make();
charge.debug.stopAI = false;
charge.boss.turn = 3;
charge.x = 400;
charge.restartCycle();
charge.cycle = charge.attackPattern.windup;
const bx = charge.enemyX;
updateEnemy(charge, 34);
assert(charge.enemyX < bx);
charge.x = charge.enemyX - 95;
charge.face = 1;
charge.parryAt = charge.clock;
updateEnemy(charge, 16);
assert.equal(charge.success, 1);
const cx = charge.enemyX;
updateEnemy(charge, 16);
assert.equal(charge.enemyX, cx, "parry arrests charge");
const melee = make();
melee.debug.stopAI = false;
melee.x = melee.enemyX - 270;
melee.boss.turn = 1;
melee.restartCycle();
melee.cycle = 895;
melee.parryAt = melee.clock;
updateEnemy(melee, 10);
assert.equal(melee.success, 1, "expanded shear reach");
const g = make();
for (const phase of [1, 2]) {
  g.boss.phase = phase;
  g.boss.turn = 0;
  const kinds = g.attackPattern.events.map((e) => e.kind);
  assert.equal(kinds.join(","), "pellet,water,pellet");
}
const controls = new Controls();
function key(code) {
  const e = new Event("keydown");
  Object.defineProperty(e, "code", { value: code });
  windowTarget.dispatchEvent(e);
}
key("KeyW");
assert.equal(controls.sample().jump, true);
key("Space");
const input = controls.sample();
assert.equal(input.jump, false);
assert.equal(input.roll, true);
assert.equal(controls.sample().roll, false);
controls.dispose();
console.log(
  "PASS: solid boss on both sides and in air, roll crossing/cooldown/pause/reset, roll immunity, non-growing pellets, moving/parry-stopped charge, expanded shears, mixed resources, W/Space input edges.",
);
const wall = make();
wall.debug.stopAI = false;
wall.x = T.world.left;
wall.boss.x = 150;
wall.boss.turn = 3;
wall.restartCycle();
wall.cycle = wall.attackPattern.windup;
for (let i = 0; i < 10; i++) wall.update({}, 16);
assert(
  wall.enemyX - wall.x >= (T.boss.width + T.player.width) / 2,
  "wall leaves space for a solid player",
);
for (const turn of [0, 1, 2, 3]) {
  const cue = make();
  cue.debug.stopAI = false;
  cue.boss.turn = turn;
  cue.cycle = cue.attackPattern.windup - T.boss.cueLead - 2;
  cue.drainEvents();
  updateEnemy(cue, 1);
  assert.equal(
    cue.events.filter((e) => e.type === "sound" && e.kind === "cue").length,
    0,
  );
  updateEnemy(cue, 1);
  assert.equal(
    cue.events.filter((e) => e.type === "sound" && e.kind === "cue").length,
    1,
  );
  updateEnemy(cue, 1);
  assert.equal(
    cue.events.filter((e) => e.type === "sound" && e.kind === "cue").length,
    1,
  );
}
console.log(
  "PASS: flash/audio lead boundary and single cue for shears, nozzle, hopper and charge.",
);

const { shearPose } = load("shear-pose");
const poses = ["sweep", "overhead", "rising"].map((kind) =>
  shearPose(kind, 1, false, 0),
);
assert(poses[1].height > poses[0].height && poses[0].height > poses[2].height);
const recoilPose = shearPose("sweep", 1, true, 54);
assert(recoilPose.reach < shearPose("sweep", 1, true, 0).reach);
for (const kind of ["sweep", "overhead", "rising"]) {
  const g = make();
  g.debug.stopAI = false;
  let found = false;
  for (let turn = 0; turn < 9; turn++) {
    g.boss.turn = turn;
    if (g.attackPattern.events[0].shear === kind) {
      found = true;
      break;
    }
  }
  assert(found);
  g.x = g.enemyX - 160;
  g.face = 1;
  g.restartCycle();
  g.cycle = g.attackPattern.windup - T.boss.cueLead;
  g.parryAt = g.clock;
  g.clock += T.boss.cueLead;
  updateEnemy(g, T.boss.cueLead);
  assert.equal(g.success, 1, "each shear can be parried from its flash");
  assert.equal(g.recoil, T.boss.parryRecoil);
}
for (const step of [10, 16, 34]) {
  const g = new Practice("practice");
  g.begin();
  g.debug.stopAI = true;
  const x = g.x;
  g.update({ roll: true }, step);
  for (let i = 0; i < 50; i++) g.update({}, step);
  assert(
    Math.abs(g.x - x - 182) < 0.001,
    "roll travel is 182 regardless of frame step",
  );
}
console.log(
  "PASS: three distinct shear poses, cue-to-parry path and recoil, frame-independent shortened roll.",
);
