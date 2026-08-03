import { act, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PictureViewer } from "@/apps/photos/PictureViewer";

class ControlledResizeObserver {
  static instances: ControlledResizeObserver[] = [];

  readonly targets = new Set<Element>();

  constructor(private readonly callback: ResizeObserverCallback) {
    ControlledResizeObserver.instances.push(this);
  }

  observe(target: Element) {
    this.targets.add(target);
  }

  unobserve(target: Element) {
    this.targets.delete(target);
  }

  disconnect() {
    this.targets.clear();
  }

  resize(target: Element, width: number, height: number) {
    Object.defineProperties(target, {
      clientWidth: { configurable: true, value: width },
      clientHeight: { configurable: true, value: height },
    });

    const contentRect = {
      bottom: height,
      height,
      left: 0,
      right: width,
      top: 0,
      width,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    };

    this.callback(
      [{ contentRect, target } as ResizeObserverEntry],
      this as unknown as ResizeObserver,
    );
  }
}

function resizeViewport(viewport: HTMLElement, width: number, height: number) {
  const observer = ControlledResizeObserver.instances.find((candidate) =>
    candidate.targets.has(viewport),
  );
  if (!observer) throw new Error("No ResizeObserver is observing the viewport");

  act(() => observer.resize(viewport, width, height));
}

function loadImage(image: HTMLElement, width = 1600, height = 900) {
  Object.defineProperties(image, {
    naturalWidth: { configurable: true, value: width },
    naturalHeight: { configurable: true, value: height },
  });
  fireEvent.load(image);
}

describe("PictureViewer", () => {
  beforeEach(() => {
    ControlledResizeObserver.instances = [];
    vi.stubGlobal("ResizeObserver", ControlledResizeObserver);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

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

  it("starts at fitted 100% and has no actual-size control", () => {
    render(<PictureViewer initialSlug="stone-gate" />);
    const viewport = screen.getByLabelText("Photo viewport");

    expect(screen.getByText("100%")).toBeInTheDocument();
    expect(viewport).toHaveAttribute("data-zoom", "100");
    expect(screen.queryByRole("button", { name: "Actual size" })).not.toBeInTheDocument();
  });

  it("zooms in from fitted 100% to 125%", async () => {
    const user = userEvent.setup();
    render(<PictureViewer initialSlug="stone-gate" />);
    const viewport = screen.getByLabelText("Photo viewport");

    await user.click(screen.getByRole("button", { name: "Zoom in" }));
    expect(screen.getByText("125%")).toBeInTheDocument();
    expect(viewport).toHaveAttribute("data-zoom", "125");
  });

  it("zooms out from fitted 100% to 75%", async () => {
    const user = userEvent.setup();
    render(<PictureViewer initialSlug="stone-gate" />);
    await user.click(screen.getByRole("button", { name: "Zoom out" }));
    expect(screen.getByText("75%")).toBeInTheDocument();
    expect(screen.getByLabelText("Photo viewport")).toHaveAttribute("data-zoom", "75");
  });

  it("returns to fitted 100% after zooming", async () => {
    const user = userEvent.setup();
    render(<PictureViewer initialSlug="stone-gate" />);
    await user.click(screen.getByRole("button", { name: "Zoom in" }));

    await user.click(screen.getByRole("button", { name: "Fit to window" }));
    expect(screen.getByText("100%")).toBeInTheDocument();
    expect(screen.getByLabelText("Photo viewport")).toHaveAttribute("data-zoom", "100");
  });

  it("falls back to the first photo for an invalid slug", () => {
    render(<PictureViewer initialSlug="missing-photo" />);

    expect(screen.getByRole("heading", { name: "Stone Gate" })).toBeInTheDocument();
    expect(screen.getByText("1 of 15")).toBeInTheDocument();
  });

  it("resizes fitted explicit dimensions without changing the percentage", () => {
    const { container } = render(<PictureViewer initialSlug="stone-gate" />);
    const viewport = screen.getByLabelText("Photo viewport");
    const image = screen.getByRole("img", { name: "Stone Gate" });
    const stage = container.querySelector<HTMLElement>(".picture-viewer__stage");
    const canvas = container.querySelector<HTMLElement>(".picture-viewer__canvas");
    expect(stage).not.toBeNull();
    expect(canvas).not.toBeNull();

    loadImage(image);
    resizeViewport(viewport, 800, 600);
    expect(stage).toHaveStyle({ width: "800px", height: "600px" });
    expect(canvas).toHaveStyle({ width: "772px", height: "434.25px" });
    expect(image).toHaveStyle({ width: "772px", height: "434.25px" });

    resizeViewport(viewport, 600, 400);
    expect(stage).toHaveStyle({ width: "600px", height: "400px" });
    expect(canvas).toHaveStyle({ width: "572px", height: "321.75px" });
    expect(image).toHaveStyle({ width: "572px", height: "321.75px" });
    expect(viewport).toHaveAttribute("data-zoom", "100");
    expect(screen.getByText("100%")).toBeInTheDocument();
  });

  it("preserves the old viewport-center focal point while zooming", async () => {
    const user = userEvent.setup();
    const { container } = render(<PictureViewer initialSlug="stone-gate" />);
    const viewport = screen.getByLabelText("Photo viewport");
    const image = screen.getByRole("img", { name: "Stone Gate" });
    const canvas = container.querySelector<HTMLElement>(".picture-viewer__canvas");
    expect(canvas).not.toBeNull();

    loadImage(image);
    resizeViewport(viewport, 800, 600);

    await user.click(screen.getByRole("button", { name: "Zoom in" }));
    await user.click(screen.getByRole("button", { name: "Zoom in" }));
    await user.click(screen.getByRole("button", { name: "Zoom in" }));
    expect(viewport).toHaveAttribute("data-zoom", "200");

    Object.defineProperties(canvas, {
      offsetLeft: { configurable: true, value: 14 },
      offsetTop: { configurable: true, value: 14 },
    });
    viewport.scrollLeft = 250;
    viewport.scrollTop = 100;

    await user.click(screen.getByRole("button", { name: "Zoom in" }));
    expect(viewport).toHaveAttribute("data-zoom", "300");
    expect(viewport.scrollLeft).toBeCloseTo(568);
    expect(viewport.scrollTop).toBeCloseTo(293);
  });

  it("retains the focal point through a transient zero-size observation", async () => {
    const user = userEvent.setup();
    const { container } = render(<PictureViewer initialSlug="stone-gate" />);
    const viewport = screen.getByLabelText("Photo viewport");
    const image = screen.getByRole("img", { name: "Stone Gate" });
    const canvas = container.querySelector<HTMLElement>(".picture-viewer__canvas");
    expect(canvas).not.toBeNull();

    loadImage(image);
    resizeViewport(viewport, 800, 600);
    await user.click(screen.getByRole("button", { name: "Zoom in" }));
    await user.click(screen.getByRole("button", { name: "Zoom in" }));
    await user.click(screen.getByRole("button", { name: "Zoom in" }));

    Object.defineProperties(canvas, {
      offsetLeft: { configurable: true, value: 14 },
      offsetTop: { configurable: true, value: 14 },
    });
    viewport.scrollLeft = 250;
    viewport.scrollTop = 100;

    resizeViewport(viewport, 0, 0);
    resizeViewport(viewport, 800, 600);

    expect(viewport.scrollLeft).toBeCloseTo(250);
    expect(viewport.scrollTop).toBeCloseTo(100);
  });

  it("swaps the fitted image axes at 90 and 270 degrees", async () => {
    const user = userEvent.setup();
    render(<PictureViewer initialSlug="stone-gate" />);
    const image = screen.getByRole("img", { name: "Stone Gate" });

    expect(image).toHaveAttribute("data-fit-axis", "normal");
    await user.click(screen.getByRole("button", { name: "Rotate clockwise" }));
    expect(image).toHaveAttribute("data-fit-axis", "swapped");
    expect(image).toHaveStyle({ transform: "rotate(90deg)" });

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
