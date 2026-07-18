const assert = require("node:assert/strict");
const { existsSync } = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const modulePath = path.join(__dirname, "..", "src", "pan-zoom.js");
const panZoom = existsSync(modulePath) ? require(modulePath) : {};

class TestElement extends EventTarget {
  constructor() {
    super();
    this.style = {};
    this.interactive = false;
  }

  closest() {
    return this.interactive ? this : null;
  }

  setPointerCapture() {}

  releasePointerCapture() {}

  getBoundingClientRect() {
    return { left: 10, top: 20 };
  }
}

function createEvent(type, properties) {
  const event = new Event(type, { bubbles: true, cancelable: true });

  for (const [name, value] of Object.entries(properties)) {
    Object.defineProperty(event, name, { value });
  }

  return event;
}

test("zoomAt keeps the pointer position anchored while scaling", () => {
  const result = panZoom.zoomAt?.(
    { x: 10, y: 20, scale: 1 },
    { x: 50, y: 80 },
    2,
    { min: 0.5, max: 8 },
  );

  assert.deepEqual(result, { x: -30, y: -40, scale: 2 });
});

test("Ctrl+wheel zooms around the pointer without scrolling the page", () => {
  const viewport = new TestElement();
  const target = new TestElement();
  const controller = panZoom.attachPanZoom?.(viewport, target);
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
  controller?.destroy();
});

test("dragging starts outside interactive Mermaid nodes only", () => {
  const viewport = new TestElement();
  const target = new TestElement();
  const controller = panZoom.attachPanZoom?.(viewport, target);
  viewport.interactive = true;

  viewport.dispatchEvent(createEvent("pointerdown", {
    button: 0,
    pointerId: 3,
    clientX: 15,
    clientY: 25,
  }));
  viewport.dispatchEvent(createEvent("pointermove", {
    pointerId: 3,
    clientX: 45,
    clientY: 55,
  }));

  assert.equal(target.style.transform, "translate(0px, 0px) scale(1)");
  controller?.destroy();
});

test("left-button drag pans the rendered diagram", () => {
  const viewport = new TestElement();
  const target = new TestElement();
  const controller = panZoom.attachPanZoom?.(viewport, target);

  viewport.dispatchEvent(createEvent("pointerdown", {
    button: 0,
    pointerId: 7,
    clientX: 20,
    clientY: 30,
  }));
  const move = createEvent("pointermove", {
    pointerId: 7,
    clientX: 32,
    clientY: 47,
  });
  viewport.dispatchEvent(move);
  viewport.dispatchEvent(createEvent("pointerup", { pointerId: 7 }));

  assert.equal(target.style.transform, "translate(12px, 17px) scale(1)");
  assert.equal(move.defaultPrevented, true);
  controller?.destroy();
});

test("small pointer movement remains a click instead of panning", () => {
  const viewport = new TestElement();
  const target = new TestElement();
  const controller = panZoom.attachPanZoom?.(viewport, target);

  viewport.dispatchEvent(createEvent("pointerdown", {
    button: 0,
    pointerId: 9,
    clientX: 20,
    clientY: 30,
  }));
  viewport.dispatchEvent(createEvent("pointermove", {
    pointerId: 9,
    clientX: 22,
    clientY: 31,
  }));

  assert.equal(target.style.transform, "translate(0px, 0px) scale(1)");
  controller?.destroy();
});

test("a completed drag does not activate a Mermaid node click", () => {
  const viewport = new TestElement();
  const target = new TestElement();
  const controller = panZoom.attachPanZoom?.(viewport, target);

  viewport.dispatchEvent(createEvent("pointerdown", {
    button: 0,
    pointerId: 11,
    clientX: 20,
    clientY: 30,
  }));
  viewport.dispatchEvent(createEvent("pointermove", {
    pointerId: 11,
    clientX: 40,
    clientY: 50,
  }));
  viewport.dispatchEvent(createEvent("pointerup", { pointerId: 11 }));
  const click = createEvent("click", {});
  viewport.dispatchEvent(click);

  assert.equal(click.defaultPrevented, true);
  controller?.destroy();
});

test("reset restores the initial transform", () => {
  const viewport = new TestElement();
  const target = new TestElement();
  const controller = panZoom.attachPanZoom?.(viewport, target);
  viewport.dispatchEvent(createEvent("wheel", {
    clientX: 60,
    clientY: 100,
    ctrlKey: true,
    metaKey: false,
    deltaY: -100,
  }));

  controller?.reset?.();

  assert.equal(target.style.transform, "translate(0px, 0px) scale(1)");
  controller?.destroy();
});
