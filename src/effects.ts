import Phaser from "phaser";
import { tuning as T } from "./data";
import { presentation as P } from "./presentation";
export type ImpactKind = "hit" | "parry" | "perfect" | "break" | "finisher";
type Particle = {
  x: number;
  y: number;
  originY: number;
  vx: number;
  vy: number;
  life: number;
  color: number;
  size: number;
  growth: boolean;
  seed?: boolean;
};
type Flash = {
  x: number;
  y: number;
  age: number;
  kind: ImpactKind;
  axis: number;
};
export class Sparks {
  particles: Particle[] = [];
  flashes: Flash[] = [];
  heals: { x: number; y: number; age: number }[] = [];
  lastAxis = 0;
  heal(x: number, y: number) {
    this.heals.push({ x, y, age: 0 });
  }
  clear() {
    this.particles = [];
    this.flashes = [];
    this.heals = [];
  }
  burst(x: number, y: number, kind: ImpactKind) {
    // A new axis per impact, separated from the previous impact even on the same frame.
    const axis =
      (this.lastAxis +
        P.parry.minAxisChange +
        Math.random() * (Math.PI - 2 * P.parry.minAxisChange)) %
      Math.PI;
    this.lastAxis = axis;
    const count =
      kind === "break"
        ? T.feedback.breakParticles
        : kind === "perfect"
          ? T.feedback.perfectParticles
          : kind === "hit"
            ? 16
            : T.feedback.particles;
    for (let i = 0; i < count; i++) {
      const a =
          axis + (i % 2 ? Math.PI : 0) + (Math.random() - 0.5) * P.parry.spread,
        s = 110 + Math.random() * (kind === "hit" ? 210 : 560);
      this.particles.push({
        x,
        y,
        originY: y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s,
        life: 200 + Math.random() * 450,
        color: T.feedback.colors[i % T.feedback.colors.length],
        size: (i % 3) + 1,
        growth: false,
      });
    }
    this.flashes.push({ x, y, age: 0, kind, axis });
  }
  bloom(x: number, y: number) {
    for (let i = 0; i < P.bloom.count; i++) {
      const angle = (i / P.bloom.count) * Math.PI * 2,
        speed = 60 + Math.random() * 170;
      this.particles.push({
        x,
        y,
        originY: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 90,
        life: P.bloom.duration,
        color: P.bloom.colors[i % P.bloom.colors.length],
        size: 3 + (i % 3),
        growth: false,
      });
    }
  }
  seed(x: number, y: number) {
    for (let i = 0; i < 5; i++)
      this.particles.push({
        x: x + (i - 2) * 4,
        y: y - 8,
        originY: y + 30,
        vx: 0,
        vy: -30 - i * 4,
        life: 650,
        color: 0x76513a,
        size: 3,
        growth: false,
        seed: true,
      });
  }
  growth(x: number, y: number) {
    for (let i = 0; i < P.growth.count; i++) {
      const a = -Math.PI + ((i + 0.5) / P.growth.count) * Math.PI,
        s = P.growth.minSpeed + Math.random() * P.growth.spreadSpeed;
      this.particles.push({
        x,
        y,
        originY: y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s,
        life: P.growth.duration,
        color: i % 3 ? 0x7fe6ff : 0xf0ffca,
        size: 2 + (i % 3),
        growth: true,
      });
    }
  }
  update(dt: number) {
    this.heals.forEach((h) => (h.age += dt));
    this.heals = this.heals.filter((h) => h.age < 500);
    for (const f of this.flashes) f.age += dt;
    this.flashes = this.flashes.filter(
      (f) => f.age < (f.kind === "finisher" ? P.finisher.flash : P.parry.flash),
    );
    for (const p of this.particles) {
      p.life -= dt;
      p.x += (p.vx * dt) / 1000;
      p.y += (p.vy * dt) / 1000;
      p.vy += ((p.growth ? P.growth.gravity : T.feedback.gravity) * dt) / 1000;
      p.vx *= Math.pow(0.98, dt / 16);
    }
    this.particles = this.particles.filter(
      (p) =>
        p.life > 0 &&
        (!p.growth || p.y <= p.originY) &&
        (!p.seed || p.y <= p.originY),
    );
  }
  draw(g: Phaser.GameObjects.Graphics) {
    for (const h of this.heals) {
      const a = 1 - h.age / 500;
      g.lineStyle(3, 0x91ffd0, a);
      g.strokeCircle(h.x, h.y, 18 + h.age * 0.05);
      g.lineBetween(h.x - 9, h.y, h.x + 9, h.y);
      g.lineBetween(h.x, h.y - 9, h.x, h.y + 9);
    }
    for (const f of this.flashes) {
      const alpha = Math.max(
        0,
        1 - f.age / (f.kind === "finisher" ? P.finisher.flash : P.parry.flash),
      );
      if (f.kind === "parry" || f.kind === "perfect") {
        if (f.kind === "perfect") {
          g.lineStyle(3, 0xffffff, alpha);
          g.strokeCircle(f.x, f.y, 12 + f.age * 0.15);
        }
        // The impact glyph is mirrored vertically around the exact parry point.
        for (const sign of [-1, 1]) {
          g.fillStyle(0xffa34d, alpha * 0.85);
          g.beginPath();
          g.moveTo(f.x - 42, f.y);
          for (const [x, y] of [
            [-24, 7],
            [-31, 19],
            [-11, 14],
            [0, 48],
            [9, 15],
            [29, 24],
            [23, 7],
            [42, 0],
          ])
            g.lineTo(f.x + x, f.y + y * sign);
          g.closePath();
          g.fillPath();
          g.lineStyle(2, 0xfff5d3, alpha);
          g.lineBetween(f.x, f.y, f.x, f.y + sign * 35);
        }
      } else if (f.kind === "break") {
        g.lineStyle(5, 0xffbb65, alpha);
        g.strokeCircle(f.x, f.y, 20 + f.age * 0.5);
        for (let i = 0; i < 6; i++) {
          const a = (i * Math.PI) / 3;
          g.lineBetween(
            f.x + Math.cos(a) * 25,
            f.y + Math.sin(a) * 25,
            f.x + Math.cos(a) * (40 + f.age * 0.4),
            f.y + Math.sin(a) * (40 + f.age * 0.4),
          );
        }
      } else {
        const big = f.kind === "finisher";
        g.fillStyle(0xffb358, alpha * 0.65);
        g.fillTriangle(
          f.x - 18,
          f.y - (big ? 135 : 35),
          f.x + 22,
          f.y + (big ? 60 : 15),
          f.x + 7,
          f.y - (big ? 145 : 42),
        );
        g.lineStyle(big ? 7 : 3, 0xfff4d2, alpha);
        for (let i = 0; i < 7; i++) {
          const a = -Math.PI + (i * Math.PI) / 6;
          g.lineBetween(
            f.x,
            f.y,
            f.x + Math.cos(a) * (big ? 90 : 25),
            f.y + Math.sin(a) * (big ? 60 : 23),
          );
        }
      }
    }
    for (const p of this.particles) {
      const alpha = Math.min(1, p.life / 180);
      g.lineStyle(p.size, p.color, alpha);
      g.lineBetween(p.x, p.y, p.x - p.vx * 0.024, p.y - p.vy * 0.024);
      g.fillStyle(p.growth ? 0xeaffff : 0xfff4cf, alpha);
      g.fillRect(p.x - 1, p.y - 1, 2, 2);
    }
  }
}
