import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from "react";
import { useSystemSound } from "@/audio/SystemSoundProvider";
import {
  clearDesktopSession,
  readDesktopSession,
} from "@/persistence/desktop-session";
import { BootScreen } from "@/system/BootScreen";
import { LoginScreen } from "@/system/LoginScreen";
import { PowerScreen } from "@/system/PowerScreen";
import { usePrefersReducedMotion } from "@/shared/usePrefersReducedMotion";
import { initialSystemState, systemReducer } from "@/system/system-reducer";
import "@/system/system.css";

export type SystemActions = {
  requestLogOff(): void;
  requestTurnOff(): void;
  requestRestart(): void;
};

export const SystemActionsContext = createContext<SystemActions | null>(null);

export function useSystemActions(): SystemActions {
  const actions = useContext(SystemActionsContext);

  if (actions === null) {
    throw new Error("useSystemActions must be used within SystemRoot");
  }

  return actions;
}

type SystemRootProps = {
  children: ReactNode;
  reducedMotion?: boolean;
};

export function SystemRoot({ children, reducedMotion }: SystemRootProps) {
  const [state, dispatch] = useReducer(
    systemReducer,
    initialSystemState,
    () => (readDesktopSession() ? { phase: "desktop" as const } : initialSystemState),
  );
  const { play } = useSystemSound();
  const systemPrefersReducedMotion = usePrefersReducedMotion();
  const prefersReducedMotion = reducedMotion ?? systemPrefersReducedMotion;

  useEffect(() => {
    const eventByPhase = {
      booting: { type: "BOOT_FINISHED" },
      "signing-in": { type: "SIGN_IN_FINISHED" },
      "logging-off": { type: "LOG_OFF_FINISHED" },
      "shutting-down": { type: "SHUTDOWN_FINISHED" },
    } as const;
    const event = eventByPhase[state.phase as keyof typeof eventByPhase];

    if (!event) return;

    const normalDelayByPhase = {
      booting: 1_800,
      "signing-in": 650,
      "logging-off": 450,
      "shutting-down": 1_200,
    } as const;
    const transitionDelay = prefersReducedMotion
      ? 150
      : normalDelayByPhase[state.phase as keyof typeof normalDelayByPhase];
    const timeoutId = window.setTimeout(() => dispatch(event), transitionDelay);
    return () => window.clearTimeout(timeoutId);
  }, [prefersReducedMotion, state.phase]);

  const actions = useMemo<SystemActions>(
    () => ({
      requestLogOff: () => {
        clearDesktopSession();
        play("logoff");
        dispatch({ type: "CONFIRM_LOG_OFF" });
      },
      requestTurnOff: () => {
        clearDesktopSession();
        play("shutdown");
        dispatch({ type: "CONFIRM_TURN_OFF" });
      },
      requestRestart: () => {
        clearDesktopSession();
        play("shutdown");
        dispatch({ type: "CONFIRM_RESTART" });
      },
    }),
    [play],
  );

  const selectAccount = useCallback(() => {
    play("login");
    dispatch({ type: "SELECT_ACCOUNT" });
  }, [play]);
  const restart = useCallback(() => dispatch({ type: "RESTART" }), []);

  let content: ReactNode;
  switch (state.phase) {
    case "booting":
      content = <BootScreen />;
      break;
    case "login":
      content = <LoginScreen onSelectAccount={selectAccount} />;
      break;
    case "signing-in":
      content = <LoginScreen onSelectAccount={selectAccount} signingIn />;
      break;
    case "desktop":
      content = children;
      break;
    case "logging-off":
    case "shutting-down":
    case "powered-off":
      content = <PowerScreen onRestart={restart} phase={state.phase} />;
      break;
  }

  return (
    <SystemActionsContext.Provider value={actions}>
      <div className="system-root">{content}</div>
    </SystemActionsContext.Provider>
  );
}
