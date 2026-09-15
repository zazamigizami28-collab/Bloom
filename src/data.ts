export const tuning = {
  player: {
    hp: 5,
    speed: 245,
    jump: 530,
    gravity: 1550,
    invulnerability: 850,
    width: 30,
    height: 59,
  },
  parry: {
    window: 180,
    perfect: 60,
    recovery: 330,
    buffer: 80,
    stop: 65,
    perfectStop: 105,
    range: 87,
  },
  weapon: {
    damage: 10,
    startup: 65,
    active: 110,
    recovery: 330,
    range: 98,
    height: 78,
    offsetY: -82,
    stop: 35,
  },
  dummy: {
    x: 755,
    hp: 100,
    width: 70,
    height: 118,
    range: 175,
    damage: 1,
    active: 115,
    rest: 1250,
    resetDelay: 1400,
  },
  break: {
    max: 100,
    parry: 28,
    perfect: 38,
    attack: 4,
    duration: 3000,
    damageMultiplier: 1,
    decayDelay: 3500,
    decayPerSecond: 6,
    stop: 150,
  },
  finisher: { damage: 38, startup: 220, recovery: 650, stop: 190 },
  flower: { thresholds: [0, 2, 4, 6], fertilizerMax: 3, fertilizerDamage: 2 },
  boss: {
    hp: 650,
    phaseThreshold: 0.5,
    transition: 1400,
    rest: 800,
    quakeRange: 430,
    quakeHeight: 28,
  },
  bloom: {
    duration: 20000,
    attackBonus: 4,
    waterExtension: 2000,
    waveCooldown: 2400,
    waveSpeed: 620,
    waveRange: 340,
    waveRadius: 18,
    waveDamage: 14,
    waveBreak: 8,
  },
  special: { speed: 280, radius: 10, breakGain: 12, stop: 90 },
  world: { ground: 454, left: 45, right: 980 },
  feedback: {
    shake: 0.006,
    particles: 38,
    perfectParticles: 58,
    breakParticles: 90,
    gravity: 650,
    colors: [0xfff4bc, 0xffd45c, 0xff9a3c, 0xff6354, 0xff82a4],
  },
  retry: 900,
};
export type AttackEvent = Readonly<{
  at: number;
  kind: "metal" | "water" | "fertilizer" | "quake";
}>;
export interface AttackPattern {
  readonly name: string;
  readonly windup: number;
  readonly events: readonly AttackEvent[];
}
export const patterns = {
  single: {
    name: "振り下ろし",
    windup: 850,
    events: [{ at: 0, kind: "metal" }],
  },
  triple: {
    name: "三連撃",
    windup: 850,
    events: [
      { at: 0, kind: "metal" },
      { at: 440, kind: "metal" },
      { at: 880, kind: "metal" },
    ],
  },
  water: { name: "散水", windup: 850, events: [{ at: 0, kind: "water" }] },
  fertilizer: {
    name: "施肥",
    windup: 1050,
    events: [{ at: 0, kind: "fertilizer" }],
  },
  garden: {
    name: "育成連携",
    windup: 850,
    events: [
      { at: 0, kind: "metal" },
      { at: 850, kind: "water" },
      { at: 1650, kind: "metal" },
      { at: 2500, kind: "fertilizer" },
    ],
  },
  delay: { name: "溜め打ち", windup: 1450, events: [{ at: 0, kind: "metal" }] },
} satisfies Record<string, AttackPattern>;
export type Pattern = keyof typeof patterns;
export function parryGrade(age: number, windowMs: number) {
  return age >= 0 && age <= windowMs
    ? age <= tuning.parry.perfect
      ? "perfect"
      : "parry"
    : "miss";
}
