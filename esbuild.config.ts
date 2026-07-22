import { build } from "esbuild";
import { copyFile, mkdir } from "node:fs/promises";

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

await mkdir("dist/icons", { recursive: true });
for (const size of [16, 32, 48, 128]) {
  await copyFile(`icons/icon-${size}.png`, `dist/icons/icon-${size}.png`);
}
