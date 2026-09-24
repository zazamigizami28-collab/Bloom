import type { Pattern } from "./data";
export type PracticeCommand =
  | { type: "home" | "interact" }
  | { type: "mode"; value: "practice" | "boss" }
  | { type: "begin" | "heal" | "replay" | "break" | "fertilize" | "reset" }
  | { type: "pause"; value: boolean }
  | { type: "pattern"; value: Pattern }
  | { type: "growth"; value: number }
  | {
      type: "debug";
      value: Partial<{ stopAI: boolean; invincible: boolean; speed: number }>;
    };
export interface PracticeCommands {
  command(command: PracticeCommand): void;
}
