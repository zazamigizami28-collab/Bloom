import { announceBloom } from "./flower-system";
import type { Practice } from "./practice";
import { tuning as T, parryGrade } from "./data";
export function updateSpecial(game: Practice, dt: number) {
  for (const a of game.absorbed) a.age += dt;
  game.absorbed = game.absorbed.filter((a) => a.age < 450);
  if (game.debug.stopAI || game.breakMeter.broken || game.defeatedAt >= 0)
    return;
  game.projectiles = game.projectiles.filter((p) => {
    const oldX = p.x;
    p.x += ((p.direction ?? -1) * T.special.speed * dt) / 1000;
    if (
      !game.rolling &&
      game.x >= Math.min(oldX, p.x) - T.special.radius - T.player.width / 2 &&
      game.x <= Math.max(oldX, p.x) + T.special.radius + T.player.width / 2 &&
      p.y > game.y - T.player.height - T.special.radius &&
      p.y < game.y + T.special.radius
    ) {
      game.attempts++;
      const grade =
        game.face === -(p.direction ?? -1)
          ? parryGrade(game.clock - game.parryAt, T.parry.window)
          : "miss";
      if (grade !== "miss") {
        game.success++;
        game.combo++;
        game.best = Math.max(game.best, game.combo);
        game.parryAt = -9999;
        game.parryReady = game.clock;
        if (p.kind === "pellet") {
          game.freeze =
            grade === "perfect" ? T.parry.perfectStop : T.parry.stop;
          game.emit({ type: "sound", kind: grade });
          game.emit({ type: "impact", x: p.x, y: p.y, kind: grade });
          game.say("圧縮弾を弾いた！", 700);
          return false;
        }
        const oldStage = game.flower.stage;
        const opened = game.flower.absorb(p.kind);
        if (game.flower.stage > oldStage) {
          game.emit({ type: "growth", x: game.x, y: game.y - 100 });
          game.emit({ type: "sound", kind: "growth" });
        }
        game.freeze = T.special.stop;
        game.emit({ type: "sound", kind: p.kind });
        game.absorbed.push({ x: p.x, y: p.y, age: 0, kind: p.kind });
        game.say(
          p.kind === "water"
            ? `水を吸収！ ${game.flower.name} / 水 ${game.flower.water} / ${T.flower.thresholds[3]}`
            : `肥料を吸収！ 攻撃力 +${game.flower.fertilizer * T.flower.fertilizerDamage}`,
        );
        if (opened) announceBloom(game);
      } else {
        game.combo = 0;
        if (game.clock - game.hurtAt > T.player.invulnerability) {
          game.hurtAt = game.clock;
          if (!game.debug.invincible) game.hp -= T.dummy.damage;
          game.emit({ type: "sound", kind: "hurt" });
          game.say("水・肥料は、弾が届く瞬間に K / RB");
          if (game.hp <= 0) {
            game.deadAt = game.clock;
            game.say("ひと息ついて、もう一度。", T.retry);
          }
        }
      }
      return false;
    }
    return p.x > -30 && p.x < T.world.right + 50;
  });
}
