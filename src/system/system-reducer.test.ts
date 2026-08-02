import { initialSystemState, systemReducer } from "@/system/system-reducer";

describe("systemReducer", () => {
  it("boots, signs in, logs off, shuts down, and restarts", () => {
    const login = systemReducer(initialSystemState, { type: "BOOT_FINISHED" });
    expect(login.phase).toBe("login");

    const signingIn = systemReducer(login, { type: "SELECT_ACCOUNT" });
    expect(systemReducer(signingIn, { type: "SIGN_IN_FINISHED" }).phase).toBe(
      "desktop",
    );

    const loggingOff = systemReducer(
      { phase: "desktop" },
      { type: "CONFIRM_LOG_OFF" },
    );
    expect(systemReducer(loggingOff, { type: "LOG_OFF_FINISHED" }).phase).toBe(
      "login",
    );

    const shuttingDown = systemReducer(
      { phase: "desktop" },
      { type: "CONFIRM_TURN_OFF" },
    );
    const poweredOff = systemReducer(shuttingDown, { type: "SHUTDOWN_FINISHED" });
    expect(poweredOff.phase).toBe("powered-off");
    expect(systemReducer(poweredOff, { type: "RESTART" }).phase).toBe("booting");
  });

  it("restarts through shutdown when restart is confirmed from the desktop", () => {
    const shuttingDown = systemReducer(
      { phase: "desktop" },
      { type: "CONFIRM_RESTART" },
    );

    expect(shuttingDown).toEqual({
      phase: "shutting-down",
      restartAfterShutdown: true,
    });
    expect(systemReducer(shuttingDown, { type: "SHUTDOWN_FINISHED" })).toEqual({
      phase: "booting",
    });
  });

  it("ignores events that are invalid for the current phase", () => {
    const state = { phase: "login" } as const;

    expect(systemReducer(state, { type: "SHUTDOWN_FINISHED" })).toBe(state);
  });
});
