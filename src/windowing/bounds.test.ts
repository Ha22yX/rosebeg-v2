import { clampBounds, fitInitialBounds } from "@/windowing/bounds";
import type { WindowDefinition } from "@/windowing/types";

const projectWindowDefinition: WindowDefinition = {
  appId: "projects-explorer",
  title: "My Projects",
  icon: "/assets/icons/projects.png",
  idealSize: { width: 900, height: 620 },
  minimumSize: { width: 520, height: 420 },
};

describe("fitInitialBounds", () => {
  it("fits an Explorer window on narrow and wide desktops without maximizing", () => {
    expect(
      fitInitialBounds(
        projectWindowDefinition,
        { width: 390, height: 812 },
        0,
      ),
    ).toMatchObject({ width: 366, height: 788 });
    expect(
      fitInitialBounds(
        projectWindowDefinition,
        { width: 1920, height: 1048 },
        0,
      ),
    ).toMatchObject({ width: 900, height: 620 });
  });

  it("centers the first window and cascades later windows without leaving the desktop", () => {
    expect(
      fitInitialBounds(
        projectWindowDefinition,
        { width: 1920, height: 1048 },
        0,
      ),
    ).toEqual({ x: 510, y: 214, width: 900, height: 620 });
    expect(
      fitInitialBounds(
        projectWindowDefinition,
        { width: 1920, height: 1048 },
        1,
      ),
    ).toEqual({ x: 532, y: 236, width: 900, height: 620 });

    const wrapped = fitInitialBounds(
      projectWindowDefinition,
      { width: 1000, height: 700 },
      2,
    );
    expect(wrapped).toEqual({ x: 50, y: 40, width: 900, height: 620 });
  });

  it("clamps normal windows inside the desktop's 12 px safe margin", () => {
    expect(
      clampBounds(
        { x: -40, y: 690, width: 900, height: 620 },
        { width: 1000, height: 700 },
      ),
    ).toEqual({ x: 12, y: 68, width: 900, height: 620 });
    expect(
      clampBounds(
        { x: 0, y: 0, width: 900, height: 900 },
        { width: 390, height: 812 },
      ),
    ).toEqual({ x: 12, y: 12, width: 366, height: 788 });
  });

  it("preserves ideal width when only desktop height is below minimum", () => {
    expect(
      fitInitialBounds(
        projectWindowDefinition,
        { width: 1200, height: 400 },
        0,
      ),
    ).toEqual({ x: 150, y: 12, width: 900, height: 376 });
  });

  it("keeps ultra-small initial bounds entirely inside the desktop", () => {
    expect(
      fitInitialBounds(
        projectWindowDefinition,
        { width: 10, height: 18 },
        0,
      ),
    ).toEqual({ x: 0, y: 0, width: 10, height: 18 });
    expect(
      fitInitialBounds(
        projectWindowDefinition,
        { width: 0, height: 0 },
        0,
      ),
    ).toEqual({ x: 0, y: 0, width: 0, height: 0 });
  });
});
