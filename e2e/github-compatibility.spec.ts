import { chromium, expect, test as base, type BrowserContext, type Frame } from "@playwright/test";
import { fileURLToPath } from "node:url";

const extensionPath = fileURLToPath(new URL("../dist/", import.meta.url));
const fixtureUrl =
  "https://github.com/muleyuck/mermove-for-github/blob/main/e2e/fixtures/github-mermaid.md";
const fixtureLabel = "Compatibility Fixture Start";
const rendererUrlPrefix =
  "https://viewscreen.githubusercontent.com/markdown/mermaid";

const test = base.extend<{ context: BrowserContext }>({
  context: async ({}, use) => {
    const context = await chromium.launchPersistentContext("", {
      channel: "chromium",
      headless: true,
      args: [
        `--disable-extensions-except=${extensionPath}`,
        `--load-extension=${extensionPath}`,
      ],
    });

    await use(context);
    await context.close();
  },
});

async function findDiagramFrame(pageFrames: () => Frame[]): Promise<Frame> {
  let diagramFrame: Frame | undefined;

  await expect
    .poll(async () => {
      for (const frame of pageFrames()) {
        if (!frame.url().startsWith(rendererUrlPrefix)) {
          continue;
        }

        const diagrams = frame.locator("svg").filter({ hasText: fixtureLabel });
        if ((await diagrams.count()) > 0) {
          diagramFrame = frame;
          return true;
        }
      }

      return false;
    }, {
      message: `expected a ${rendererUrlPrefix} frame containing ${JSON.stringify(fixtureLabel)}`,
    })
    .toBe(true);

  return diagramFrame as Frame;
}

test("the extension controls GitHub's live Mermaid renderer", async ({
  context,
}) => {
  const page = await context.newPage();
  await page.goto(fixtureUrl, { waitUntil: "domcontentloaded" });

  const diagramFrame = await findDiagramFrame(() => page.frames());
  const diagram = diagramFrame
    .locator("svg")
    .filter({ hasText: fixtureLabel })
    .first();
  const target = diagram.locator("..");

  await expect(diagram).toBeVisible();
  await expect
    .poll(() => target.evaluate((element) => element.style.transform))
    .toBe("translate(0px, 0px) scale(1)");

  await diagram.evaluate((element) =>
    element.scrollIntoView({ block: "center" }),
  );

  const bounds = await diagram.boundingBox();
  assertBounds(bounds);
  const pointer = {
    x: bounds.x + Math.min(bounds.width / 2, 200),
    y: bounds.y + Math.min(bounds.height / 2, 150),
  };

  await page.mouse.move(pointer.x, pointer.y);
  await page.keyboard.down("Control");
  await page.mouse.wheel(0, -100);
  await page.keyboard.up("Control");

  await expect
    .poll(() => target.evaluate((element) => element.style.transform))
    .toContain("scale(1.07)");

  const transformBeforePan = await target.evaluate(
    (element) => element.style.transform,
  );
  await page.mouse.move(pointer.x, pointer.y);
  await page.mouse.down();
  await page.mouse.move(pointer.x + 30, pointer.y + 20);
  await page.mouse.up();

  await expect
    .poll(() => target.evaluate((element) => element.style.transform))
    .not.toBe(transformBeforePan);

  await diagramFrame.getByRole("button", { name: "Reset view" }).click();
  await expect
    .poll(() => target.evaluate((element) => element.style.transform))
    .toBe("translate(0px, 0px) scale(1)");
});

function assertBounds(
  bounds: { x: number; y: number; width: number; height: number } | null,
): asserts bounds is { x: number; y: number; width: number; height: number } {
  expect(bounds, "expected the Mermaid diagram to have a bounding box").not.toBeNull();
}
