import { tuning as T, type AttackPattern } from "./data";
const irrigation: AttackPattern = {
  name: "噴水ノズル・交互射出",
  windup: 950,
  events: [
    { at: 0, kind: "pellet" },
    { at: 520, kind: "water" },
    { at: 1040, kind: "pellet" },
  ],
};
const shears: AttackPattern = {
  name: "伸縮剪定・横薙ぎ",
  windup: 900,
  events: [
    { at: 0, kind: "metal" },
    { at: 520, kind: "metal" },
  ],
};
const feed: AttackPattern = {
  name: "施肥ホッパー・圧縮弾",
  windup: 1100,
  events: [
    { at: 0, kind: "pellet" },
    { at: 520, kind: "fertilizer" },
    { at: 1040, kind: "pellet" },
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
  name: "土壌転圧：ジャンプ",
  windup: 1300,
  events: [{ at: 0, kind: "quake" }],
};
const mixed: AttackPattern = {
  name: "過給噴水・交互射出",
  windup: 900,
  events: [
    { at: 0, kind: "pellet" },
    { at: 460, kind: "water" },
    { at: 920, kind: "pellet" },
  ],
};
const charge: AttackPattern = {
  name: "芝刈り駆動・突進",
  windup: 1150,
  events: [{ at: 0, kind: "charge" }],
};
export class Boss {
  x = T.dummy.x;
  phase = 1;
  turn = 0;
  transition = 0;
  facing = -1;
  get pattern() {
    const sequence =
      this.phase === 1
        ? [irrigation, shears, feed, charge]
        : [mixed, rush, quake, feed, charge];
    return sequence[this.turn % sequence.length];
  }
  move(dt: number, targetX: number) {
    const delta = targetX - this.x;
    const travel = Math.min(
      Math.max(0, Math.abs(delta) - T.boss.approachDistance),
      (T.boss.speed * dt) / 1000,
    );
    this.x = Math.max(
      T.world.left + T.boss.width / 2 + T.player.width,
      Math.min(
        T.world.right - T.boss.width / 2 - T.player.width,
        this.x + Math.sign(delta) * travel,
      ),
    );
    this.facing = targetX < this.x ? -1 : 1;
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
    this.x = T.dummy.x;
    this.phase = 1;
    this.turn = 0;
    this.transition = 0;
    this.facing = -1;
  }
}
