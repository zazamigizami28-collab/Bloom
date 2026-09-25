import type { GameSnapshot } from "./game-state";
import type { ViewResources } from "./scene-view";
import type { Sparks } from "./effects";
import { pot, plant, dummy } from "./render";
import { tuning as T } from "./data";
import { journeyTarget } from "./journey";
import { drawTelegraph } from "./telegraph";
export function drawJourney(s: GameSnapshot, v: ViewResources, sparks: Sparks) {
  const g = v.g;
  g.clear();
  const hub = s.location === "hub",
    path = s.location === "path";
  const camera = path
    ? Math.max(0, Math.min(T.journey.length - 1024, s.x - 420))
    : 0;
  g.setPosition(-camera, 0);
  // Flowers belong to visible pot-headed inhabitants, not empty floating stems.
  if (hub) {
    pot(g, 650, T.world.ground, -1, 0, false, 0);
    plant(g, 650, T.world.ground, s.restoredGarden ? 3 : 1, 0, s.clock);
    g.lineStyle(3, 0xbcebb1);
    g.strokeCircle(420, T.world.ground - 12, 22);
  } else {
    g.lineStyle(6, s.pathValve ? 0x88e5dc : 0x4b777a);
    g.lineBetween(
      40,
      T.world.ground + 8,
      path ? T.journey.length : 950,
      T.world.ground + 8,
    );
    g.strokeCircle(path ? 420 : 490, T.world.ground - 20, 18);
  }
  if (path) {
    g.fillStyle(0x54746b);
    g.fillRect(640, T.world.ground - 38, 60, 38);
    g.lineStyle(4, 0xffd88c);
    g.strokeRect(1070, T.world.ground - 60, 60, 60);
    for (const foe of s.scouts) {
      if (foe.hp <= 0) continue;
      const time = foe.strikeAt < 0 ? -9999 : s.clock - foe.strikeAt;
      g.save();
      g.translateCanvas(foe.x, 0);
      g.scaleCanvas(-foe.face, 1);
      dummy(
        g,
        0,
        T.world.ground,
        foe.strikeAt < 0 ? 0 : Math.max(0, 1 + time / T.journey.windup),
        s.clock < foe.attackUntil,
        0,
      );
      g.restore();
      g.fillStyle(0xe8c089);
      g.fillRect(
        foe.x - 30,
        T.world.ground - 155,
        (60 * foe.hp) / T.journey.foeHP,
        5,
      );
      // Visible threat range follows the committed facing.
      if (foe.strikeAt >= 0) {
        g.lineStyle(3, 0xffd18d);
        g.lineBetween(
          foe.x,
          T.world.ground - 45,
          foe.x + foe.face * T.journey.foeRange,
          T.world.ground - 45,
        );
      }
    }
  }
  pot(
    g,
    s.x,
    s.y,
    s.face,
    s.rolling ? 0 : Math.sin(s.clock / 80) * 2,
    s.clock - s.parryAt < T.parry.window,
    s.clock - s.attackAt < T.weapon.startup + T.weapon.active
      ? Math.max(
          0,
          (s.clock - s.attackAt) / (T.weapon.startup + T.weapon.active),
        )
      : 0,
  );
  if (s.rolling) {
    g.lineStyle(4, 0xffe3ab);
    g.strokeCircle(s.x, s.y - 26, 28);
  }
  sparks.draw(g);
  if (path)
    for (const foe of s.scouts)
      if (foe.hp > 0 && foe.strikeAt >= 0)
        drawTelegraph(
          g,
          foe.x + foe.face * 55,
          T.world.ground - 130,
          s.clock - foe.strikeAt,
        );
  const target = journeyTarget(s);
  v.label.setPosition(s.x - camera, Math.max(240, s.y - 110));
  v.label.setText(target ? "[ J / X ]  " + target : "");
  v.hud.setText(
    (hub ? "小さな庭" : path ? "水路沿い" : "温室前") +
      "  " +
      "●".repeat(Math.max(0, s.hp)),
  );
  v.readout.setText(
    "A/D 移動  W ジャンプ\nSpace 回避  J 攻撃/調べる  K パリィ",
  );
  v.breakText.setText(
    hub
      ? s.restoredGarden
        ? "♪ おかえり"
        : "温室へ向かおう"
      : path
        ? "温室まで " +
          Math.max(0, Math.ceil((T.journey.length - s.x) / 10)) +
          " m"
        : "水門を開いて温室へ",
  );
  v.hint.setText(
    s.clock < s.messageUntil
      ? s.message
      : hub
        ? "住人・休息場所・出口に近づくと J マーク"
        : path
          ? s.x < 600
            ? "A/Dで進む → 段差は W / Aでジャンプ"
            : s.x < 1350
              ? "枠の障害物は Space / Bでローリング"
              : "小型整備機：Jで攻撃、収束と合図音に Kでパリィ"
          : "水門を調べて温室へ",
  );
  v.flowerText.setText(
    hub
      ? "中央：休息   住人：会話   右端：出発"
      : path
        ? "移動 → ジャンプ → ローリング → 小型整備機2体"
        : "左端：水路へ   中央：水門   右端：温室",
  );
}
