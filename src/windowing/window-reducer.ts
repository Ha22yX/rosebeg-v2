import { clampBounds, fitInitialBounds } from "@/windowing/bounds";
import type {
  DesktopSize,
  Rect,
  WindowDefinition,
  WindowInstance,
  WindowPayload,
} from "@/windowing/types";

export type WindowState = {
  windows: WindowInstance[];
  activeWindowId: string | null;
  desktopSize: DesktopSize;
  nextCascadeIndex: number;
  nextZIndex: number;
};

export type WindowAction =
  | {
      type: "LAUNCH";
      id: string;
      definition: WindowDefinition;
      payload: WindowPayload;
    }
  | { type: "FOCUS"; id: string }
  | { type: "MOVE"; id: string; x: number; y: number }
  | { type: "RESIZE"; id: string; bounds: Rect }
  | { type: "MINIMIZE"; id: string }
  | { type: "MAXIMIZE"; id: string }
  | { type: "RESTORE"; id: string }
  | { type: "TOGGLE_TASKBAR"; id: string }
  | { type: "CLOSE"; id: string }
  | { type: "CLOSE_ALL" }
  | { type: "SET_DESKTOP_SIZE"; size: DesktopSize };

export const initialWindowState: WindowState = {
  windows: [],
  activeWindowId: null,
  desktopSize: { width: 1024, height: 768 },
  nextCascadeIndex: 0,
  nextZIndex: 1,
};

export function windowReducer(
  state: WindowState,
  action: WindowAction,
): WindowState {
  switch (action.type) {
    case "LAUNCH": {
      const bounds = fitInitialBounds(
        action.definition,
        state.desktopSize,
        state.nextCascadeIndex,
      );
      const instance: WindowInstance = {
        id: action.id,
        appId: action.definition.appId,
        title: action.definition.title,
        icon: action.definition.icon,
        mode: "normal",
        bounds,
        restoreBounds: bounds,
        zIndex: state.nextZIndex,
        payload: action.payload,
      };

      return {
        ...state,
        windows: [...state.windows, instance],
        activeWindowId: instance.id,
        nextCascadeIndex: state.nextCascadeIndex + 1,
        nextZIndex: state.nextZIndex + 1,
      };
    }
    case "FOCUS":
      return focusWindow(state, action.id);
    case "MOVE":
      return updateNormalBounds(state, action.id, (bounds) => ({
        ...bounds,
        x: action.x,
        y: action.y,
      }));
    case "RESIZE":
      return updateNormalBounds(state, action.id, () => action.bounds);
    case "MINIMIZE": {
      const target = state.windows.find(({ id }) => id === action.id);
      if (!target || target.mode === "minimized") return state;

      const windows = state.windows.map((windowInstance) =>
        windowInstance.id === action.id
          ? { ...windowInstance, mode: "minimized" as const }
          : windowInstance,
      );

      return {
        ...state,
        windows,
        activeWindowId:
          state.activeWindowId === action.id
            ? topVisibleWindowId(windows)
            : state.activeWindowId,
      };
    }
    case "MAXIMIZE": {
      const target = state.windows.find(({ id }) => id === action.id);
      if (!target || target.mode !== "normal") return state;

      return focusWindow(
        {
          ...state,
          windows: state.windows.map((windowInstance) =>
            windowInstance.id === action.id
              ? {
                  ...windowInstance,
                  mode: "maximized" as const,
                  restoreBounds: windowInstance.bounds,
                  bounds: desktopRect(state.desktopSize),
                }
              : windowInstance,
          ),
        },
        action.id,
      );
    }
    case "RESTORE": {
      const target = state.windows.find(({ id }) => id === action.id);
      if (!target || target.mode === "normal") return state;
      const bounds = clampBounds(target.restoreBounds, state.desktopSize);

      return focusWindow(
        {
          ...state,
          windows: state.windows.map((windowInstance) =>
            windowInstance.id === action.id
              ? {
                  ...windowInstance,
                  mode: "normal" as const,
                  bounds,
                  restoreBounds: bounds,
                }
              : windowInstance,
          ),
        },
        action.id,
      );
    }
    case "TOGGLE_TASKBAR": {
      const target = state.windows.find(({ id }) => id === action.id);
      if (!target) return state;
      if (target.mode === "minimized") {
        return windowReducer(state, { type: "RESTORE", id: action.id });
      }
      if (state.activeWindowId === action.id) {
        return windowReducer(state, { type: "MINIMIZE", id: action.id });
      }
      return focusWindow(state, action.id);
    }
    case "CLOSE": {
      if (!state.windows.some(({ id }) => id === action.id)) return state;
      const windows = state.windows.filter(({ id }) => id !== action.id);

      return {
        ...state,
        windows,
        activeWindowId:
          state.activeWindowId === action.id
            ? topVisibleWindowId(windows)
            : state.activeWindowId,
      };
    }
    case "CLOSE_ALL":
      if (state.windows.length === 0) return state;
      return { ...state, windows: [], activeWindowId: null };
    case "SET_DESKTOP_SIZE": {
      const size = normalizeDesktopSize(action.size);

      return {
        ...state,
        desktopSize: size,
        windows: state.windows.map((windowInstance) => {
          if (windowInstance.mode === "maximized") {
            return { ...windowInstance, bounds: desktopRect(size) };
          }
          if (windowInstance.mode !== "normal") return windowInstance;
          const bounds = clampBounds(windowInstance.bounds, size);
          return { ...windowInstance, bounds, restoreBounds: bounds };
        }),
      };
    }
  }
}

function focusWindow(state: WindowState, id: string): WindowState {
  const target = state.windows.find(
    (windowInstance) =>
      windowInstance.id === id && windowInstance.mode !== "minimized",
  );
  if (!target) return state;

  return {
    ...state,
    windows: state.windows.map((windowInstance) =>
      windowInstance.id === id
        ? { ...windowInstance, zIndex: state.nextZIndex }
        : windowInstance,
    ),
    activeWindowId: id,
    nextZIndex: state.nextZIndex + 1,
  };
}

function updateNormalBounds(
  state: WindowState,
  id: string,
  update: (bounds: Rect) => Rect,
): WindowState {
  const target = state.windows.find(({ id: windowId }) => windowId === id);
  if (!target || target.mode !== "normal") return state;
  const bounds = clampBounds(update(target.bounds), state.desktopSize);

  return {
    ...state,
    windows: state.windows.map((windowInstance) =>
      windowInstance.id === id
        ? { ...windowInstance, bounds, restoreBounds: bounds }
        : windowInstance,
    ),
  };
}

function topVisibleWindowId(windows: WindowInstance[]): string | null {
  let topWindow: WindowInstance | undefined;

  for (const windowInstance of windows) {
    if (windowInstance.mode === "minimized") continue;
    if (!topWindow || windowInstance.zIndex > topWindow.zIndex) {
      topWindow = windowInstance;
    }
  }

  return topWindow?.id ?? null;
}

function desktopRect(size: DesktopSize): Rect {
  return { x: 0, y: 0, width: size.width, height: size.height };
}

function normalizeDesktopSize(size: DesktopSize): DesktopSize {
  return {
    width: Math.max(0, size.width),
    height: Math.max(0, size.height),
  };
}
