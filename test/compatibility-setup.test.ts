import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";

const repositoryRoot = new URL("../", import.meta.url);

function readRepositoryFile(path: string): string {
  const url = new URL(path, repositoryRoot);
  assert.equal(existsSync(fileURLToPath(url)), true, `${path} should exist`);
  return readFileSync(url, "utf8");
}

test("the repository contains a GitHub-rendered Mermaid compatibility fixture", () => {
  const fixture = readRepositoryFile("e2e/fixtures/github-mermaid.md");

  assert.match(fixture, /```mermaid\s+flowchart/);
});

test("the package exposes the isolated compatibility test command", () => {
  const packageJson = JSON.parse(
    readRepositoryFile("package.json"),
  ) as {
    scripts?: Record<string, string>;
    devDependencies?: Record<string, string>;
  };

  assert.equal(
    packageJson.scripts?.["test:compatibility"],
    "npm run build && playwright test",
  );
  assert.equal(typeof packageJson.devDependencies?.["@playwright/test"], "string");
});

test("the compatibility test uses the repository fixture directly", () => {
  const spec = readRepositoryFile("e2e/github-compatibility.spec.ts");

  assert.match(
    spec,
    /https:\/\/github\.com\/muleyuck\/mermove-for-github\/blob\/main\/e2e\/fixtures\/github-mermaid\.md/,
  );
  assert.match(spec, /const fixtureLabel = "Compatibility Fixture Start";/);
  assert.doesNotMatch(spec, /GITHUB_MERMAID_FIXTURE_/);
});

test("the compatibility workflow remains manually runnable when scheduling stops", () => {
  const workflow = readRepositoryFile(
    ".github/workflows/github-compatibility.yml",
  );

  assert.match(workflow, /\n  workflow_dispatch:\s*\n/);
  assert.match(workflow, /\n  workflow_call:\s*\n/);
  assert.match(workflow, /\n  push:\s*\n/);
  assert.doesNotMatch(workflow, /\n  schedule:\s*\n/);
  assert.match(
    workflow,
    /if: github\.event\.repository\.visibility == 'public'/,
  );
  assert.match(workflow, /run: pnpm test:compatibility/);
  assert.doesNotMatch(workflow, /GITHUB_MERMAID_FIXTURE_/);
});

test("the scheduled workflow delegates to the reusable compatibility workflow", () => {
  const workflow = readRepositoryFile(
    ".github/workflows/github-compatibility-schedule.yml",
  );

  assert.match(workflow, /\n  schedule:\s*\n/);
  assert.match(
    workflow,
    /uses: \.\/\.github\/workflows\/github-compatibility\.yml/,
  );
  assert.doesNotMatch(workflow, /workflow_dispatch/);
});
