import { drawBoss } from "./boss-view";
import Phaser from "phaser";
import type { GameSnapshot } from "./game-state";
import type { Sparks } from "./effects";
import { tuning as T } from "./data";
import { pot, dummy, plant } from "./render";
import { attackRect, attackActive } from "./combat";
export interface ViewResources {
  g: Phaser.GameObjects.Graphics;
  hud: Phaser.GameObjects.Text;
  readout: Phaser.GameObjects.Text;
  hint: Phaser.GameObjects.Text;
  label: Phaser.GameObjects.Text;
  breakText: Phaser.GameObjects.Text;
  flowerText: Phaser.GameObjects.Text;
}
export function drawScene(
  scene: GameSnapshot,
  view: ViewResources,
  sparks: Sparks,
) {
  const checked = (id: string) =>
    (document.getElementById(id) as HTMLInputElement).checked;
  const g = view.g;
  g.clear();
  const p = scene.attackPattern,
    next = p.events.find(
      (event) =>
        scene.cycle <
        p.windup +
          event.at +
          (event.kind === "charge" ? T.boss.chargeDuration : T.dummy.active),
    ),
    time = next === undefined ? -999 : scene.cycle - (p.windup + next.at),
    wind =
      next === undefined
        ? 0
        : Phaser.Math.Clamp(1 + time / (next.at === 0 ? p.windup : 400), 0, 1),
    active =
      scene.boss.transition === 0 &&
      !scene.breakMeter.broken &&
      scene.defeatedAt < 0 &&
      time >= 0 &&
      !(
        next?.kind === "charge" &&
        scene.resolved.includes(p.events.indexOf(next))
      ) &&
      time < (next?.kind === "charge" ? T.boss.chargeDuration : T.dummy.active);
  if (scene.mode === "boss")
    drawBoss(g, scene, wind, active, next?.kind, next?.shear, time);
  else
    dummy(
      g,
      scene.enemyX,
      T.world.ground,
      scene.breakMeter.broken || scene.defeatedAt >= 0 ? 0 : wind,
      active,
      scene.recoil,
    );
  if (scene.rolling) {
    g.fillStyle(0x916647);
    g.fillCircle(scene.x, scene.y - 24, 23);
    const spin = ((scene.clock - scene.rollAt) / 45) * scene.rollFace;
    g.lineStyle(5, 0xffedab);
    g.lineBetween(
      scene.x - Math.cos(spin) * 20,
      scene.y - 24 - Math.sin(spin) * 20,
      scene.x + Math.cos(spin) * 20,
      scene.y - 24 + Math.sin(spin) * 20,
    );
    g.lineStyle(3, 0xf5d896, 0.6);
    g.lineBetween(
      scene.x - scene.rollFace * 30,
      scene.y - 8,
      scene.x - scene.rollFace * 65,
      scene.y - 8,
    );
  }
  if (
    !scene.rolling &&
    (scene.clock - scene.hurtAt > 160 || Math.floor(scene.clock / 70) % 2 === 0)
  )
    pot(
      g,
      scene.x,
      scene.y,
      scene.face,
      scene.vy ? 0 : Math.sin(scene.clock / 80) * 2,
      scene.clock - scene.parryAt < T.parry.window,
      scene.clock - scene.attackAt < T.weapon.startup + T.weapon.active
        ? (scene.clock - scene.attackAt) / (T.weapon.startup + T.weapon.active)
        : 0,
      scene.clock - scene.finisherAt,
    );
  if (
    next?.kind !== "quake" &&
    !(scene.mode === "boss" && next?.kind === "metal") &&
    scene.boss.transition === 0 &&
    time >= -(scene.mode === "boss" ? T.boss.cueLead : T.parry.cueLead) &&
    time < 0 &&
    !active &&
    !scene.breakMeter.broken &&
    scene.defeatedAt < 0
  ) {
    g.lineStyle(3, 0xfff1a0, 1);
    g.strokeCircle(
      scene.enemyX + scene.enemyFacing * 73,
      T.world.ground - 150,
      (scene.mode === "boss" ? 32 : 12) + Math.sin(scene.clock / 40) * 4,
    );
    g.lineBetween(
      scene.enemyX + scene.enemyFacing * 96,
      T.world.ground - 150,
      scene.enemyX + scene.enemyFacing * 50,
      T.world.ground - 150,
    );
  }
  if (scene.mode === "practice" && active && next?.kind === "metal") {
    g.lineStyle(6, 0xffe7a6, 0.8);
    g.beginPath();
    g.arc(
      scene.enemyX + scene.enemyFacing * 10,
      T.world.ground - 68,
      130,
      scene.enemyFacing < 0 ? Math.PI * 0.86 : -Math.PI * 0.4,
      scene.enemyFacing < 0 ? Math.PI * 1.4 : Math.PI * 0.14,
    );
    g.strokePath();
  }
  if (scene.clock - scene.parryAt < T.parry.window) {
    g.lineStyle(3, 0xdaf4bb, 0.85);
    g.beginPath();
    g.arc(
      scene.x,
      scene.y - 37,
      46,
      scene.face > 0 ? -1.2 : 1.94,
      scene.face > 0 ? 1.2 : 4.34,
    );
    g.strokePath();
  }
  const attackAge = scene.clock - scene.attackAt;
  if (attackActive(attackAge)) {
    const tip = scene.x + scene.attackFace * T.weapon.range;
    const f = (attackAge - T.weapon.startup) / T.weapon.active;
    g.fillStyle(0xffce7b, (1 - f) * 0.65);
    g.fillTriangle(
      scene.x,
      scene.y - 60,
      tip,
      scene.y - 36,
      tip - scene.attackFace * 12,
      scene.y - 56,
    );
    g.lineStyle(3, 0xffefd1, (1 - f) * 0.9);
    g.lineBetween(
      scene.x + scene.attackFace * 20,
      scene.y - 58,
      tip,
      scene.y - 36,
    );
    for (let i = 0; i < 3; i++) {
      g.lineStyle(2, 0xf3c58d, (1 - f) * 0.6);
      g.lineBetween(
        tip - scene.attackFace * (18 + i * 8),
        scene.y - 26 - i * 8,
        tip - scene.attackFace * 4,
        scene.y - 35 - i * 3,
      );
    }
  }
  plant(
    g,
    scene.x,
    scene.y,
    scene.flower.stage,
    scene.flower.fertilizer,
    scene.clock,
  );
  for (const w of scene.waves) {
    for (let i = 0; i < 7; i++) {
      const px = w.x - w.face * i * 7,
        py = w.y + Math.sin(w.distance / 24 - i * 0.7) * 12;
      g.fillStyle(i % 2 ? 0xfff0a6 : 0xffc950, 1 - i * 0.1);
      g.fillEllipse(px, py, 13, 7);
    }
    if (checked("attackbox")) {
      g.lineStyle(1, 0xffd05b);
      g.strokeRect(
        w.x - T.bloom.waveRadius,
        w.y - T.bloom.waveRadius,
        T.bloom.waveRadius * 2,
        T.bloom.waveRadius * 2,
      );
    }
  }
  for (const p of scene.projectiles) {
    g.fillStyle(
      p.kind === "water" ? 0x65d7f5 : p.kind === "pellet" ? 0xe8f6ff : 0xe6b455,
    );
    if (p.kind === "pellet") {
      g.fillTriangle(p.x - 13, p.y, p.x, p.y - 13, p.x + 13, p.y);
      g.fillTriangle(p.x - 13, p.y, p.x, p.y + 13, p.x + 13, p.y);
    } else if (p.kind === "water") {
      g.fillCircle(p.x, p.y + 3, T.special.radius);
      g.fillTriangle(p.x - 8, p.y, p.x, p.y - 15, p.x + 8, p.y);
    } else {
      g.fillRect(p.x - 9, p.y - 9, 18, 18);
    }
    g.lineStyle(3, p.kind === "water" ? 0xb8f6ff : 0xffdb92, 0.6);
    g.lineBetween(
      p.x - (p.direction ?? -1) * 8,
      p.y,
      p.x - (p.direction ?? -1) * 28,
      p.y,
    );
    if (checked("hitboxes")) {
      g.lineStyle(1, 0xffffff);
      g.strokeCircle(p.x, p.y, T.special.radius);
    }
  }
  for (const a of scene.absorbed) {
    const f = a.age / 450;
    const tx = scene.x,
      ty = scene.y - 72;
    for (let i = 0; i < 12; i++) {
      const q = Math.min(1, Math.max(0, f * 1.6 - i * 0.035));
      const px = a.x + (tx - a.x) * q + Math.sin(i * 2) * 18 * (1 - q),
        py = a.y + (ty - a.y) * q - Math.sin(q * Math.PI) * 40;
      g.fillStyle(a.kind === "water" ? 0x8ceeff : 0xffd274, 1 - f);
      g.fillCircle(px, py, 3 + (i % 3));
    }
  }
  if (scene.clock - scene.finisherAt < T.finisher.startup) {
    g.lineStyle(3, 0xffedb5);
    g.strokeCircle(
      scene.enemyX,
      T.world.ground - 65,
      28 + Math.sin(scene.clock / 35) * 4,
    );
  }
  sparks.draw(g);
  if (checked("hitboxes")) {
    g.lineStyle(1, 0xff667a);
    g.strokeRect(scene.x - 15, scene.y - 59, 30, 59);
    const box = scene.enemyRect;
    g.strokeRect(box.x, box.y, box.width, box.height);
    if (active)
      g.strokeRect(
        scene.enemyFacing < 0
          ? scene.enemyX -
              (scene.mode === "boss" ? T.boss.meleeRange : T.dummy.range)
          : scene.enemyX,
        T.world.ground - (scene.mode === "boss" ? T.boss.meleeHeight : 95),
        scene.mode === "boss" ? T.boss.meleeRange : T.dummy.range,
        scene.mode === "boss" ? T.boss.meleeHeight : 95,
      );
  }
  if (checked("hitboxes") || checked("attackbox")) {
    const a = attackRect(scene.x, scene.y, scene.attackFace);
    const age = scene.clock - scene.attackAt;
    if (age >= 0 && age < T.weapon.recovery) {
      g.lineStyle(
        2,
        attackActive(age) ? 0xffd05b : 0x99b9cd,
        attackActive(age) ? 1 : 0.4,
      );
      g.fillStyle(0xffbc49, attackActive(age) ? 0.16 : 0.025);
      g.fillRect(a.x, a.y, a.width, a.height);
      g.strokeRect(a.x, a.y, a.width, a.height);
    }
  }
  if (checked("parrybox")) {
    g.lineStyle(
      2,
      scene.clock - scene.parryAt < T.parry.window ? 0x99ffad : 0x829c99,
    );
    g.strokeRect(
      scene.face > 0 ? scene.x : scene.x - T.parry.range,
      scene.y - 90,
      T.parry.range,
      90,
    );
  }
  g.fillStyle(0x2b4236, 0.9);
  g.fillRect(362, 108, 300, 12);
  g.fillStyle(scene.breakMeter.broken ? 0xff9461 : 0xffcc6a);
  g.fillRect(
    364,
    110,
    296 *
      (scene.breakMeter.broken
        ? scene.breakMeter.remaining / T.break.duration
        : scene.breakMeter.value / T.break.max),
    8,
  );
  g.fillStyle(0x203e37, 0.85);
  g.fillRect(30, 510, 470, 44);
  g.fillStyle(scene.flower.blooming ? 0xffd757 : 0x8dbd88);
  g.fillRect(
    30,
    551,
    470 *
      (scene.flower.blooming
        ? scene.flower.remaining / T.bloom.duration
        : scene.flower.water / T.flower.thresholds[3]),
    3,
  );
  view.breakText.setText(
    scene.breakMeter.broken
      ? `BREAK  ${(scene.breakMeter.remaining / 1000).toFixed(1)}秒 / 近距離で J：決めの一撃`
      : `BREAK  ${Math.ceil(scene.breakMeter.value)} / ${T.break.max}`,
  );
  view.flowerText.setText(
    scene.flower.blooming
      ? `ひまわり 開花 ${(scene.flower.remaining / 1000).toFixed(1)}秒  / 攻撃 +${T.bloom.attackBonus}\n通常攻撃＋花風  ${scene.flower.waveCooldown > 0 ? `あと${(scene.flower.waveCooldown / 1000).toFixed(1)}秒` : "次の攻撃に追加"}`
      : `ひまわり  ${scene.flower.name}  水${scene.flower.water}/${T.flower.thresholds[3]}\n${T.flower.thresholds[3] - scene.flower.water}回の散水パリィで開花 / 開花中は通常攻撃に花風を追加`,
  );
  view.hud.setText(
    `花守り  ${"●".repeat(Math.max(0, scene.hp))}${"○".repeat(T.player.hp - Math.max(0, scene.hp))}\n${scene.flower.name}  水${scene.flower.water}/${T.flower.thresholds[3]} 肥料${scene.flower.fertilizer}/3`,
  );
  view.readout.setText(
    `連続成功  ${String(scene.combo).padStart(2, "0")}   /   BEST ${String(scene.best).padStart(2, "0")}\n成功 ${scene.success} / 接触 ${scene.attempts}`,
  );
  view.hint.setText(
    scene.clock < scene.messageUntil
      ? scene.message
      : scene.mode === "boss"
        ? next?.kind === "quake"
          ? "橙の地面：W / Aでジャンプ"
          : "打撃はK / RB。水と肥料も受け止めよう"
        : scene.x < 570
          ? "練習機に近づこう →"
          : scene.x > scene.enemyX
            ? "← 左側から向き合おう"
            : scene.pattern === "water" ||
                scene.pattern === "fertilizer" ||
                scene.pattern === "garden"
              ? "水・肥料は届く瞬間に K / RB"
              : "光ったら K / RB",
  );
  view.label.setText(
    scene.mode === "boss"
      ? `園芸管理機 HRT-01  ${scene.boss.phase === 1 ? "通常運転" : "過給運転"}\n${scene.defeatedAt >= 0 ? "鎮静完了" : scene.breakMeter.broken ? "BREAK — 決めの一撃" : p.name}\n${scene.dummyHP} / ${scene.enemyHPMax}`
      : `${scene.breakMeter.broken ? "機能停止 / 攻撃チャンス" : scene.defeatedAt >= 0 ? "再起動中" : p.name}\n練習機 ${scene.dummyHP} / ${T.dummy.hp}`,
  );
}
