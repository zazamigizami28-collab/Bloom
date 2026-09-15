import type { Practice } from "./practice";
import type { ActionInput } from "./actions";
import { tuning as T } from "./data";
import { clamp } from "./math";
export function movePlayer(
  game: Practice,
  input: ActionInput,
  dt: number,
  guarding: boolean,
) {
  if (input.move) {
    game.face = input.move > 0 ? 1 : -1;
    game.x = clamp(
      game.x +
        ((input.move * T.player.speed * dt) / 1000) * (guarding ? 0.5 : 1),
      T.world.left,
      T.world.right,
    );
  }
  if (input.jump && game.y >= T.world.ground) {
    game.vy = -T.player.jump;
  }
  game.vy += (T.player.gravity * dt) / 1000;
  game.y = Math.min(T.world.ground, game.y + (game.vy * dt) / 1000);
  if (game.y === T.world.ground) game.vy = 0;
}
