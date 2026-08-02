import { act } from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "@/app/App";

beforeAll(() => {
  class TestPointerEvent extends MouseEvent {
    pointerId: number;
    pointerType: string;

    constructor(type: string, init: PointerEventInit = {}) {
      super(type, init);
      this.pointerId = init.pointerId ?? 0;
      this.pointerType = init.pointerType ?? "mouse";
    }
  }

  Object.defineProperty(window, "PointerEvent", {
    configurable: true,
    value: TestPointerEvent,
    writable: true,
  });
});

describe("DesktopShell", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      value: 1024,
      writable: true,
    });
    Object.defineProperty(window, "innerHeight", {
      configurable: true,
      value: 768,
      writable: true,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("launches a new window and task button for every desktop activation", () => {
    renderDesktop();

    fireEvent.doubleClick(screen.getByRole("button", { name: "My Projects" }));
    fireEvent.doubleClick(screen.getByRole("button", { name: "My Projects" }));

    expect(screen.getAllByRole("heading", { name: "My Projects" })).toHaveLength(2);
    expect(
      screen.getAllByRole("button", { name: /My Projects task/i }),
    ).toHaveLength(2);
  });

  it("exposes the desktop icon area as a named control group", () => {
    renderDesktop();

    expect(screen.getByRole("group", { name: "Desktop" })).toBeInTheDocument();
  });

  it("dismisses Start with Escape, a desktop click, a Start re-click, or an app launch", () => {
    renderDesktop();
    const startButton = screen.getByRole("button", { name: "Start" });

    fireEvent.click(startButton);
    expect(screen.getByRole("menu", { name: "Start menu" })).toBeInTheDocument();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("menu", { name: "Start menu" })).not.toBeInTheDocument();

    fireEvent.click(startButton);
    fireEvent.pointerDown(screen.getByTestId("desktop-background"));
    expect(screen.queryByRole("menu", { name: "Start menu" })).not.toBeInTheDocument();

    fireEvent.click(startButton);
    fireEvent.click(startButton);
    expect(screen.queryByRole("menu", { name: "Start menu" })).not.toBeInTheDocument();

    fireEvent.click(startButton);
    const startMenu = screen.getByRole("menu", { name: "Start menu" });
    fireEvent.click(
      within(startMenu).getAllByRole("menuitem", { name: "About Harry" })[0],
    );
    expect(screen.queryByRole("menu", { name: "Start menu" })).not.toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "About Harry - Notepad" }),
    ).toBeInTheDocument();
  });

  it("keeps exact Start item names while exposing action context as descriptions", () => {
    renderDesktop();
    fireEvent.click(screen.getByRole("button", { name: "Start" }));
    const menu = screen.getByRole("menu", { name: "Start menu" });
    const projects = within(menu).getByRole("menuitem", {
      name: "My Projects",
    });
    const pictures = within(menu).getAllByRole("menuitem", {
      name: "My Pictures",
    });

    expect(projects).toHaveAccessibleName("My Projects");
    expect(projects).toHaveAccessibleDescription("Explore selected work");
    expect(pictures).toHaveLength(2);
    expect(pictures[0]).toHaveAccessibleDescription("Browse the photo archive");
    expect(pictures[1]).toHaveAccessibleDescription("Start menu places");
  });

  it("launches a desktop app with one touch pointer activation", () => {
    renderDesktop();

    fireEvent.pointerUp(screen.getByRole("button", { name: "Harry Messenger" }), {
      button: 0,
      pointerId: 7,
      pointerType: "touch",
    });

    expect(
      screen.getByRole("heading", { name: "Harry Messenger" }),
    ).toBeInTheDocument();
  });

  it("launches the focused desktop app with Enter", () => {
    renderDesktop();
    const aboutIcon = screen.getByRole("button", { name: "About Harry" });

    aboutIcon.focus();
    fireEvent.keyDown(aboutIcon, { key: "Enter" });

    expect(
      screen.getByRole("heading", { name: "About Harry - Notepad" }),
    ).toBeInTheDocument();
  });

  it("updates the tray clock at the next minute boundary", () => {
    vi.setSystemTime(new Date(2026, 7, 2, 12, 34, 0, 0));
    renderDesktop();
    const clock = screen
      .getByLabelText("Notification area")
      .querySelector("time");
    if (!clock) throw new Error("Tray clock was not rendered");

    expect(clock).toHaveTextContent("34");
    act(() => vi.advanceTimersByTime(57_549));
    expect(clock).toHaveTextContent("34");
    act(() => vi.advanceTimersByTime(1));
    expect(clock).toHaveTextContent("35");
  });

  it("launches a normal window inside twelve-pixel constrained margins", () => {
    Object.defineProperty(window, "innerWidth", { value: 390 });
    Object.defineProperty(window, "innerHeight", { value: 844 });
    renderDesktop();

    fireEvent.doubleClick(screen.getByRole("button", { name: "My Projects" }));

    const explorerWindow = screen.getByRole("dialog", { name: "My Projects" });
    expect(explorerWindow).toHaveStyle({
      left: "12px",
      top: "12px",
      width: "366px",
      height: "788px",
    });
    expect(explorerWindow).toHaveAttribute("data-window-mode", "normal");
    expect(
      screen.getByRole("button", { name: "Maximize My Projects" }),
    ).toBeInTheDocument();
  });

  it("keeps Explorer at its ideal size on a 1920 by 1080 desktop", () => {
    Object.defineProperty(window, "innerWidth", { value: 1920 });
    Object.defineProperty(window, "innerHeight", { value: 1080 });
    renderDesktop();

    fireEvent.doubleClick(screen.getByRole("button", { name: "My Projects" }));

    expect(screen.getByRole("dialog", { name: "My Projects" })).toHaveStyle({
      width: "900px",
      height: "620px",
    });
    expect(
      screen.getByRole("button", { name: "Maximize My Projects" }),
    ).toBeInTheDocument();
  });

  it("tabs through named desktop, window, and Explorer controls in DOM order", async () => {
    renderDesktop();
    fireEvent.doubleClick(screen.getByRole("button", { name: "My Projects" }));
    vi.useRealTimers();
    const user = userEvent.setup();

    const expectedNames = [
      "My Projects",
      "My Pictures",
      "About Harry",
      "Harry Messenger",
      "Start",
      "Open applications",
      "My Projects task 1",
      "Minimize My Projects",
      "Maximize My Projects",
      "Close My Projects",
      "Search",
      "Folders",
      "Views",
    ];

    for (const accessibleName of expectedNames) {
      await user.tab();
      expect(document.activeElement).toHaveAccessibleName(accessibleName);
    }
  });

  it("keeps every narrow-screen task reachable with task-strip keyboard navigation", () => {
    Object.defineProperty(window, "innerWidth", { value: 390 });
    Object.defineProperty(window, "innerHeight", { value: 844 });
    renderDesktop();
    const projectsIcon = screen.getByRole("button", { name: "My Projects" });

    for (let index = 0; index < 6; index += 1) {
      fireEvent.doubleClick(projectsIcon);
    }

    const tasks = screen.getAllByRole("button", { name: /My Projects task/i });
    const taskStrip = screen.getByRole("group", { name: "Open applications" });
    expect(tasks).toHaveLength(6);

    taskStrip.focus();
    fireEvent.keyDown(taskStrip, { key: "End" });
    expect(tasks[5]).toHaveFocus();
    fireEvent.keyDown(tasks[5]!, { key: "Home" });
    expect(tasks[0]).toHaveFocus();
  });

  it("moves focus into Start, supports arrow keys, and restores Start focus", () => {
    renderDesktop();
    const startButton = screen.getByRole("button", { name: "Start" });

    fireEvent.click(startButton);
    const menu = screen.getByRole("menu", { name: "Start menu" });
    const items = within(menu).getAllByRole("menuitem");
    expect(items[0]).toHaveFocus();

    fireEvent.keyDown(items[0]!, { key: "ArrowDown" });
    expect(items[1]).toHaveFocus();
    fireEvent.keyDown(items[1]!, { key: "End" });
    expect(items.at(-1)).toHaveFocus();
    fireEvent.keyDown(items.at(-1)!, { key: "Escape" });

    expect(screen.queryByRole("menu", { name: "Start menu" })).not.toBeInTheDocument();
    expect(startButton).toHaveFocus();
  });

  it("minimizes and restores the active window from its taskbar button", () => {
    renderDesktop();
    fireEvent.doubleClick(screen.getByRole("button", { name: "My Projects" }));
    const taskButton = screen.getByRole("button", { name: /My Projects task/i });

    fireEvent.click(taskButton);
    expect(screen.queryByRole("heading", { name: "My Projects" })).not.toBeInTheDocument();
    expect(taskButton).toHaveAttribute("aria-pressed", "false");

    fireEvent.click(taskButton);
    expect(screen.getByRole("heading", { name: "My Projects" })).toBeInTheDocument();
    expect(taskButton).toHaveAttribute("aria-pressed", "true");
  });

  it("opens My Pictures at the all-photo view and launches a separate viewer", () => {
    renderDesktop();
    fireEvent.doubleClick(screen.getByRole("button", { name: "My Pictures" }));

    expect(screen.getByLabelText("Pictures")).toBeInTheDocument();
    fireEvent.doubleClick(screen.getByRole("button", { name: "Stone Gate photo" }));

    expect(
      screen.getByRole("heading", { name: "Windows Picture and Fax Viewer" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Windows Picture and Fax Viewer task/i }),
    ).toBeInTheDocument();
    expect(
      within(
        screen.getByRole("dialog", {
          name: "Windows Picture and Fax Viewer",
        }),
      ).getByRole("img", { name: "Stone Gate" }),
    ).toBeInTheDocument();
  });

  it("logs off through confirmation and returns with an empty desktop", () => {
    renderDesktop();
    fireEvent.doubleClick(screen.getByRole("button", { name: "My Projects" }));
    openStartAction("Log Off");

    expect(screen.getByRole("dialog", { name: "Log Off Windows" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Confirm Log Off" }));
    expect(screen.getByTestId("logging-off-screen")).toBeInTheDocument();

    act(() => vi.advanceTimersByTime(650));
    expect(screen.getByTestId("login-screen")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Harry" }));
    act(() => vi.advanceTimersByTime(650));

    expect(screen.getByTestId("desktop-shell")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /My Projects task/i }),
    ).not.toBeInTheDocument();
  });

  it("cancels Turn Off Computer without closing the desktop or its windows", () => {
    renderDesktop();
    fireEvent.doubleClick(screen.getByRole("button", { name: "My Projects" }));
    openStartAction("Turn Off Computer");

    expect(
      screen.getByRole("dialog", { name: "Turn Off Computer" }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(screen.getByTestId("desktop-shell")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "My Projects" })).toBeInTheDocument();
    expect(
      screen.queryByRole("dialog", { name: "Turn Off Computer" }),
    ).not.toBeInTheDocument();
  });

  it("makes the power dialog modal, focuses its default choice, and restores Start on cancel", () => {
    renderDesktop();
    openStartAction("Turn Off Computer");

    const dialog = screen.getByRole("dialog", { name: "Turn Off Computer" });
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(screen.getByRole("button", { name: "Turn Off" })).toHaveFocus();

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.getByRole("button", { name: "Start" })).toHaveFocus();
  });

  it("wires both Turn Off and Restart choices to system transitions", () => {
    renderDesktop();
    openStartAction("Turn Off Computer");
    fireEvent.click(screen.getByRole("button", { name: "Restart" }));

    expect(screen.getByTestId("shutting-down-screen")).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(650));
    expect(screen.getByTestId("boot-screen")).toBeInTheDocument();
  });

  it("wires Turn Off through shutdown to the powered-off screen", () => {
    renderDesktop();
    openStartAction("Turn Off Computer");
    fireEvent.click(screen.getByRole("button", { name: "Turn Off" }));

    expect(screen.getByTestId("shutting-down-screen")).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(650));
    expect(screen.getByTestId("powered-off-screen")).toBeInTheDocument();
  });
});

function renderDesktop() {
  render(<App />);

  act(() => vi.advanceTimersByTime(1_800));
  fireEvent.click(screen.getByRole("button", { name: "Harry" }));
  act(() => vi.advanceTimersByTime(650));
  expect(screen.getByTestId("desktop-shell")).toBeInTheDocument();
}

function openStartAction(name: "Log Off" | "Turn Off Computer") {
  fireEvent.click(screen.getByRole("button", { name: "Start" }));
  fireEvent.click(
    within(screen.getByRole("menu", { name: "Start menu" })).getByRole(
      "menuitem",
      { name },
    ),
  );
}
