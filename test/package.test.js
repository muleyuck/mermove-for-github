const assert = require("node:assert/strict");
const { existsSync, readFileSync } = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const packagePath = path.join(__dirname, "..", "package.json");
const packageJson = existsSync(packagePath)
  ? JSON.parse(readFileSync(packagePath, "utf8"))
  : {};

test("npm test runs the dependency-free Node test suite", () => {
  assert.equal(packageJson.name, "mermove-for-github");
  assert.equal(packageJson.private, true);
  assert.equal(packageJson.scripts?.test, "node --test");
  assert.equal(packageJson.dependencies, undefined);
  assert.equal(packageJson.devDependencies, undefined);
});
