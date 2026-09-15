import assert from "node:assert/strict";
import { load } from "./loader.mjs";
const { Practice } = load("practice");
const { tuning: T } = load("data");
const { snapshot } = load("game-state");
const { updateEnemy, finishEnemyCycle } = load("enemy-system");
const { updateSpecial } = load("special-system");
const boss = () => {
  const g = new Practice("boss");
  g.begin();
  g.drainEvents();
  return g;
};
const a = boss();
assert.equal(a.dummyHP, 650);
assert.equal(a.attackPattern.name, "散水三連");
a.cycle = 10000;
finishEnemyCycle(a);
assert.equal(a.attackPattern.name, "剪定二連");
a.projectiles = [{ x: 1, y: 2, kind: "water" }];
a.waves = [{ x: 1, y: 2, face: 1, distance: 0, damage: 10 }];
a.hitDummy(325);
assert.equal(a.boss.phase, 2);
assert.equal(a.boss.transition, 1400);
assert.equal(a.projectiles.length, 0);
assert.equal(a.waves.length, 0);
a.hitDummy(100);
assert.equal(a.dummyHP, 325);
a.cycle = 10000;
updateEnemy(a, 20);
assert.equal(a.projectiles.length, 0);
a.pause(true);
a.update({}, 34);
assert.equal(a.boss.transition, 1400);
a.pause(false);
for (let i = 0; i < 42; i++) a.update({}, 34);
assert.equal(a.boss.transition, 0);
assert(a.cycle < 0);
a.hitDummy(325);
assert.equal(a.dummyHP, 0);
assert(a.defeatedAt >= 0);
for (let i = 0; i < 100; i++) a.update({}, 34);
assert.equal(a.dummyHP, 0);
assert.equal(a.projectiles.length, 0);
assert.equal(
  a.events.filter((e) => e.type === "sound" && e.kind === "victory").length,
  1,
);
a.command({ type: "mode", value: "boss" });
assert.equal(a.dummyHP, 650);
assert.equal(a.boss.phase, 1);
assert.equal(a.defeatedAt, -1);
a.hp = 0;
a.deadAt = a.clock;
for (let i = 0; i < 29; i++) a.update({}, 34);
assert.equal(a.hp, 5);
assert.equal(a.dummyHP, 650);
assert.equal(a.boss.turn, 0);
const right = boss();
right.x = 850;
right.face = -1;
right.boss.turn = 1;
right.restartCycle();
assert.equal(right.enemyFacing, 1);
right.cycle = 895;
right.parryAt = right.clock;
updateEnemy(right, 10);
assert.equal(right.success, 1);
assert.equal(right.hp, 5);
right.parryAt = right.clock;
right.projectiles = [{ x: 840, y: 412, kind: "water", direction: 1 }];
updateSpecial(right, 0);
assert.equal(right.flower.water, 1);
const q = boss();
q.boss.phase = 2;
q.boss.turn = 2;
q.cycle = 1290;
q.parryAt = 0;
updateEnemy(q, 20);
assert.equal(q.hp, 4);
assert.equal(q.breakMeter.value, 0);
const jump = boss();
jump.boss.phase = 2;
jump.boss.turn = 2;
jump.cycle = 1290;
jump.y = T.world.ground - 40;
updateEnemy(jump, 20);
assert.equal(jump.hp, 5);
const br = boss();
br.boss.turn = 1;
br.cycle = 890;
br.breakMeter.add(76);
br.parryAt = 0;
updateEnemy(br, 20);
assert.equal(br.breakMeter.broken, true);
const health = br.hp;
for (let i = 0; i < 40; i++) updateEnemy(br, 20);
assert.equal(br.hp, health);
assert.equal(br.projectiles.length, 0);
const graphics = new Proxy({}, { get: () => () => graphics });
const resources = { g: graphics };
for (const key of [
  "hud",
  "hint",
  "readout",
  "label",
  "breakText",
  "flowerText",
])
  resources[key] = { setText() {} };
for (const state of [boss(), q, a])
  load("scene-view").drawScene(
    snapshot(state),
    resources,
    new (load("effects").Sparks)(),
  );
console.log(
  "PASS: boss schedule, half-HP transition/cleanup/invulnerability, pause, stable victory, rematch/death reset, right-facing parry/projectile, jump-only quake, BREAK interruption, boss draw paths.",
);

const recovery = boss();
recovery.addBreak(100);
recovery.freeze = 0;
recovery.breakMeter.remaining = 1;
recovery.update({}, 10);
assert.equal(recovery.boss.turn, 1);
assert(recovery.cycle < 0);
const finish = boss();
finish.x = 630;
finish.addBreak(100);
finish.freeze = 0;
finish.update({ attack: true }, 10);
for (let i = 0; i < 24; i++) finish.update({}, 10);
assert.equal(finish.boss.turn, 1);
assert.equal(finish.dummyHP, 612);
console.log(
  "PASS: boss advances to next move after BREAK timeout or finisher, avoiding repeated irrigation lock.",
);
