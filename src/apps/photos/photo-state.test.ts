import {
  clampZoom,
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

  it("moves through the supported zoom steps and disables fit mode", () => {
    const initial: ViewerState = {
      index: 0,
      zoom: 100,
      rotation: 0,
      fitToWindow: true,
    };

    const zoomedIn = photoStateReducer(initial, { type: "ZOOM", delta: 1 });
    expect(zoomedIn).toEqual({ ...initial, zoom: 125, fitToWindow: false });

    const zoomedOut = photoStateReducer(zoomedIn, { type: "ZOOM", delta: -1 });
    expect(zoomedOut).toEqual({ ...initial, fitToWindow: false });
  });
});
