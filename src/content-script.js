(function initializeContentScript(globalScope, factory) {
  const api = factory();

  if (typeof module === "object" && module.exports) {
    module.exports = api;
    return;
  }

  const namespace = globalScope.MermaidMouseOperation = Object.assign(
    globalScope.MermaidMouseOperation || {},
    api,
  );

  if (
    globalScope.document
    && globalScope.MutationObserver
    && typeof namespace.attachPanZoom === "function"
  ) {
    api.startRendererEnhancement(globalScope.document, {
      MutationObserverClass: globalScope.MutationObserver,
      attachPanZoom: namespace.attachPanZoom,
    });
  }
})(globalThis, function createContentScriptApi() {
  "use strict";

  function viewBoxArea(svg) {
    const values = (svg.getAttribute("viewBox") || "")
      .trim()
      .split(/[\s,]+/)
      .map(Number);

    if (values.length !== 4 || values.some((value) => !Number.isFinite(value))) {
      return 0;
    }

    return Math.abs(values[2] * values[3]);
  }

  function findDiagramSvg(root) {
    return [...root.querySelectorAll("svg")]
      .filter((svg) => !svg.closest("button"))
      .sort((left, right) => viewBoxArea(right) - viewBoxArea(left))[0] || null;
  }

  function observeRenderer(root, MutationObserverClass, attachPanZoom) {
    let controller = null;
    let currentSvg = null;

    function bind() {
      const svg = findDiagramSvg(root);
      if (svg === currentSvg) {
        return;
      }

      controller?.destroy();
      controller = null;
      currentSvg = null;

      if (!svg?.parentElement) {
        return;
      }

      currentSvg = svg;
      const target = svg.parentElement;
      const viewport = target.parentElement || target;
      controller = attachPanZoom(viewport, target);
    }

    function handleClick(event) {
      const resetControl = event.target?.closest?.(
        "button[aria-label='Reset view']",
      );
      if (resetControl) {
        controller?.reset();
      }
    }

    bind();
    const observer = new MutationObserverClass(bind);
    observer.observe(root.documentElement, { childList: true, subtree: true });
    root.addEventListener?.("click", handleClick, true);

    return function stopObserving() {
      observer.disconnect();
      root.removeEventListener?.("click", handleClick, true);
      controller?.destroy();
      controller = null;
      currentSvg = null;
    };
  }

  function startRendererEnhancement(root, environment) {
    return observeRenderer(
      root,
      environment.MutationObserverClass,
      environment.attachPanZoom,
    );
  }

  return { findDiagramSvg, observeRenderer, startRendererEnhancement };
});
