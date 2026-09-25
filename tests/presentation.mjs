import assert from "node:assert/strict";
import { load } from "./loader.mjs";
const { Practice } = load("practice");
const { tuning: T } = load("data");
const { snapshot } = load("game-state");
const { drawBoss } = load("boss-view");
const { beginTelegraphs, drawTelegraph, flushTelegraphs } = load("telegraph");
const g = new Practice("boss");
g.begin();
g.debug.stopAI = true;
g.freeze = 100;
g.hitDummy(1);
assert.equal(g.freeze, 100, "hit must not shorten a stronger stop");
assert.equal(snapshot(g).enemyHitAt, g.clock);
g.update({}, 34);
assert.equal(g.clock, 0, "hit stop freezes game clock");
g.reset(false);
assert(g.enemyHitAt < 0);
g.hitDummy(0);
assert.equal(g.freeze, 0);
g.hitDummy(1);
assert.equal(g.freeze, T.bossHit.stop);
const colors = [];
const graphics = new Proxy(
  {},
  {
    get:
      (_, key) =>
      (...args) => {
        if (key === "fillStyle" || key === "lineStyle")
          colors.push(args[key === "fillStyle" ? 0 : 1]);
      },
  },
);
drawBoss(graphics, snapshot(g), 0.2, false, "metal", "sweep", -900);
assert(
  colors.slice(0, 25).every((c) => c === 0xffffff),
  "body materials whiten",
);
g.clock += T.bossHit.flash;
colors.length = 0;
drawBoss(graphics, snapshot(g), 0.2, false, "metal", "sweep", -900);
assert(
  colors.some((c) => c !== 0xffffff),
  "white flash expires",
);
colors.length = 0;
beginTelegraphs();
drawTelegraph(graphics, 0, 0, -100, true);
assert.equal(colors.length, 0);
flushTelegraphs();
assert(colors.includes(0xff3659), "red outline survives queued drawing");
g.reset(false);
g.hp = 1;
g.drainEvents();
g.update({ heal: true }, 10);
for (let i = 0; i < 120; i++) g.update({}, 10);
let events = g.drainEvents();
assert.equal(events.filter((e) => e.type === "heal").length, 1);
assert(events.some((e) => e.type === "sound" && e.kind === "heal"));
assert(!events.some((e) => e.type === "growth"));
console.log(
  "PASS: boss hit stop/flash/reset, warning foreground, independent heal feedback.",
);
{
  const { element } = await import("./loader.mjs");
  const { renderControls } = load("ui");
  element("encounter").style = { setProperty() {} };
  const battle = new Practice("boss");
  battle.command({ type: "begin" });
  const initialCycle = battle.cycle;
  battle.update({ attack: true, move: 1 }, 34);
  assert.equal(battle.cycle, initialCycle);
  assert.equal(battle.attackAt, -9999);
  battle.pause(true);
  const clock = battle.clock;
  battle.update({}, 34);
  assert.equal(battle.clock, clock);
  battle.pause(false);
  for (let i = 0; i < 36; i++) battle.update({}, 34);
  assert.equal(battle.introAt, -1);
  battle.hp = 0;
  battle.defeat();
  battle.defeat();
  assert.equal(
    battle
      .drainEvents()
      .filter((e) => e.type === "sound" && e.kind === "defeat").length,
    1,
  );
  for (let i = 0; i < 28; i++) battle.update({}, 34);
  assert.equal(battle.hp, 5);
  assert.equal(battle.introAt, -1);
  battle.hitDummy(999);
  renderControls(snapshot(battle));
  assert.equal(element("victory").hidden, true);
  battle.clock = battle.defeatedAt + T.encounter.victoryReveal;
  renderControls(snapshot(battle));
  assert.equal(element("victory").hidden, false);
  battle.command({ type: "mode", value: "practice" });
  assert.equal(battle.introAt, -1);
  console.log(
    "PASS: encounter intro gate/pause, defeat once/retry, victory reveal, mode cleanup.",
  );
}
{
  const game = new Practice();
  game.command({ type: "home" });
  assert.equal(game.location, "hub");
  game.x = 900;
  game.command({ type: "interact" });
  assert.equal(game.location, "path");
  const cycle = game.cycle;
  game.update({}, 34);
  assert.equal(game.cycle, cycle);
  game.pause(true);
  const now = game.clock;
  game.update({ move: 1 }, 34);
  assert.equal(game.clock, now);
  game.pause(false);
  game.x = T.journey.length - 10;
  game.command({ type: "interact" });
  assert.equal(game.location, "gate");
  game.x = 900;
  game.command({ type: "interact" });
  assert.equal(game.location, "gate", "gate requires valve");
  game.x = 490;
  game.command({ type: "interact" });
  game.x = 900;
  game.command({ type: "interact" });
  assert.equal(game.location, "battle");
  assert.equal(game.mode, "boss");
  game.introAt = -1;
  game.hitDummy(999);
  game.command({ type: "home" });
  assert(game.restoredGarden);
  assert.equal(game.location, "hub");
  game.command({ type: "mode", value: "practice" });
  assert.equal(game.location, "battle");
  assert.equal(game.hp, 5);
  console.log(
    "PASS: hub/exploration/gate/boss/return loop, pause, gate condition, practice isolation.",
  );
}
{
  const { journeyTarget } = load("journey");
  const game = new Practice();
  game.command({ type: "home" });
  game.x = 420;
  assert(journeyTarget(snapshot(game)));
  game.y = T.world.ground - 30;
  assert.equal(journeyTarget(snapshot(game)), "");
  game.y = T.world.ground;
  game.x = 220;
  game.update({ roll: true, move: 1 }, 10);
  assert(game.rolling);
  const start = game.x;
  for (let i = 0; i < 42; i++) game.update({}, 10);
  assert(game.x > start + 160);
  game.command({ type: "home" });
  game.x = 900;
  game.command({ type: "interact" });
  game.x = 1400;
  game.update({ move: 1 }, 34);
  assert(game.x > 1400, "path is wider than combat arena");
  game.x = game.scouts[0].x - 65;
  game.face = 1;
  game.scouts[0].strikeAt = game.clock + 100;
  game.update({ parry: true }, 10);
  for (let i = 0; i < 10; i++) game.update({}, 10);
  assert.equal(game.hp, 5, "weak foe uses normal parry timing");
  assert(
    game
      .drainEvents()
      .some(
        (e) =>
          e.type === "sound" && (e.kind === "parry" || e.kind === "perfect"),
      ),
  );
  game.freeze = 0;
  game.debug.stopAI = true;
  for (let n = 0; n < 2; n++) {
    game.update({ attack: true }, 10);
    for (let i = 0; i < 45; i++) game.update({}, 10);
  }
  assert.equal(game.scouts[0].hp, 0, "two shovel hits defeat weak foe");
  assert.equal(game.scouts[1].hp, 20);
  console.log(
    "PASS: shared prompt, airborne exclusion, exploration roll, scroll bounds and weak enemy parry/two-hit defeat.",
  );
}
