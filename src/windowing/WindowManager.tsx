import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useSystemSound } from "@/audio/SystemSoundProvider";
import {
  readDesktopSession,
  writeDesktopSession,
} from "@/persistence/desktop-session";
import { AppErrorBoundary } from "@/shared/AppErrorBoundary";
import { WindowFrame } from "@/windowing/WindowFrame";
import {
  initialWindowState,
  windowReducer,
  type WindowState,
} from "@/windowing/window-reducer";
import type {
  AppId,
  DesktopSize,
  WindowAppContext,
  WindowInstance,
  WindowPayload,
  WindowRegistry,
  WindowRegistryEntry,
} from "@/windowing/types";
import "@/windowing/windowing.css";

export type WindowManagerApi = {
  windows: readonly WindowInstance[];
  activeWindowId: string | null;
  launch(appId: AppId, payload?: WindowPayload): string;
  focus(id: string): void;
  minimize(id: string): void;
  maximize(id: string): void;
  restore(id: string): void;
  toggleTaskbar(id: string): void;
  close(id: string): void;
  closeAll(): void;
};

type WindowManagerProviderProps = {
  children: ReactNode;
  desktopSize: DesktopSize;
  registry: WindowRegistry;
};

const WindowManagerContext = createContext<WindowManagerApi | null>(null);

export function useWindowManager(): WindowManagerApi {
  const manager = useContext(WindowManagerContext);

  if (manager === null) {
    throw new Error(
      "useWindowManager must be used within WindowManagerProvider",
    );
  }

  return manager;
}

export function WindowManagerProvider({
  children,
  desktopSize,
  registry,
}: WindowManagerProviderProps) {
  const [initialState] = useState(() => restoreWindowState(desktopSize, registry));
  const [state, dispatch] = useReducer(windowReducer, initialState.state);
  const nextWindowNumber = useRef(initialState.nextWindowNumber);
  const { play } = useSystemSound();

  useEffect(() => {
    dispatch({ type: "SET_DESKTOP_SIZE", size: desktopSize });
  }, [desktopSize.height, desktopSize.width]);

  useEffect(() => {
    writeDesktopSession({
      windows: state.windows,
      activeWindowId: state.activeWindowId,
      nextCascadeIndex: state.nextCascadeIndex,
      nextZIndex: state.nextZIndex,
      nextWindowNumber: nextWindowNumber.current,
    });
  }, [
    state.activeWindowId,
    state.nextCascadeIndex,
    state.nextZIndex,
    state.windows,
  ]);

  const launch = useCallback(
    (appId: AppId, payload: WindowPayload = {}) => {
      const definition = registry[appId];
      if (!definition) {
        throw new Error(`No window is registered for ${appId}`);
      }
      nextWindowNumber.current += 1;
      const id = `${appId}-${nextWindowNumber.current}`;
      play("open");
      dispatch({ type: "LAUNCH", id, definition, payload });
      return id;
    },
    [play, registry],
  );

  const focus = useCallback(
    (id: string) => dispatch({ type: "FOCUS", id }),
    [],
  );
  const minimize = useCallback((id: string) => {
    play("minimize");
    dispatch({ type: "MINIMIZE", id });
  }, [play]);
  const maximize = useCallback((id: string) => {
    play("maximize");
    dispatch({ type: "MAXIMIZE", id });
  }, [play]);
  const restore = useCallback((id: string) => {
    play("restore");
    dispatch({ type: "RESTORE", id });
  }, [play]);
  const toggleTaskbar = useCallback(
    (id: string) => {
      const target = state.windows.find((windowInstance) => windowInstance.id === id);
      if (target?.mode === "minimized") play("restore");
      else if (state.activeWindowId === id) play("minimize");
      dispatch({ type: "TOGGLE_TASKBAR", id });
    },
    [play, state.activeWindowId, state.windows],
  );
  const close = useCallback((id: string) => {
    play("close");
    dispatch({ type: "CLOSE", id });
  }, [play]);
  const closeAll = useCallback(() => dispatch({ type: "CLOSE_ALL" }), []);

  const manager = useMemo<WindowManagerApi>(
    () => ({
      windows: state.windows,
      activeWindowId: state.activeWindowId,
      launch,
      focus,
      minimize,
      maximize,
      restore,
      toggleTaskbar,
      close,
      closeAll,
    }),
    [
      close,
      closeAll,
      focus,
      launch,
      maximize,
      minimize,
      restore,
      state.activeWindowId,
      state.windows,
      toggleTaskbar,
    ],
  );

  return (
    <WindowManagerContext.Provider value={manager}>
      {children}
      <div className="window-manager__layer">
        {state.windows.map((windowInstance) => {
          if (windowInstance.mode === "minimized") return null;
          const entry = registry[windowInstance.appId];
          if (!entry) return null;

          return (
            <WindowFrame
              active={state.activeWindowId === windowInstance.id}
              definition={entry}
              desktopSize={state.desktopSize}
              key={windowInstance.id}
              onClose={() => close(windowInstance.id)}
              onFocus={() => {
                if (state.activeWindowId !== windowInstance.id) {
                  focus(windowInstance.id);
                }
              }}
              onMaximize={() => maximize(windowInstance.id)}
              onMinimize={() => minimize(windowInstance.id)}
              onMove={(x, y) =>
                dispatch({ type: "MOVE", id: windowInstance.id, x, y })
              }
              onResize={(bounds) =>
                dispatch({
                  type: "RESIZE",
                  id: windowInstance.id,
                  bounds,
                })
              }
              onRestore={() => restore(windowInstance.id)}
              windowInstance={windowInstance}
            >
              <AppErrorBoundary
                onClose={() => close(windowInstance.id)}
                windowTitle={windowInstance.title}
              >
                <RegistryApplication
                  context={{
                    windowId: windowInstance.id,
                    payload: windowInstance.payload,
                    close: () => close(windowInstance.id),
                    launch,
                  }}
                  entry={entry}
                />
              </AppErrorBoundary>
            </WindowFrame>
          );
        })}
      </div>
    </WindowManagerContext.Provider>
  );
}

function RegistryApplication({
  context,
  entry,
}: {
  context: WindowAppContext;
  entry: WindowRegistryEntry;
}) {
  return entry.render(context);
}

function restoreWindowState(
  desktopSize: DesktopSize,
  registry: WindowRegistry,
): { state: WindowState; nextWindowNumber: number } {
  const session = readDesktopSession();
  if (!session) {
    return {
      state: { ...initialWindowState, desktopSize },
      nextWindowNumber: 0,
    };
  }

  const windows = session.windows.filter(({ appId }) => Boolean(registry[appId]));
  const windowDefinitions = Object.fromEntries(
    windows.map((windowInstance) => [
      windowInstance.id,
      registry[windowInstance.appId]!,
    ]),
  );
  const windowCascadeIndexes = Object.fromEntries(
    windows.map((windowInstance, index) => [windowInstance.id, index]),
  );
  const activeWindowId = windows.some(
    ({ id, mode }) => id === session.activeWindowId && mode !== "minimized",
  )
    ? session.activeWindowId
    : null;
  const hydrated: WindowState = {
    windows,
    windowDefinitions,
    windowCascadeIndexes,
    activeWindowId,
    desktopSize,
    nextCascadeIndex: Math.max(session.nextCascadeIndex, windows.length),
    nextZIndex: Math.max(
      session.nextZIndex,
      ...windows.map(({ zIndex }) => zIndex + 1),
      1,
    ),
  };

  return {
    state: windowReducer(hydrated, { type: "SET_DESKTOP_SIZE", size: desktopSize }),
    nextWindowNumber: Math.max(
      session.nextWindowNumber,
      ...windows.map(({ id }) => Number(id.match(/-(\d+)$/)?.[1] ?? 0)),
      0,
    ),
  };
}
