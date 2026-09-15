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
  const before = game.x;
  if (game.rolling) {
    game.x = clamp(
      game.x +
        (game.rollFace *
          T.roll.speed *
          Math.min(dt, T.roll.duration - (game.clock - game.rollAt))) /
          1000,
      T.world.left,
      T.world.right,
    );
    return;
  }
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
  resolveBossContact(game, before);
}

// Solid body outside a roll; retain the approach side even on large steps.
export function resolveBossContact(game: Practice, previousX = game.x) {
  if (game.mode !== "boss" || game.rolling || game.defeatedAt >= 0) return;
  if (game.y <= T.world.ground - T.boss.height) return;
  const gap = (T.boss.width + T.player.width) / 2;
  const side =
    previousX < game.enemyX ? -1 : previousX > game.enemyX ? 1 : -game.face;
  if (
    Math.abs(game.x - game.enemyX) < gap ||
    (previousX - game.enemyX) * (game.x - game.enemyX) < 0
  ) {
    game.x = clamp(game.enemyX + side * gap, T.world.left, T.world.right);
  }
}
