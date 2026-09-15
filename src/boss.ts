import { tuning as T, type AttackPattern } from "./data";
const irrigation: AttackPattern = {
  name: "噴水ノズル・交互射出",
  windup: 950,
  events: [
    { at: 0, kind: "pellet" },
    { at: 520, kind: "pellet" },
    { at: 1040, kind: "water" },
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
const rush: AttackPattern = {
  name: "剪定三連",
  windup: 850,
  events: [
    { at: 0, kind: "metal", shear: "sweep" },
    { at: 720, kind: "metal", shear: "rising" },
    { at: 1680, kind: "metal", shear: "overhead" },
  ],
};
const mixed: AttackPattern = {
  name: "過給噴水・交互射出",
  windup: 900,
  events: [
    { at: 0, kind: "pellet" },
    { at: 460, kind: "pellet" },
    { at: 920, kind: "water" },
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
  name: "後方除草・反転掃討",
  windup: 1050,
  stationary: true,
  rest: T.boss.rearRest,
  events: [{ at: 0, kind: "metal", shear: "sweep" }],
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
        ? [
            irrigation,
            shears,
            shears,
            charge,
            rising,
            irrigation,
            overhead,
            shears,
          ]
        : [
            mixed,
            rush,
            rising,
            shears,
            charge,
            overhead,
            mixed,
            rising,
            shears,
          ];
    const base = this.selected ?? sequence[this.turn % sequence.length];
    // Distinct rhythms; ranged cadence stays as evaluated in v0.6.7.
    const rhythm =
      base === shears
        ? [0, 360, 1560, 2440]
        : base === overhead
          ? [0, 900, 1720, 2820]
          : base === rising
            ? [0, 680, 1500, 2460]
            : base === quick
              ? [0, 460, 1340, 2200]
              : base === charge
                ? [0, 1000, 1820, 2920]
                : base === rear
                  ? [0, 780, 1740, 2660]
                  : [0, 320, 1420, 2520];
    const ranged = base === irrigation || base === mixed;
    const events = [...base.events];
    while (events.length < 3)
      events.push({ at: 0, kind: "metal", shear: "sweep" });
    if (this.phase === 2) events.push({ at: 0, kind: "metal", shear: "sweep" });
    for (let i = 0; i < events.length; i++) {
      const event = events[i];
      events[i] = {
        ...event,
        at: ranged
          ? i < 3
            ? base.events[i].at
            : base.events[2].at + 950
          : rhythm[i],
        unblockable: base === overhead && i === events.length - 1,
        shear:
          !ranged && i === events.length - 1 && event.kind === "metal"
            ? "overhead"
            : event.shear,
      };
    }
    return {
      ...base,
      name: base.name + (this.phase === 2 ? "・四連" : "・三連"),
      events,
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
    if (this.turn % 3 === 0)
      this.selected = this.turn % 2 ? irrigation : shears;
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
