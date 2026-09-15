import type { Practice } from "./practice";
import { tuning as T } from "./data";
import { dummyRect, overlaps } from "./combat";
export function announceBloom(game: Practice) {
  game.emit({ type: "bloom", x: game.x, y: game.y - 100 });
  game.emit({ type: "sound", kind: "bloom" });
  game.say("ひまわり 開花！  通常攻撃に花風が宿る", 2200);
}
export function updateFlower(game: Practice, dt: number) {
  if (game.defeatedAt >= 0) return;
  if (game.flower.tick(dt)) {
    game.emit({ type: "sound", kind: "bloomEnd" });
    game.emit({ type: "seed", x: game.x, y: game.y - 100 });
    game.say("次の種を残した。水を取り込み、もう一度咲かせよう。", 1800);
  }
}
export function castFlower(game: Practice) {
  if (game.defeatedAt >= 0) return;
  if (!game.flower.useWave()) return;
  game.waves.push({
    x: game.x,
    y: game.y - 48,
    face: game.attackFace,
    distance: 0,
    damage: game.flower.damage(T.bloom.waveDamage),
  });
  game.emit({ type: "sound", kind: "flowerWave" });
}
export function updateWaves(game: Practice, dt: number) {
  if (game.defeatedAt >= 0) {
    game.waves = [];
    return;
  }
  game.waves = game.waves.filter((w) => {
    const travel = Math.min(
      (T.bloom.waveSpeed * dt) / 1000,
      T.bloom.waveRange - w.distance,
    );
    const from = w.x;
    w.x += w.face * travel;
    w.distance += travel;
    const r = T.bloom.waveRadius;
    // Swept rectangle prevents passing through the target at large frame steps.
    if (
      overlaps(
        {
          x: Math.min(from, w.x) - r,
          y: w.y - r,
          width: Math.abs(w.x - from) + r * 2,
          height: r * 2,
        },
        dummyRect(),
      )
    ) {
      game.hitDummy(w.damage);
      if (game.defeatedAt < 0) game.addBreak(T.bloom.waveBreak);
      game.emit({ type: "bloom", x: w.x, y: w.y });
      game.emit({ type: "sound", kind: "flowerHit" });
      return false;
    }
    return w.distance < T.bloom.waveRange;
  });
}
