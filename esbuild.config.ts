import { build } from "esbuild";
import { copyFile } from "node:fs/promises";

await build({
  entryPoints: ["src/content-script.ts"],
  bundle: true,
  outfile: "dist/content-script.js",
  format: "iife",
  target: "es2024",
  platform: "browser",
  sourcemap: false,
});

await copyFile("manifest.json", "dist/manifest.json");
