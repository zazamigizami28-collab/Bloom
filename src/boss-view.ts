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
  const x = T.dummy.x,
    y = T.world.ground,
    face = state.enemyFacing;
  const defeated = state.defeatedAt >= 0,
    broken = state.breakMeter.broken;
  const lift = broken || defeated ? 14 : Math.sin(state.clock / 350) * 2;
  // Roots anchor the irrigation machine; the torso is the actual hurtbox.
  for (let i = -2; i <= 2; i++) {
    g.lineStyle(9, 0x526943);
    g.lineBetween(x + i * 12, y - 12, x + i * 29, y + 5);
    g.lineStyle(3, 0x8aaf64);
    g.lineBetween(x + i * 12, y - 12, x + i * 29, y + 5);
  }
  g.fillStyle(0x334d47);
  g.fillRoundedRect(x - 35, y - 118 + lift, 70, 108 - lift, 12);
  g.fillStyle(0x829c88);
  g.fillRect(x - 29, y - 106 + lift, 58, 52);
  g.fillStyle(0xabc7a1);
  g.fillRect(x - 24, y - 101 + lift, 46, 7);
  g.fillStyle(
    defeated ? 0x9ad66e : state.boss.phase === 2 ? 0xffab55 : 0x90dfdd,
  );
  g.fillRect(x - 18, y - 86 + lift, 36, 9);
  g.fillStyle(0x2e4c3e);
  g.fillRect(x - 22, y - 60, 44, 35);
  g.fillStyle(0x67c9d3);
  g.fillRect(x - 17, y - 54, 12, 22);
  g.fillStyle(0xd8b666);
  g.fillRect(x + 5, y - 54, 12, 22);
  g.lineStyle(12, 0x556b56);
  g.lineBetween(
    x + face * 27,
    y - 82 + lift,
    x + face * 56,
    y - 56 - (active ? 0 : wind * 35),
  );
  g.fillStyle(
    kind === "water" ? 0x6ecbdc : kind === "fertilizer" ? 0xdbb563 : 0xb9c0a3,
  );
  g.fillRect(x + face * 56 - 9, y - 63 - (active ? 0 : wind * 35), 18, 17);
  for (let i = 0; i < 5; i++) {
    g.fillStyle(i % 2 ? 0x8bb663 : 0x54854e);
    g.fillEllipse(x - 25 + i * 12, y - 122 + lift - (i % 2) * 7, 21, 12);
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
