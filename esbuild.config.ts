import { build } from "esbuild";

await build({
  entryPoints: ["src/content-script.ts"],
  bundle: true,
  outfile: "dist/content-script.js",
  format: "iife",
  target: "es2024",
  platform: "browser",
  sourcemap: false,
});
