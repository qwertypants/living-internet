// @vitest-environment jsdom
import {
  act,
  fireEvent,
  render,
  screen,
  cleanup,
} from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import App from "./App";

vi.mock("@react-three/fiber", async (importOriginal) => ({
  ...await importOriginal<typeof import("@react-three/fiber")>(),
  Canvas: () => null,
}));
vi.mock("@react-three/drei", () => ({
  Html: () => null,
  Line: () => null,
  Stars: vi.fn(() => null),
  OrbitControls: vi.fn(() => null),
}));
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  localStorage?.clear();
  vi.unstubAllGlobals();
});
it("follows system motion changes, allows override and keeps replay usable", () => {
  vi.useFakeTimers();
  let listener = () => {};
  const query = {
    matches: true,
    addEventListener: (_: string, cb: () => void) => {
      listener = cb;
    },
    removeEventListener: vi.fn(),
  };
  window.matchMedia = vi.fn().mockReturnValue(query);
  render(<App />);
  expect(screen.getByTitle("Toggle reduced motion").getAttribute("aria-pressed")).toBe("true");
  fireEvent.click(screen.getByTitle("Play"));
  act(() => {
    vi.advanceTimersByTime(270);
  });
  expect(
    Number((screen.getByLabelText("Timeline") as HTMLInputElement).value),
  ).toBeGreaterThan(0);
  act(() => {
    query.matches = false;
    listener();
  });
  expect(screen.getByTitle("Toggle reduced motion").getAttribute("aria-pressed")).toBe("false");
  fireEvent.click(screen.getByTitle("Toggle reduced motion"));
  expect(screen.getByTitle("Toggle reduced motion").getAttribute("aria-pressed")).toBe("true");
  act(() => {
    query.matches = true;
    listener();
  });
  expect(
    screen.getByTitle("Toggle reduced motion").getAttribute("aria-pressed"),
  ).toBe("true");
});

it("freezes actual tree frame updates and disables camera damping and stars", async () => {
  const { create } = await import("@react-three/test-renderer");
  const { Island } = await import("./App");
  const { makeDemoEvents, replay } = await import("./domain");
  const { Stars, OrbitControls } = await import("@react-three/drei");
  const props = { trees: replay(makeDemoEvents(1), 1), selected: null, onPick: vi.fn() };
  (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  const renderer = await create(<Island {...props} reduced={false} />);
  await renderer.advanceFrames(2, 0.1);
  const tree = renderer.scene.findByProps({ name: "forest" }).instance;
  expect(tree.position.y).toBe(0);
  await renderer.update(<Island {...props} reduced />);
  const frozen = tree.position.y;
  await renderer.advanceFrames(4, 0.5);
  expect(tree.position.y).toBe(frozen);
  expect(Stars).toHaveBeenLastCalledWith(expect.objectContaining({ speed: 0 }), undefined);
  expect(OrbitControls).toHaveBeenLastCalledWith(expect.objectContaining({ autoRotate: false, enableDamping: false }), undefined);
  await renderer.unmount();
});

it("selects canonical commits with arrow keys after rewind and input reordering", async () => {
  const { makeDemoEvents, replay } = await import("./domain");
  const events = makeDemoEvents(12).reverse();
  vi.stubGlobal("localStorage", { getItem: () => JSON.stringify(events), setItem: vi.fn(), clear: vi.fn() });
  window.matchMedia = vi.fn().mockReturnValue({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() });
  render(<App />);
  const select = screen.getByLabelText("Inspect commit") as HTMLSelectElement;
  fireEvent.keyDown(select, { key: "End" });
  expect(select.value).toBe(replay(events, 12).at(-1)!.id);
  fireEvent.change(screen.getByLabelText("Timeline"), { target: { value: "3" } });
  expect(select.value).toBe("");
  fireEvent.keyDown(select, { key: "ArrowDown" });
  expect(select.value).toBe(replay(events, 3)[0].id);
  fireEvent.click(screen.getByRole("button", { name: "Scene: detailed" }));
  expect(screen.getByRole("button", { name: "Scene: simple" }).getAttribute("aria-pressed")).toBe("true");
});
