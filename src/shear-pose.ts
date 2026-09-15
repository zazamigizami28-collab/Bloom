import type { AttackEvent } from "./data";
import { tuning as T } from "./data";
// Local coordinates from the machine centre; shared by the arm and cue light.
export function shearPose(
  shear: AttackEvent["shear"],
  wind: number,
  active: boolean,
  recoil: number,
) {
  const variant = shear ?? "sweep";
  const reach = active
    ? T.boss.meleeRange - 32
    : variant === "overhead"
      ? 68
      : variant === "rising"
        ? 130
        : 80;
  const height = active
    ? 58
    : variant === "overhead"
      ? 160 + wind * 155
      : variant === "rising"
        ? 45 - wind * 15
        : 100 + wind * 35;
  return {
    reach: reach - recoil * 1.4,
    height: height + recoil * 1.1,
    opening: active ? 8 : 20 + wind * 24,
  };
}
