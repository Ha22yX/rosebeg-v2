export type SystemPhase =
  | "booting"
  | "login"
  | "signing-in"
  | "desktop"
  | "logging-off"
  | "shutting-down"
  | "powered-off";

export type SystemEvent =
  | { type: "BOOT_FINISHED" }
  | { type: "SELECT_ACCOUNT" }
  | { type: "SIGN_IN_FINISHED" }
  | { type: "CONFIRM_LOG_OFF" }
  | { type: "LOG_OFF_FINISHED" }
  | { type: "CONFIRM_TURN_OFF" }
  | { type: "CONFIRM_RESTART" }
  | { type: "SHUTDOWN_FINISHED" }
  | { type: "RESTART" };

export type SystemState = {
  phase: SystemPhase;
  restartAfterShutdown?: boolean;
};
