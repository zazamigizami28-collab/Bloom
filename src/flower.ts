import { tuning as T } from "./data";
export type Nutrient = "water" | "fertilizer";
export type FlowerPhase = "growing" | "blooming";
export class Flower {
  water = 0;
  fertilizer = 0;
  remaining = 0;
  waveCooldown = 0;
  get blooming() {
    return this.remaining > 0;
  }
  get phase(): FlowerPhase {
    return this.blooming ? "blooming" : "growing";
  }
  get stage() {
    return this.blooming
      ? 3
      : this.water >= T.flower.thresholds[2]
        ? 2
        : this.water >= T.flower.thresholds[1]
          ? 1
          : 0;
  }
  get name() {
    return ["種", "芽", "蕾", "ひまわり・開花"][this.stage];
  }
  absorb(kind: Nutrient) {
    if (kind === "fertilizer") {
      this.fertilizer = Math.min(T.flower.fertilizerMax, this.fertilizer + 1);
      return false;
    }
    if (this.blooming) {
      this.remaining = Math.min(
        T.bloom.duration,
        this.remaining + T.bloom.waterExtension,
      );
      return false;
    }
    this.water = Math.min(T.flower.thresholds[3], this.water + 1);
    if (this.water === T.flower.thresholds[3]) {
      this.remaining = T.bloom.duration;
      this.waveCooldown = 0;
      return true;
    }
    return false;
  }
  tick(dt: number) {
    this.waveCooldown = Math.max(0, this.waveCooldown - dt);
    if (!this.blooming) return false;
    this.remaining = Math.max(0, this.remaining - dt);
    if (!this.blooming) {
      this.water = 0;
      this.waveCooldown = 0;
      return true;
    }
    return false;
  }
  useWave() {
    if (!this.blooming || this.waveCooldown > 0) return false;
    this.waveCooldown = T.bloom.waveCooldown;
    return true;
  }
  damage(base: number) {
    return (
      base +
      this.fertilizer * T.flower.fertilizerDamage +
      (this.blooming ? T.bloom.attackBonus : 0)
    );
  }
  reset() {
    this.water = 0;
    this.fertilizer = 0;
    this.remaining = 0;
    this.waveCooldown = 0;
  }
  setStage(stage: number) {
    if (Number.isInteger(stage) && stage >= 0 && stage < 4) {
      this.water = T.flower.thresholds[stage];
      this.remaining = stage === 3 ? T.bloom.duration : 0;
      this.waveCooldown = 0;
    }
  }
}
