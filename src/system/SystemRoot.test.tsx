import { act } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SystemRoot, useSystemActions } from "@/system/SystemRoot";

function DesktopControls() {
  const { requestTurnOff } = useSystemActions();

  return <button onClick={requestTurnOff}>Turn Off</button>;
}

describe("SystemRoot", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows the desktop after booting and signing in with Harry", () => {
    render(
      <SystemRoot reducedMotion>
        <div>Desktop child</div>
      </SystemRoot>,
    );

    expect(screen.getByTestId("boot-screen")).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(150));
    expect(screen.getByTestId("login-screen")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Harry" }));
    expect(screen.getByTestId("signing-in-screen")).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(150));

    expect(screen.getByText("Desktop child")).toBeInTheDocument();
  });

  it("restarts from the powered-off screen into a new boot sequence", () => {
    render(
      <SystemRoot reducedMotion>
        <DesktopControls />
      </SystemRoot>,
    );

    act(() => vi.advanceTimersByTime(150));
    fireEvent.click(screen.getByRole("button", { name: "Harry" }));
    act(() => vi.advanceTimersByTime(150));

    fireEvent.click(screen.getByRole("button", { name: "Turn Off" }));
    expect(screen.getByTestId("shutting-down-screen")).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(150));
    expect(screen.getByTestId("powered-off-screen")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Restart" }));
    expect(screen.getByTestId("boot-screen")).toBeInTheDocument();
  });
});
