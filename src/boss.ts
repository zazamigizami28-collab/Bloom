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
    { at: 0, kind: "metal", shear: "sweep" },
    { at: 820, kind: "metal", shear: "overhead" },
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
    { at: 0, kind: "metal", shear: "sweep" },
    { at: 720, kind: "metal", shear: "rising" },
    { at: 1680, kind: "metal", shear: "overhead" },
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
const overhead: AttackPattern = {
  name: "高枝剪定・溜め下ろし",
  windup: 1350,
  events: [
    { at: 0, kind: "metal", shear: "overhead" },
    { at: 760, kind: "metal", shear: "sweep" },
  ],
};
const rising: AttackPattern = {
  name: "下枝剪定・切り上げ",
  windup: 1050,
  events: [
    { at: 0, kind: "metal", shear: "rising" },
    { at: 680, kind: "metal", shear: "sweep" },
  ],
};
const quick: AttackPattern = {
  name: "短枝剪定・即時復帰",
  windup: 800,
  rest: T.boss.quickRest,
  events: [{ at: 0, kind: "metal", shear: "rising" }],
};
const rear: AttackPattern = {
  name: "後方除草・反転掃討：回避",
  windup: 1050,
  stationary: true,
  rest: T.boss.rearRest,
  events: [{ at: 0, kind: "metal", shear: "sweep", unblockable: true }],
};
export class Boss {
  selected: AttackPattern | undefined;
  rearReadyTurn = 0;
  rearOpportunity = 0;

  x = T.dummy.x;
  phase = 1;
  turn = 0;
  transition = 0;
  facing = -1;
  get pattern() {
    const sequence =
      this.phase === 1
        ? [irrigation, shears, feed, charge, rising, irrigation, overhead, feed]
        : [mixed, rush, quake, feed, charge, overhead, mixed, rising, feed];
    const base = this.selected ?? sequence[this.turn % sequence.length];
    if (this.phase !== 2 || base === rear) return base;
    const last = base.events[base.events.length - 1];
    return {
      ...base,
      name: base.name + "＋追撃",
      events: [
        ...base.events,
        base === charge || base === rush || base === overhead
          ? { at: last.at + 1100, kind: "quake" as const }
          : {
              at: last.at + 850,
              kind: "metal" as const,
              shear: "sweep" as const,
            },
      ],
    };
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
  next(targetX?: number) {
    this.turn++;
    this.selected = undefined;
    if (targetX === undefined) return;
    const distance = Math.abs(targetX - this.x);
    const behind = (targetX - this.x) * this.facing < 0;
    if (behind && distance < T.boss.meleeRange) {
      this.rearOpportunity++;
      if (this.turn >= this.rearReadyTurn && this.rearOpportunity % 2 === 1) {
        this.selected = rear;
        this.rearReadyTurn = this.turn + T.boss.rearCooldownTurns;
        return;
      }
    }
    // Resource slots remain available at every distance; other slots answer positioning.
    if (this.turn % 3 === 0) this.selected = this.turn % 2 ? irrigation : feed;
    else if (distance > T.boss.farDistance)
      this.selected = this.turn % 2 ? charge : irrigation;
    else if (distance < T.boss.nearDistance)
      this.selected = this.turn % 2 ? quick : rising;
    else this.selected = this.turn % 2 ? shears : overhead;
  }
  observe(hp: number) {
    if (hp > 0 && hp <= T.boss.hp * T.boss.phaseThreshold && this.phase === 1) {
      this.selected = undefined;
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
    this.selected = undefined;
    this.rearReadyTurn = 0;
    this.rearOpportunity = 0;
    this.x = T.dummy.x;
    this.phase = 1;
    this.turn = 0;
    this.transition = 0;
    this.facing = -1;
  }
}
