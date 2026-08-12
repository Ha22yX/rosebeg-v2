import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DosLoginScreen } from "@/system/DosLoginScreen";

describe("DosLoginScreen", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("types the ownership message before showing the Log In prompt", () => {
    render(<DosLoginScreen reducedMotion={false} />);

    expect(screen.getByTestId("signing-in-screen")).toBeInTheDocument();
    expect(screen.getByText("C:\\WINDOWS\\system32\\cmd.exe")).toBeInTheDocument();
    expect(screen.queryByText("Log In", { exact: true })).not.toBeInTheDocument();

    act(() => vi.advanceTimersByTime(4_000));

    expect(screen.getByTestId("dos-transcript")).toHaveTextContent(
      "WELCOME TO ROSEBEG.",
    );
    expect(screen.getByTestId("dos-transcript")).toHaveTextContent(
      "This website is Harry Xing's portfolio.",
    );
    expect(screen.getByTestId("dos-transcript")).toHaveTextContent(
      "independently designed and developed by Zhiyuan Xing",
    );
    expect(screen.getByText("Log In", { exact: true })).toBeInTheDocument();
  });

  it("shows the complete transcript immediately for reduced motion", () => {
    render(<DosLoginScreen reducedMotion />);

    expect(screen.getByTestId("dos-transcript")).toHaveTextContent(
      "Every photograph was independently captured by Zhiyuan Xing.",
    );
    expect(screen.getByText("Log In", { exact: true })).toBeInTheDocument();
  });
});
