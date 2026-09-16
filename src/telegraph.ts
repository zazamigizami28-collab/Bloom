import { TELEGRAPH_LIGHT_MS } from "./data";
import type Phaser from "phaser";
export function telegraphFrame(time: number) {
  const progress = Math.max(
    0,
    Math.min(1, (time + TELEGRAPH_LIGHT_MS) / TELEGRAPH_LIGHT_MS),
  );
  return {
    visible: time >= -TELEGRAPH_LIGHT_MS && time < 0,
    progress,
    white: progress >= 0.5,
    radius: 42 * (1 - progress) + 6,
  };
}
export function drawTelegraph(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  time: number,
  danger = false,
) {
  const f = telegraphFrame(time);
  if (!f.visible) return;
  const color = f.white ? 0xffffff : danger ? 0xff3659 : 0xffce69;
  g.lineStyle(5, color, 1);
  g.strokeCircle(x, y, f.radius);
  g.fillStyle(color, 0.8);
  g.fillCircle(x, y, 5 + (1 - f.progress) * 8);
  if (danger) {
    g.lineStyle(3, 0xff3659, 1);
    g.strokeCircle(x, y, f.radius + 7);
  }
}
