import { act } from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SystemRoot, useSystemActions } from "@/system/SystemRoot";

function DesktopControls() {
  const { requestLogOff, requestTurnOff } = useSystemActions();

  return (
    <>
      <button onClick={requestLogOff}>Log Off</button>
      <button onClick={requestTurnOff}>Turn Off</button>
    </>
  );
}

describe("SystemRoot", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("uses short phase timing when the operating system requests reduced motion", () => {
    vi.stubGlobal(
      "matchMedia",
      vi.fn().mockReturnValue({
        matches: true,
        media: "(prefers-reduced-motion: reduce)",
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      } satisfies MediaQueryList),
    );

    render(
      <SystemRoot>
        <div>Desktop child</div>
      </SystemRoot>,
    );

    act(() => vi.advanceTimersByTime(149));
    expect(screen.getByTestId("boot-screen")).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(1));
    expect(screen.getByTestId("login-screen")).toBeInTheDocument();
  });

  it("keeps the normal boot screen visible for exactly 1800 ms", () => {
    render(
      <SystemRoot reducedMotion={false}>
        <DesktopControls />
      </SystemRoot>,
    );

    act(() => vi.advanceTimersByTime(1_799));
    expect(screen.getByTestId("boot-screen")).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(1));
    expect(screen.getByTestId("login-screen")).toBeInTheDocument();
  });

  it("shows Rosebeg XP branding and a decorative boot progress indicator", () => {
    render(
      <SystemRoot reducedMotion={false}>
        <div>Desktop child</div>
      </SystemRoot>,
    );

    expect(screen.getByRole("img", { name: "Rosebeg XP" })).toBeInTheDocument();
    expect(screen.getByTestId("boot-progress")).toBeInTheDocument();
    expect(screen.queryByText("Starting Windows...")).not.toBeInTheDocument();
  });

  it("shows the Rosebeg XP intro and the two login footer groups", () => {
    render(
      <SystemRoot reducedMotion={false}>
        <div>Desktop child</div>
      </SystemRoot>,
    );

    act(() => vi.advanceTimersByTime(1_800));
    expect(screen.getByTestId("login-header")).toBeInTheDocument();
    expect(screen.getByTestId("login-main")).toBeInTheDocument();
    expect(screen.getByTestId("login-footer")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Harry" })).toBeInTheDocument();
    const header = screen.getByTestId("login-header");
    const intro = screen.getByTestId("login-intro");
    const footer = screen.getByTestId("login-footer");
    expect(within(header).queryByRole("img", { name: "Rosebeg XP" })).not.toBeInTheDocument();
    expect(within(intro).getByRole("img", { name: "Rosebeg XP" })).toBeInTheDocument();
    expect(within(intro).getByText("To begin, click your user name")).toBeInTheDocument();
    expect(within(intro).queryByText("Welcome")).not.toBeInTheDocument();
    expect(within(footer).getByText("Turn off computer")).toBeInTheDocument();
    expect(
      within(footer).getByText(
        "After you log on, you can explore Harry's work, photography, and story.",
      ),
    ).toBeInTheDocument();
  });

  it("switches from the XP login shell to the DOS portfolio introduction", () => {
    render(
      <SystemRoot reducedMotion={false}>
        <div>Desktop child</div>
      </SystemRoot>,
    );

    act(() => vi.advanceTimersByTime(1_800));

    fireEvent.click(screen.getByRole("button", { name: "Harry" }));
    expect(screen.getByTestId("signing-in-screen")).toBeInTheDocument();
    expect(screen.queryByTestId("login-header")).not.toBeInTheDocument();
    expect(screen.getByText("C:\\WINDOWS\\system32\\cmd.exe")).toBeInTheDocument();
    expect(screen.getByLabelText("Rosebeg portfolio login introduction")).toHaveTextContent(
      "Every project displayed here was independently developed by Zhiyuan Xing.",
    );
  });

  it("keeps the normal DOS sign-in sequence visible for exactly 5200 ms", () => {
    render(
      <SystemRoot reducedMotion={false}>
        <DesktopControls />
      </SystemRoot>,
    );

    act(() => vi.advanceTimersByTime(1_800));
    fireEvent.click(screen.getByRole("button", { name: "Harry" }));
    act(() => vi.advanceTimersByTime(5_199));
    expect(screen.getByTestId("signing-in-screen")).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(1));
    expect(screen.getByRole("button", { name: "Log Off" })).toBeInTheDocument();
  });

  it("keeps normal logoff visible for exactly 450 ms", () => {
    render(
      <SystemRoot reducedMotion={false}>
        <DesktopControls />
      </SystemRoot>,
    );

    act(() => vi.advanceTimersByTime(1_800));
    fireEvent.click(screen.getByRole("button", { name: "Harry" }));
    act(() => vi.advanceTimersByTime(5_200));
    fireEvent.click(screen.getByRole("button", { name: "Log Off" }));
    act(() => vi.advanceTimersByTime(449));
    expect(screen.getByTestId("logging-off-screen")).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(1));
    expect(screen.getByTestId("login-screen")).toBeInTheDocument();
  });

  it("keeps normal shutdown visible for exactly 1200 ms", () => {
    render(
      <SystemRoot reducedMotion={false}>
        <DesktopControls />
      </SystemRoot>,
    );

    act(() => vi.advanceTimersByTime(1_800));
    fireEvent.click(screen.getByRole("button", { name: "Harry" }));
    act(() => vi.advanceTimersByTime(5_200));
    fireEvent.click(screen.getByRole("button", { name: "Turn Off" }));
    act(() => vi.advanceTimersByTime(1_199));
    expect(screen.getByTestId("shutting-down-screen")).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(1));
    expect(screen.getByTestId("powered-off-screen")).toBeInTheDocument();
  });

  it("uses exactly 150 ms for every reduced-motion timed phase", () => {
    render(
      <SystemRoot reducedMotion>
        <DesktopControls />
      </SystemRoot>,
    );

    act(() => vi.advanceTimersByTime(149));
    expect(screen.getByTestId("boot-screen")).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(1));
    fireEvent.click(screen.getByRole("button", { name: "Harry" }));
    act(() => vi.advanceTimersByTime(149));
    expect(screen.getByTestId("signing-in-screen")).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(1));
    fireEvent.click(screen.getByRole("button", { name: "Log Off" }));
    act(() => vi.advanceTimersByTime(149));
    expect(screen.getByTestId("logging-off-screen")).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(1));
    fireEvent.click(screen.getByRole("button", { name: "Harry" }));
    act(() => vi.advanceTimersByTime(150));
    fireEvent.click(screen.getByRole("button", { name: "Turn Off" }));
    act(() => vi.advanceTimersByTime(149));
    expect(screen.getByTestId("shutting-down-screen")).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(1));
    expect(screen.getByTestId("powered-off-screen")).toBeInTheDocument();
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
