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
