import { tuning as T } from "./data";
export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}
export const attackRect = (x: number, y: number, facing: number): Rect => ({
  x: facing > 0 ? x : x - T.weapon.range,
  y: y + T.weapon.offsetY,
  width: T.weapon.range,
  height: T.weapon.height,
});
export const dummyRect = (): Rect => ({
  x: T.dummy.x - T.dummy.width / 2,
  y: T.world.ground - T.dummy.height,
  width: T.dummy.width,
  height: T.dummy.height,
});
export const overlaps = (a: Rect, b: Rect) =>
  a.x < b.x + b.width &&
  a.x + a.width > b.x &&
  a.y < b.y + b.height &&
  a.y + a.height > b.y;
export const attackActive = (age: number) =>
  age >= T.weapon.startup && age <= T.weapon.startup + T.weapon.active;
export class BreakMeter {
  value = 0;
  remaining = 0;
  idle = 0;
  get broken() {
    return this.remaining > 0;
  }
  reset() {
    this.value = 0;
    this.remaining = 0;
    this.idle = 0;
  }
  add(amount: number) {
    if (this.broken) return false;
    this.idle = 0;
    this.value = Math.min(T.break.max, this.value + amount);
    if (this.value >= T.break.max) {
      this.remaining = T.break.duration;
      return true;
    }
    return false;
  }
  tick(dt: number) {
    if (this.broken) {
      this.remaining = Math.max(0, this.remaining - dt);
      if (!this.broken) {
        this.value = 0;
        this.idle = 0;
        return true;
      }
      return false;
    }
    const before = Math.max(0, this.idle - T.break.decayDelay);
    this.idle += dt;
    const decayTime = Math.max(0, this.idle - T.break.decayDelay) - before;
    this.value = Math.max(
      0,
      this.value - (decayTime * T.break.decayPerSecond) / 1000,
    );
    return false;
  }
  damage(base: number) {
    return Math.round(base * (this.broken ? T.break.damageMultiplier : 1));
  }
}
