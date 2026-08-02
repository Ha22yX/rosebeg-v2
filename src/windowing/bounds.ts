import type {
  DesktopSize,
  Rect,
  WindowDefinition,
} from "@/windowing/types";

const INITIAL_MARGIN = 12;
const CASCADE_OFFSET = 22;

export function fitInitialBounds(
  definition: WindowDefinition,
  desktopSize: DesktopSize,
  cascadeIndex: number,
): Rect {
  const usableWidth = Math.max(0, desktopSize.width - INITIAL_MARGIN * 2);
  const usableHeight = Math.max(0, desktopSize.height - INITIAL_MARGIN * 2);
  const narrowLayout = usableWidth < definition.minimumSize.width;
  const width = narrowLayout
    ? usableWidth
    : Math.min(definition.idealSize.width, usableWidth);
  const height = narrowLayout
    ? usableHeight
    : Math.min(definition.idealSize.height, usableHeight);
  const centeredX = Math.max(
    INITIAL_MARGIN,
    Math.floor((desktopSize.width - width) / 2),
  );
  const centeredY = Math.max(
    INITIAL_MARGIN,
    Math.floor((desktopSize.height - height) / 2),
  );
  const lastX = Math.max(
    INITIAL_MARGIN,
    desktopSize.width - INITIAL_MARGIN - width,
  );
  const lastY = Math.max(
    INITIAL_MARGIN,
    desktopSize.height - INITIAL_MARGIN - height,
  );
  const cascadeSteps =
    Math.floor(
      Math.min(lastX - centeredX, lastY - centeredY) / CASCADE_OFFSET,
    ) + 1;
  const offset =
    (Math.max(0, cascadeIndex) % Math.max(1, cascadeSteps)) * CASCADE_OFFSET;

  return {
    x: centeredX + offset,
    y: centeredY + offset,
    width,
    height,
  };
}

export function clampBounds(bounds: Rect, desktopSize: DesktopSize): Rect {
  const width = Math.min(Math.max(0, bounds.width), desktopSize.width);
  const height = Math.min(Math.max(0, bounds.height), desktopSize.height);

  return {
    x: clamp(bounds.x, 0, desktopSize.width - width),
    y: clamp(bounds.y, 0, desktopSize.height - height),
    width,
    height,
  };
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(Math.max(value, minimum), Math.max(minimum, maximum));
}
