import type { SystemEvent, SystemState } from "@/system/types";

export const initialSystemState: SystemState = { phase: "booting" };

export function systemReducer(
  state: SystemState,
  event: SystemEvent,
): SystemState {
  switch (state.phase) {
    case "booting":
      return event.type === "BOOT_FINISHED" ? { phase: "login" } : state;
    case "login":
      return event.type === "SELECT_ACCOUNT" ? { phase: "signing-in" } : state;
    case "signing-in":
      return event.type === "SIGN_IN_FINISHED" ? { phase: "desktop" } : state;
    case "desktop":
      if (event.type === "CONFIRM_LOG_OFF") return { phase: "logging-off" };
      if (event.type === "CONFIRM_TURN_OFF") return { phase: "shutting-down" };
      if (event.type === "CONFIRM_RESTART") {
        return { phase: "shutting-down", restartAfterShutdown: true };
      }
      return state;
    case "logging-off":
      return event.type === "LOG_OFF_FINISHED" ? { phase: "login" } : state;
    case "shutting-down":
      if (event.type !== "SHUTDOWN_FINISHED") return state;
      return state.restartAfterShutdown
        ? { phase: "booting" }
        : { phase: "powered-off" };
    case "powered-off":
      return event.type === "RESTART" ? { phase: "booting" } : state;
  }
}
