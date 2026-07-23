<picture>
  <source media="(prefers-color-scheme: dark)" srcset="/icons/logo-dark.svg">
  <img width="512" src="/icons/logo-light.svg">
</picture>

[![unit-test](https://github.com/muleyuck/mermove-for-github/actions/workflows/unit-test.yml/badge.svg)](https://github.com/muleyuck/mermove-for-github/actions/workflows/unit-test.yml)
![Software License](https://img.shields.io/badge/license-MIT-brightgreen.svg?style=flat-square)
[![Release](https://img.shields.io/github/release/muleyuck/mermove-for-github.svg)](https://github.com/muleyuck/mermove-for-github/releases/latest)

# Mermove for GitHub

Mermove for GitHub is a Chrome extension for panning and zooming Mermaid diagrams rendered on GitHub.

It is useful when a large flowchart, sequence diagram, or other Mermaid diagram does not fit comfortably in GitHub's viewer and you need to inspect its details without leaving the page.

## Controls

- Left-drag the diagram: Pan
- `Ctrl` + mouse wheel (`Command` + mouse wheel is also supported on macOS): Zoom around the pointer position
- GitHub's existing Reset view button: Reset both GitHub's view and the extension's transformations

Dragging does not start from Mermaid nodes that are links. A click and a drag are distinguished by a 4-pixel movement threshold.

## Install

1. Open `chrome://extensions`.
2. Enable Developer mode.
3. Run `npm ci && npm run build` to generate `dist/`.
4. Click Load unpacked and select the `dist/` directory.
5. Reload a GitHub page that contains a Mermaid diagram.

## Scope and Permissions

The extension runs only in GitHub's dedicated Mermaid renderer at `viewscreen.githubusercontent.com/markdown/mermaid`. It does not run directly on `github.com` pages and does not request additional browser permissions.
