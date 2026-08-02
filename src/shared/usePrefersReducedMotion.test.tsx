import { act, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { usePrefersReducedMotion } from "@/shared/usePrefersReducedMotion";

afterEach(() => vi.restoreAllMocks());

it("tracks live changes to the reduced-motion media query", () => {
  class TestMediaQueryList extends EventTarget implements MediaQueryList {
    matches = false;
    readonly media = "(prefers-reduced-motion: reduce)";
    onchange: ((this: MediaQueryList, event: MediaQueryListEvent) => unknown) | null =
      null;

    addListener(listener: (event: MediaQueryListEvent) => void): void {
      this.addEventListener("change", listener as EventListener);
    }

    removeListener(listener: (event: MediaQueryListEvent) => void): void {
      this.removeEventListener("change", listener as EventListener);
    }
  }

  const mediaQuery = new TestMediaQueryList();
  const removeEventListener = vi.spyOn(mediaQuery, "removeEventListener");
  vi.spyOn(window, "matchMedia").mockReturnValue(mediaQuery);

  function Probe() {
    return <output>{usePrefersReducedMotion() ? "reduced" : "standard"}</output>;
  }

  const { unmount } = render(<Probe />);
  expect(screen.getByText("standard")).toBeInTheDocument();
  expect(window.matchMedia).toHaveBeenCalledWith(
    "(prefers-reduced-motion: reduce)",
  );

  act(() => {
    mediaQuery.matches = true;
    mediaQuery.dispatchEvent(new Event("change"));
  });

  expect(screen.getByText("reduced")).toBeInTheDocument();
  unmount();
  expect(removeEventListener).toHaveBeenCalledOnce();
});
