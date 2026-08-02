import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PictureViewer } from "@/apps/photos/PictureViewer";

describe("PictureViewer", () => {
  it("keeps wrapped navigation local to the viewer", async () => {
    const user = userEvent.setup();
    render(<PictureViewer initialSlug="stone-gate" />);

    expect(screen.getByRole("heading", { name: "Stone Gate" })).toBeInTheDocument();
    expect(screen.getByText("1 of 15")).toBeInTheDocument();

    screen.getByLabelText("Windows Picture and Fax Viewer").focus();
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("heading", { name: "Underline Skyline" })).toBeInTheDocument();
    expect(screen.getByText("2 of 15")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Previous photo" }));
    await user.click(screen.getByRole("button", { name: "Previous photo" }));
    expect(screen.getByRole("heading", { name: "Night Pavilion" })).toBeInTheDocument();
    expect(screen.getByText("15 of 15")).toBeInTheDocument();
  });

  it("supports the full zoom, fit, and rotation toolbar", async () => {
    const user = userEvent.setup();
    render(<PictureViewer initialSlug="stone-gate" />);
    const image = screen.getByRole("img", { name: "Stone Gate" });
    const viewport = screen.getByLabelText("Photo viewport");

    expect(screen.getByText("Fit to window")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Zoom in" }));
    expect(screen.getByText("125%")).toBeInTheDocument();
    expect(viewport).toHaveAttribute("data-fit-to-window", "false");

    await user.click(screen.getByRole("button", { name: "Zoom out" }));
    expect(screen.getByText("100%")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Actual size" }));
    expect(viewport).toHaveAttribute("data-fit-to-window", "false");
    expect(screen.getByText("Actual size")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Rotate clockwise" }));
    expect(image).toHaveStyle({ transform: "rotate(90deg) scale(1)" });
    await user.click(screen.getByRole("button", { name: "Rotate counter-clockwise" }));
    expect(image).toHaveStyle({ transform: "rotate(0deg) scale(1)" });

    await user.click(screen.getByRole("button", { name: "Fit to window" }));
    expect(viewport).toHaveAttribute("data-fit-to-window", "true");
    expect(screen.getByText("Fit to window")).toBeInTheDocument();
  });

  it("falls back to the first photo for an invalid slug", () => {
    render(<PictureViewer initialSlug="missing-photo" />);

    expect(screen.getByRole("heading", { name: "Stone Gate" })).toBeInTheDocument();
    expect(screen.getByText("1 of 15")).toBeInTheDocument();
  });

  it("returns to a true fitted scale immediately after zooming", async () => {
    const user = userEvent.setup();
    render(<PictureViewer initialSlug="stone-gate" />);
    const image = screen.getByRole("img", { name: "Stone Gate" });

    await user.click(screen.getByRole("button", { name: "Zoom in" }));
    await user.click(screen.getByRole("button", { name: "Zoom in" }));
    expect(image).toHaveStyle({ transform: "rotate(0deg) scale(1.5)" });

    await user.click(screen.getByRole("button", { name: "Fit to window" }));
    expect(image).toHaveStyle({ transform: "rotate(0deg) scale(1)" });
    expect(screen.getByLabelText("Photo viewport")).toHaveAttribute(
      "data-fit-to-window",
      "true",
    );
  });

  it("swaps the fitted image axes at 90 and 270 degrees", async () => {
    const user = userEvent.setup();
    render(<PictureViewer initialSlug="stone-gate" />);
    const image = screen.getByRole("img", { name: "Stone Gate" });

    expect(image).toHaveAttribute("data-fit-axis", "normal");
    await user.click(screen.getByRole("button", { name: "Rotate clockwise" }));
    expect(image).toHaveAttribute("data-fit-axis", "swapped");

    await user.click(screen.getByRole("button", { name: "Rotate counter-clockwise" }));
    await user.click(screen.getByRole("button", { name: "Rotate counter-clockwise" }));
    expect(image).toHaveAttribute("data-fit-axis", "swapped");
  });

  it("keeps separate viewer instances on independent sequences", async () => {
    const user = userEvent.setup();
    render(
      <>
        <PictureViewer initialSlug="stone-gate" />
        <PictureViewer initialSlug="amber-room" />
      </>,
    );

    const viewers = screen.getAllByLabelText("Windows Picture and Fax Viewer");
    await user.click(
      within(viewers[0]).getByRole("button", { name: "Next photo" }),
    );

    expect(within(viewers[0]).getByRole("heading", { name: "Underline Skyline" })).toBeInTheDocument();
    expect(within(viewers[1]).getByRole("heading", { name: "Amber Room" })).toBeInTheDocument();
  });

  it("applies keyboard navigation only to the focused viewer", async () => {
    const user = userEvent.setup();
    render(
      <>
        <PictureViewer initialSlug="stone-gate" />
        <PictureViewer initialSlug="amber-room" />
      </>,
    );

    const viewers = screen.getAllByLabelText("Windows Picture and Fax Viewer");
    viewers[0].focus();
    await user.keyboard("{ArrowRight}");

    expect(within(viewers[0]).getByRole("heading", { name: "Underline Skyline" })).toBeInTheDocument();
    expect(within(viewers[1]).getByRole("heading", { name: "Amber Room" })).toBeInTheDocument();
  });

  it("ignores Arrow keys after focus leaves every viewer", async () => {
    const user = userEvent.setup();
    render(
      <>
        <PictureViewer initialSlug="stone-gate" />
        <button type="button">Outside control</button>
      </>,
    );

    const viewer = screen.getByLabelText("Windows Picture and Fax Viewer");
    viewer.focus();
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("heading", { name: "Underline Skyline" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Outside control" }));
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("heading", { name: "Underline Skyline" })).toBeInTheDocument();
  });
});
