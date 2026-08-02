export type PictureBrowserView = "thumbnails" | "filmstrip" | "list";

export type ViewerState = {
  index: number;
  zoom: number;
  rotation: 0 | 90 | 180 | 270;
  fitToWindow: boolean;
};

export type ViewerAction =
  | { type: "NAVIGATE"; delta: -1 | 1; length: number }
  | { type: "ZOOM"; delta: -1 | 1 }
  | { type: "ACTUAL_SIZE" }
  | { type: "FIT_TO_WINDOW" }
  | { type: "ROTATE"; delta: -90 | 90 };

export const zoomSteps = [25, 50, 75, 100, 125, 150, 200, 300, 400] as const;

export function nextIndex(
  index: number,
  delta: -1 | 1,
  length: number,
): number {
  if (length <= 0) return 0;
  return (index + delta + length) % length;
}

export function clampZoom(value: number): number {
  return Math.min(400, Math.max(25, value));
}

export function rotate(
  current: ViewerState["rotation"],
  delta: -90 | 90,
): ViewerState["rotation"] {
  return ((current + delta + 360) % 360) as ViewerState["rotation"];
}

export function photoStateReducer(
  state: ViewerState,
  action: ViewerAction,
): ViewerState {
  switch (action.type) {
    case "NAVIGATE":
      return {
        ...state,
        index: nextIndex(state.index, action.delta, action.length),
      };
    case "ZOOM": {
      const currentStep = zoomSteps.findIndex((step) => step >= state.zoom);
      const nextStep = Math.min(
        zoomSteps.length - 1,
        Math.max(0, currentStep + action.delta),
      );
      return {
        ...state,
        zoom: zoomSteps[nextStep],
        fitToWindow: false,
      };
    }
    case "ACTUAL_SIZE":
      return { ...state, zoom: 100, fitToWindow: false };
    case "FIT_TO_WINDOW":
      return { ...state, fitToWindow: true };
    case "ROTATE":
      return { ...state, rotation: rotate(state.rotation, action.delta) };
  }
}
