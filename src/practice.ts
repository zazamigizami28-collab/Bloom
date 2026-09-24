import {
  announceBloom,
  updateFlower,
  castFlower,
  updateWaves,
} from "./flower-system";
import type { PracticeCommand } from "./commands";
import { tuning as T } from "./data";
import { attackRect, overlaps, attackActive } from "./combat";
import { GameState } from "./game-state";
import type { ActionInput } from "./actions";
import type { GameEvent } from "./events";
import { movePlayer, resolveBossContact } from "./player-system";
import { updateEnemy, finishEnemyCycle } from "./enemy-system";
import { updateSpecial } from "./special-system";
export class Practice extends GameState {
  constructor(mode: "practice" | "boss" = "practice") {
    super();
    this.mode = mode;
    this.x = mode === "boss" ? T.boss.playerStartX : 610;
  }
  debug = { stopAI: false, invincible: false, speed: 1 };
  events: GameEvent[] = [];
  emit(event: GameEvent) {
    this.events.push(event);
  }
  drainEvents() {
    return this.events.splice(0);
  }
  command(command: PracticeCommand) {
    switch (command.type) {
      case "mode":
        this.mode = command.value;
        this.begin(true);
        break;
      case "begin":
        this.begin(true);
        break;
      case "pause":
        this.pause(command.value);
        break;
      case "pattern":
        this.pattern = command.value;
        this.projectiles = [];
        this.waves = [];
        this.restartCycle();
        break;
      case "heal":
        this.healAt = -1;
        this.hp = T.player.hp;
        this.deadAt = -1;
        this.introAt = -1;
        break;
      case "replay":
        this.healAt = -1;
        if (this.mode === "boss") {
          this.reset(false);
          break;
        }
        this.projectiles = [];
        this.waves = [];
        this.finisherAt = -9999;
        this.finisherDone = true;
        this.attackAt = -9999;
        this.breakMeter.reset();
        this.defeatedAt = -1;
        this.dummyHP = this.enemyHPMax;
        this.freeze = 0;
        this.restartCycle();
        break;
      case "break":
        if (this.started && this.deadAt < 0 && this.defeatedAt < 0)
          this.addBreak(T.break.max);
        break;
      case "growth":
        this.flower.setStage(command.value);
        if (command.value === 3) announceBloom(this);
        break;
      case "fertilize":
        this.flower.absorb("fertilizer");
        break;
      case "reset":
        this.reset(true);
        break;
      case "debug":
        this.debug = { ...this.debug, ...command.value };
        break;
    }
  }
  begin(withIntro = false) {
    this.paused = false;
    this.started = true;
    this.reset(false);
    if (withIntro && this.mode === "boss") {
      this.introAt = this.clock;
      this.emit({ type: "sound", kind: "startup" });
      this.say("園芸管理機 HRT-01 / 起動", T.encounter.intro);
    }
  }
  defeat() {
    if (this.deadAt >= 0) return;
    this.deadAt = this.clock;
    this.introAt = -1;
    this.healAt = -1;
    this.projectiles = [];
    this.waves = [];
    this.emit({ type: "sound", kind: "defeat" });
    this.say("まだ、芽吹ける。", T.retry);
  }
  pause(v: boolean) {
    this.paused = v;
  }
  restartCycle() {
    if (this.mode === "boss") this.boss.facing = this.x < this.enemyX ? -1 : 1;
    this.cycle = -500;
    this.resolved.clear();
    this.cued.clear();
  }
  reset(stats: boolean) {
    this.boss.reset();
    this.healAt = -1;
    this.healsLeft = T.heal.charges;
    this.rollAt = -9999;
    this.rollReady = 0;
    this.rollFace = 1;
    this.hp = T.player.hp;
    this.x = this.mode === "boss" ? T.boss.playerStartX : 610;
    this.y = T.world.ground;
    this.vy = 0;
    this.face = 1;
    this.attackFace = 1;
    this.attackHit = false;
    this.recoil = 0;
    this.deadAt = -1;
    this.introAt = -1;
    this.parryAt = -9999;
    this.attackAt = -9999;
    this.hurtAt = -9999;
    this.enemyHitAt = -9999;
    this.parryReady = 0;
    this.buffer = -9999;
    this.combo = 0;
    this.dummyHP = this.enemyHPMax;
    this.breakMeter.reset();
    this.defeatedAt = -1;
    this.freeze = 0;
    this.events = [];
    this.emit({ type: "clear" });
    this.flower.reset();
    this.projectiles = [];
    this.absorbed = [];
    this.waves = [];
    this.finisherAt = -9999;
    this.finisherDone = true;
    this.restartCycle();
    if (stats) {
      this.best = 0;
      this.success = 0;
      this.attempts = 0;
    }
    this.message = "近接は収束と合図音、弾は届く瞬間に";
    this.messageUntil = this.clock + 1800;
  }
  addBreak(amount: number) {
    if (
      this.defeatedAt >= 0 ||
      (this.mode === "boss" && this.boss.transition > 0)
    )
      return;
    if (this.breakMeter.add(amount)) {
      this.projectiles = [];
      this.freeze = T.break.stop;
      this.recoil = 22;
      this.resolved = new Set(this.attackPattern.events.map((_, i) => i));
      this.emit({ type: "sound", kind: "break" });
      this.emit({
        type: "impact",
        x: this.enemyX - 25,
        y: T.world.ground - 65,
        kind: "break",
      });
      this.emit({ type: "feedback", kind: "break" });
      this.say("BREAK  /  近づいて J：決めの一撃", 1600);
    }
  }
  hitDummy(damage: number) {
    if (
      this.defeatedAt >= 0 ||
      (this.mode === "boss" && this.boss.transition > 0)
    )
      return;
    if (damage <= 0) return;
    if (this.mode === "boss") {
      this.enemyHitAt = this.clock;
      this.freeze = Math.max(this.freeze, T.bossHit.stop);
    }
    this.dummyHP = Math.max(0, this.dummyHP - damage);
    if (this.mode === "boss" && this.boss.observe(this.dummyHP)) {
      this.projectiles = [];
      this.waves = [];
      this.breakMeter.reset();
      this.restartCycle();
      this.emit({ type: "sound", kind: "phase" });
      this.emit({ type: "bloom", x: this.enemyX, y: T.world.ground - 90 });
      this.say(
        "HRT-01・過給運転  /  高枝の最終段は赤い攻撃",
        T.boss.transition,
      );
    }
    if (this.dummyHP === 0) {
      this.healAt = -1;
      this.defeatedAt = this.clock;
      this.breakMeter.reset();
      this.projectiles = [];
      this.restartCycle();
      if (this.mode === "boss") {
        this.waves = [];
        this.emit({ type: "sound", kind: "victory" });
        this.emit({ type: "bloom", x: this.enemyX, y: T.world.ground - 110 });
        this.say("温室に、穏やかな風が戻った。", 999999);
      } else this.say("稽古達成！ 練習機を再起動中", T.dummy.resetDelay);
    }
  }
  say(text: string, duration = 1100) {
    this.message = text;
    this.messageUntil = this.clock + duration;
  }
  update(input: ActionInput, delta: number) {
    if (input.start && !this.started) this.begin(true);
    if (input.pause && this.started) this.pause(!this.paused);
    if (!this.started || this.paused) return;
    if (this.freeze > 0) {
      this.freeze -= delta;
      if (input.parry && !this.rolling && !this.healing)
        this.buffer = this.clock + T.parry.buffer;
      this.emit({ type: "tick", dt: Math.min(delta, 34) * 0.2 });
      return;
    }
    const dt = Math.min(delta, 34) * this.debug.speed;
    this.clock += dt;
    this.emit({ type: "tick", dt: dt });
    if (this.deadAt >= 0) {
      this.introAt = -1;
      if (this.clock - this.deadAt > T.retry) this.reset(false);
      return;
    }
    if (this.introAt >= 0) {
      if (this.clock - this.introAt >= T.encounter.intro) {
        this.introAt = -1;
        this.restartCycle();
      }
      return;
    }
    if (this.mode === "boss" && this.defeatedAt >= 0) return;
    if (this.mode === "boss" && this.boss.transition > 0) {
      this.healAt = -1;
      this.boss.tick(dt);
      this.rollAt = -9999;
      this.parryAt = -9999;
      this.buffer = -9999;
      this.attackAt = -9999;
      this.finisherAt = -9999;
      this.finisherDone = true;
      if (this.boss.transition === 0) this.restartCycle();
      return;
    }
    updateFlower(this, dt);
    updateWaves(this, dt);
    if (
      this.mode === "boss" &&
      (this.defeatedAt >= 0 || this.boss.transition > 0)
    )
      return;
    if (
      this.mode === "practice" &&
      this.defeatedAt >= 0 &&
      this.clock - this.defeatedAt >= T.dummy.resetDelay
    ) {
      this.defeatedAt = -1;
      this.dummyHP = this.enemyHPMax;
      this.breakMeter.reset();
      this.restartCycle();
    }
    if (this.clock - this.finisherAt < T.finisher.recovery) {
      if (
        !this.finisherDone &&
        this.clock - this.finisherAt >= T.finisher.startup
      ) {
        this.finisherDone = true;
        this.hitDummy(this.flower.damage(T.finisher.damage));
        this.breakMeter.reset();
        if (
          this.mode === "boss" &&
          this.defeatedAt < 0 &&
          this.boss.transition === 0
        )
          this.boss.next(this.x);
        this.restartCycle();
        this.freeze = T.finisher.stop;
        this.recoil = 28;
        this.emit({
          type: "impact",
          x: this.enemyX - 12,
          y: T.world.ground - 65,
          kind: "finisher",
        });
        this.emit({ type: "sound", kind: "finisher" });
        this.emit({ type: "feedback", kind: "finisher" });
        if (this.dummyHP > 0) this.say("決めの一撃！", 1000);
      }
      return;
    }
    if (this.breakMeter.tick(dt)) {
      if (this.mode === "boss") this.boss.next(this.x);
      this.restartCycle();
    }
    if (
      input.heal &&
      !this.healing &&
      this.playerAction === "idle" &&
      this.hp < T.player.hp &&
      this.healsLeft > 0 &&
      this.y >= T.world.ground
    ) {
      this.healAt = this.clock;
      this.parryAt = -9999;
      this.buffer = -9999;
      this.attackAt = -9999;
      this.say("修復中… 1.2秒", T.heal.duration);
    }
    if (this.healing) {
      // Resolve incoming attacks before completion, including the deadline frame.
      updateEnemy(this, dt);
      resolveBossContact(this);
      updateSpecial(this, dt);
      if (
        this.healing &&
        this.deadAt < 0 &&
        this.clock - this.healAt >= T.heal.duration
      ) {
        const restored = Math.min(T.heal.amount, T.player.hp - this.hp);
        this.hp += restored;
        this.healsLeft--;
        this.healAt = -1;
        this.emit({ type: "sound", kind: "heal" });
        this.emit({ type: "heal", x: this.x, y: this.y - 40 });
        this.say(`HP +${restored} / 修復完了`, 900);
      }
      finishEnemyCycle(this);
      return;
    }
    if (
      input.roll &&
      !this.rolling &&
      this.clock >= this.rollReady &&
      this.y >= T.world.ground
    ) {
      this.rollAt = this.clock;
      this.rollReady = this.clock + T.roll.cooldown;
      this.rollFace = input.move ? Math.sign(input.move) : this.face;
      this.face = this.rollFace;
      this.parryAt = -9999;
      this.buffer = -9999;
      this.attackAt = -9999;
      this.emit({ type: "sound", kind: "swing" });
    }
    if (this.rolling) {
      movePlayer(this, {}, dt, false);
      updateEnemy(this, dt);
      updateSpecial(this, dt);
      finishEnemyCycle(this);
      return;
    }
    resolveBossContact(this);
    if (input.parry) this.buffer = this.clock + T.parry.buffer;
    if (this.buffer >= this.clock && this.clock >= this.parryReady) {
      this.parryAt = this.clock;
      this.parryReady = this.clock + Math.max(T.parry.recovery, T.parry.window);
      this.buffer = -9999;
      this.attackAt = -9999;
    }
    if (
      input.attack &&
      this.breakMeter.broken &&
      this.defeatedAt < 0 &&
      overlaps(attackRect(this.x, this.y, this.face), this.enemyRect)
    ) {
      this.finisherAt = this.clock;
      this.finisherDone = false;
      this.emit({ type: "sound", kind: "charge" });
      this.attackAt = -9999;
      this.parryAt = -9999;
      this.projectiles = [];
      this.say("決めの一撃", 800);
      return;
    }
    const guarding = this.clock - this.parryAt <= T.parry.window;
    const attacking = this.clock - this.attackAt < T.weapon.recovery;
    if (
      input.attack &&
      !guarding &&
      !attacking &&
      this.clock >= this.parryReady
    ) {
      this.attackAt = this.clock;
      this.attackFace = this.face;
      this.attackHit = false;
      this.emit({ type: "sound", kind: "swing" });
      castFlower(this);
    }
    movePlayer(this, input, dt, guarding);
    const age = this.clock - this.attackAt;
    if (
      this.defeatedAt < 0 &&
      !this.attackHit &&
      attackActive(age) &&
      overlaps(attackRect(this.x, this.y, this.attackFace), this.enemyRect)
    ) {
      this.attackHit = true;
      const damage = this.flower.damage(T.weapon.damage);
      this.hitDummy(damage);
      this.emit({ type: "sound", kind: "hit" });
      this.freeze = Math.max(this.freeze, T.weapon.stop);
      this.recoil = 8;
      this.emit({
        type: "impact",
        x: this.enemyX - 20,
        y: this.y - 45,
        kind: "hit",
      });
      const wasBroken = this.breakMeter.broken;
      this.addBreak(T.break.attack);
      if (wasBroken) this.say(`好機！  ${damage} ダメージ`, 500);
    }
    updateEnemy(this, dt);
    resolveBossContact(this);
    updateSpecial(this, dt);
    if (this.breakMeter.broken) this.projectiles = [];
    finishEnemyCycle(this);
    this.recoil *= Math.pow(0.85, dt / 16);
  }
}
