import type { SoundKind } from "./audio";
export type ImpactKind = "parry" | "perfect" | "break" | "finisher" | "hit";
export type GameEvent =
  | { type: "sound"; kind: SoundKind }
  | { type: "impact"; x: number; y: number; kind: ImpactKind }
  | { type: "seed"; x: number; y: number }
  | { type: "bloom"; x: number; y: number }
  | { type: "heal"; x: number; y: number }
  | { type: "growth"; x: number; y: number }
  | { type: "feedback"; kind: "break" | "finisher" }
  | { type: "shake"; duration: number; intensity: number }
  | { type: "tick"; dt: number }
  | { type: "clear" };
