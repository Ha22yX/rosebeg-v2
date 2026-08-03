import type { WindowInstance } from "@/windowing/types";

const DESKTOP_SESSION_KEY = "rosebeg-xp:desktop-session:v1";
const SESSION_VERSION = 1;
const MAX_RESTORED_WINDOWS = 40;

export type DesktopSession = {
  version: 1;
  loggedIn: true;
  windows: WindowInstance[];
  activeWindowId: string | null;
  nextCascadeIndex: number;
  nextZIndex: number;
  nextWindowNumber: number;
};

export function readDesktopSession(): DesktopSession | null {
  const storage = getStorage();
  if (!storage) return null;

  try {
    const raw = storage.getItem(DESKTOP_SESSION_KEY);
    if (!raw) return null;
    const value: unknown = JSON.parse(raw);
    if (!isDesktopSession(value)) {
      storage.removeItem(DESKTOP_SESSION_KEY);
      return null;
    }
    return value;
  } catch {
    try {
      storage.removeItem(DESKTOP_SESSION_KEY);
    } catch {
      // Storage can be unavailable in private browsing or restricted embeds.
    }
    return null;
  }
}

export function writeDesktopSession(
  session: Omit<DesktopSession, "version" | "loggedIn">,
): void {
  const storage = getStorage();
  if (!storage) return;

  try {
    storage.setItem(
      DESKTOP_SESSION_KEY,
      JSON.stringify({ ...session, version: SESSION_VERSION, loggedIn: true }),
    );
  } catch {
    // A portfolio session is optional; never break the desktop if quota is full.
  }
}

export function clearDesktopSession(): void {
  const storage = getStorage();
  if (!storage) return;
  try {
    storage.removeItem(DESKTOP_SESSION_KEY);
  } catch {
    // Ignore unavailable storage.
  }
}

function getStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function isDesktopSession(value: unknown): value is DesktopSession {
  if (!isRecord(value)) return false;
  if (value.version !== SESSION_VERSION || value.loggedIn !== true) return false;
  if (!Array.isArray(value.windows) || value.windows.length > MAX_RESTORED_WINDOWS) {
    return false;
  }
  if (!value.windows.every(isWindowInstance)) return false;
  if (new Set(value.windows.map(({ id }) => id)).size !== value.windows.length) {
    return false;
  }
  if (value.activeWindowId !== null && typeof value.activeWindowId !== "string") {
    return false;
  }
  return (
    isCounter(value.nextCascadeIndex) &&
    isCounter(value.nextZIndex) &&
    isCounter(value.nextWindowNumber)
  );
}

function isWindowInstance(value: unknown): value is WindowInstance {
  if (!isRecord(value)) return false;
  if (
    typeof value.id !== "string" ||
    value.id.length === 0 ||
    value.id.length > 160 ||
    !isAppId(value.appId) ||
    typeof value.title !== "string" ||
    typeof value.icon !== "string" ||
    !isWindowMode(value.mode) ||
    !isRect(value.bounds) ||
    !isRect(value.restoreBounds) ||
    !isCounter(value.zIndex) ||
    !isPayload(value.payload)
  ) {
    return false;
  }
  return true;
}

function isAppId(value: unknown): value is WindowInstance["appId"] {
  return [
    "projects-explorer",
    "pictures-browser",
    "picture-viewer",
    "about-notepad",
    "harry-messenger",
  ].includes(String(value));
}

function isWindowMode(value: unknown): value is WindowInstance["mode"] {
  return value === "normal" || value === "minimized" || value === "maximized";
}

function isRect(value: unknown): value is WindowInstance["bounds"] {
  return (
    isRecord(value) &&
    isFiniteNumber(value.x) &&
    isFiniteNumber(value.y) &&
    isFiniteNumber(value.width) &&
    isFiniteNumber(value.height) &&
    value.width >= 0 &&
    value.height >= 0
  );
}

function isPayload(value: unknown): value is WindowInstance["payload"] {
  if (!isRecord(value)) return false;
  const keys = Object.keys(value);
  if (keys.some((key) => key !== "photoSlug" && key !== "projectSlug")) return false;
  return keys.every((key) => value[key] === undefined || typeof value[key] === "string");
}

function isCounter(value: unknown): value is number {
  return Number.isSafeInteger(value) && Number(value) >= 0;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
