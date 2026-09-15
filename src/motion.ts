import { tuning as T } from "./data";
import { presentation as P } from "./presentation";
export function finisherPose(age: number) {
  if (age < 0 || age >= T.finisher.recovery)
    return { offset: 0, crouch: 0, angle: 0.3, active: false };
  const windup = T.finisher.startup * P.finisher.windupFraction;
  if (age < windup) {
    const f = age / windup;
    return { offset: -8 * f, crouch: 6 * f, angle: -2.5 * f, active: true };
  }
  if (age < T.finisher.startup) {
    const f = (age - windup) / (T.finisher.startup - windup);
    return {
      offset: -8 + 26 * f * f,
      crouch: 6 + 4 * f,
      angle: -2.5 + 3.7 * f * f,
      active: true,
    };
  }
  const f =
    (age - T.finisher.startup) / (T.finisher.recovery - T.finisher.startup);
  return {
    offset: 18 * (1 - f),
    crouch: 10 * (1 - f),
    angle: 1.2 * (1 - f) + 0.3 * f,
    active: true,
  };
}
