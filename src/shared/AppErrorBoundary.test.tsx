import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";
import { AppErrorBoundary } from "@/shared/AppErrorBoundary";

afterEach(() => vi.restoreAllMocks());

it("contains an application crash and offers to close the broken window", async () => {
  const user = userEvent.setup();
  const onClose = vi.fn();
  vi.spyOn(console, "error").mockImplementation(() => undefined);

  function BrokenApp(): never {
    throw new Error("broken app");
  }

  render(
    <AppErrorBoundary onClose={onClose} windowTitle="Broken">
      <BrokenApp />
    </AppErrorBoundary>,
  );

  expect(
    screen.getByRole("alertdialog", {
      name: "Broken has encountered a problem",
    }),
  ).toBeInTheDocument();
  expect(
    screen.getByText("This application could not continue. Your desktop is still running."),
  ).toBeInTheDocument();

  const closeButton = screen.getByRole("button", { name: "Close Broken" });
  expect(closeButton).toHaveFocus();

  await user.click(closeButton);
  expect(onClose).toHaveBeenCalledOnce();
});
