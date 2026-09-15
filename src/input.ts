export class Controls {
  held = new Set<string>();
  pressed = new Set<string>();
  previous = new Set<string>();
  private keydown = (e: KeyboardEvent) => {
    const target = e.target as HTMLElement | null;
    if (
      target &&
      (target.matches?.("input,select,textarea") || target.isContentEditable)
    )
      return;
    if (["Space", "ArrowLeft", "ArrowRight", "ArrowUp"].includes(e.code))
      e.preventDefault();
    if (!this.held.has(e.code)) this.pressed.add(e.code);
    this.held.add(e.code);
  };
  private keyup = (e: KeyboardEvent) => {
    this.held.delete(e.code);
  };
  private blur = () => {
    this.held.clear();
    this.pressed.clear();
    this.previous.clear();
  };
  constructor() {
    window.addEventListener("keydown", this.keydown);
    window.addEventListener("keyup", this.keyup);
    window.addEventListener("blur", this.blur);
  }
  dispose() {
    window.removeEventListener("keydown", this.keydown);
    window.removeEventListener("keyup", this.keyup);
    window.removeEventListener("blur", this.blur);
    this.blur();
  }
  sample() {
    const pad = Array.from(navigator.getGamepads?.() ?? []).find(
      (p) => p?.connected,
    );
    const now = new Set<string>();
    if (pad) {
      if (pad.buttons[0]?.pressed) now.add("jump");
      if (pad.buttons[2]?.pressed) now.add("attack");
      if (pad.buttons[5]?.pressed) now.add("parry");
      if (pad.buttons[9]?.pressed) now.add("pause");
    }
    const edge = (action: string, keys: string[]) =>
      keys.some((k) => this.pressed.has(k)) ||
      (now.has(action) && !this.previous.has(action));
    const v = {
      move: Math.max(
        -1,
        Math.min(
          1,
          (this.held.has("KeyD") || this.held.has("ArrowRight") ? 1 : 0) -
            (this.held.has("KeyA") || this.held.has("ArrowLeft") ? 1 : 0) +
            (pad && Math.abs(pad.axes[0]) > 0.2 ? pad.axes[0] : 0),
        ),
      ),
      jump: edge("jump", ["Space"]),
      attack: edge("attack", ["KeyJ"]),
      parry: edge("parry", ["KeyK"]),
      pause: edge("pause", ["Escape"]),
      start: this.pressed.has("Enter"),
      debug: this.pressed.has("F2"),
    };
    this.previous = now;
    this.pressed.clear();
    return v;
  }
}
