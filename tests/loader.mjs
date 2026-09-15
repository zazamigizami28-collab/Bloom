import ts from "typescript";
import fs from "node:fs";
import vm from "node:vm";
const cache = new Map();
const dom = new Map();
const pads = [];
const element = (id) => {
  if (!dom.has(id))
    dom.set(
      id,
      Object.assign(new EventTarget(), {
        value: id === "speed" ? "1" : "180",
        checked: false,
        hidden: false,
      }),
    );
  return dom.get(id);
};
const noop = () => {};
const windowTarget = new EventTarget();
const documentTarget = new EventTarget();
documentTarget.getElementById = element;
const Phaser = {
  Scene: class {
    cameras = { main: { shake: noop } };
  },
  Game: class {},
  Math: { Clamp: (n, a, b) => Math.max(a, Math.min(b, n)) },
  Scale: {},
};
function load(name) {
  if (cache.has(name)) return cache.get(name);
  const module = { exports: {} };
  cache.set(name, module.exports);
  const code = ts.transpile(fs.readFileSync(`src/${name}.ts`, "utf8") + "", {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2022,
    esModuleInterop: true,
  });
  vm.runInNewContext(code, {
    module,
    exports: module.exports,
    require: (p) =>
      p === "phaser"
        ? Phaser
        : p.endsWith(".css")
          ? {}
          : load(p.replace("./", "")),
    window: windowTarget,
    document: documentTarget,
    navigator: { getGamepads: () => pads },
    console,
    Math,
    Set,
  });
  return module.exports;
}

export { load, element, windowTarget, documentTarget, pads };
