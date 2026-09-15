import fs from "node:fs";
import ts from "typescript";
import assert from "node:assert/strict";
const core = [
  "practice",
  "game-state",
  "combat",
  "flower",
  "flower-system",
  "player-system",
  "enemy-system",
  "special-system",
  "data",
  "boss",
  "actions",
  "commands",
  "events",
  "math",
];
for (const name of core) {
  const path = `src/${name}.ts`,
    text = fs.readFileSync(path, "utf8"),
    tree = ts.createSourceFile(path, text, ts.ScriptTarget.Latest, true);
  const visit = (node) => {
    if (ts.isImportDeclaration(node) && !node.importClause?.isTypeOnly) {
      assert(
        core.includes(node.moduleSpecifier.text.replace("./", "")),
        `${path}: core must not import platform/presentation`,
      );
    }
    if (
      ts.isIdentifier(node) &&
      !(
        ts.isPropertyAccessExpression(node.parent) && node.parent.name === node
      ) &&
      !(ts.isPropertyAssignment(node.parent) && node.parent.name === node)
    )
      assert(
        !["window", "document", "navigator", "Phaser", "AudioContext"].includes(
          node.text,
        ),
        `${path}: platform global ${node.text}`,
      );
    ts.forEachChild(node, visit);
  };
  visit(tree);
}
for (const name of ["scene-view", "ui"]) {
  const text = fs.readFileSync(`src/${name}.ts`, "utf8");
  assert(
    !/from ["']\.\/(main|practice)["']/.test(text),
    `${name}: use snapshot or command contract`,
  );
}
console.log(
  "PASS: domain/platform dependency boundary; UI/view contract boundary.",
);
