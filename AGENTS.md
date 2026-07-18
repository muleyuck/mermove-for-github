# AGENTS.md

## Setup

- Node version is pinned via `mise.toml` (`node = "25.1.0"`).
- No runtime or dev dependencies — do not add a package manager lockfile without discussing it first.

## Commands

```sh
npm test                              # run the full suite (node --test)
node --test test/pan-zoom.test.js     # run a single test file
```

No build or lint step exists.

## Architecture

- **`manifest.json`** declares a single content script pair injected into `https://viewscreen.githubusercontent.com/markdown/mermaid*` (`all_frames: true`). This is GitHub's dedicated Mermaid renderer iframe, not `github.com` itself — GitHub embeds Mermaid diagrams there rather than rendering them inline.
- **`src/pan-zoom.js`** is generic, DOM-agnostic pan/zoom logic with no knowledge of GitHub or Mermaid. `attachPanZoom(viewport, target)` wires pointer/wheel listeners onto a given viewport element and applies `transform: translate(...) scale(...)` to a target element, returning `{ reset, destroy }`. Dragging is distinguished from clicking via a 4px movement threshold before drag events fire; drag doesn't start from links/buttons/inputs/`[role='link']`.
- **`src/content-script.js`** contains all GitHub/Mermaid-specific detection logic, isolated from the pan/zoom mechanics:
  - `findDiagramSvg(root)` picks the diagram: the largest-`viewBox` `<svg>` outside any `<button>` (largest area wins to reject small control icons).
  - `observeRenderer(root, MutationObserverClass, attachPanZoom)` uses a `MutationObserver` on `documentElement` to re-bind pan/zoom whenever GitHub replaces/re-renders the SVG (deferred rendering, live re-render), destroying the previous controller each time. It also listens for clicks on GitHub's own `button[aria-label='Reset view']` and forwards them to the controller's `reset()`.
  - Both files use a UMD-style IIFE (`module.exports` under Node/CommonJS, `globalThis.MermaidMouseOperation` in the browser) so the same source loads unmodified as a content script and as a `require()`-able module in tests.
- Because GitHub's DOM/CSS is not depended on (no class names or Mermaid SVG IDs), if GitHub changes its renderer's URL/host, update `matches` in `manifest.json`; if it changes the renderer's HTML structure, the fix should stay confined to `src/content-script.js`.

## Testing conventions

Tests use plain `node:test` + `node:assert/strict` with hand-rolled fakes for `SVGElement`, `MutationObserver`, etc. (no DOM library, no mocking framework). `test/manifest.test.js` and `test/package.test.js` assert directly against the parsed `manifest.json`/`package.json` contents (e.g. no `permissions`/`host_permissions`, no dependencies) — keep those files' shape and these tests in sync when editing them.
