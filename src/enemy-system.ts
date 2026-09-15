import type { Practice } from "./practice";
import { tuning as T, parryGrade } from "./data";
export function updateEnemy(game: Practice, dt: number) {
  if (game.mode === "boss" && game.boss.transition > 0) return;
  if (!game.debug.stopAI && !game.breakMeter.broken && game.defeatedAt < 0)
    game.cycle += dt;
  const p = game.attackPattern;
  // Travel only before the committed windup; telegraphs and contact stay still.
  if (
    game.mode === "boss" &&
    !game.debug.stopAI &&
    !game.breakMeter.broken &&
    game.defeatedAt < 0 &&
    !p.stationary &&
    game.cycle < p.windup * T.boss.moveUntil
  )
    game.boss.move(dt, game.x);
  p.events.forEach((event, i) => {
    if (game.debug.stopAI || game.breakMeter.broken || game.defeatedAt >= 0)
      return;
    const hit = p.windup + event.at;
    const time = game.cycle - hit;
    const kind = event.kind;
    if (
      kind !== "quake" &&
      !event.unblockable &&
      time >= -(game.mode === "boss" ? T.boss.cueLead : T.parry.cueLead) &&
      !game.cued.has(i)
    ) {
      game.cued.add(i);
      game.emit({ type: "sound", kind: "cue" });
    }
    if (event.unblockable && time >= -T.boss.dangerLead && !game.cued.has(i)) {
      game.cued.add(i);
      game.emit({ type: "sound", kind: "quakeCue" });
      game.say("赤い剪定！ Space / B：ローリング", 1000);
    }
    if (kind === "water" || kind === "fertilizer" || kind === "pellet") {
      if (time >= 0 && !game.resolved.has(i)) {
        game.resolved.add(i);
        game.projectiles.push({
          x: game.enemyX + game.enemyFacing * 50,
          y: T.world.ground - 42,
          kind,
          direction: game.enemyFacing,
        });
      }
      return;
    }
    if (
      kind === "charge" &&
      time >= 0 &&
      time < T.boss.chargeDuration &&
      !game.resolved.has(i)
    ) {
      game.boss.x = Math.max(
        T.world.left + T.boss.width / 2 + T.player.width,
        Math.min(
          T.world.right - T.boss.width / 2 - T.player.width,
          game.boss.x + (game.enemyFacing * T.boss.chargeSpeed * dt) / 1000,
        ),
      );
    }
    if (kind === "quake") {
      if (time >= -T.boss.dangerLead && !game.cued.has(i)) {
        game.cued.add(i);
        game.emit({ type: "sound", kind: "quakeCue" });
        game.say("地面が光る！ W / A：ジャンプ", 800);
      }
      if (time >= 0 && time < T.dummy.active && !game.resolved.has(i)) {
        game.resolved.add(i);
        game.emit({ type: "sound", kind: "quake" });
        game.emit({ type: "shake", duration: 160, intensity: 0.006 });
        if (
          !game.rolling &&
          Math.abs(game.x - game.enemyX) < T.boss.quakeRange &&
          game.y > T.world.ground - T.boss.quakeHeight &&
          game.clock - game.hurtAt > T.player.invulnerability
        ) {
          game.hurtAt = game.clock;
          if (!game.debug.invincible) game.hp -= T.dummy.damage;
          game.combo = 0;
          game.say("赤い地面攻撃はジャンプで越えよう", 1300);
          if (game.hp <= 0) {
            game.deadAt = game.clock;
            game.say("ひと息ついて、もう一度。", T.retry);
          }
        }
      }
      return;
    }
    const duration = kind === "charge" ? T.boss.chargeDuration : T.dummy.active;
    if (
      time >= 0 &&
      time < duration &&
      !game.resolved.has(i) &&
      !game.rolling
    ) {
      const dx = (game.x - game.enemyX) * game.enemyFacing;
      if (
        dx > 0 &&
        dx <
          (kind === "charge"
            ? (T.boss.width + T.player.width) / 2 + 12
            : game.mode === "boss"
              ? T.boss.meleeRange
              : T.dummy.range) &&
        game.y >
          T.world.ground - (game.mode === "boss" ? T.boss.meleeHeight : 95)
      ) {
        game.resolved.add(i);
        game.attempts++;
        const grade =
          !event.unblockable && game.face === -game.enemyFacing
            ? parryGrade(game.clock - game.parryAt, T.parry.window)
            : "miss";
        if (grade !== "miss") {
          game.success++;
          game.combo++;
          game.best = Math.max(game.best, game.combo);
          game.parryReady = game.clock;
          game.freeze =
            grade === "perfect" ? T.parry.perfectStop : T.parry.stop;
          game.recoil =
            game.mode === "boss"
              ? grade === "perfect"
                ? T.boss.perfectRecoil
                : T.boss.parryRecoil
              : grade === "perfect"
                ? 18
                : 10;
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
              event.unblockable
                ? "赤い攻撃はパリィ不可 — ローリングで回避"
                : game.face !== -game.enemyFacing
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
    if (time >= duration && !game.resolved.has(i)) {
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
      (game.mode === "boss" ? (p.rest ?? T.boss.rest) : T.dummy.rest)
  ) {
    if (game.mode === "boss") game.boss.next(game.x);
    game.restartCycle();
    game.cycle = 0;
  }
}
