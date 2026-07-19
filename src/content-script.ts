export interface DiagramElement<TParent> {
  getAttribute(name: string): string | null;
  closest(selector: string): Element | null;
  parentElement: TParent | null;
}

export interface RendererRoot<TSvgParent> {
  documentElement: unknown;
  querySelectorAll(selector: "svg"): Iterable<DiagramElement<TSvgParent>>;
  addEventListener?(
    type: string,
    listener: (event: Event) => void,
    options?: boolean | AddEventListenerOptions,
  ): void;
  removeEventListener?(
    type: string,
    listener: (event: Event) => void,
    options?: boolean | EventListenerOptions,
  ): void;
}

export interface RendererController {
  reset(): void;
  destroy(): void;
}

export interface MutationObserverLike {
  observe(
    target: unknown,
    options: { childList: boolean; subtree: boolean },
  ): void;
  disconnect(): void;
}

export interface RendererEnvironment<TSvgParent extends { parentElement?: TSvgParent | null }> {
  MutationObserverClass: new (callback: () => void) => MutationObserverLike;
  attachPanZoom: (viewport: TSvgParent, target: TSvgParent) => RendererController;
}

function viewBoxArea<TParent>(svg: DiagramElement<TParent>): number {
  const values = (svg.getAttribute("viewBox") || "")
    .trim()
    .split(/[\s,]+/)
    .map(Number);

  if (values.length !== 4 || values.some((value) => !Number.isFinite(value))) {
    return 0;
  }

  return Math.abs((values[2] as number) * (values[3] as number));
}

export function findDiagramSvg<TParent>(
  root: Pick<RendererRoot<TParent>, "querySelectorAll">,
): DiagramElement<TParent> | null {
  return (
    [...root.querySelectorAll("svg")]
      .filter((svg) => !svg.closest("button"))
      .sort((left, right) => viewBoxArea(right) - viewBoxArea(left))[0] ?? null
  );
}

export function observeRenderer<TSvgParent extends { parentElement?: TSvgParent | null }>(
  root: RendererRoot<TSvgParent>,
  MutationObserverClass: new (callback: () => void) => MutationObserverLike,
  attachPanZoom: (viewport: TSvgParent, target: TSvgParent) => RendererController,
): () => void {
  let controller: RendererController | null = null;
  let currentSvg: DiagramElement<TSvgParent> | null = null;

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
    const viewport = target.parentElement ?? target;
    controller = attachPanZoom(viewport, target);
  }

  function handleClick(event: Event) {
    const resetControl = (event.target as Element | null)?.closest?.(
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

export function startRendererEnhancement<TSvgParent extends { parentElement?: TSvgParent | null }>(
  root: RendererRoot<TSvgParent>,
  environment: RendererEnvironment<TSvgParent>,
): () => void {
  return observeRenderer(
    root,
    environment.MutationObserverClass,
    environment.attachPanZoom,
  );
}

import { attachPanZoom } from "./pan-zoom.ts";

if (typeof document !== "undefined" && typeof MutationObserver !== "undefined") {
  startRendererEnhancement(document, {
    MutationObserverClass: MutationObserver,
    attachPanZoom,
  });
}
