import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  WindowManagerProvider,
  useWindowManager,
} from "@/windowing/WindowManager";
import type { DesktopSize, WindowRegistry } from "@/windowing/types";

beforeAll(() => {
  class TestPointerEvent extends MouseEvent {
    pointerId: number;

    constructor(type: string, init: PointerEventInit = {}) {
      super(type, init);
      this.pointerId = init.pointerId ?? 0;
    }
  }

  Object.defineProperty(window, "PointerEvent", {
    configurable: true,
    value: TestPointerEvent,
    writable: true,
  });
  Object.defineProperty(HTMLElement.prototype, "setPointerCapture", {
    configurable: true,
    value: () => undefined,
    writable: true,
  });
  Object.defineProperty(HTMLElement.prototype, "releasePointerCapture", {
    configurable: true,
    value: () => undefined,
    writable: true,
  });
});

afterEach(() => vi.restoreAllMocks());

const registry: WindowRegistry = {
  "projects-explorer": {
    appId: "projects-explorer",
    title: "My Projects",
    icon: "/assets/icons/projects.png",
    idealSize: { width: 900, height: 620 },
    minimumSize: { width: 520, height: 420 },
    render: ({ windowId }) => <p>Explorer instance {windowId}</p>,
  },
};

describe("WindowManagerProvider", () => {
  it("launches independent frames and restores a minimized frame from its task action", async () => {
    const user = userEvent.setup();
    renderManager();

    await user.click(screen.getByRole("button", { name: "Launch project" }));
    await user.click(screen.getByRole("button", { name: "Launch project" }));

    expect(
      screen.getAllByRole("heading", { name: "My Projects" }),
    ).toHaveLength(2);
    expect(
      screen.getAllByRole("button", { name: "Minimize My Projects" }),
    ).toHaveLength(2);
    expect(
      screen.getAllByRole("button", { name: "Maximize My Projects" }),
    ).toHaveLength(2);
    expect(
      screen.getAllByRole("button", { name: "Close My Projects" }),
    ).toHaveLength(2);

    await user.click(
      screen.getAllByRole("button", { name: "Minimize My Projects" })[0],
    );
    expect(
      screen.getAllByRole("heading", { name: "My Projects" }),
    ).toHaveLength(1);

    await user.click(screen.getAllByRole("button", { name: /Task My Projects/ })[0]);
    expect(
      screen.getAllByRole("heading", { name: "My Projects" }),
    ).toHaveLength(2);
  });

  it("moves a normal frame by its title bar and releases pointer capture", async () => {
    const user = userEvent.setup();
    const setPointerCapture = vi
      .spyOn(HTMLElement.prototype, "setPointerCapture")
      .mockImplementation(() => undefined);
    const releasePointerCapture = vi
      .spyOn(HTMLElement.prototype, "releasePointerCapture")
      .mockImplementation(() => undefined);
    renderManager();
    await user.click(screen.getByRole("button", { name: "Launch project" }));
    const frame = screen.getByRole("dialog", { name: "My Projects" });
    const titleBar = screen.getByLabelText("Move My Projects window");

    fireEvent.pointerDown(titleBar, {
      button: 0,
      clientX: 100,
      clientY: 100,
      pointerId: 7,
    });
    fireEvent.pointerMove(titleBar, {
      clientX: 150,
      clientY: 130,
      pointerId: 7,
    });
    fireEvent.pointerUp(titleBar, { pointerId: 7 });

    expect(frame).toHaveStyle({ left: "100px", top: "70px" });
    expect(setPointerCapture).toHaveBeenCalledWith(7);
    expect(releasePointerCapture).toHaveBeenCalledWith(7);

    setPointerCapture.mockRestore();
    releasePointerCapture.mockRestore();
  });

  it("provides eight resize handles and resizes from the southeast handle", async () => {
    const user = userEvent.setup();
    vi.spyOn(HTMLElement.prototype, "setPointerCapture").mockImplementation(
      () => undefined,
    );
    vi.spyOn(HTMLElement.prototype, "releasePointerCapture").mockImplementation(
      () => undefined,
    );
    const { container } = renderManager();
    await user.click(screen.getByRole("button", { name: "Launch project" }));
    const frame = screen.getByRole("dialog", { name: "My Projects" });

    expect(container.querySelectorAll(".xp-window__resize")).toHaveLength(8);
    expect(screen.queryAllByRole("separator")).toHaveLength(0);
    const handle = container.querySelector<HTMLElement>(
      ".xp-window__resize--southeast",
    );
    expect(handle).not.toBeNull();
    if (!handle) throw new Error("Southeast resize handle was not rendered");
    fireEvent.pointerDown(handle, {
      button: 0,
      clientX: 950,
      clientY: 660,
      pointerId: 8,
    });
    fireEvent.pointerMove(handle, {
      clientX: 990,
      clientY: 690,
      pointerId: 8,
    });
    fireEvent.pointerUp(handle, { pointerId: 8 });

    expect(frame).toHaveStyle({ width: "940px", height: "650px" });
    vi.restoreAllMocks();
  });

  it("stops a pointer operation when capture is lost", async () => {
    const user = userEvent.setup();
    vi.spyOn(HTMLElement.prototype, "setPointerCapture").mockImplementation(
      () => undefined,
    );
    renderManager();
    await user.click(screen.getByRole("button", { name: "Launch project" }));
    const frame = screen.getByRole("dialog", { name: "My Projects" });
    const titleBar = screen.getByLabelText("Move My Projects window");

    fireEvent.pointerDown(titleBar, {
      button: 0,
      clientX: 100,
      clientY: 100,
      pointerId: 9,
    });
    fireEvent.lostPointerCapture(titleBar, { pointerId: 9 });
    fireEvent.pointerMove(titleBar, {
      clientX: 150,
      clientY: 130,
      pointerId: 9,
    });

    expect(frame).toHaveStyle({ left: "50px", top: "40px" });
  });

  it("does not jump an adaptively undersized frame when resize begins", async () => {
    const user = userEvent.setup();
    vi.spyOn(HTMLElement.prototype, "setPointerCapture").mockImplementation(
      () => undefined,
    );
    const { container } = renderManager({ width: 390, height: 700 });
    await user.click(screen.getByRole("button", { name: "Launch project" }));
    const frame = screen.getByRole("dialog", { name: "My Projects" });
    const handle = container.querySelector<HTMLElement>(
      ".xp-window__resize--southeast",
    );
    if (!handle) throw new Error("Southeast resize handle was not rendered");

    fireEvent.pointerDown(handle, {
      button: 0,
      clientX: 378,
      clientY: 688,
      pointerId: 10,
    });
    fireEvent.pointerMove(handle, {
      clientX: 378,
      clientY: 688,
      pointerId: 10,
    });

    expect(frame).toHaveStyle({
      left: "12px",
      top: "12px",
      width: "366px",
      height: "676px",
    });
  });

  it("toggles maximize and restore by double-clicking the title bar", async () => {
    const user = userEvent.setup();
    renderManager();
    await user.click(screen.getByRole("button", { name: "Launch project" }));
    const titleBar = screen.getByLabelText("Move My Projects window");

    await user.dblClick(titleBar);
    expect(
      screen.getByRole("button", { name: "Restore My Projects" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("dialog", { name: "My Projects" })).toHaveStyle({
      left: "0px",
      top: "0px",
      width: "1000px",
      height: "700px",
    });

    await user.dblClick(titleBar);
    expect(
      screen.getByRole("button", { name: "Maximize My Projects" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("dialog", { name: "My Projects" })).toHaveStyle({
      left: "50px",
      top: "40px",
      width: "900px",
      height: "620px",
    });
  });
});

function renderManager(desktopSize: DesktopSize = { width: 1000, height: 700 }) {
  return render(
    <WindowManagerProvider desktopSize={desktopSize} registry={registry}>
      <ManagerHarness />
    </WindowManagerProvider>,
  );
}

function ManagerHarness() {
  const manager = useWindowManager();

  return (
    <>
      <button onClick={() => manager.launch("projects-explorer")} type="button">
        Launch project
      </button>
      {manager.windows.map((windowInstance) => (
        <button
          aria-label={`Task ${windowInstance.title} ${windowInstance.id}`}
          key={windowInstance.id}
          onClick={() => manager.toggleTaskbar(windowInstance.id)}
          type="button"
        >
          {windowInstance.title}
        </button>
      ))}
    </>
  );
}
