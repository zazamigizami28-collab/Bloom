import { patterns, tuning as T } from "./data";
import type { PracticeCommands } from "./commands";
import type { GameSnapshot } from "./game-state";
import type { AudioFeedback } from "./audio";
import { clamp } from "./math";
const el = <T extends HTMLElement>(id: string) =>
  document.getElementById(id) as T;
export function bindControls(commands: PracticeCommands, audio: AudioFeedback) {
  const removers: (() => void)[] = [];
  const on = (target: EventTarget, event: string, handler: EventListener) => {
    target.addEventListener(event, handler);
    removers.push(() => target.removeEventListener(event, handler));
  };
  const click = (id: string, handler: () => void) =>
    on(el(id), "click", handler);
  click("play", () => {
    audio.unlock();
    commands.command({ type: "begin" });
  });
  click("bossMode", () => {
    audio.unlock();
    commands.command({ type: "mode", value: "boss" });
  });
  click("practiceMode", () => {
    audio.unlock();
    commands.command({ type: "mode", value: "practice" });
  });
  click("rematch", () => commands.command({ type: "mode", value: "boss" }));
  click("resume", () => commands.command({ type: "pause", value: false }));
  click("sound", () => {
    audio.muted = !audio.muted;
    el("sound").textContent = `音：${audio.muted ? "OFF" : "ON"}`;
  });
  on(el("pattern"), "change", () => {
    const value = el<HTMLSelectElement>("pattern").value;
    if (isPattern(value)) commands.command({ type: "pattern", value });
  });
  for (const [id, type] of [
    ["heal", "heal"],
    ["replay", "replay"],
    ["breakNow", "break"],
    ["fertilize", "fertilize"],
    ["reset", "reset"],
  ] as const)
    click(id, () => commands.command({ type }));
  on(el("growth"), "change", () =>
    commands.command({
      type: "growth",
      value: Number(el<HTMLSelectElement>("growth").value),
    }),
  );
  on(el("window"), "change", () => {
    const n = Number(el<HTMLInputElement>("window").value);
    T.parry.window = Number.isFinite(n) ? clamp(n, 60, 350) : 180;
    el<HTMLInputElement>("window").value = String(T.parry.window);
  });
  const debug = () => {
    const speed = Number(el<HTMLSelectElement>("speed").value);
    commands.command({
      type: "debug",
      value: {
        stopAI: el<HTMLInputElement>("stopAI").checked,
        invincible: el<HTMLInputElement>("invincible").checked,
        speed: Number.isFinite(speed) ? clamp(speed, 0.1, 2) : 1,
      },
    });
  };
  for (const id of ["stopAI", "invincible", "speed"])
    on(el(id), "change", debug);
  const volume = document.getElementById("volume") as HTMLInputElement | null;
  if (volume)
    on(volume, "input", () => audio.setVolume(Number(volume.value) / 100));
  debug();
  on(window, "blur", () => commands.command({ type: "pause", value: true }));
  on(document, "visibilitychange", () => {
    if (document.hidden) commands.command({ type: "pause", value: true });
  });
  return () => {
    for (const remove of removers.splice(0)) remove();
  };
}
function isPattern(value: string): value is keyof typeof patterns {
  return Object.hasOwn(patterns, value);
}
export function renderControls(state: GameSnapshot) {
  el("victory").hidden = !(state.mode === "boss" && state.defeatedAt >= 0);
  el<HTMLButtonElement>("bossMode").textContent =
    state.mode === "boss" ? "ボス戦をやり直す" : "番人に挑む";
  el<HTMLSelectElement>("pattern").disabled = state.mode === "boss";
  el("resume").textContent =
    state.mode === "boss" ? "戦闘に戻る" : "稽古に戻る";
  el("start").hidden = state.started;
  el("pause").hidden = !state.started || !state.paused;
  el<HTMLSelectElement>("pattern").value = state.pattern;
  el<HTMLSelectElement>("growth").value = String(state.flower.stage);
}
