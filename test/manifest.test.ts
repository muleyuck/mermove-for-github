import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const manifestPath = path.join(projectRoot, "manifest.json");
const manifest = existsSync(manifestPath)
  ? JSON.parse(readFileSync(manifestPath, "utf8"))
  : {};

test("manifest exposes the public extension identity", () => {
  assert.equal(manifest.name, "Mermove for GitHub");
  assert.equal(
    manifest.description,
    "Pan and zoom Mermaid diagrams rendered on GitHub.",
  );
});

test("manifest targets only GitHub's Mermaid renderer in every frame", () => {
  assert.equal(manifest.manifest_version, 3);
  assert.equal(manifest.permissions, undefined);
  assert.equal(manifest.host_permissions, undefined);
  assert.deepEqual(manifest.content_scripts, [
    {
      matches: ["https://viewscreen.githubusercontent.com/markdown/mermaid*"],
      all_frames: true,
      run_at: "document_idle",
      js: ["dist/content-script.js"],
    },
  ]);
});

test("every content script declared by the manifest exists", () => {
  const scripts: string[] = manifest.content_scripts?.flatMap(
    (entry: { js: string[] }) => entry.js,
  ) ?? [];

  assert.ok(scripts.length > 0, "expected at least one content script");
  for (const script of scripts) {
    assert.equal(existsSync(path.join(projectRoot, script)), true, script);
  }
});
