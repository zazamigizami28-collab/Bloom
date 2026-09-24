import type { Practice } from "./practice";
import type { ActionInput } from "./actions";
import { tuning as T } from "./data";
import { movePlayer } from "./player-system";
export function interactJourney(g: Practice) {
  if (g.location === "hub") {
    if (g.x > 820) {
      g.location = "path";
      g.x = 90;
      g.pathWater = false;
      g.pathValve = false;
    } else if (Math.abs(g.x - 420) < 100) {
      g.hp = T.player.hp;
      g.healsLeft = T.heal.charges;
      g.say("♡  準備はできた", 1400);
      g.emit({ type: "sound", kind: "heal" });
    } else if (Math.abs(g.x - 650) < 90)
      g.say(
        g.restoredGarden ? "♪  おかえり" : "！  温室の水が止まっている",
        1800,
      );
  } else if (g.location === "path") {
    if (g.x < 110) {
      g.location = "hub";
      g.x = 790;
    } else if (Math.abs(g.x - 420) < 85 && !g.pathWater) {
      g.pathWater = true;
      g.emit({ type: "growth", x: g.x, y: g.y - 70 });
      g.emit({ type: "sound", kind: "water" });
      g.say("💧  水路の先に温室", 1500);
    } else if (g.x > 850) {
      g.location = "gate";
      g.x = 90;
    }
  } else if (g.location === "gate") {
    if (g.x < 110) {
      g.location = "path";
      g.x = 800;
    } else if (Math.abs(g.x - 490) < 85) {
      g.pathValve = true;
      g.emit({ type: "sound", kind: "heal" });
      g.say("♪  水門が開いた", 1300);
    } else if (g.x > 830) {
      if (!g.pathValve) {
        g.say("！  水門を調べよう", 1300);
        return;
      }
      g.mode = "boss";
      g.begin(true);
    }
  }
}
export function updateJourney(g: Practice, input: ActionInput, delta: number) {
  const dt = Math.min(delta, 34) * g.debug.speed;
  g.clock += dt;
  g.emit({ type: "tick", dt });
  movePlayer(g, input, dt, false);
  if (input.attack) interactJourney(g);
}
