import { attachPanZoom } from "./pan-zoom.ts";
import { startRendererEnhancement } from "./renderer.ts";

if (typeof document !== "undefined" && typeof MutationObserver !== "undefined") {
  startRendererEnhancement(document, {
    MutationObserverClass: MutationObserver,
    attachPanZoom,
  });
}
