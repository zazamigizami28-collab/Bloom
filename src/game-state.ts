import { Boss } from "./boss";
import { tuning as T, patterns, type Pattern } from "./data";
import { BreakMeter } from "./combat";
import { Flower, type Nutrient } from "./flower";
export type SessionStatus = "ready" | "running" | "paused" | "dead";
export type PlayerAction = "idle" | "parry" | "attack" | "finisher";
export type EnemyStatus = "active" | "broken" | "defeated";
export class GameState {
  mode: "practice" | "boss" = "practice";
  boss = new Boss();
  get attackPattern() {
    return this.mode === "boss" ? this.boss.pattern : patterns[this.pattern];
  }
  get enemyHPMax() {
    return this.mode === "boss" ? T.boss.hp : T.dummy.hp;
  }
  get enemyFacing() {
    return this.mode === "boss" ? this.boss.facing : -1;
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
  message = "黄色い光に合わせて K / RB";
  messageUntil = 0;
  breakMeter = new BreakMeter();
  defeatedAt = -1;
  attackFace = 1;
  flower = new Flower();
  projectiles: { x: number; y: number; kind: Nutrient; direction?: number }[] =
    [];
  absorbed: { x: number; y: number; age: number; kind: Nutrient }[] = [];
  finisherAt = -9999;
  finisherDone = true;
  deadAt = -1;
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
    mode: state.mode,
    boss: { phase: state.boss.phase, transition: state.boss.transition },
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
