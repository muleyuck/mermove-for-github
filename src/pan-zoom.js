(function initializePanZoom(globalScope, factory) {
  const api = factory();

  if (typeof module === "object" && module.exports) {
    module.exports = api;
    return;
  }

  globalScope.MermaidMouseOperation = api;
})(globalThis, function createPanZoomApi() {
  "use strict";

  function zoomAt(state, point, requestedScale, limits) {
    const scale = Math.min(Math.max(requestedScale, limits.min), limits.max);
    const ratio = scale / state.scale;

    return {
      x: point.x - (point.x - state.x) * ratio,
      y: point.y - (point.y - state.y) * ratio,
      scale,
    };
  }

  function formatNumber(value) {
    return Math.round(value * 1000) / 1000;
  }

  function attachPanZoom(viewport, target) {
    let state = { x: 0, y: 0, scale: 1 };
    let drag = null;
    let suppressNextClick = false;

    function render() {
      target.style.transform = `translate(${formatNumber(state.x)}px, ${formatNumber(state.y)}px) scale(${formatNumber(state.scale)})`;
      target.style.transformOrigin = "0 0";
    }

    function handleWheel(event) {
      if ((!event.ctrlKey && !event.metaKey) || event.deltaY === 0) {
        return;
      }

      event.preventDefault();
      const bounds = viewport.getBoundingClientRect();
      const point = {
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top,
      };
      const requestedScale = event.deltaY < 0
        ? state.scale * 1.1
        : state.scale / 1.1;
      state = zoomAt(state, point, requestedScale, { min: 0.5, max: 8 });
      render();
    }

    function handlePointerDown(event) {
      const interactiveElement = event.target?.closest?.(
        "a, button, input, textarea, select, [contenteditable='true'], [role='link']",
      );

      if (event.button !== 0 || interactiveElement) {
        return;
      }

      drag = {
        pointerId: event.pointerId,
        clientX: event.clientX,
        clientY: event.clientY,
        started: false,
        state,
      };
      viewport.setPointerCapture?.(event.pointerId);
    }

    function handlePointerMove(event) {
      if (!drag || event.pointerId !== drag.pointerId) {
        return;
      }

      const deltaX = event.clientX - drag.clientX;
      const deltaY = event.clientY - drag.clientY;
      if (!drag.started && Math.hypot(deltaX, deltaY) < 4) {
        return;
      }

      drag.started = true;
      viewport.style.cursor = "grabbing";
      event.preventDefault();
      state = {
        ...drag.state,
        x: drag.state.x + deltaX,
        y: drag.state.y + deltaY,
      };
      render();
    }

    function finishDrag(event) {
      if (!drag || event.pointerId !== drag.pointerId) {
        return;
      }

      if (event.type === "pointerup" && drag.started) {
        suppressNextClick = true;
        setTimeout(() => {
          suppressNextClick = false;
        }, 0);
      }
      viewport.releasePointerCapture?.(event.pointerId);
      viewport.style.cursor = "grab";
      drag = null;
    }

    function handleClick(event) {
      if (!suppressNextClick) {
        return;
      }

      suppressNextClick = false;
      event.preventDefault();
      event.stopImmediatePropagation();
    }

    viewport.addEventListener("wheel", handleWheel, { passive: false });
    viewport.addEventListener("pointerdown", handlePointerDown);
    viewport.addEventListener("pointermove", handlePointerMove);
    viewport.addEventListener("pointerup", finishDrag);
    viewport.addEventListener("pointercancel", finishDrag);
    viewport.addEventListener("click", handleClick, true);
    viewport.style.cursor = "grab";
    render();

    return {
      reset() {
        state = { x: 0, y: 0, scale: 1 };
        render();
      },
      destroy() {
        viewport.removeEventListener("wheel", handleWheel);
        viewport.removeEventListener("pointerdown", handlePointerDown);
        viewport.removeEventListener("pointermove", handlePointerMove);
        viewport.removeEventListener("pointerup", finishDrag);
        viewport.removeEventListener("pointercancel", finishDrag);
        viewport.removeEventListener("click", handleClick, true);
      },
    };
  }

  return { attachPanZoom, zoomAt };
});
