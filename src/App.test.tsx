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

vi.mock("@react-three/fiber", () => ({
  Canvas: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  useFrame: vi.fn(),
}));
vi.mock("@react-three/drei", () => ({
  Line: () => null,
  Stars: ({ speed }: { speed: number }) => (
    <div data-testid="stars">{speed}</div>
  ),
  OrbitControls: ({ autoRotate }: { autoRotate: boolean }) => (
    <div data-testid="orbit">{String(autoRotate)}</div>
  ),
}));
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  localStorage?.clear();
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
  expect(screen.getByTestId("orbit").textContent).toBe("false");
  expect(screen.getByTestId("stars").textContent).toBe("0");
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
  expect(screen.getByTestId("orbit").textContent).toBe("true");
  fireEvent.click(screen.getByTitle("Toggle reduced motion"));
  expect(screen.getByTestId("orbit").textContent).toBe("false");
  act(() => {
    query.matches = true;
    listener();
  });
  expect(
    screen.getByTitle("Toggle reduced motion").getAttribute("aria-pressed"),
  ).toBe("true");
});
