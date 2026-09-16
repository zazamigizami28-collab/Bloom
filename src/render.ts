import { presentation as P } from "./presentation";
import Phaser from "phaser";
import { finisherPose } from "./motion";
export function background(s: Phaser.Scene) {
  const g = s.add.graphics();
  g.fillStyle(0x91c8be);
  g.fillRect(0, 0, 1024, 576);
  g.fillStyle(0xc8e2bf);
  g.fillCircle(230, 112, 65);
  g.fillStyle(0xb8d8c6);
  for (let i = 0; i < 8; i++) {
    g.fillRect(i * 150, 185 - (i % 3) * 25, 100, 260);
    g.fillStyle(0x8eb9ad);
    for (let y = 220; y < 390; y += 35) g.fillRect(i * 150 + 20, y, 18, 20);
    g.fillStyle(0xb8d8c6);
  }
  g.fillStyle(0x679d8b);
  for (let i = 0; i < 12; i++) {
    g.fillRect(i * 97, 300 + (i % 3) * 18, 58, 150);
  }
  g.lineStyle(8, 0x486e61, 0.6);
  for (let i = 0; i < 6; i++) {
    g.lineBetween(i * 220 - 40, 0, i * 220 - 40, 454);
    g.lineBetween(i * 220 - 40, 0, i * 220 + 180, 115);
  }
  g.lineBetween(0, 115, 1024, 115);
  g.lineStyle(3, 0x577f6c, 0.5);
  g.lineBetween(0, 245, 1024, 245);
  g.fillStyle(0x486f58);
  g.fillRect(0, 440, 1024, 15);
  g.fillStyle(0x233e35);
  g.fillRect(0, 455, 1024, 121);
  g.fillStyle(0x75a767);
  for (let i = 0; i < 128; i++) g.fillRect(i * 8, 440 - ((i * 17) % 11), 6, 9);
  for (let i = 0; i < 50; i++) {
    g.fillStyle(i % 2 ? 0x385347 : 0x486052);
    g.fillRect((i * 29) % 1024, 474 + ((i * 31) % 100), 12 + (i % 4) * 7, 5);
  }
  g.fillStyle(0x426a58);
  g.fillRect(110, 373, 118, 63);
  g.fillStyle(0x7f9980);
  g.fillRect(105, 361, 127, 14);
  g.fillStyle(0xdda273);
  g.fillRect(144, 337, 32, 24);
  g.fillStyle(0x57875c);
  g.fillRect(157, 305, 7, 32);
  g.fillRect(164, 314, 18, 8);
  g.fillRect(139, 301, 21, 9);
  g.fillStyle(0x416954);
  g.fillRect(917, 329, 45, 112);
  g.fillStyle(0xb1c2a0);
  g.fillRect(912, 320, 56, 13);
  g.fillStyle(0xe1c271);
  for (let i = 0; i < 14; i++) g.fillRect(20 + i * 79, 428 - (i % 3) * 5, 5, 5);
  s.add.text(45, 510, "旧市営温室  /  第三育成区", {
    fontFamily: "sans-serif",
    fontSize: "13px",
    color: "#819d88",
  });
  s.add
    .text(950, 510, "訓練装置 07", {
      fontFamily: "sans-serif",
      fontSize: "13px",
      color: "#819d88",
    })
    .setOrigin(1, 0);
}
export function pot(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  face: number,
  walk: number,
  parry: boolean,
  attack: number,
  finisherAge = -1,
) {
  const pose = finisherPose(finisherAge);
  x += pose.offset * face;
  y += pose.crouch;
  const r = (c: number, a: number, b: number, w: number, h: number) => {
    g.fillStyle(c);
    g.fillRect(Math.round(x + a), Math.round(y + b), w, h);
  };
  r(0x153d36, -17, -35, 34, 28);
  r(0x283d37, -18, -10 + walk, 12, 10);
  r(0x283d37, 7, -10 - walk, 12, 10);
  r(0x729c73, -12, -35, 24, 22);
  r(0xdd9774, -22, -65, 44, 30);
  r(0xf4bc86, -26, -68, 52, 9);
  r(0x714f3d, -20, -68, 40, 4);
  r(0xf4bd89, -17, -55, 5, 16);
  r(0x273d38, -9 + face * 2, -52, 5, 6);
  r(0x273d38, 5 + face * 2, -52, 5, 6);
  r(0xedce9f, -2, -71, 6, 4);
  r(0xd9d5a4, face > 0 ? 10 : -19, -30, 9, 10);
  const angle = pose.active
    ? pose.angle
    : parry
      ? -0.9
      : attack > 0
        ? -1.7 + attack * 3
        : 0.3;
  const sx = x + face * 20,
    sy = y - 27;
  g.lineStyle(5, 0xb59768);
  g.lineBetween(
    sx,
    sy,
    sx + face * (23 + Math.sin(angle) * 23),
    sy - (pose.active ? 64 : 35) * Math.cos(angle),
  );
  g.fillStyle(0xd4e0bf);
  g.fillRect(
    sx + face * (23 + Math.sin(angle) * 23) - 8,
    sy - (pose.active ? 64 : 35) * Math.cos(angle) - 13,
    16,
    20,
  );
}
export function dummy(
  g: Phaser.GameObjects.Graphics,
  x: number,
  ground: number,
  wind: number,
  active: boolean,
  recoil: number,
) {
  x += recoil;
  g.fillStyle(0x2d493f);
  g.fillRect(x - 40, ground - 13, 80, 13);
  g.fillStyle(0x819584);
  g.fillRect(x - 22, ground - 75, 44, 62);
  g.fillStyle(0x506c5d);
  g.fillRect(x - 32, ground - 110, 64, 50);
  g.fillStyle(0xb6b69a);
  g.fillRect(x - 35, ground - 118, 70, 12);
  g.fillStyle(0xe5b771);
  g.fillRect(x - 20, ground - 96, 14, 10);
  g.fillRect(x + 6, ground - 96, 14, 10);
  g.lineStyle(13, 0x8c9c86);
  const ex = active ? x - 149 : x - 55 - wind * 30,
    ey = active ? ground - 36 : ground - 66 - wind * 99;
  g.lineBetween(x - 29, ground - 73, ex, ey);
  g.fillStyle(0xc6c4a0);
  g.fillRect(ex - 19, ey - 12, 37, 24);
  g.fillStyle(0x719761);
  g.fillRect(x + 12, ground - 130, 24, 12);
  g.fillRect(x + 22, ground - 139, 8, 11);
}

export function plant(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  stage: number,
  fertilizer: number,
  time: number,
) {
  if (stage > 0) {
    const h = stage === 1 ? 17 : 31;
    g.fillStyle(0x426b39);
    g.fillRect(x - 2, y - 69 - h, 4, h);
    g.fillStyle(0x99d66d);
    g.fillRect(x - 13, y - 75 - h / 2, 12, 5);
    g.fillRect(x + 2, y - 79 - h / 2, 12, 5);
    if (stage >= 2) {
      g.fillStyle(stage === 3 ? 0xffc777 : 0xe8a084);
      g.fillRect(x - 7, y - 73 - h, 14, 12);
      g.fillStyle(0x679b53);
      g.fillRect(x - 6, y - 63 - h, 12, 4);
      if (stage === 3) {
        const cy = y - 68 - h;
        g.fillStyle(0xffde72, 0.12);
        g.fillCircle(x, cy, P.bloom.auraRadius + Math.sin(time / 220) * 3);
        for (let i = 0; i < 12; i++) {
          const a = (i * Math.PI) / 6 + Math.sin(time / 600) * 0.05;
          const px = Math.round(x + Math.cos(a) * P.bloom.petalRadius),
            py = Math.round(cy + Math.sin(a) * P.bloom.petalRadius);
          g.fillStyle(i % 2 ? 0xffce43 : 0xffe97a);
          g.fillRect(px - 6, py - 6, 12, 12);
          g.fillStyle(0xfff2ad);
          g.fillRect(px - 3, py - 4, 5, 5);
        }
        g.fillStyle(0x67432f);
        g.fillCircle(x, cy, 12);
        g.fillStyle(0xd9a453);
        for (let i = 0; i < 5; i++)
          g.fillRect(x - 6 + (i % 3) * 5, cy - 5 + Math.floor(i / 3) * 6, 3, 3);
      }
    }
  }
  for (let i = 0; i < fertilizer; i++) {
    g.fillStyle(0xf1c477);
    g.fillRect(x - 12 + i * 9, y - 42, 4, 3);
  }
}
