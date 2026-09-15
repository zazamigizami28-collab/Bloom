import assert from "node:assert/strict";
import { load, element, windowTarget, pads } from "./loader.mjs";
const { Controls } = load("input");
const event = (type, code) => {
  const e = new Event(type, { cancelable: true });
  Object.defineProperty(e, "code", { value: code });
  return e;
};
const first = new Controls();
windowTarget.dispatchEvent(event("keydown", "KeyK"));
assert.equal(first.sample().parry, true);
assert.equal(first.sample().parry, false);
first.dispose();
first.dispose();
windowTarget.dispatchEvent(event("keydown", "KeyK"));
assert.equal(first.sample().parry, false);
const second = new Controls();
windowTarget.dispatchEvent(event("keydown", "KeyK"));
assert.equal(second.sample().parry, true);
windowTarget.dispatchEvent(new Event("blur"));
assert.equal(second.held.size, 0);
second.dispose();
const { bindControls } = load("ui");
const { Practice } = load("practice");
const model = new Practice();
let count = 0;
const commands = {
  command(command) {
    count++;
    model.command(command);
  },
};
const audio = { unlock() {}, muted: false };
const off = bindControls(commands, audio);
count = 0;
element("fertilize").dispatchEvent(new Event("click"));
assert.equal(count, 1);
assert.equal(model.flower.fertilizer, 1);
off();
off();
element("fertilize").dispatchEvent(new Event("click"));
assert.equal(count, 1);
const off2 = bindControls(commands, audio);
count = 0;
element("fertilize").dispatchEvent(new Event("click"));
assert.equal(count, 1);
assert.equal(model.flower.fertilizer, 2);
windowTarget.dispatchEvent(new Event("blur"));
assert.equal(model.paused, true);
model.begin();
assert.equal(model.paused, false);
off2();
model.pause(false);
windowTarget.dispatchEvent(new Event("blur"));
assert.equal(model.paused, false);
const { AudioFeedback } = load("audio");
const sound = new AudioFeedback();
let closes = 0;
sound.ctx = {
  close() {
    closes++;
  },
};
sound.dispose();
sound.dispose();
assert.equal(closes, 1);
console.log(
  "PASS: keyboard pressed edge; input/UI detach and rebind; blur cleanup; start after blur; idempotent audio disposal.",
);

const padControls = new Controls();
pads.push({
  connected: true,
  axes: [0],
  buttons: Array.from({ length: 10 }, () => ({ pressed: false })),
});
pads[0].buttons[2].pressed = true;
assert.equal(padControls.sample().attack, true);
assert.equal(padControls.sample().attack, false);
pads[0].buttons[2].pressed = false;
padControls.sample();
pads[0].buttons[2].pressed = true;
assert.equal(padControls.sample().attack, true);
padControls.dispose();
pads.length = 0;
console.log("PASS: simulated X button uses a pressed edge, not held-repeat.");
