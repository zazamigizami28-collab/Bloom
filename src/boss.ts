import { tuning as T, type AttackPattern } from "./data";
const irrigation: AttackPattern = {
  name: "散水三連",
  windup: 950,
  events: [
    { at: 0, kind: "water" },
    { at: 620, kind: "water" },
    { at: 1240, kind: "water" },
  ],
};
const shears: AttackPattern = {
  name: "剪定二連",
  windup: 900,
  events: [
    { at: 0, kind: "metal" },
    { at: 520, kind: "metal" },
  ],
};
const feed: AttackPattern = {
  name: "施肥・剪定",
  windup: 1100,
  events: [
    { at: 0, kind: "fertilizer" },
    { at: 900, kind: "metal" },
  ],
};
const rush: AttackPattern = {
  name: "剪定三連",
  windup: 850,
  events: [
    { at: 0, kind: "metal" },
    { at: 440, kind: "metal" },
    { at: 880, kind: "metal" },
  ],
};
const quake: AttackPattern = {
  name: "根の衝撃：ジャンプ",
  windup: 1300,
  events: [{ at: 0, kind: "quake" }],
};
const mixed: AttackPattern = {
  name: "過給散水",
  windup: 900,
  events: [
    { at: 0, kind: "water" },
    { at: 480, kind: "water" },
    { at: 960, kind: "water" },
    { at: 1700, kind: "fertilizer" },
  ],
};
export class Boss {
  phase = 1;
  turn = 0;
  transition = 0;
  facing = -1;
  get pattern() {
    const sequence =
      this.phase === 1
        ? [irrigation, shears, feed, shears]
        : [mixed, rush, quake, feed, rush];
    return sequence[this.turn % sequence.length];
  }
  next() {
    this.turn++;
  }
  observe(hp: number) {
    if (hp > 0 && hp <= T.boss.hp * T.boss.phaseThreshold && this.phase === 1) {
      this.phase = 2;
      this.turn = 0;
      this.transition = T.boss.transition;
      return true;
    }
    return false;
  }
  tick(dt: number) {
    this.transition = Math.max(0, this.transition - dt);
  }
  reset() {
    this.phase = 1;
    this.turn = 0;
    this.transition = 0;
    this.facing = -1;
  }
}
