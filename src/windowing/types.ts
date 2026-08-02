import type { ReactNode } from "react";

export type AppId =
  | "projects-explorer"
  | "pictures-browser"
  | "picture-viewer"
  | "about-notepad"
  | "harry-messenger";

export type WindowPayload = { photoSlug?: string; projectSlug?: string };
export type WindowMode = "normal" | "minimized" | "maximized";
export type Rect = { x: number; y: number; width: number; height: number };
export type DesktopSize = { width: number; height: number };

export type WindowDefinition = {
  appId: AppId;
  title: string;
  icon: string;
  idealSize: { width: number; height: number };
  minimumSize: { width: number; height: number };
};

export type WindowAppContext = {
  windowId: string;
  payload: WindowPayload;
  close(): void;
  launch(appId: AppId, payload?: WindowPayload): string;
};

export type WindowRegistryEntry = WindowDefinition & {
  render(context: WindowAppContext): ReactNode;
};

export type WindowRegistry = Partial<Record<AppId, WindowRegistryEntry>>;

export type WindowInstance = {
  id: string;
  appId: AppId;
  title: string;
  icon: string;
  mode: WindowMode;
  bounds: Rect;
  restoreBounds: Rect;
  zIndex: number;
  payload: WindowPayload;
};
