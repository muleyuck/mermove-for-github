export interface PannableViewport extends EventTarget {
  setPointerCapture(pointerId: number): void;
  releasePointerCapture(pointerId: number): void;
  getBoundingClientRect(): Pick<DOMRect, "left" | "top">;
  style: Pick<CSSStyleDeclaration, "cursor">;
}

export interface PannableTarget {
  style: Pick<CSSStyleDeclaration, "transform" | "transformOrigin">;
}

export interface PanZoomController {
  reset(): void;
  destroy(): void;
}

interface PanZoomState {
  x: number;
  y: number;
  scale: number;
}

interface ScaleLimits {
  min: number;
  max: number;
}

export function zoomAt(
  state: PanZoomState,
  point: { x: number; y: number },
  requestedScale: number,
  limits: ScaleLimits,
): PanZoomState {
  const scale = Math.min(Math.max(requestedScale, limits.min), limits.max);
  const ratio = scale / state.scale;

  return {
    x: point.x - (point.x - state.x) * ratio,
    y: point.y - (point.y - state.y) * ratio,
    scale,
  };
}

function formatNumber(value: number): number {
  return Math.round(value * 1000) / 1000;
}

const ZOOM_LIMITS: ScaleLimits = { min: 0.5, max: 8 };
const WHEEL_ZOOM_FACTOR = 1.07;
const DRAG_START_THRESHOLD_PX = 4;
// Mermaid's default htmlLabels setting renders node/edge labels as HTML
// (<span>/<p>) inside <foreignObject>, not as SVG <text>/<tspan>.
const TEXT_SELECTOR = "text, tspan, foreignObject";
const INTERACTIVE_SELECTOR = `a, button, input, textarea, select, [contenteditable='true'], [role='link'], ${TEXT_SELECTOR}`;

export function attachPanZoom(
  viewport: PannableViewport,
  target: PannableTarget,
): PanZoomController {
  let state: PanZoomState = { x: 0, y: 0, scale: 1 };
  let drag: {
    pointerId: number;
    clientX: number;
    clientY: number;
    started: boolean;
    state: PanZoomState;
  } | null = null;
  let suppressNextClick = false;

  function render() {
    target.style.transform = `translate(${formatNumber(state.x)}px, ${formatNumber(state.y)}px) scale(${formatNumber(state.scale)})`;
    target.style.transformOrigin = "0 0";
  }

  function handleWheel(event: Event) {
    const wheelEvent = event as WheelEvent;
    if ((!wheelEvent.ctrlKey && !wheelEvent.metaKey) || wheelEvent.deltaY === 0) {
      return;
    }

    wheelEvent.preventDefault();
    const bounds = viewport.getBoundingClientRect();
    const point = {
      x: wheelEvent.clientX - bounds.left,
      y: wheelEvent.clientY - bounds.top,
    };
    const requestedScale =
      wheelEvent.deltaY < 0
        ? state.scale * WHEEL_ZOOM_FACTOR
        : state.scale / WHEEL_ZOOM_FACTOR;
    state = zoomAt(state, point, requestedScale, ZOOM_LIMITS);
    render();
  }

  function handlePointerDown(event: Event) {
    const pointerEvent = event as PointerEvent;
    const interactiveElement = (pointerEvent.target as Element | null)?.closest?.(
      INTERACTIVE_SELECTOR,
    );

    if (pointerEvent.button !== 0 || interactiveElement) {
      return;
    }

    // Without this, the browser's native mousedown-drag text selection runs
    // alongside panning and selects whatever label the pointer crosses.
    pointerEvent.preventDefault();

    drag = {
      pointerId: pointerEvent.pointerId,
      clientX: pointerEvent.clientX,
      clientY: pointerEvent.clientY,
      started: false,
      state,
    };
    viewport.setPointerCapture?.(pointerEvent.pointerId);
  }

  function updateHoverCursor(pointerEvent: PointerEvent) {
    const overText = (pointerEvent.target as Element | null)?.closest?.(TEXT_SELECTOR);
    viewport.style.cursor = overText ? "text" : "grab";
  }

  function handlePointerMove(event: Event) {
    const pointerEvent = event as PointerEvent;
    if (!drag) {
      updateHoverCursor(pointerEvent);
      return;
    }

    if (pointerEvent.pointerId !== drag.pointerId) {
      return;
    }

    if (pointerEvent.buttons === 0) {
      finishDrag(event);
      return;
    }

    const deltaX = pointerEvent.clientX - drag.clientX;
    const deltaY = pointerEvent.clientY - drag.clientY;
    if (!drag.started && Math.hypot(deltaX, deltaY) < DRAG_START_THRESHOLD_PX) {
      return;
    }

    drag.started = true;
    viewport.style.cursor = "grabbing";
    pointerEvent.preventDefault();
    state = {
      ...drag.state,
      x: drag.state.x + deltaX,
      y: drag.state.y + deltaY,
    };
    render();
  }

  function finishDrag(event: Event) {
    const pointerEvent = event as PointerEvent;
    if (!drag || pointerEvent.pointerId !== drag.pointerId) {
      return;
    }

    if (pointerEvent.type === "pointerup" && drag.started) {
      suppressNextClick = true;
      setTimeout(() => {
        suppressNextClick = false;
      }, 0);
    }
    viewport.releasePointerCapture?.(pointerEvent.pointerId);
    viewport.style.cursor = "grab";
    drag = null;
  }

  function handleClick(event: Event) {
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
