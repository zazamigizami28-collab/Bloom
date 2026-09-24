import { presentation as P } from "./presentation";
import type { GameEvent } from "./events";
import type { AudioFeedback } from "./audio";
import type { Sparks } from "./effects";
export function presentEvents(
  events: readonly GameEvent[],
  audio: AudioFeedback,
  sparks: Sparks,
  shake: (duration: number, intensity: number) => void,
) {
  for (const event of events) {
    switch (event.type) {
      case "feedback":
        shake(P[event.kind].shakeDuration, P[event.kind].shake);
        break;
      case "sound":
        audio.play(event.kind);
        break;
      case "impact":
        sparks.burst(event.x, event.y, event.kind);
        break;
      case "seed":
        sparks.seed(event.x, event.y);
        break;
      case "bloom":
        sparks.bloom(event.x, event.y);
        break;
      case "heal":
        sparks.heal(event.x, event.y);
        break;
      case "growth":
        sparks.growth(event.x, event.y);
        break;
      case "shake":
        shake(event.duration, event.intensity);
        break;
      case "tick":
        sparks.update(event.dt);
        break;
      case "clear":
        sparks.clear();
        break;
      default: {
        const unreachable: never = event;
        throw new Error(String(unreachable));
      }
    }
  }
}
