import {
  clampZoom,
  fitAxisForRotation,
  nextIndex,
  photoStateReducer,
  rotate,
  type ViewerState,
} from "@/apps/photos/photo-state";

describe("photo state", () => {
  it("wraps navigation, clamps zoom, and normalizes rotation", () => {
    expect(nextIndex(14, 1, 15)).toBe(0);
    expect(nextIndex(0, -1, 15)).toBe(14);
    expect(clampZoom(500)).toBe(400);
    expect(clampZoom(10)).toBe(25);
    expect(rotate(270, 90)).toBe(0);
  });

  it("changes relative zoom from the fitted 100% size", () => {
    const initial: ViewerState = {
      index: 0,
      zoom: 100,
      rotation: 0,
    };

    const zoomedIn = photoStateReducer(initial, { type: "ZOOM", delta: 1 });
    expect(zoomedIn).toEqual({ ...initial, zoom: 125 });

    const zoomedOut = photoStateReducer(initial, { type: "ZOOM", delta: -1 });
    expect(zoomedOut).toEqual({ ...initial, zoom: 75 });
  });

  it("restores the fitted 100% zoom", () => {
    const initial: ViewerState = { index: 0, zoom: 100, rotation: 0 };
    const zoomed = { ...initial, zoom: 300 };

    expect(photoStateReducer(zoomed, { type: "FIT_TO_WINDOW" })).toEqual(initial);
  });

  it("swaps fit axes for both quarter-turn rotations", () => {
    expect(fitAxisForRotation(0)).toBe("normal");
    expect(fitAxisForRotation(90)).toBe("swapped");
    expect(fitAxisForRotation(180)).toBe("normal");
    expect(fitAxisForRotation(270)).toBe("swapped");
  });
});
