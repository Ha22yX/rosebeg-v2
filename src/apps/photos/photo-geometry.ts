import type { ViewerState } from "@/apps/photos/photo-state";

export type Size = { width: number; height: number };

export type PhotoLayout = { image: Size; canvas: Size; stage: Size };

const DEFAULT_GUTTER = 14;

function nonNegative(value: number): number {
  return Number.isFinite(value) && value > 0 ? value : 0;
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

export function calculatePhotoLayout(
  natural: Size,
  viewport: Size,
  rotation: ViewerState["rotation"],
  zoom: number,
  gutter = DEFAULT_GUTTER,
): PhotoLayout {
  const viewportWidth = nonNegative(viewport.width);
  const viewportHeight = nonNegative(viewport.height);
  const gutterSize = nonNegative(gutter);
  const naturalWidth = nonNegative(natural.width);
  const naturalHeight = nonNegative(natural.height);
  const zoomScale = nonNegative(zoom) / 100;

  if (!naturalWidth || !naturalHeight || !zoomScale) {
    const stage = { width: viewportWidth, height: viewportHeight };
    return { image: { width: 0, height: 0 }, canvas: { width: 0, height: 0 }, stage };
  }

  const quarterTurn = rotation === 90 || rotation === 270;
  const fitWidth = quarterTurn ? naturalHeight : naturalWidth;
  const fitHeight = quarterTurn ? naturalWidth : naturalHeight;
  const availableWidth = Math.max(0, viewportWidth - gutterSize * 2);
  const availableHeight = Math.max(0, viewportHeight - gutterSize * 2);
  const fitScale = Math.min(availableWidth / fitWidth, availableHeight / fitHeight);

  if (!Number.isFinite(fitScale) || fitScale <= 0) {
    const stage = { width: viewportWidth, height: viewportHeight };
    return { image: { width: 0, height: 0 }, canvas: { width: 0, height: 0 }, stage };
  }

  const image = {
    width: naturalWidth * fitScale * zoomScale,
    height: naturalHeight * fitScale * zoomScale,
  };
  const canvas = quarterTurn
    ? { width: image.height, height: image.width }
    : { ...image };
  const stage = {
    width: Math.max(viewportWidth, canvas.width + gutterSize * 2),
    height: Math.max(viewportHeight, canvas.height + gutterSize * 2),
  };

  return { image, canvas, stage };
}

export function calculateFocus(
  scroll: number,
  viewportExtent: number,
  canvasOffset: number,
  canvasExtent: number,
): number {
  const extent = nonNegative(canvasExtent);
  if (!extent) return 0;

  const safeScroll = nonNegative(scroll);
  const safeViewport = nonNegative(viewportExtent);
  const safeOffset = Number.isFinite(canvasOffset) ? canvasOffset : 0;
  return clamp((safeScroll + safeViewport / 2 - safeOffset) / extent, 0, 1);
}

export function calculateScroll(
  focus: number,
  viewportExtent: number,
  canvasOffset: number,
  canvasExtent: number,
  stageExtent: number,
): number {
  const safeViewport = nonNegative(viewportExtent);
  const safeCanvasExtent = nonNegative(canvasExtent);
  const safeStageExtent = nonNegative(stageExtent);
  const maximumScroll = Math.max(0, safeStageExtent - safeViewport);
  if (!safeCanvasExtent || !maximumScroll) return 0;

  const safeFocus = clamp(Number.isFinite(focus) ? focus : 0, 0, 1);
  const safeOffset = Number.isFinite(canvasOffset) ? canvasOffset : 0;
  const desiredScroll = safeOffset + safeFocus * safeCanvasExtent - safeViewport / 2;
  return clamp(Number.isFinite(desiredScroll) ? desiredScroll : 0, 0, maximumScroll);
}
