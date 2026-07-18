# Mermove for GitHub

This Chrome extension adds mouse controls to Mermaid diagrams rendered on GitHub.

## Controls

- Left-drag the diagram: Pan
- `Ctrl` + mouse wheel (`Command` + mouse wheel is also supported on macOS): Zoom around the pointer position
- GitHub's existing Reset view button: Reset both GitHub's view and the extension's transformations

Dragging does not start from Mermaid nodes that are links. A click and a drag are distinguished by a 4-pixel movement threshold.

## Loading in Chrome

1. Open `chrome://extensions`.
2. Enable Developer mode.
3. Click Load unpacked and select this directory.
4. Reload a GitHub page that contains a Mermaid diagram.

## Handling GitHub DOM Changes

GitHub-specific detection logic is isolated in [`src/content-script.js`](src/content-script.js).

- Target only the dedicated Mermaid renderer at `viewscreen.githubusercontent.com/markdown/mermaid`, not `github.com`.
- Do not depend on GitHub CSS classes or Mermaid SVG IDs.
- Detect the SVG outside a button with the largest `viewBox` in the renderer as the diagram.
- Use `MutationObserver` to track deferred rendering, re-rendering, and SVG replacement or removal.
- Keep pan and zoom logic separate in [`src/pan-zoom.js`](src/pan-zoom.js).

If the renderer host or URL changes, the main update should be to `matches` in [`manifest.json`](manifest.json). If the renderer's HTML structure changes, the main update should be limited to `src/content-script.js`.

## Tests

This project has no external packages. Run the tests with Node.js's built-in test runner.

```sh
npm test
```
