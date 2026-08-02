import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PicturesBrowser } from "@/apps/photos/PicturesBrowser";

describe("PicturesBrowser", () => {
  it("browses all photographs and opens the selected photo independently", async () => {
    const user = userEvent.setup();
    const onOpenPhoto = vi.fn();
    render(<PicturesBrowser onOpenPhoto={onOpenPhoto} />);

    expect(screen.getAllByRole("button", { name: /photo$/i })).toHaveLength(15);
    expect(screen.getByText("15 objects")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Filmstrip view" }));
    expect(screen.getByRole("button", { name: "Filmstrip view" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await user.click(screen.getByRole("button", { name: "Stone Gate photo" }));
    expect(
      screen.getByText("A quiet threshold held in old masonry and winter light."),
    ).toBeInTheDocument();

    await user.dblClick(screen.getByRole("button", { name: "Stone Gate photo" }));
    expect(onOpenPhoto).toHaveBeenCalledWith("stone-gate");
  });

  it("switches between list and thumbnail views without losing selection", async () => {
    const user = userEvent.setup();
    render(<PicturesBrowser onOpenPhoto={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "Cloud Needle photo" }));
    await user.click(screen.getByRole("button", { name: "List view" }));

    expect(screen.getByRole("button", { name: "List view" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: "Cloud Needle photo" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("columnheader", { name: "Name" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Thumbnails view" }));
    expect(screen.getByRole("button", { name: "Thumbnails view" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.queryByRole("columnheader", { name: "Name" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cloud Needle photo" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("opens a focused photo with the keyboard", async () => {
    const user = userEvent.setup();
    const onOpenPhoto = vi.fn();
    render(<PicturesBrowser onOpenPhoto={onOpenPhoto} />);

    const photo = screen.getByRole("button", { name: "Amber Room photo" });
    photo.focus();
    await user.keyboard("{Enter}");

    expect(onOpenPhoto).toHaveBeenCalledWith("amber-room");
  });

  it("marks only the failed image as unavailable", () => {
    render(<PicturesBrowser onOpenPhoto={vi.fn()} />);

    const stone = screen.getByRole("button", { name: "Stone Gate photo" });
    fireEvent.error(within(stone).getByRole("img", { name: "Stone Gate" }));

    expect(
      within(stone).getByRole("img", { name: "Stone Gate image unavailable" }),
    ).toBeInTheDocument();
    expect(
      within(screen.getByRole("button", { name: "Underline Skyline photo" })).getByRole(
        "img",
        { name: "Underline Skyline" },
      ),
    ).toBeInTheDocument();
  });

  it("exposes unfinished Explorer and task actions as non-interactive", () => {
    render(<PicturesBrowser onOpenPhoto={vi.fn()} />);

    expect(screen.getByRole("button", { name: "Search" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Folders" })).toBeDisabled();
    expect(screen.getByText("View as a slide show")).toHaveAttribute(
      "aria-disabled",
      "true",
    );
    expect(screen.getByText("Order prints online")).toHaveAttribute(
      "aria-disabled",
      "true",
    );
    expect(screen.getByText("My Documents")).toHaveAttribute("aria-disabled", "true");
  });
});
