const assert = require("node:assert/strict");
const { existsSync } = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const modulePath = path.join(__dirname, "..", "src", "content-script.js");
const contentScript = existsSync(modulePath) ? require(modulePath) : {};

function createSvg(width, height, { insideButton = false } = {}) {
  return {
    parentElement: {},
    closest(selector) {
      return selector === "button" && insideButton ? {} : null;
    },
    getAttribute(name) {
      return name === "viewBox" ? `0 0 ${width} ${height}` : null;
    },
  };
}

test("findDiagramSvg selects the largest non-control SVG", () => {
  const controlIcon = createSvg(500, 500, { insideButton: true });
  const decorativeIcon = createSvg(16, 16);
  const diagram = createSvg(120, 80);
  const root = {
    querySelectorAll() {
      return [controlIcon, decorativeIcon, diagram];
    },
  };

  const result = contentScript.findDiagramSvg?.(root);

  assert.equal(result, diagram);
});

test("observeRenderer rebinds when GitHub replaces the rendered SVG", () => {
  const first = createSvg(120, 80);
  const second = createSvg(200, 100);
  let current = first;
  let notifyMutation;
  let observerDisconnected = false;
  const destroyedTargets = [];
  const attachedTargets = [];
  const root = {
    documentElement: {},
    querySelectorAll() {
      return [current];
    },
  };
  class TestMutationObserver {
    constructor(callback) {
      notifyMutation = callback;
    }

    observe() {}

    disconnect() {
      observerDisconnected = true;
    }
  }
  function attachPanZoom(viewport, target) {
    attachedTargets.push({ viewport, target });
    return {
      destroy() {
        destroyedTargets.push(target);
      },
    };
  }

  const stop = contentScript.observeRenderer?.(
    root,
    TestMutationObserver,
    attachPanZoom,
  );
  current = second;
  notifyMutation?.();
  stop?.();

  assert.deepEqual(attachedTargets, [
    { viewport: first.parentElement, target: first.parentElement },
    { viewport: second.parentElement, target: second.parentElement },
  ]);
  assert.deepEqual(destroyedTargets, [first.parentElement, second.parentElement]);
  assert.equal(observerDisconnected, true);
});

test("observeRenderer ignores unrelated mutations while the SVG is unchanged", () => {
  const diagram = createSvg(120, 80);
  let notifyMutation;
  let attachmentCount = 0;
  const root = {
    documentElement: {},
    querySelectorAll() {
      return [diagram];
    },
  };
  class TestMutationObserver {
    constructor(callback) {
      notifyMutation = callback;
    }

    observe() {}

    disconnect() {}
  }

  const stop = contentScript.observeRenderer?.(
    root,
    TestMutationObserver,
    () => {
      attachmentCount += 1;
      return { destroy() {} };
    },
  );
  notifyMutation?.();
  notifyMutation?.();
  stop?.();

  assert.equal(attachmentCount, 1);
});

test("observeRenderer detaches when the rendered SVG is removed", () => {
  const diagram = createSvg(120, 80);
  let current = diagram;
  let notifyMutation;
  let destroyCount = 0;
  const root = {
    documentElement: {},
    querySelectorAll() {
      return current ? [current] : [];
    },
  };
  class TestMutationObserver {
    constructor(callback) {
      notifyMutation = callback;
    }

    observe() {}

    disconnect() {}
  }

  const stop = contentScript.observeRenderer?.(
    root,
    TestMutationObserver,
    () => ({
      destroy() {
        destroyCount += 1;
      },
    }),
  );
  current = null;
  notifyMutation?.();

  assert.equal(destroyCount, 1);
  stop?.();
  assert.equal(destroyCount, 1);
});

test("GitHub's accessible reset control also resets mouse transforms", () => {
  const diagram = createSvg(120, 80);
  let resetCount = 0;
  class RendererRoot extends EventTarget {
    constructor() {
      super();
      this.documentElement = {};
    }

    closest(selector) {
      return selector === "button[aria-label='Reset view']" ? this : null;
    }

    querySelectorAll() {
      return [diagram];
    }
  }
  class TestMutationObserver {
    observe() {}
    disconnect() {}
  }
  const root = new RendererRoot();

  const stop = contentScript.observeRenderer?.(
    root,
    TestMutationObserver,
    () => ({
      destroy() {},
      reset() {
        resetCount += 1;
      },
    }),
  );
  root.dispatchEvent(new Event("click", { bubbles: true }));

  assert.equal(resetCount, 1);
  stop?.();
});

test("startRendererEnhancement wires the renderer document to pan and zoom", () => {
  const diagram = createSvg(120, 80);
  let attachmentCount = 0;
  const root = {
    documentElement: {},
    querySelectorAll() {
      return [diagram];
    },
  };
  class TestMutationObserver {
    observe() {}
    disconnect() {}
  }

  const stop = contentScript.startRendererEnhancement?.(root, {
    MutationObserverClass: TestMutationObserver,
    attachPanZoom() {
      attachmentCount += 1;
      return { destroy() {} };
    },
  });

  assert.equal(attachmentCount, 1);
  stop?.();
});

test("observeRenderer keeps pointer coordinates in an untransformed parent viewport", () => {
  const diagram = createSvg(120, 80);
  const stableViewport = {};
  diagram.parentElement.parentElement = stableViewport;
  let attachment;
  const root = {
    documentElement: {},
    querySelectorAll() {
      return [diagram];
    },
  };
  class TestMutationObserver {
    observe() {}
    disconnect() {}
  }

  const stop = contentScript.observeRenderer?.(
    root,
    TestMutationObserver,
    (viewport, target) => {
      attachment = { viewport, target };
      return { destroy() {} };
    },
  );

  assert.deepEqual(attachment, {
    viewport: stableViewport,
    target: diagram.parentElement,
  });
  stop?.();
});
