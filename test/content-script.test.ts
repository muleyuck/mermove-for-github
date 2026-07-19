import assert from "node:assert/strict";
import test from "node:test";

test("content script observes the renderer document in a browser environment", async (t) => {
  const documentDescriptor = Object.getOwnPropertyDescriptor(globalThis, "document");
  const mutationObserverDescriptor = Object.getOwnPropertyDescriptor(
    globalThis,
    "MutationObserver",
  );
  const documentElement = {};
  const documentFake = {
    documentElement,
    querySelectorAll() {
      return [];
    },
    addEventListener() {},
  };
  let observedTarget: unknown;
  let observedOptions: MutationObserverInit | undefined;

  class MutationObserverFake {
    constructor(_callback: MutationCallback) {}

    observe(target: Node, options?: MutationObserverInit): void {
      observedTarget = target;
      observedOptions = options;
    }

    disconnect(): void {}
  }

  Object.defineProperty(globalThis, "document", {
    configurable: true,
    value: documentFake,
  });
  Object.defineProperty(globalThis, "MutationObserver", {
    configurable: true,
    value: MutationObserverFake,
  });
  t.after(() => {
    if (documentDescriptor) {
      Object.defineProperty(globalThis, "document", documentDescriptor);
    } else {
      delete (globalThis as { document?: unknown }).document;
    }
    if (mutationObserverDescriptor) {
      Object.defineProperty(
        globalThis,
        "MutationObserver",
        mutationObserverDescriptor,
      );
    } else {
      delete (globalThis as { MutationObserver?: unknown }).MutationObserver;
    }
  });

  const moduleUrl = new URL("../src/content-script.ts", import.meta.url);
  moduleUrl.searchParams.set("test", String(Date.now()));
  await import(moduleUrl.href);

  assert.equal(observedTarget, documentElement);
  assert.deepEqual(observedOptions, { childList: true, subtree: true });
});
