import type { GameSnapshot } from "./game-state";
import { tuning as T } from "./data";
/** DOM presentation reads only the model clock; pause freezes every transition. */
export function renderEncounter(state: GameSnapshot) {
  const root = document.getElementById("encounter");
  if (!root) return;
  const intro = state.introAt >= 0;
  const defeat = state.deadAt >= 0;
  const victory = state.mode === "boss" && state.defeatedAt >= 0;
  const age =
    state.clock -
    (intro ? state.introAt : defeat ? state.deadAt : state.defeatedAt);
  const duration = intro
    ? T.encounter.intro
    : defeat
      ? T.retry
      : T.encounter.victoryReveal;
  root.hidden =
    !state.started ||
    state.paused ||
    !(intro || defeat || (victory && age < duration));
  if (root.hidden) return;
  const progress = Math.max(0, Math.min(1, age / duration));
  root.className = `encounter ${intro ? "awakening" : defeat ? "regrow" : "quiet"}`;
  root.style.setProperty("--progress", String(progress));
  root.style.opacity = String(
    Math.min(1, progress * 7 + 0.15) *
      (defeat ? 1 : Math.min(1, (1 - progress) * 6)),
  );
  document.getElementById("encounter-sub")!.textContent = intro
    ? "温室管理系統 / 再起動"
    : defeat
      ? "ひと息ついて"
      : "管理機、鎮静";
  document.getElementById("encounter-title")!.textContent = intro
    ? "HRT-01"
    : defeat
      ? "まだ、芽吹ける。"
      : "穏やかな風が戻る";
  document.getElementById("encounter-note")!.textContent = intro
    ? "園芸管理機"
    : defeat
      ? "まもなく再挑戦"
      : "温室に、新しい季節を。";
}
