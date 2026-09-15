import Phaser from "phaser";
import type { GameSnapshot } from "./game-state";
import { tuning as T } from "./data";
export function drawBoss(
  g: Phaser.GameObjects.Graphics,
  state: GameSnapshot,
  wind: number,
  active: boolean,
  kind: string | undefined,
) {
  const x = state.enemyX,
    y = T.world.ground,
    face = state.enemyFacing;
  const defeated = state.defeatedAt >= 0,
    broken = state.breakMeter.broken;
  const h = T.boss.height;
  const lift = broken || defeated ? 12 : Math.sin(state.clock / 350) * 2;
  // Low tracks, a water reservoir and fertilizer hopper retain the original
  // procedural machine style. Silhouette height is five player hurtboxes.
  g.fillStyle(0x263d3e);
  g.fillRoundedRect(x - 75, y - 38, 150, 38, 12);
  for (let i = -2; i <= 2; i++) {
    g.fillStyle(0x82958a);
    g.fillCircle(x + i * 28, y - 19, 12);
    g.lineStyle(3, 0x334d47);
    const spin = state.enemyX / 12 + i;
    g.lineBetween(
      x + i * 28,
      y - 19,
      x + i * 28 + Math.cos(spin) * 9,
      y - 19 + Math.sin(spin) * 9,
    );
  }
  g.fillStyle(0x334d47);
  g.fillRoundedRect(x - 62, y - h + lift, 124, h - 28 - lift, 16);
  g.fillStyle(0x829c88);
  g.fillRect(x - 53, y - h + 18 + lift, 106, 45);
  g.fillStyle(
    defeated ? 0x9ad66e : state.boss.phase === 2 ? 0xffab55 : 0x90dfdd,
  );
  g.fillRect(x - 35, y - h + 34 + lift, 70, 10);
  // Transparent blue tank and gold granular hopper distinguish resources.
  g.fillStyle(0x223f49);
  g.fillRoundedRect(x - 49, y - 214, 46, 122, 8);
  g.fillStyle(0x67c9d3);
  g.fillRect(x - 43, y - 188, 34, 89);
  for (let i = 0; i < 4; i++) {
    g.lineStyle(2, 0xb8f6ff, 0.7);
    g.lineBetween(x - 40, y - 110 - i * 23, x - 18, y - 110 - i * 23);
  }
  g.fillStyle(0xd8b666);
  g.fillRoundedRect(x + 8, y - 214, 42, 85, 6);
  for (let i = 0; i < 8; i++) {
    g.fillStyle(0x8a6c38);
    g.fillCircle(x + 18 + (i % 3) * 10, y - 196 + Math.floor(i / 3) * 20, 3);
  }
  const ready = !broken && !defeated && state.boss.transition === 0;
  const motion = ready ? wind : 0;
  const projectile =
    kind === "water" || kind === "fertilizer" || kind === "pellet";
  const feeding = state.attackPattern.name.includes("施肥");
  if (projectile) {
    // Separate mechanisms: pivoting blue nozzle versus shaking gold hopper.
    const color = feeding ? 0xe6b455 : 0x65d7f5;
    const tipX = x + face * 50,
      tipY = y - 42;
    g.lineStyle(14, 0x314c50);
    g.lineBetween(
      x + (feeding ? 30 : -25),
      y - (feeding ? 155 : 120),
      tipX,
      tipY,
    );
    g.lineStyle(8, color);
    g.lineBetween(
      x + (feeding ? 30 : -25),
      y - (feeding ? 155 : 120),
      tipX,
      tipY,
    );
    g.fillStyle(color);
    if (feeding) {
      const shake = Math.sin(state.clock / 35) * motion * 6;
      g.fillTriangle(
        x + 5 + shake,
        y - 150,
        x + 52 + shake,
        y - 150,
        x + 28 + shake,
        y - 105,
      );
      for (let i = 0; i < 4; i++)
        g.fillCircle(tipX - face * i * 8, tipY - 22 - i * motion * 8, 3);
    } else {
      g.lineStyle(4, color, 0.7);
      for (let i = 0; i < 3; i++)
        g.strokeCircle(tipX, tipY, 13 + i * 7 + motion * 6);
    }
    // Resource shape + colour: blue drops, gold grains, white diamond pellets.
    g.fillStyle(
      kind === "water" ? 0x65d7f5 : kind === "fertilizer" ? 0xe6b455 : 0xe8f6ff,
    );
    g.fillRect(tipX - 12, tipY - 12, 24, 24);
    if (active && ready) {
      g.lineStyle(6, color, 0.8);
      g.lineBetween(tipX, tipY, tipX + face * 48, tipY);
    }
  } else if (kind === "charge") {
    // Tracks spool up before a committed, straight gardening-machine rush.
    g.lineStyle(4, 0xffe6a3, ready ? 0.25 + motion * 0.6 : 0);
    g.lineBetween(x, y - 8, x + face * 260, y - 8);
    for (let i = 0; i < 4; i++) {
      const tx = x + face * (95 + i * 44);
      g.lineBetween(tx - face * 12, y - 20, tx, y - 8);
      g.lineBetween(tx - face * 12, y + 2, tx, y - 8);
    }
    if (active && ready) {
      g.lineStyle(5, 0xffdda1, 0.65);
      for (let i = 0; i < 4; i++)
        g.lineBetween(
          x - face * 55,
          y - 20 - i * 25,
          x - face * (115 + i * 10),
          y - 20 - i * 25,
        );
    }
  } else {
    const reach = active ? T.boss.meleeRange - 32 : 95 + motion * 55;
    const armY = active ? y - 58 : y - 115 - motion * 55;
    g.lineStyle(16, 0x556b56);
    g.lineBetween(x + face * 50, y - 140, x + face * reach, armY);
    g.lineStyle(6, 0xd3dfca);
    g.lineBetween(
      x + face * reach,
      armY,
      x + face * (reach + 32),
      armY - (active ? 8 : 30),
    );
    g.lineBetween(
      x + face * reach,
      armY,
      x + face * (reach + 32),
      armY + (active ? 8 : 30),
    );
    if (kind === "metal" && ready) {
      const left = face < 0 ? x - T.boss.meleeRange : x;
      g.fillStyle(0xffe7a6, active ? 0.28 : motion * 0.08);
      g.fillRect(
        left,
        y - T.boss.meleeHeight,
        T.boss.meleeRange,
        T.boss.meleeHeight,
      );
      g.lineStyle(active ? 8 : 2, 0xffefb8, active ? 0.9 : motion * 0.5);
      g.lineBetween(x, y - 58, x + face * T.boss.meleeRange, y - 58);
    }
  }
  if (state.boss.transition > 0) {
    g.lineStyle(3, 0xffb967, 0.7);
    g.strokeCircle(x, y - 67, 64 + Math.sin(state.clock / 50) * 5);
  }
  if (kind === "quake" && !broken && !defeated) {
    const opacity = active ? 0.8 : Math.max(0, wind - 0.3) * 0.6;
    g.fillStyle(0xf4a35b, opacity);
    g.fillRect(
      Math.max(T.world.left, x - T.boss.quakeRange),
      y - T.boss.quakeHeight,
      Math.min(T.world.right, x + T.boss.quakeRange) -
        Math.max(T.world.left, x - T.boss.quakeRange),
      T.boss.quakeHeight,
    );
    for (let px = x - T.boss.quakeRange; px < x + T.boss.quakeRange; px += 35) {
      g.lineStyle(2, 0xffe1a4, opacity);
      g.lineBetween(px, y - 4, px + 10, y - (active ? 30 : 10));
    }
  }
  // Permanent health strip communicates a full encounter rather than a resetting dummy.
  g.fillStyle(0x203b34);
  g.fillRect(560, 515, 430, 14);
  g.fillStyle(state.boss.phase === 2 ? 0xd9975c : 0x9bbd79);
  g.fillRect(562, 517, (426 * state.dummyHP) / state.enemyHPMax, 10);
}
