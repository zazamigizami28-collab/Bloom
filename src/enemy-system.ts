import type { Practice } from "./practice";
import { tuning as T, parryGrade } from "./data";
export function updateEnemy(game: Practice, dt: number) {
  if (game.mode === "boss" && game.boss.transition > 0) return;
  if (!game.debug.stopAI && !game.breakMeter.broken && game.defeatedAt < 0)
    game.cycle += dt;
  const p = game.attackPattern;
  p.events.forEach((event, i) => {
    if (game.debug.stopAI || game.breakMeter.broken || game.defeatedAt >= 0)
      return;
    const hit = p.windup + event.at;
    const time = game.cycle - hit;
    const kind = event.kind;
    if (kind === "water" || kind === "fertilizer") {
      if (time >= 0 && !game.resolved.has(i)) {
        game.resolved.add(i);
        game.projectiles.push({
          x: T.dummy.x + game.enemyFacing * 50,
          y: T.world.ground - 42,
          kind,
          direction: game.enemyFacing,
        });
        game.emit({ type: "sound", kind: "cue" });
      }
      return;
    }
    if (kind === "quake") {
      if (time >= -400 && !game.cued.has(i)) {
        game.cued.add(i);
        game.emit({ type: "sound", kind: "quakeCue" });
        game.say("地面が光る！ Space / A：ジャンプ", 800);
      }
      if (time >= 0 && time < T.dummy.active && !game.resolved.has(i)) {
        game.resolved.add(i);
        game.emit({ type: "sound", kind: "quake" });
        game.emit({ type: "shake", duration: 160, intensity: 0.006 });
        if (
          Math.abs(game.x - T.dummy.x) < T.boss.quakeRange &&
          game.y > T.world.ground - T.boss.quakeHeight &&
          game.clock - game.hurtAt > T.player.invulnerability
        ) {
          game.hurtAt = game.clock;
          if (!game.debug.invincible) game.hp -= T.dummy.damage;
          game.combo = 0;
          game.say("橙の地面攻撃はジャンプで越えよう", 1300);
          if (game.hp <= 0) {
            game.deadAt = game.clock;
            game.say("ひと息ついて、もう一度。", T.retry);
          }
        }
      }
      return;
    }
    if (time >= -80 && !game.cued.has(i)) {
      game.cued.add(i);
      game.emit({ type: "sound", kind: "cue" });
    }
    if (time >= 0 && time < T.dummy.active && !game.resolved.has(i)) {
      const dx = (game.x - T.dummy.x) * game.enemyFacing;
      if (dx > 0 && dx < T.dummy.range && game.y > T.world.ground - 95) {
        game.resolved.add(i);
        game.attempts++;
        const grade =
          game.face === -game.enemyFacing
            ? parryGrade(game.clock - game.parryAt, T.parry.window)
            : "miss";
        if (grade !== "miss") {
          game.success++;
          game.combo++;
          game.best = Math.max(game.best, game.combo);
          game.parryReady = game.clock;
          game.freeze =
            grade === "perfect" ? T.parry.perfectStop : T.parry.stop;
          game.recoil = grade === "perfect" ? 18 : 10;
          game.emit({ type: "sound", kind: grade });
          game.emit({
            type: "impact",
            x: game.x + game.face * 35,
            y: game.y - 47,
            kind: grade,
          });
          game.emit({
            type: "shake",
            duration: 100,
            intensity: T.feedback.shake * (grade === "perfect" ? 1 : 0.5),
          });
          game.say(
            `${grade === "perfect" ? "JUST PARRY" : "PARRY"}  /  ${Math.round(game.clock - game.parryAt)} ms`,
          );
          game.parryAt = -9999;
          game.addBreak(T.break[grade]);
        } else {
          game.combo = 0;
          if (game.clock - game.hurtAt > T.player.invulnerability) {
            if (!game.debug.invincible) game.hp -= T.dummy.damage;
            game.hurtAt = game.clock;
            game.emit({ type: "sound", kind: "hurt" });
            game.emit({ type: "shake", duration: 110, intensity: 0.003 });
            const since = game.clock - game.parryAt;
            game.say(
              game.face !== -game.enemyFacing
                ? "相手の方を向こう"
                : since < 600
                  ? "パリィが早い — 光るまで待とう"
                  : "攻撃が先に届いた — 光に合わせて K",
            );
            if (game.hp <= 0) {
              game.deadAt = game.clock;
              game.say("ひと息ついて、もう一度。", T.retry);
            }
          }
        }
      }
    }
    if (time >= T.dummy.active && !game.resolved.has(i)) {
      game.resolved.add(i);
      game.combo = 0;
    }
  });
}
export function finishEnemyCycle(game: Practice) {
  const p = game.attackPattern;
  if (
    game.cycle >
    p.windup +
      p.events[p.events.length - 1].at +
      (game.mode === "boss" ? T.boss.rest : T.dummy.rest)
  ) {
    if (game.mode === "boss") game.boss.next();
    game.restartCycle();
    game.cycle = 0;
  }
}
