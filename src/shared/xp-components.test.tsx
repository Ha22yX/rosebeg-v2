import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { XpButton } from "@/shared/XpButton";
import { XpDialog } from "@/shared/XpDialog";
import { XpIcon } from "@/shared/XpIcon";

describe("XP shared controls", () => {
  it("keeps button activation native and keyboard accessible", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<XpButton onClick={onClick}>Open</XpButton>);

    await user.tab();
    await user.keyboard("{Enter}");

    expect(screen.getByRole("button", { name: "Open" })).toHaveFocus();
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("labels a dialog by its title and exposes a real close button", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <XpDialog onClose={onClose} title="Confirm delete">
        This cannot be undone.
      </XpDialog>,
    );

    expect(
      screen.getByRole("dialog", { name: "Confirm delete" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("dialog", { name: "Confirm delete" }),
    ).not.toHaveAttribute("aria-modal");
    await user.click(
      screen.getByRole("button", { name: "Close Confirm delete" }),
    );
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("autofocuses, traps Tab, dismisses on Escape, and restores a modal invoker", async () => {
    const user = userEvent.setup();
    const onDismiss = vi.fn();
    render(<ModalDialogHarness onDismiss={onDismiss} />);
    const invoker = screen.getByRole("button", { name: "Open settings" });

    await user.click(invoker);

    const dialog = screen.getByRole("dialog", { name: "Settings" });
    const accept = screen.getByRole("button", { name: "Accept" });
    const cancel = screen.getByRole("button", { name: "Cancel" });
    const close = screen.getByRole("button", { name: "Close Settings" });
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(accept).toHaveFocus();

    cancel.focus();
    await user.keyboard("{Tab}");
    expect(close).toHaveFocus();
    close.focus();
    await user.keyboard("{Shift>}{Tab}{/Shift}");
    expect(cancel).toHaveFocus();

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog", { name: "Settings" })).not.toBeInTheDocument();
    expect(onDismiss).toHaveBeenCalledOnce();
    expect(invoker).toHaveFocus();
  });

  it("forwards meaningful image alternative text", () => {
    render(<XpIcon alt="Projects" src="/assets/icons/projects.png" />);

    expect(screen.getByRole("img", { name: "Projects" })).toHaveAttribute(
      "src",
      "/assets/icons/projects.png",
    );
  });
});

function ModalDialogHarness({ onDismiss }: { onDismiss(): void }) {
  const [open, setOpen] = useState(false);
  const dismiss = () => {
    onDismiss();
    setOpen(false);
  };

  return (
    <>
      <button onClick={() => setOpen(true)} type="button">
        Open settings
      </button>
      {open ? (
        <XpDialog
          actions={
            <>
              <XpButton>Accept</XpButton>
              <XpButton onClick={dismiss}>Cancel</XpButton>
            </>
          }
          modal
          onClose={dismiss}
          onDismiss={dismiss}
          title="Settings"
        >
          <a href="#details">Details</a>
        </XpDialog>
      ) : null}
    </>
  );
}
