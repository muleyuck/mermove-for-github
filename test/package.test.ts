import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const packagePath = path.join(projectRoot, "package.json");
const packageJson = existsSync(packagePath)
  ? JSON.parse(readFileSync(packagePath, "utf8"))
  : {};

test("npm test runs the Node test suite with no runtime dependencies", () => {
  assert.equal(packageJson.name, "mermove-for-github");
  assert.equal(packageJson.private, true);
  assert.equal(
    packageJson.scripts?.test,
    "node --test --experimental-test-coverage --test-coverage-lines=95 --test-coverage-branches=82 --test-coverage-functions=100",
  );
  assert.equal(packageJson.dependencies, undefined);
  assert.deepEqual(
    Object.keys(packageJson.devDependencies ?? {}).sort(),
    ["@types/node", "esbuild", "typescript"],
  );
});
