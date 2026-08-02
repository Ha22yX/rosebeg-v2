import { act } from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AboutNotepad } from "@/apps/about/AboutNotepad";
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
    render: ({ windowId }) => (
      <button type="button">Explorer action {windowId}</button>
    ),
  },
};

const modalRegistry: WindowRegistry = {
  ...registry,
  "about-notepad": {
    appId: "about-notepad",
    title: "About Harry - Notepad",
    icon: "/assets/icons/notepad.png",
    idealSize: { width: 660, height: 520 },
    minimumSize: { width: 360, height: 300 },
    render: ({ close }) => <AboutNotepad closeWindow={close} />,
  },
};

describe("WindowManagerProvider", () => {
  it("contains a registry app crash to its window and keeps sibling windows usable", async () => {
    const user = userEvent.setup();
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    const crashRegistry: WindowRegistry = {
      "projects-explorer": {
        ...registry["projects-explorer"]!,
        title: "Broken",
        render: () => {
          throw new Error("broken app");
        },
      },
      "pictures-browser": {
        appId: "pictures-browser",
        title: "Healthy",
        icon: "/assets/icons/pictures.png",
        idealSize: { width: 600, height: 480 },
        minimumSize: { width: 320, height: 240 },
        render: () => <button type="button">Healthy action</button>,
      },
    };

    render(
      <WindowManagerProvider
        desktopSize={{ width: 1000, height: 700 }}
        registry={crashRegistry}
      >
        <CrashHarness />
      </WindowManagerProvider>,
    );

    await user.click(screen.getByRole("button", { name: "Launch healthy" }));
    await user.click(screen.getByRole("button", { name: "Launch broken" }));

    const errorDialog = screen.getByRole("alertdialog", {
      name: "Broken has encountered a problem",
    });
    expect(screen.getByRole("button", { name: "Healthy action" })).toBeEnabled();

    await user.click(
      within(errorDialog).getByRole("button", { name: "Close Broken" }),
    );
    expect(
      screen.queryByRole("alertdialog", {
        name: "Broken has encountered a problem",
      }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Healthy action" })).toBeEnabled();
  });

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

  it("activates a background window when one of its descendants receives focus", async () => {
    const user = userEvent.setup();
    renderManager();

    await user.click(screen.getByRole("button", { name: "Launch project" }));
    await user.click(screen.getByRole("button", { name: "Launch project" }));
    const actions = screen.getAllByRole("button", {
      name: /Explorer action projects-explorer-/,
    });
    const tasks = screen.getAllByRole("button", { name: /Task My Projects/ });

    act(() => actions[0]!.focus());

    expect(actions[0]).toHaveFocus();
    expect(tasks[0]).toHaveAttribute("aria-pressed", "true");
    expect(tasks[1]).toHaveAttribute("aria-pressed", "false");
  });

  it("moves DOM focus with launch, taskbar, minimize, restore, and close activation", async () => {
    const user = userEvent.setup();
    renderManager();
    const launcher = screen.getByRole("button", { name: "Launch project" });

    await user.click(launcher);
    const firstWindow = screen.getByRole("dialog", { name: "My Projects" });
    expect(firstWindow).toContainElement(document.activeElement as HTMLElement);

    await user.click(launcher);
    let windows = screen.getAllByRole("dialog", { name: "My Projects" });
    expect(windows[1]).toContainElement(document.activeElement as HTMLElement);

    const tasks = screen.getAllByRole("button", { name: /Task My Projects/ });
    await user.click(tasks[0]!);
    windows = screen.getAllByRole("dialog", { name: "My Projects" });
    expect(windows[0]).toContainElement(document.activeElement as HTMLElement);

    await user.click(
      within(windows[0]!).getByRole("button", { name: "Minimize My Projects" }),
    );
    const remainingWindow = screen.getByRole("dialog", { name: "My Projects" });
    expect(remainingWindow).toContainElement(document.activeElement as HTMLElement);

    await user.click(tasks[0]!);
    windows = screen.getAllByRole("dialog", { name: "My Projects" });
    expect(windows[0]).toContainElement(document.activeElement as HTMLElement);

    await user.click(
      within(windows[0]!).getByRole("button", { name: "Close My Projects" }),
    );
    expect(screen.getByRole("dialog", { name: "My Projects" })).toContainElement(
      document.activeElement as HTMLElement,
    );
  });

  it("keeps focus in a visible modal when its window is reactivated from the taskbar", async () => {
    const user = userEvent.setup();
    render(
      <WindowManagerProvider
        desktopSize={{ width: 1000, height: 700 }}
        registry={modalRegistry}
      >
        <ModalHarness />
      </WindowManagerProvider>,
    );

    await user.click(screen.getByRole("button", { name: "Launch About" }));
    const help = screen.getByRole("button", { name: "Help" });
    await user.click(help);
    await user.click(
      screen.getByRole("menuitem", { name: "About This Portfolio" }),
    );
    const modal = screen.getByRole("dialog", {
      name: "About This Portfolio",
    });

    await user.click(screen.getByRole("button", { name: "Launch sibling" }));
    await user.click(
      screen.getByRole("button", { name: /Task About Harry - Notepad/ }),
    );

    expect(modal).toContainElement(document.activeElement as HTMLElement);
    await user.keyboard("{Escape}");
    expect(
      screen.queryByRole("dialog", { name: "About This Portfolio" }),
    ).not.toBeInTheDocument();
    expect(help).toHaveFocus();
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

    expect(frame).toHaveStyle({ left: "88px", top: "68px" });
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

  it("keeps every resize hit target inside the frame boundary", async () => {
    const user = userEvent.setup();
    const { container } = renderManager();
    await user.click(screen.getByRole("button", { name: "Launch project" }));
    const expectedEdges = {
      north: { top: "0px" },
      northeast: { top: "0px", right: "0px" },
      east: { right: "0px" },
      southeast: { right: "0px", bottom: "0px" },
      south: { bottom: "0px" },
      southwest: { bottom: "0px", left: "0px" },
      west: { left: "0px" },
      northwest: { top: "0px", left: "0px" },
    } as const;

    for (const [direction, edges] of Object.entries(expectedEdges)) {
      const handle = container.querySelector<HTMLElement>(
        `.xp-window__resize--${direction}`,
      );
      if (!handle) throw new Error(`${direction} resize handle was not rendered`);
      expect(handle).toHaveStyle(edges);
    }
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
          aria-pressed={
            manager.activeWindowId === windowInstance.id &&
            windowInstance.mode !== "minimized"
          }
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

function CrashHarness() {
  const manager = useWindowManager();

  return (
    <>
      <button onClick={() => manager.launch("pictures-browser")} type="button">
        Launch healthy
      </button>
      <button onClick={() => manager.launch("projects-explorer")} type="button">
        Launch broken
      </button>
    </>
  );
}

function ModalHarness() {
  const manager = useWindowManager();

  return (
    <>
      <button onClick={() => manager.launch("about-notepad")} type="button">
        Launch About
      </button>
      <button
        onClick={() => manager.launch("projects-explorer")}
        type="button"
      >
        Launch sibling
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
