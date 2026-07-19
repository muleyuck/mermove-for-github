import assert from "node:assert/strict";
import test from "node:test";
import {
  findDiagramSvg,
  observeRenderer,
  startRendererEnhancement,
  type DiagramElement,
  type MutationObserverLike,
  type RendererRoot,
} from "../src/content-script.ts";

interface FakeParent {
  parentElement?: FakeParent | null;
}

function createSvg(
  width: number,
  height: number,
  { insideButton = false }: { insideButton?: boolean } = {},
): DiagramElement<FakeParent> {
  return {
    parentElement: {},
    closest(selector: string) {
      return selector === "button" && insideButton
        ? ({} as unknown as Element)
        : null;
    },
    getAttribute(name: string) {
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

  const result = findDiagramSvg(root);

  assert.equal(result, diagram);
});

test("observeRenderer rebinds when GitHub replaces the rendered SVG", () => {
  const first = createSvg(120, 80);
  const second = createSvg(200, 100);
  let current = first;
  let notifyMutation: (() => void) | undefined;
  let observerDisconnected = false;
  const destroyedTargets: FakeParent[] = [];
  const attachedTargets: { viewport: FakeParent; target: FakeParent }[] = [];
  const root: RendererRoot<FakeParent> = {
    documentElement: {},
    querySelectorAll() {
      return [current];
    },
  };
  class TestMutationObserver implements MutationObserverLike {
    constructor(callback: () => void) {
      notifyMutation = callback;
    }
    observe(): void {}
    disconnect(): void {
      observerDisconnected = true;
    }
  }
  function attachPanZoom(viewport: FakeParent, target: FakeParent) {
    attachedTargets.push({ viewport, target });
    return {
      reset() {},
      destroy() {
        destroyedTargets.push(target);
      },
    };
  }

  const stop = observeRenderer(root, TestMutationObserver, attachPanZoom);
  current = second;
  notifyMutation?.();
  stop();

  assert.deepEqual(attachedTargets, [
    { viewport: first.parentElement, target: first.parentElement },
    { viewport: second.parentElement, target: second.parentElement },
  ]);
  assert.deepEqual(destroyedTargets, [first.parentElement, second.parentElement]);
  assert.equal(observerDisconnected, true);
});

test("observeRenderer ignores unrelated mutations while the SVG is unchanged", () => {
  const diagram = createSvg(120, 80);
  let notifyMutation: (() => void) | undefined;
  let attachmentCount = 0;
  const root: RendererRoot<FakeParent> = {
    documentElement: {},
    querySelectorAll() {
      return [diagram];
    },
  };
  class TestMutationObserver implements MutationObserverLike {
    constructor(callback: () => void) {
      notifyMutation = callback;
    }
    observe(): void {}
    disconnect(): void {}
  }

  const stop = observeRenderer(root, TestMutationObserver, () => {
    attachmentCount += 1;
    return { reset() {}, destroy() {} };
  });
  notifyMutation?.();
  notifyMutation?.();
  stop();

  assert.equal(attachmentCount, 1);
});

test("observeRenderer detaches when the rendered SVG is removed", () => {
  const diagram = createSvg(120, 80);
  let current: DiagramElement<FakeParent> | null = diagram;
  let notifyMutation: (() => void) | undefined;
  let destroyCount = 0;
  const root: RendererRoot<FakeParent> = {
    documentElement: {},
    querySelectorAll() {
      return current ? [current] : [];
    },
  };
  class TestMutationObserver implements MutationObserverLike {
    constructor(callback: () => void) {
      notifyMutation = callback;
    }
    observe(): void {}
    disconnect(): void {}
  }

  const stop = observeRenderer(root, TestMutationObserver, () => ({
    reset() {},
    destroy() {
      destroyCount += 1;
    },
  }));
  current = null;
  notifyMutation?.();

  assert.equal(destroyCount, 1);
  stop();
  assert.equal(destroyCount, 1);
});

test("GitHub's accessible reset control also resets mouse transforms", () => {
  const diagram = createSvg(120, 80);
  let resetCount = 0;
  class RendererRootFake extends EventTarget implements RendererRoot<FakeParent> {
    documentElement = {};

    closest(selector: string): Element | null {
      return selector === "button[aria-label='Reset view']"
        ? (this as unknown as Element)
        : null;
    }

    querySelectorAll() {
      return [diagram];
    }
  }
  class TestMutationObserver implements MutationObserverLike {
    observe(): void {}
    disconnect(): void {}
  }
  const root = new RendererRootFake();

  const stop = observeRenderer(root, TestMutationObserver, () => ({
    destroy() {},
    reset() {
      resetCount += 1;
    },
  }));
  root.dispatchEvent(new Event("click", { bubbles: true }));

  assert.equal(resetCount, 1);
  stop();
});

test("startRendererEnhancement wires the renderer document to pan and zoom", () => {
  const diagram = createSvg(120, 80);
  let attachmentCount = 0;
  const root: RendererRoot<FakeParent> = {
    documentElement: {},
    querySelectorAll() {
      return [diagram];
    },
  };
  class TestMutationObserver implements MutationObserverLike {
    observe(): void {}
    disconnect(): void {}
  }

  const stop = startRendererEnhancement(root, {
    MutationObserverClass: TestMutationObserver,
    attachPanZoom() {
      attachmentCount += 1;
      return { reset() {}, destroy() {} };
    },
  });

  assert.equal(attachmentCount, 1);
  stop();
});

test("observeRenderer keeps pointer coordinates in an untransformed parent viewport", () => {
  const diagram = createSvg(120, 80);
  const stableViewport: FakeParent = {};
  (diagram.parentElement as FakeParent).parentElement = stableViewport;
  let attachment: { viewport: FakeParent; target: FakeParent } | undefined;
  const root: RendererRoot<FakeParent> = {
    documentElement: {},
    querySelectorAll() {
      return [diagram];
    },
  };
  class TestMutationObserver implements MutationObserverLike {
    observe(): void {}
    disconnect(): void {}
  }

  const stop = observeRenderer(
    root,
    TestMutationObserver,
    (viewport, target) => {
      attachment = { viewport, target };
      return { reset() {}, destroy() {} };
    },
  );

  assert.deepEqual(attachment, {
    viewport: stableViewport,
    target: diagram.parentElement,
  });
  stop();
});
