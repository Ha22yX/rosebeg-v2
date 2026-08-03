import {
  calculateFocus,
  calculatePhotoLayout,
  calculateScroll,
} from "@/apps/photos/photo-geometry";

describe("photo geometry", () => {
  it("fits a landscape image within the guttered viewport at 100%", () => {
    const layout = calculatePhotoLayout(
      { width: 1600, height: 900 },
      { width: 800, height: 600 },
      0,
      100,
      14,
    );

    expect(layout.image).toEqual({ width: 772, height: 434.25 });
    expect(layout.canvas).toEqual({ width: 772, height: 434.25 });
    expect(layout.stage).toEqual({ width: 800, height: 600 });
  });

  it.each([90, 270] as const)(
    "swaps fitted canvas axes for a %d degree rotation",
    (rotation) => {
      const layout = calculatePhotoLayout(
        { width: 1600, height: 900 },
        { width: 800, height: 600 },
        rotation,
        100,
        14,
      );

      expect(layout.image).toEqual({ width: 572, height: 321.75 });
      expect(layout.canvas).toEqual({ width: 321.75, height: 572 });
      expect(layout.stage).toEqual({ width: 800, height: 600 });
    },
  );

  it("scales the fitted image and stage relative to 100% zoom", () => {
    const layout = calculatePhotoLayout(
      { width: 1600, height: 900 },
      { width: 800, height: 600 },
      0,
      125,
      14,
    );

    expect(layout.image).toEqual({ width: 965, height: 542.8125 });
    expect(layout.canvas).toEqual({ width: 965, height: 542.8125 });
    expect(layout.stage).toEqual({ width: 993, height: 600 });
  });

  it("captures the viewport center as a normalized canvas focus", () => {
    expect(calculateFocus(250, 500, 50, 1000)).toBeCloseTo(0.45);
  });

  it("restores and clamps scroll from normalized focus", () => {
    expect(calculateScroll(0.45, 500, 50, 1250, 1278)).toBeCloseTo(362.5);
    expect(calculateScroll(-1, 500, 50, 1250, 1278)).toBe(0);
    expect(calculateScroll(2, 500, 50, 1250, 1278)).toBe(778);
  });

  it("returns finite clamped values for invalid geometry", () => {
    expect(calculateFocus(0, 0, 0, 0)).toBe(0);
    expect(calculateScroll(Number.NaN, 0, 0, 0, 0)).toBe(0);
    expect(
      calculatePhotoLayout(
        { width: 0, height: Number.NaN },
        { width: 0, height: -1 },
        0,
        Number.NaN,
      ),
    ).toEqual({
      image: { width: 0, height: 0 },
      canvas: { width: 0, height: 0 },
      stage: { width: 0, height: 0 },
    });
  });
});
