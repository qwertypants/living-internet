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
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
  });
  await page.goto(process.env.APP_URL || "http://127.0.0.1:5183");
  await page.evaluate(async () => {
    const f = await import(
      performance
        .getEntriesByType("resource")
        .find((e) => e.name.includes("/@react-three_fiber.js")).name
    );
    window.state = () => [...f._roots.values()][0]?.store.getState();
    window.matrices = () => {
      const a = [];
      window.state().scene.traverse((o) => {
        if (o.isInstancedMesh) a.push(...o.instanceMatrix.array);
      });
      return a;
    };
  });
  await page.waitForFunction(() => window.state()?.gl.info.render.calls > 5);
  const baseline = await page.evaluate(() => window.matrices());
  await page.evaluate(async () => {
    const d = await import("/src/domain.ts");
    const trees = new Map(
      d.replay(d.makeDemoEvents(), 360).map((t) => [t.id, t]),
    );
    window.growthRatios = () => {
      const result = [];
      window.state().scene.traverse((o) => {
        if (o.isInstancedMesh && o.geometry.type === "CylinderGeometry")
          o.userData.eventIds.forEach((id, i) =>
            result.push({
              id,
              ratio: o.instanceMatrix.array[i * 16 + 5] / trees.get(id).height,
            }),
          );
      });
      return result;
    };
  });
  for (const speed of ["1×", "3×", "8×"]) {
    await page.getByLabel("Timeline").fill("350");
    await page.getByRole("button", { name: speed, exact: true }).click();
    await page.getByTitle("Play", { exact: true }).click();
    await page.waitForTimeout(130);
    await page.getByTitle("Pause", { exact: true }).click();
    const paused = await page.evaluate(() => window.matrices());
    const ratios = await page.evaluate(() => window.growthRatios());
    const growing = ratios.filter((t) => t.ratio < 0.99);
    assert(
      growing.length > 0,
      "new commits are visibly smaller than their settled height",
    );
    if (speed === "1×") {
      await page.getByLabel("Inspect commit").selectOption(growing[0].id);
      await page.waitForTimeout(1000);
      await page.screenshot({ path: "/tmp/mycelium-mid-growth.png" });
    }
    await page.waitForTimeout(250);
    assert.deepEqual(
      await page.evaluate(() => window.matrices()),
      paused,
      "pause freezes instance matrices",
    );
    await page.getByTitle("Play", { exact: true }).click();
    await page.waitForTimeout(50);
    const resumed = await page.evaluate(() => window.growthRatios());
    assert(
      growing.some((before) =>
        resumed.some(
          (after) =>
            after.id === before.id && after.ratio > before.ratio + 0.001,
        ),
      ),
      "resume advances an existing partial sprout",
    );
    await page.waitForTimeout(1800);
    assert.deepEqual(
      await page.evaluate(() => window.matrices()),
      baseline,
      "automatic end settles exactly at every speed",
    );
  }
  for (const speed of ["1×", "3×", "8×"]) {
    await page.getByTitle("Restart", { exact: true }).click();
    await page.getByRole("button", { name: speed, exact: true }).click();
    await page.getByTitle("Play", { exact: true }).click();
    await page.waitForFunction(
      () =>
        document.querySelector('input[aria-label="Timeline"]').value ===
          "360" && document.querySelector('button[title="Play"]'),
      {},
      { timeout: 40000 },
    );
    await page.waitForTimeout(700);
    assert.deepEqual(
      await page.evaluate(() => window.matrices()),
      baseline,
      `full-history replay settles identically at ${speed}`,
    );
  }
  await page.getByLabel("Timeline").fill("10");
  await page.getByLabel("Timeline").fill("360");
  assert.deepEqual(
    await page.evaluate(() => window.matrices()),
    baseline,
    "scrub settles",
  );
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.getByLabel("Timeline").fill("350");
  await page.getByTitle("Play", { exact: true }).click();
  await page.waitForTimeout(1600);
  assert.deepEqual(
    await page.evaluate(() => window.matrices()),
    baseline,
    "reduced replay settles",
  );
  await page.screenshot({ path: "/tmp/mycelium-growth.png" });
  console.log(
    "PASS real Chrome intermediate growth, frozen pause, advancing resume, full-history speeds 1/3/8, automatic final settle, scrub, reduced motion",
  );
} finally {
  await browser.close();
}
