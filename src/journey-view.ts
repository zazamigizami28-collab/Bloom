import type { GameSnapshot } from "./game-state";
import type { ViewResources } from "./scene-view";
import type { Sparks } from "./effects";
import { pot, plant } from "./render";
import { tuning as T } from "./data";
export function drawJourney(s: GameSnapshot, v: ViewResources, sparks: Sparks) {
  const g = v.g;
  g.clear();
  const hub = s.location === "hub",
    gate = s.location === "gate";
  // Reuse the established garden inhabitants and flower rendering.
  pot(g, s.x, s.y, s.face, s.vy ? 0 : Math.sin(s.clock / 80) * 2, false, 0);
  if (hub) {
    pot(g, 650, T.world.ground, -1, 0, false, 0);
    plant(g, 650, T.world.ground, s.restoredGarden ? 3 : 1, 0, s.clock);
    for (let i = 0; i < 5; i++)
      plant(
        g,
        180 + i * 140,
        T.world.ground,
        s.restoredGarden ? 3 : 1,
        0,
        s.clock,
      );
  } else {
    for (let i = 0; i < 4; i++)
      plant(g, 220 + i * 190, T.world.ground, 1, 0, s.clock);
    g.lineStyle(6, gate && s.pathValve ? 0x88e5dc : 0x4b777a);
    g.lineBetween(100, T.world.ground + 8, 900, T.world.ground + 8);
    g.strokeCircle(gate ? 490 : 420, T.world.ground - 20, 18);
  }
  sparks.draw(g);
  v.hud.setText(
    hub ? "小さな庭 / 拠点" : gate ? "温室前 / 水門" : "水路沿い / 短い探索",
  );
  v.readout.setText("A/D 移動  W ジャンプ\nJ / パッドX 調べる");
  v.breakText.setText(
    hub
      ? s.restoredGarden
        ? "温室の水が戻った"
        : "温室へ向かおう"
      : gate
        ? "水門を開いて温室へ"
        : "水の行方をたどる",
  );
  v.label.setPosition(hub ? 650 : gate ? 490 : 420, 340);
  v.label.setText(
    hub
      ? s.restoredGarden
        ? "♪"
        : "！"
      : gate
        ? s.pathValve
          ? "水門：開"
          : "水門：J / X"
        : s.pathWater
          ? "💧"
          : "水路：J / X",
  );
  v.hint.setText(
    s.clock < s.messageUntil
      ? s.message
      : hub
        ? "右へ進むと水路 / 住人に近づいて J"
        : gate
          ? "中央の水門を調べ、右端から温室へ"
          : "水路を調べて右へ / 左端で拠点へ",
  );
  v.flowerText.setText(
    hub
      ? "中央左：休息 ♡    右端：出発 →"
      : gate
        ? "← 水路     右端：HRT-01 →"
        : "← 拠点     右端：温室前 →",
  );
}
