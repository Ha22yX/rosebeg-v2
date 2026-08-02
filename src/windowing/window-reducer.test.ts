import {
  initialWindowState,
  windowReducer,
} from "@/windowing/window-reducer";
import type { WindowDefinition } from "@/windowing/types";

const projectWindowDefinition: WindowDefinition = {
  appId: "projects-explorer",
  title: "My Projects",
  icon: "/assets/icons/projects.png",
  idealSize: { width: 900, height: 620 },
  minimumSize: { width: 520, height: 420 },
};

describe("windowReducer", () => {
  it("creates independent instances and restores maximized bounds", () => {
    const once = windowReducer(initialWindowState, {
      type: "LAUNCH",
      id: "w1",
      definition: projectWindowDefinition,
      payload: {},
    });
    const twice = windowReducer(once, {
      type: "LAUNCH",
      id: "w2",
      definition: projectWindowDefinition,
      payload: {},
    });

    expect(twice.windows.map(({ id }) => id)).toEqual(["w1", "w2"]);

    const maximized = windowReducer(twice, { type: "MAXIMIZE", id: "w1" });

    expect(
      windowReducer(maximized, { type: "RESTORE", id: "w1" }).windows[0]
        .mode,
    ).toBe("normal");
  });

  it("focuses, moves, and resizes only normal windows", () => {
    const state = launchTwoWindows();
    const focused = windowReducer(state, { type: "FOCUS", id: "w1" });
    const moved = windowReducer(focused, {
      type: "MOVE",
      id: "w1",
      x: -20,
      y: 700,
    });
    const resized = windowReducer(moved, {
      type: "RESIZE",
      id: "w1",
      bounds: { x: 0, y: 80, width: 1200, height: 900 },
    });

    expect(focused.activeWindowId).toBe("w1");
    expect(focused.windows[0].zIndex).toBeGreaterThan(
      focused.windows[1].zIndex,
    );
    expect(moved.windows[0].bounds).toMatchObject({ x: 0, y: 80 });
    expect(resized.windows[0].bounds).toEqual({
      x: 0,
      y: 0,
      width: 1000,
      height: 700,
    });

    const maximized = windowReducer(resized, { type: "MAXIMIZE", id: "w1" });
    expect(
      windowReducer(maximized, {
        type: "MOVE",
        id: "w1",
        x: 50,
        y: 50,
      }),
    ).toBe(maximized);
  });

  it("minimizes the active window and activates the top visible window", () => {
    const state = launchTwoWindows();
    const minimized = windowReducer(state, { type: "MINIMIZE", id: "w2" });

    expect(minimized.windows[1].mode).toBe("minimized");
    expect(minimized.activeWindowId).toBe("w1");
    expect(minimized.windows[1].restoreBounds).toEqual(
      state.windows[1].restoreBounds,
    );
  });

  it("toggles the active taskbar window and restores or focuses other windows", () => {
    const state = launchTwoWindows();
    const minimized = windowReducer(state, {
      type: "TOGGLE_TASKBAR",
      id: "w2",
    });
    expect(minimized.windows[1].mode).toBe("minimized");

    const restored = windowReducer(minimized, {
      type: "TOGGLE_TASKBAR",
      id: "w2",
    });
    expect(restored.windows[1].mode).toBe("normal");
    expect(restored.activeWindowId).toBe("w2");

    const focusedFirst = windowReducer(restored, {
      type: "TOGGLE_TASKBAR",
      id: "w1",
    });
    expect(focusedFirst.windows[0].mode).toBe("normal");
    expect(focusedFirst.activeWindowId).toBe("w1");
  });

  it("closes individual windows or all windows and keeps active state valid", () => {
    const state = launchTwoWindows();
    const closed = windowReducer(state, { type: "CLOSE", id: "w2" });

    expect(closed.windows.map(({ id }) => id)).toEqual(["w1"]);
    expect(closed.activeWindowId).toBe("w1");
    expect(closed.windowDefinitions).not.toHaveProperty("w2");
    expect(closed.windowCascadeIndexes).not.toHaveProperty("w2");
    expect(windowReducer(closed, { type: "CLOSE_ALL" })).toMatchObject({
      windows: [],
      activeWindowId: null,
    });
  });

  it("reclamps normal windows and refits maximized windows when the desktop changes", () => {
    const state = launchTwoWindows();
    const moved = windowReducer(state, {
      type: "MOVE",
      id: "w1",
      x: 100,
      y: 80,
    });
    const maximized = windowReducer(moved, { type: "MAXIMIZE", id: "w2" });
    const resizedDesktop = windowReducer(maximized, {
      type: "SET_DESKTOP_SIZE",
      size: { width: 700, height: 500 },
    });

    expect(resizedDesktop.windows[0].bounds).toEqual({
      x: 0,
      y: 0,
      width: 700,
      height: 500,
    });
    expect(resizedDesktop.windows[1].bounds).toEqual({
      x: 0,
      y: 0,
      width: 700,
      height: 500,
    });
  });

  it("uses a fresh cascade slot when a window closes before another launch", () => {
    const state = launchTwoWindows();
    const closed = windowReducer(state, { type: "CLOSE", id: "w1" });
    const relaunched = windowReducer(closed, {
      type: "LAUNCH",
      id: "w3",
      definition: projectWindowDefinition,
      payload: {},
    });

    expect(relaunched.windows[1].bounds).not.toEqual(
      relaunched.windows[0].bounds,
    );
  });

  it("refits a normal window when a zero-size desktop later becomes available", () => {
    const unavailable = windowReducer(initialWindowState, {
      type: "SET_DESKTOP_SIZE",
      size: { width: 0, height: 0 },
    });
    const launched = windowReducer(unavailable, {
      type: "LAUNCH",
      id: "w1",
      definition: projectWindowDefinition,
      payload: {},
    });
    expect(launched.windows[0].bounds).toEqual({
      x: 0,
      y: 0,
      width: 0,
      height: 0,
    });

    const recovered = windowReducer(launched, {
      type: "SET_DESKTOP_SIZE",
      size: { width: 1000, height: 700 },
    });

    expect(recovered.windows[0]).toMatchObject({
      mode: "normal",
      bounds: { x: 50, y: 40, width: 900, height: 620 },
      restoreBounds: { x: 50, y: 40, width: 900, height: 620 },
    });
  });

  it("refits a minimized zero-size launch before taskbar restore", () => {
    const unavailable = windowReducer(initialWindowState, {
      type: "SET_DESKTOP_SIZE",
      size: { width: 0, height: 0 },
    });
    const launched = windowReducer(unavailable, {
      type: "LAUNCH",
      id: "w1",
      definition: projectWindowDefinition,
      payload: {},
    });
    const minimized = windowReducer(launched, {
      type: "MINIMIZE",
      id: "w1",
    });
    const desktopAvailable = windowReducer(minimized, {
      type: "SET_DESKTOP_SIZE",
      size: { width: 1000, height: 700 },
    });
    const restored = windowReducer(desktopAvailable, {
      type: "TOGGLE_TASKBAR",
      id: "w1",
    });

    expect(restored.windows[0]).toMatchObject({
      mode: "normal",
      bounds: { x: 50, y: 40, width: 900, height: 620 },
      restoreBounds: { x: 50, y: 40, width: 900, height: 620 },
    });
  });
});

function launchTwoWindows() {
  const sized = windowReducer(initialWindowState, {
    type: "SET_DESKTOP_SIZE",
    size: { width: 1000, height: 700 },
  });
  const once = windowReducer(sized, {
    type: "LAUNCH",
    id: "w1",
    definition: projectWindowDefinition,
    payload: {},
  });
  return windowReducer(once, {
    type: "LAUNCH",
    id: "w2",
    definition: projectWindowDefinition,
    payload: {},
  });
}
