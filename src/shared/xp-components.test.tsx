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

  it("forwards meaningful image alternative text", () => {
    render(<XpIcon alt="Projects" src="/assets/icons/projects.png" />);

    expect(screen.getByRole("img", { name: "Projects" })).toHaveAttribute(
      "src",
      "/assets/icons/projects.png",
    );
  });
});
