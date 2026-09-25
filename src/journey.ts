import type { Practice } from "./practice";
import type { ActionInput } from "./actions";
import { attackActive, attackRect, overlaps } from "./combat";
import { tuning as T, parryGrade } from "./data";
import { movePlayer } from "./player-system";
export function interactJourney(g: Practice) {
  if (!journeyTarget(g)) return;
  g.attackAt = -9999;
  if (g.location === "hub") {
    if (g.x > 820) {
      g.location = "path";
      g.x = 90;
      g.scouts = [1700, 2240].map((x) => ({
        x,
        hp: T.journey.foeHP,
        strikeAt: -1,
        readyAt: 0,
        cued: false,
        face: -1,
        hitAt: -9999,
        attackUntil: -1,
      }));
      g.pathWater = false;
      g.pathValve = false;
    } else if (Math.abs(g.x - 420) < 100) {
      g.hp = T.player.hp;
      g.healsLeft = T.heal.charges;
      g.say("♡  準備はできた", 1400);
      g.emit({ type: "sound", kind: "heal" });
    } else if (Math.abs(g.x - 650) < 90)
      g.say(
        g.restoredGarden ? "♪  おかえり" : "！  温室の水が止まっている",
        1800,
      );
  } else if (g.location === "path") {
    if (g.x < 110) {
      g.location = "hub";
      g.x = 790;
    } else if (Math.abs(g.x - 420) < 85 && !g.pathWater) {
      g.pathWater = true;
      g.emit({ type: "growth", x: g.x, y: g.y - 70 });
      g.emit({ type: "sound", kind: "water" });
      g.say("💧  水路の先に温室", 1500);
    } else if (g.x > T.journey.length - 100) {
      g.location = "gate";
      g.x = 90;
    }
  } else if (g.location === "gate") {
    if (g.x < 110) {
      g.location = "path";
      g.x = T.journey.length - 160;
    } else if (Math.abs(g.x - 490) < 85) {
      g.pathValve = true;
      g.emit({ type: "sound", kind: "heal" });
      g.say("♪  水門が開いた", 1300);
    } else if (g.x > 830) {
      if (!g.pathValve) {
        g.say("！  水門を調べよう", 1300);
        return;
      }
      g.mode = "boss";
      g.begin(true);
    }
  }
}
/** Same predicate feeds action dispatch and the on-screen prompt. */
export function journeyTarget(g: {
  location: string;
  x: number;
  y: number;
  rolling: boolean;
  pathWater: boolean;
  pathValve: boolean;
}) {
  if (g.rolling || g.y < T.world.ground - 8) return "";
  if (g.location === "hub")
    return g.x > 820
      ? "出発"
      : Math.abs(g.x - 420) < 100
        ? "休息"
        : Math.abs(g.x - 650) < 90
          ? "話す"
          : "";
  if (g.location === "path")
    return g.x < 110
      ? "拠点へ"
      : g.x > T.journey.length - 100
        ? "温室前へ"
        : Math.abs(g.x - 420) < 85 && !g.pathWater
          ? "水路を調べる"
          : "";
  if (g.location === "gate")
    return g.x < 110
      ? "水路へ"
      : Math.abs(g.x - 490) < 85
        ? "水門"
        : g.x > 830
          ? g.pathValve
            ? "温室へ"
            : "閉じた門"
          : "";
  return "";
}
export function updateJourney(g: Practice, input: ActionInput, delta: number) {
  if (g.freeze > 0) {
    g.freeze = Math.max(0, g.freeze - delta);
    return;
  }
  const dt = Math.min(delta, 34) * g.debug.speed;
  g.clock += dt;
  g.emit({ type: "tick", dt });
  if (g.deadAt >= 0) {
    if (g.clock - g.deadAt > T.retry) g.command({ type: "home" });
    return;
  }
  if (
    input.roll &&
    !g.rolling &&
    g.clock >= g.rollReady &&
    g.y >= T.world.ground
  ) {
    g.rollAt = g.clock;
    g.rollReady = g.clock + T.roll.cooldown;
    g.rollFace = input.move ? Math.sign(input.move) : g.face;
    g.face = g.rollFace;
    g.attackAt = -9999;
    g.parryAt = -9999;
    g.emit({ type: "sound", kind: "swing" });
  }
  const before = g.x;
  movePlayer(g, g.rolling ? {} : input, dt, false);
  if (g.location === "path") {
    for (const [x, height, rollThrough] of [
      [670, 38, false],
      [1100, 60, true],
    ] as const) {
      if (
        Math.abs(g.x - x) < 35 &&
        g.y > T.world.ground - height &&
        !(rollThrough && g.rolling)
      )
        g.x = before < x ? x - 35 : x + 35;
    }
  }
  if (input.attack && !g.rolling) {
    if (journeyTarget(g)) {
      interactJourney(g);
      return;
    }
    if (g.clock - g.attackAt >= T.weapon.recovery) {
      g.attackAt = g.clock;
      g.attackFace = g.face;
      g.attackHit = false;
      g.emit({ type: "sound", kind: "swing" });
    }
  }
  if (input.parry && !g.rolling && g.clock >= g.parryReady) {
    g.parryAt = g.clock;
    g.parryReady = g.clock + T.parry.recovery;
  }
  if (g.location !== "path") return;
  for (const foe of g.scouts) {
    if (foe.hp <= 0) continue;
    const distance = Math.abs(g.x - foe.x);
    if (
      !g.attackHit &&
      attackActive(g.clock - g.attackAt) &&
      overlaps(attackRect(g.x, g.y, g.attackFace), {
        x: foe.x - 30,
        y: T.world.ground - 118,
        width: 60,
        height: 118,
      })
    ) {
      foe.hp = Math.max(0, foe.hp - T.weapon.damage);
      foe.hitAt = g.clock;
      g.attackHit = true;
      g.freeze = T.weapon.stop;
      g.emit({ type: "sound", kind: "hit" });
      g.emit({ type: "impact", kind: "hit", x: foe.x, y: T.world.ground - 55 });
      if (foe.hp === 0) {
        g.emit({ type: "sound", kind: "victory" });
        continue;
      }
    }
    if (g.debug.stopAI) continue;
    if (foe.strikeAt < 0 && g.clock >= foe.readyAt && distance < 220) {
      foe.strikeAt = g.clock + T.journey.windup;
      foe.cued = false;
      foe.face = g.x < foe.x ? -1 : 1;
    }
    if (foe.strikeAt < 0) continue;
    if (g.clock < foe.strikeAt - T.boss.aimLock)
      foe.face = g.x < foe.x ? -1 : 1;
    if (g.clock >= foe.strikeAt - T.parry.cueLead && !foe.cued) {
      foe.cued = true;
      g.emit({ type: "sound", kind: "cue" });
    }
    if (g.clock >= foe.strikeAt) {
      foe.attackUntil = g.clock + 120;
      if (
        distance < T.journey.foeRange &&
        (g.x - foe.x) * foe.face >= 0 &&
        g.y > T.world.ground - 65 &&
        !g.rolling
      ) {
        const grade =
          distance <= T.parry.range && g.face === -foe.face
            ? parryGrade(g.clock - g.parryAt, T.parry.window)
            : "miss";
        if (grade !== "miss") {
          foe.readyAt = g.clock + 2400;
          g.parryReady = g.clock;
          g.emit({ type: "sound", kind: grade });
          g.emit({ type: "impact", kind: grade, x: g.x, y: g.y - 40 });
          g.freeze = T.parry.stop;
          g.say("弾いた！ J / Xで反撃", 1000);
        } else if (g.clock - g.hurtAt > T.player.invulnerability) {
          if (!g.debug.invincible) g.hp--;
          g.hurtAt = g.clock;
          g.emit({ type: "sound", kind: "hurt" });
          if (g.hp <= 0) {
            g.defeat();
            return;
          }
        }
      }
      foe.strikeAt = -1;
      foe.readyAt = Math.max(foe.readyAt, g.clock + T.journey.rest);
    }
  }
}
