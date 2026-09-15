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
  const reach = active ? 130 : 82;
  const armY = y - 65 - (active ? 0 : wind * 55);
  g.lineStyle(15, 0x556b56);
  g.lineBetween(x + face * 50, y - 140, x + face * reach, armY);
  g.fillStyle(0xb9c0a3);
  g.fillCircle(x + face * 50, y - 140, 13);
  if (kind === "water" || kind === "fertilizer") {
    g.fillStyle(kind === "water" ? 0x6ecbdc : 0xdbb563);
    g.fillRect(x + face * 50 - 12, y - 54, 24, 24);
  } else {
    g.lineStyle(7, 0xd3dfca);
    g.lineBetween(
      x + face * reach,
      armY,
      x + face * (reach + 32),
      armY - (active ? 5 : 22),
    );
    g.lineBetween(
      x + face * reach,
      armY,
      x + face * (reach + 32),
      armY + (active ? 5 : 22),
    );
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
