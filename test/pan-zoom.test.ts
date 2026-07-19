import assert from "node:assert/strict";
import test, { type TestContext } from "node:test";
import {
  attachPanZoom,
  zoomAt,
  type PannableViewport,
  type PannableTarget,
} from "../src/pan-zoom.ts";

class TestElement extends EventTarget implements PannableViewport, PannableTarget {
  style = { cursor: "grab", transform: "", transformOrigin: "" };
  interactive = false;

  closest(): Element | null {
    return this.interactive ? (this as unknown as Element) : null;
  }
  setPointerCapture(): void {}
  releasePointerCapture(): void {}
  getBoundingClientRect() {
    return { left: 10, top: 20 };
  }
}

function createEvent(type: string, properties: Record<string, unknown>): Event {
  const event = new Event(type, { bubbles: true, cancelable: true });

  for (const [name, value] of Object.entries(properties)) {
    Object.defineProperty(event, name, { value });
  }

  return event;
}

function setup(t: TestContext) {
  const viewport = new TestElement();
  const target = new TestElement();
  const controller = attachPanZoom(viewport, target);
  t.after(() => controller.destroy());

  return { viewport, target, controller };
}

test("zoomAt keeps the pointer position anchored while scaling", () => {
  const result = zoomAt(
    { x: 10, y: 20, scale: 1 },
    { x: 50, y: 80 },
    2,
    { min: 0.5, max: 8 },
  );

  assert.deepEqual(result, { x: -30, y: -40, scale: 2 });
});

test("Ctrl+wheel zooms around the pointer without scrolling the page", (t) => {
  const { viewport, target } = setup(t);
  const event = createEvent("wheel", {
    clientX: 60,
    clientY: 100,
    ctrlKey: true,
    metaKey: false,
    deltaY: -100,
  });

  viewport.dispatchEvent(event);

  assert.equal(target.style.transform, "translate(-5px, -8px) scale(1.1)");
  assert.equal(event.defaultPrevented, true);
});

test("wheel without a zoom modifier leaves page scrolling unchanged", (t) => {
  const { viewport, target } = setup(t);
  const event = createEvent("wheel", {
    clientX: 60,
    clientY: 100,
    ctrlKey: false,
    metaKey: false,
    deltaY: -100,
  });

  viewport.dispatchEvent(event);

  assert.equal(target.style.transform, "translate(0px, 0px) scale(1)");
  assert.equal(event.defaultPrevented, false);
});

test("zero-delta wheel leaves the diagram and page scrolling unchanged", (t) => {
  const { viewport, target } = setup(t);
  const event = createEvent("wheel", {
    clientX: 60,
    clientY: 100,
    ctrlKey: true,
    metaKey: false,
    deltaY: 0,
  });

  viewport.dispatchEvent(event);

  assert.equal(target.style.transform, "translate(0px, 0px) scale(1)");
  assert.equal(event.defaultPrevented, false);
});

test("dragging starts outside interactive Mermaid nodes only", (t) => {
  const { viewport, target } = setup(t);
  viewport.interactive = true;

  viewport.dispatchEvent(
    createEvent("pointerdown", { button: 0, pointerId: 3, clientX: 15, clientY: 25 }),
  );
  viewport.dispatchEvent(
    createEvent("pointermove", { pointerId: 3, clientX: 45, clientY: 55 }),
  );

  assert.equal(target.style.transform, "translate(0px, 0px) scale(1)");
});

test("left-button drag pans the rendered diagram", (t) => {
  const { viewport, target } = setup(t);

  viewport.dispatchEvent(
    createEvent("pointerdown", { button: 0, pointerId: 7, clientX: 20, clientY: 30 }),
  );
  const move = createEvent("pointermove", { pointerId: 7, clientX: 32, clientY: 47 });
  viewport.dispatchEvent(move);
  viewport.dispatchEvent(createEvent("pointerup", { pointerId: 7 }));

  assert.equal(target.style.transform, "translate(12px, 17px) scale(1)");
  assert.equal(move.defaultPrevented, true);
});

test("small pointer movement remains a click instead of panning", (t) => {
  const { viewport, target } = setup(t);

  viewport.dispatchEvent(
    createEvent("pointerdown", { button: 0, pointerId: 9, clientX: 20, clientY: 30 }),
  );
  viewport.dispatchEvent(
    createEvent("pointermove", { pointerId: 9, clientX: 22, clientY: 31 }),
  );

  assert.equal(target.style.transform, "translate(0px, 0px) scale(1)");
});

test("a completed drag does not activate a Mermaid node", (t) => {
  const { viewport } = setup(t);
  let activationCount = 0;
  viewport.addEventListener("click", () => {
    activationCount += 1;
  });

  viewport.dispatchEvent(
    createEvent("pointerdown", { button: 0, pointerId: 11, clientX: 20, clientY: 30 }),
  );
  viewport.dispatchEvent(
    createEvent("pointermove", { pointerId: 11, clientX: 40, clientY: 50 }),
  );
  viewport.dispatchEvent(createEvent("pointerup", { pointerId: 11 }));
  const click = createEvent("click", {});
  viewport.dispatchEvent(click);

  assert.equal(activationCount, 0);
});

test("reset restores the initial transform", (t) => {
  const { viewport, target, controller } = setup(t);
  viewport.dispatchEvent(
    createEvent("wheel", {
      clientX: 60,
      clientY: 100,
      ctrlKey: true,
      metaKey: false,
      deltaY: -100,
    }),
  );

  controller.reset();

  assert.equal(target.style.transform, "translate(0px, 0px) scale(1)");
});
