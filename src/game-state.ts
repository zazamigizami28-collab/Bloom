import { Boss } from "./boss";
import {
  tuning as T,
  patterns,
  type Pattern,
  type AttackPattern,
} from "./data";
import { BreakMeter } from "./combat";
import { Flower, type Nutrient } from "./flower";
export type SessionStatus = "ready" | "running" | "paused" | "dead";
export type PlayerAction =
  | "idle"
  | "parry"
  | "attack"
  | "finisher"
  | "roll"
  | "heal";
export type EnemyStatus = "active" | "broken" | "defeated";
export class GameState {
  location: "hub" | "path" | "gate" | "battle" = "battle";
  restoredGarden = false;
  pathWater = false;
  pathValve = false;
  mode: "practice" | "boss" = "practice";
  boss = new Boss();
  get attackPattern(): AttackPattern {
    return this.mode === "boss" ? this.boss.pattern : patterns[this.pattern];
  }
  get enemyX() {
    return this.mode === "boss" ? this.boss.x : T.dummy.x;
  }
  get enemyWidth() {
    return this.mode === "boss" ? T.boss.width : T.dummy.width;
  }
  get enemyHeight() {
    return this.mode === "boss" ? T.boss.height : T.dummy.height;
  }
  get enemyRect() {
    return {
      x: this.enemyX - this.enemyWidth / 2,
      y: T.world.ground - this.enemyHeight,
      width: this.enemyWidth,
      height: this.enemyHeight,
    };
  }
  get enemyHPMax() {
    return this.mode === "boss" ? T.boss.hp : T.dummy.hp;
  }
  get enemyFacing() {
    return this.mode === "boss" ? this.boss.facing : -1;
  }
  healAt = -1;
  healsLeft = T.heal.charges;
  get healing() {
    return this.healAt >= 0;
  }
  rollAt = -9999;
  rollReady = 0;
  rollFace = 1;
  get rolling() {
    return this.clock - this.rollAt < T.roll.duration;
  }
  started = false;
  paused = false;
  clock = 0;
  freeze = 0;
  x = 610;
  y = T.world.ground;
  vy = 0;
  face = 1;
  hp = T.player.hp;
  parryAt = -9999;
  parryReady = 0;
  buffer = -9999;
  attackAt = -9999;
  attackHit = false;
  hurtAt = -9999;
  enemyHitAt = -9999;
  cycle = 0;
  resolved = new Set<number>();
  cued = new Set<number>();
  pattern: Pattern = "garden";
  combo = 0;
  best = 0;
  success = 0;
  attempts = 0;
  dummyHP = 100;
  recoil = 0;
  message = "近接は収束と合図音に K / RB";
  messageUntil = 0;
  breakMeter = new BreakMeter();
  defeatedAt = -1;
  attackFace = 1;
  flower = new Flower();
  projectiles: {
    x: number;
    y: number;
    kind: Nutrient | "pellet";
    direction?: number;
  }[] = [];
  absorbed: { x: number; y: number; age: number; kind: Nutrient }[] = [];
  finisherAt = -9999;
  finisherDone = true;
  deadAt = -1;
  introAt = -1;
  waves: {
    x: number;
    y: number;
    face: number;
    distance: number;
    damage: number;
  }[] = [];
  get sessionStatus(): SessionStatus {
    return !this.started
      ? "ready"
      : this.paused
        ? "paused"
        : this.deadAt >= 0
          ? "dead"
          : "running";
  }
  get playerAction(): PlayerAction {
    if (this.healing) return "heal";
    if (this.rolling) return "roll";
    return this.clock - this.finisherAt < T.finisher.recovery
      ? "finisher"
      : this.clock - this.parryAt <= T.parry.window
        ? "parry"
        : this.clock - this.attackAt < T.weapon.recovery
          ? "attack"
          : "idle";
  }
  get enemyStatus(): EnemyStatus {
    return this.defeatedAt >= 0
      ? "defeated"
      : this.breakMeter.broken
        ? "broken"
        : "active";
  }
}
export function snapshot(state: GameState) {
  return {
    location: state.location,
    restoredGarden: state.restoredGarden,
    pathWater: state.pathWater,
    pathValve: state.pathValve,
    mode: state.mode,
    healing: state.healing,
    healAt: state.healAt,
    healsLeft: state.healsLeft,
    rolling: state.rolling,
    rollAt: state.rollAt,
    rollFace: state.rollFace,
    boss: { phase: state.boss.phase, transition: state.boss.transition },
    enemyX: state.enemyX,
    enemyWidth: state.enemyWidth,
    enemyHeight: state.enemyHeight,
    enemyRect: state.enemyRect,
    enemyFacing: state.enemyFacing,
    enemyHPMax: state.enemyHPMax,
    attackPattern: {
      ...state.attackPattern,
      events: state.attackPattern.events.map((e) => ({ ...e })),
    },
    started: state.started,
    paused: state.paused,
    clock: state.clock,
    freeze: state.freeze,
    x: state.x,
    y: state.y,
    vy: state.vy,
    face: state.face,
    hp: state.hp,
    parryAt: state.parryAt,
    parryReady: state.parryReady,
    buffer: state.buffer,
    attackAt: state.attackAt,
    attackHit: state.attackHit,
    hurtAt: state.hurtAt,
    enemyHitAt: state.enemyHitAt,
    cycle: state.cycle,
    pattern: state.pattern,
    combo: state.combo,
    best: state.best,
    success: state.success,
    attempts: state.attempts,
    dummyHP: state.dummyHP,
    recoil: state.recoil,
    message: state.message,
    messageUntil: state.messageUntil,
    defeatedAt: state.defeatedAt,
    attackFace: state.attackFace,
    finisherAt: state.finisherAt,
    finisherDone: state.finisherDone,
    deadAt: state.deadAt,
    introAt: state.introAt,
    sessionStatus: state.sessionStatus,
    playerAction: state.playerAction,
    enemyStatus: state.enemyStatus,
    flower: {
      stage: state.flower.stage,
      phase: state.flower.phase,
      remaining: state.flower.remaining,
      blooming: state.flower.blooming,
      waveCooldown: state.flower.waveCooldown,
      name: state.flower.name,
      water: state.flower.water,
      fertilizer: state.flower.fertilizer,
    },
    breakMeter: {
      value: state.breakMeter.value,
      remaining: state.breakMeter.remaining,
      broken: state.breakMeter.broken,
    },
    projectiles: state.projectiles.map((p) => ({ ...p })),
    waves: state.waves.map((w) => ({ ...w })),
    absorbed: state.absorbed.map((p) => ({ ...p })),
    resolved: [...state.resolved],
    cued: [...state.cued],
  };
}
type DeepReadonly<T> = T extends object
  ? { readonly [K in keyof T]: DeepReadonly<T[K]> }
  : T;
export type GameSnapshot = DeepReadonly<ReturnType<typeof snapshot>>;
