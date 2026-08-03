import {
  clearDesktopSession,
  readDesktopSession,
  writeDesktopSession,
} from "@/persistence/desktop-session";

describe("desktop session storage", () => {
  it("round-trips a versioned window session", () => {
    writeDesktopSession({
      windows: [
        {
          id: "about-notepad-3",
          appId: "about-notepad",
          title: "About Harry - Notepad",
          icon: "/assets/icons/notepad.png",
          mode: "minimized",
          bounds: { x: 40, y: 30, width: 660, height: 520 },
          restoreBounds: { x: 40, y: 30, width: 660, height: 520 },
          zIndex: 4,
          payload: {},
        },
      ],
      activeWindowId: null,
      nextCascadeIndex: 3,
      nextZIndex: 5,
      nextWindowNumber: 3,
    });

    expect(readDesktopSession()).toMatchObject({
      version: 1,
      loggedIn: true,
      nextWindowNumber: 3,
      windows: [{ id: "about-notepad-3", mode: "minimized" }],
    });
  });

  it("rejects and removes malformed or untrusted saved data", () => {
    window.localStorage.setItem(
      "rosebeg-xp:desktop-session:v1",
      JSON.stringify({
        version: 1,
        loggedIn: true,
        windows: [{ id: "fake", appId: "unknown-program" }],
        activeWindowId: null,
        nextCascadeIndex: 0,
        nextZIndex: 1,
        nextWindowNumber: 0,
      }),
    );

    expect(readDesktopSession()).toBeNull();
    expect(window.localStorage.length).toBe(0);
  });

  it("clears the session marker without affecting other preferences", () => {
    window.localStorage.setItem("rosebeg-xp:sound-muted:v1", "true");
    writeDesktopSession({
      windows: [],
      activeWindowId: null,
      nextCascadeIndex: 0,
      nextZIndex: 1,
      nextWindowNumber: 0,
    });

    clearDesktopSession();

    expect(readDesktopSession()).toBeNull();
    expect(window.localStorage.getItem("rosebeg-xp:sound-muted:v1")).toBe("true");
  });
});
