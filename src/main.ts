import Phaser from "phaser";
import "./style.css";
import { tuning as T } from "./data";
import { Controls } from "./input";
import { AudioFeedback } from "./audio";
import { background } from "./render";
import { Sparks } from "./effects";
import { drawScene } from "./scene-view";
import { bindControls, renderControls } from "./ui";
import { Practice } from "./practice";
import { snapshot } from "./game-state";
import { presentEvents } from "./event-presenter";
class Garden extends Phaser.Scene {
  model!: Practice;
  keys!: Controls;
  soundFX!: AudioFeedback;
  sparks!: Sparks;
  g!: Phaser.GameObjects.Graphics;
  hud!: Phaser.GameObjects.Text;
  readout!: Phaser.GameObjects.Text;
  hint!: Phaser.GameObjects.Text;
  label!: Phaser.GameObjects.Text;
  breakText!: Phaser.GameObjects.Text;
  flowerText!: Phaser.GameObjects.Text;
  create() {
    this.model = new Practice("boss");
    this.keys = new Controls();
    this.soundFX = new AudioFeedback();
    this.sparks = new Sparks();
    background(this);
    this.g = this.add.graphics();
    this.hud = this.add.text(30, 24, "", {
      fontFamily: "sans-serif",
      fontSize: "18px",
      color: "#f0f5de",
      backgroundColor: "#203e37dd",
      padding: { x: 14, y: 10 },
    });
    this.readout = this.add
      .text(995, 25, "", {
        fontFamily: "monospace",
        fontSize: "15px",
        color: "#263e35",
        align: "right",
      })
      .setOrigin(1, 0);
    this.hint = this.add
      .text(512, 165, "", {
        fontFamily: "sans-serif",
        fontSize: "25px",
        fontStyle: "bold",
        color: "#fff9cd",
        stroke: "#315748",
        strokeThickness: 4,
      })
      .setOrigin(0.5);
    this.breakText = this.add
      .text(512, 82, "", {
        fontFamily: "sans-serif",
        fontSize: "15px",
        fontStyle: "bold",
        color: "#fff0b8",
        backgroundColor: "#243f35dd",
        padding: { x: 12, y: 7 },
      })
      .setOrigin(0.5);
    this.label = this.add
      .text(T.dummy.x, 285, "", {
        fontFamily: "sans-serif",
        fontSize: "14px",
        color: "#233d33",
        align: "center",
      })
      .setOrigin(0.5);
    this.flowerText = this.add.text(40, 514, "", {
      fontFamily: "sans-serif",
      fontSize: "14px",
      color: "#fff1b2",
      lineSpacing: 3,
    });
    const disposeUI = bindControls(this.model, this.soundFX);
    const context = (
      document as Document & {
        modelContext?: {
          registerTool: (tool: unknown) => void;
          unregisterTool?: (name: string) => void;
        };
      }
    ).modelContext;
    const toolName = "read_practice_state";
    // Register only when an inverse operation is available for Scene shutdown.
    if (context?.unregisterTool)
      context.registerTool({
        name: toolName,
        description: "Read current practice state",
        inputSchema: {
          type: "object",
          properties: {},
          additionalProperties: false,
        },
        annotations: { readOnlyHint: true },
        execute: () => snapshot(this.model),
      });
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      disposeUI();
      this.keys.dispose();
      this.soundFX.dispose();
      this.sparks.clear();
      this.model.drainEvents();
      context?.unregisterTool?.(toolName);
    });
    this.draw();
  }
  update(_time: number, delta: number) {
    const input = this.keys.sample();
    if (input.debug) {
      const debug = document.getElementById("debug") as HTMLDetailsElement;
      debug.open = !debug.open;
    }
    if (input.start && !this.model.started) this.soundFX.unlock();
    this.model.update(input, delta);
    this.draw();
  }
  draw() {
    presentEvents(
      this.model.drainEvents(),
      this.soundFX,
      this.sparks,
      (duration, intensity) => this.cameras.main.shake(duration, intensity),
    );
    const state = snapshot(this.model);
    renderControls(state);
    drawScene(state, this, this.sparks);
  }
}
new Phaser.Game({
  type: Phaser.AUTO,
  parent: "game",
  width: 1024,
  height: 576,
  backgroundColor: "#91c8be",
  pixelArt: true,
  antialias: false,
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  scene: Garden,
  audio: { noAudio: true },
});
