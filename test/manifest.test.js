const assert = require("node:assert/strict");
const { existsSync, readFileSync } = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const projectRoot = path.join(__dirname, "..");
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
      js: ["src/pan-zoom.js", "src/content-script.js"],
    },
  ]);
});

test("every content script declared by the manifest exists", () => {
  const scripts = manifest.content_scripts?.flatMap((entry) => entry.js) || [];

  assert.ok(scripts.length > 0, "expected at least one content script");
  for (const script of scripts) {
    assert.equal(existsSync(path.join(projectRoot, script)), true, script);
  }
});
