import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  type ReactNode,
} from "react";
import { AppErrorBoundary } from "@/shared/AppErrorBoundary";
import { WindowFrame } from "@/windowing/WindowFrame";
import {
  initialWindowState,
  windowReducer,
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
  const [state, dispatch] = useReducer(windowReducer, {
    ...initialWindowState,
    desktopSize,
  });
  const nextWindowNumber = useRef(0);

  useEffect(() => {
    dispatch({ type: "SET_DESKTOP_SIZE", size: desktopSize });
  }, [desktopSize.height, desktopSize.width]);

  const launch = useCallback(
    (appId: AppId, payload: WindowPayload = {}) => {
      const definition = registry[appId];
      if (!definition) {
        throw new Error(`No window is registered for ${appId}`);
      }
      nextWindowNumber.current += 1;
      const id = `${appId}-${nextWindowNumber.current}`;
      dispatch({ type: "LAUNCH", id, definition, payload });
      return id;
    },
    [registry],
  );

  const focus = useCallback(
    (id: string) => dispatch({ type: "FOCUS", id }),
    [],
  );
  const minimize = useCallback(
    (id: string) => dispatch({ type: "MINIMIZE", id }),
    [],
  );
  const maximize = useCallback(
    (id: string) => dispatch({ type: "MAXIMIZE", id }),
    [],
  );
  const restore = useCallback(
    (id: string) => dispatch({ type: "RESTORE", id }),
    [],
  );
  const toggleTaskbar = useCallback(
    (id: string) => dispatch({ type: "TOGGLE_TASKBAR", id }),
    [],
  );
  const close = useCallback(
    (id: string) => dispatch({ type: "CLOSE", id }),
    [],
  );
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
              onFocus={() => focus(windowInstance.id)}
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
