# AGENTS.md

## Setup

- Node version is pinned via `mise.toml` (`node = "25.1.0"`).
- No runtime dependencies. `typescript`, `esbuild`, and `@types/node` are devDependencies (type checking and bundling only); `package-lock.json` is committed.

## Commands

```sh
npm run typecheck                     # type-check with tsc (no emit)
npm run build                         # bundle src/content-script.ts (and its pan-zoom.ts import) into dist/content-script.js with esbuild
npm test                              # run the full suite (node --test)
node --test test/pan-zoom.test.ts     # run a single test file
```

`npm test` does not run `typecheck` or `build` — CI runs all three separately (see `.github/workflows/ci.yml`).

## Architecture

- **`manifest.json`** declares a single content script pair injected into `https://viewscreen.githubusercontent.com/markdown/mermaid*` (`all_frames: true`). This is GitHub's dedicated Mermaid renderer iframe, not `github.com` itself — GitHub embeds Mermaid diagrams there rather than rendering them inline.
- **`src/pan-zoom.ts`** is generic, DOM-agnostic pan/zoom logic with no knowledge of GitHub or Mermaid. `attachPanZoom(viewport, target)` wires pointer/wheel listeners onto a given viewport element and applies `transform: translate(...) scale(...)` to a target element, returning `{ reset, destroy }`. Dragging is distinguished from clicking via a 4px movement threshold before drag events fire; drag doesn't start from links/buttons/inputs/`[role='link']`.
- **`src/renderer.ts`** contains all GitHub/Mermaid-specific detection logic, isolated from the pan/zoom mechanics:
  - `findDiagramSvg(root)` picks the diagram: the largest-`viewBox` `<svg>` outside any `<button>` (largest area wins to reject small control icons).
  - `observeRenderer(root, MutationObserverClass, attachPanZoom)` uses a `MutationObserver` on `documentElement` to re-bind pan/zoom whenever GitHub replaces/re-renders the SVG (deferred rendering, live re-render), destroying the previous controller each time. It also listens for clicks on GitHub's own `button[aria-label='Reset view']` and forwards them to the controller's `reset()`.
  - All source files are plain ESM (`export`/`import`). `content-script.ts` imports `attachPanZoom` from `pan-zoom.ts` and `startRendererEnhancement` from `renderer.ts`, then wires them to `document`/`MutationObserver` at module load time.
- Because GitHub's DOM/CSS is not depended on (no class names or Mermaid SVG IDs), if GitHub changes its renderer's URL/host, update `matches` in `manifest.json`; if it changes the renderer's HTML structure, the fix should stay confined to `src/renderer.ts`.
- `dist/content-script.js` is the esbuild-bundled output that `manifest.json` actually loads; it's gitignored and rebuilt via `npm run build`.

## Testing conventions

Tests use plain `node:test` + `node:assert/strict` with hand-rolled fakes for `SVGElement`, `MutationObserver`, etc. (no DOM library, no mocking framework). `test/manifest.test.ts` and `test/package.test.ts` assert directly against the parsed `manifest.json`/`package.json` contents (e.g. no `permissions`/`host_permissions`, no runtime `dependencies`) — keep those files' shape and these tests in sync when editing them. Tests import `.ts` source directly (e.g. `from "../src/pan-zoom.ts"`) and run via Node's native TypeScript support — no build step for tests. `PannableViewport` (in `pan-zoom.ts`) `extends EventTarget`; test fakes must do the same (not compose an internal `EventTarget`) or `event.target` inside dispatched events resolves incorrectly.
