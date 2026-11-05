import { createRequire } from "node:module";
import assert from "node:assert/strict";
const { chromium } = createRequire(
  process.env.PLAYWRIGHT_PACKAGE ||
    "/tmp/mycelium-browser-evidence/package.json",
)("playwright");
const browser = await chromium.launch({
  executablePath:
    process.env.CHROME_PATH ||
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: true,
});
try {
  for (const width of [1440, 390]) {
    const page = await browser.newPage({
      viewport: { width, height: 1000 },
      reducedMotion: "reduce",
    });
    await page.goto(process.env.APP_URL || "http://127.0.0.1:5182");
    await page.evaluate(async () => {
      const f = await import(
        performance
          .getEntriesByType("resource")
          .find((e) => e.name.includes("/@react-three_fiber.js")).name
      );
      window.state = () => [...f._roots.values()][0].store.getState();
    });
    await page.waitForTimeout(500);
    const select = page.getByLabel("Inspect commit");
    await select.selectOption({ index: 1 });
    await page.waitForTimeout(100);
    assert(await page.locator(".inspector").isVisible());
    await page.waitForTimeout(300);
    const panel = await page.locator(".inspector").boundingBox(),
      controls = await page.locator(".scene-controls").boundingBox();
    assert(
      panel.x >= 0 &&
        panel.x + panel.width <= width &&
        panel.y + panel.height <= 1000,
      "inspector stays within viewport",
    );
    assert(
      controls.y + controls.height < panel.y ||
        controls.x + controls.width < panel.x,
      "controls do not overlap inspector",
    );
    const projected = await page.evaluate(() => {
      const s = window.state();
      const p = s.controls.target.clone().project(s.camera);
      const r = s.gl.domElement.getBoundingClientRect();
      return {
        x: r.x + ((p.x + 1) * r.width) / 2,
        y: r.y + ((1 - p.y) * r.height) / 2,
      };
    });
    assert(
      projected.x < panel.x ||
        projected.x > panel.x + panel.width ||
        projected.y < panel.y ||
        projected.y > panel.y + panel.height,
      "selected target remains outside inspector",
    );
    await page.screenshot({ path: `/tmp/mycelium-camera-${width}.png` });
    assert(
      await page.evaluate(() => window.state().controls.target.length() > 0),
    );
    await page.getByRole("button", { name: "Home", exact: true }).focus();
    await page.keyboard.press("Enter");
    await page.waitForTimeout(100);
    assert(
      await page.evaluate(
        () => window.state().controls.target.length() < 0.001,
      ),
    );
    for (const keyboard of [false, true]) {
      const box = await page.locator("canvas").boundingBox();
      await page.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.4);
      await page.mouse.down();
      await page.mouse.move(
        box.x + box.width * 0.65,
        box.y + box.height * 0.4,
        { steps: 5 },
      );
      await page.mouse.up();
      assert(
        await page.evaluate(
          () =>
            window.state().camera.position.distanceTo({ x: 8, y: 8, z: 12 }) >
            0.1,
        ),
      );
      if (keyboard) {
        await page.getByRole("button", { name: "Home", exact: true }).focus();
        await page.keyboard.press("Enter");
      } else
        await page.getByRole("button", { name: "Home", exact: true }).click();
      await page.waitForTimeout(100);
      assert(
        await page.evaluate(
          () =>
            window.state().camera.position.distanceTo({ x: 8, y: 8, z: 12 }) <
            0.001,
        ),
        "Home resets already-empty selection",
      );
    }
    await select.selectOption({ index: 360 });
    await page.getByLabel("Timeline").fill("0");
    await page.waitForTimeout(100);
    assert.equal(await page.locator(".inspector").count(), 0);
    await page.getByLabel("Timeline").fill("360");
    await page.getByTitle("Toggle reduced motion").click();
    await select.selectOption({ index: 1 });
    await page.waitForTimeout(120);
    const box = await page.locator("canvas").boundingBox();
    const dragStart = {
      x: box.x + box.width * 0.5,
      y: box.y + box.height * 0.3,
    };
    assert(
      await page.evaluate(
        ({ x, y }) =>
          document.elementFromPoint(x, y) === document.querySelector("canvas"),
        dragStart,
      ),
      "drag starts on canvas rather than controls",
    );
    const selectionBeforeDrag = await select.inputValue();
    await page.mouse.move(dragStart.x, dragStart.y);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width * 0.6, box.y + box.height * 0.305, {
      steps: 5,
    });
    await page.mouse.up();
    await page.waitForTimeout(100);
    assert.equal(await select.inputValue(), selectionBeforeDrag, "orbit drag must not select another tree");
    const a = await page.evaluate(() =>
      window.state().camera.position.toArray(),
    );
    await page.waitForTimeout(1000);
    assert.deepEqual(
      await page.evaluate(() => window.state().camera.position.toArray()),
      a,
    );
    await select.selectOption({ index: 2 });
    await page.waitForTimeout(1100);
    const expected = await page.evaluate(async () => {
      const d = await import("/src/domain.ts");
      const t = d.replay(d.makeDemoEvents(), 360)[1];
      return [t.x, t.height * 0.6, t.z];
    });
    assert(
      await page.evaluate(
        (expected) =>
          window
            .state()
            .controls.target.toArray()
            .every((n, i) => Math.abs(n - expected[i]) < 0.001),
        expected,
      ),
      "reselection reaches second target",
    );
    await page.getByRole("button", { name: "Home", exact: true }).click();
    await page.waitForTimeout(100);
    assert.equal(
      await page.evaluate(() => window.state().controls.autoRotate),
      false,
      "no rotation during overview flight",
    );
    await page.waitForTimeout(1100);
    assert.equal(
      await page.evaluate(() => window.state().controls.autoRotate),
      true,
      "rotation resumes after overview flight",
    );
    console.log(
      width,
      "PASS reduced snap, keyboard Home, rewind clear, manual cancellation, reselection",
    );
    await page.close();
  }
} finally {
  await browser.close();
}
