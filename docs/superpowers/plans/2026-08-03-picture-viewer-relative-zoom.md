# Picture Viewer Relative Zoom Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Fit to window the viewer's 100% zoom baseline, recompute that baseline with window size, zoom around the pre-zoom viewport center, and remove the 1:1 control.

**Architecture:** Replace intrinsic-pixel manual mode with a single relative zoom model. Pure geometry functions calculate fitted and rotated image dimensions; `PictureViewer` observes its viewport, renders an explicit scroll stage/canvas/image size, captures the normalized focal point before layout changes, and restores that point after the new layout commits.

**Tech Stack:** React 19, TypeScript 7, ResizeObserver, CSS, Vitest, Testing Library, Playwright

## Global Constraints

- `100%` means the current Fit to window size, not source-image pixels.
- Resizing the window recomputes the 100% base size while retaining the selected zoom percentage.
- Zoom in/out and Fit to window preserve the point previously at the viewport center.
- The Actual size / `1:1` button and mode are removed.
- Existing previous/next, rotation, failure fallback, multi-instance, and keyboard behavior remain unchanged.
- No new dependency is added.

---

### Task 1: Relative zoom state

**Files:**
- Modify: `src/apps/photos/photo-state.ts`
- Modify: `src/apps/photos/photo-state.test.ts`

**Interfaces:**
- Produces: `ViewerState { index: number; zoom: number; rotation: 0 | 90 | 180 | 270 }`
- Produces: `ViewerAction` with `NAVIGATE`, `ZOOM`, `FIT_TO_WINDOW`, and `ROTATE`; no `ACTUAL_SIZE`
- Produces: zoom steps interpreted relative to the fitted size

- [ ] **Step 1: Rewrite state tests for the relative model**

```ts
const initial: ViewerState = { index: 0, zoom: 100, rotation: 0 };
expect(photoStateReducer(initial, { type: "ZOOM", delta: 1 })).toEqual({
  ...initial,
  zoom: 125,
});
expect(photoStateReducer(initial, { type: "ZOOM", delta: -1 })).toEqual({
  ...initial,
  zoom: 75,
});
expect(
  photoStateReducer({ ...initial, zoom: 300 }, { type: "FIT_TO_WINDOW" }),
).toEqual(initial);
```

Assert that `ViewerAction` no longer accepts `ACTUAL_SIZE` by removing all uses and allowing TypeScript to enforce the union.

- [ ] **Step 2: Run and verify RED**

Run: `npm test -- src/apps/photos/photo-state.test.ts`

Expected: FAIL because the current state retains `fitToWindow`, treats zoom-out from fitted 100 incorrectly through mode state, and exposes `ACTUAL_SIZE`.

- [ ] **Step 3: Implement the minimal reducer**

Use zoom steps `[25, 50, 75, 100, 125, 150, 200, 300, 400]`, remove `fitToWindow`, delete `ACTUAL_SIZE`, and make `FIT_TO_WINDOW` set only `zoom: 100`.

- [ ] **Step 4: Verify GREEN and commit**

Run: `npm test -- src/apps/photos/photo-state.test.ts`

```bash
git add src/apps/photos/photo-state.ts src/apps/photos/photo-state.test.ts
git commit -m "refactor: define viewer zoom relative to fitted size"
```

### Task 2: Deterministic fitted geometry and focal-point math

**Files:**
- Create: `src/apps/photos/photo-geometry.ts`
- Create: `src/apps/photos/photo-geometry.test.ts`

**Interfaces:**
- Produces: `Size { width: number; height: number }`
- Produces: `PhotoLayout { image: Size; canvas: Size; stage: Size }`
- Produces: `calculatePhotoLayout(natural: Size, viewport: Size, rotation: ViewerState["rotation"], zoom: number, gutter?: number): PhotoLayout`
- Produces: `calculateFocus(scroll: number, viewportExtent: number, canvasOffset: number, canvasExtent: number): number`
- Produces: `calculateScroll(focus: number, viewportExtent: number, canvasOffset: number, canvasExtent: number, stageExtent: number): number`

- [ ] **Step 1: Write failing geometry tests**

Cover landscape fit, 90-degree rotation, 125% relative zoom, normalized center capture, and clamped scroll restoration.

```ts
expect(
  calculatePhotoLayout(
    { width: 1600, height: 900 },
    { width: 800, height: 600 },
    0,
    100,
    14,
  ).canvas,
).toEqual({ width: 772, height: 434.25 });

expect(calculateFocus(250, 500, 50, 1000)).toBeCloseTo(0.45);
expect(calculateScroll(0.45, 500, 50, 1250, 1278)).toBeCloseTo(362.5);
```

- [ ] **Step 2: Run and verify RED**

Run: `npm test -- src/apps/photos/photo-geometry.test.ts`

Expected: FAIL because the module does not exist.

- [ ] **Step 3: Implement pure layout functions**

Calculate available width/height as the viewport minus twice the gutter. Swap natural extents for quarter turns when choosing the fit scale. Return unrotated image dimensions, rotated canvas dimensions, and a stage that is at least the viewport size and otherwise canvas plus gutters. Clamp focus to `[0, 1]` and scroll to `[0, stageExtent - viewportExtent]`.

- [ ] **Step 4: Verify GREEN and commit**

Run: `npm test -- src/apps/photos/photo-geometry.test.ts`

```bash
git add src/apps/photos/photo-geometry.ts src/apps/photos/photo-geometry.test.ts
git commit -m "feat: add fitted photo zoom geometry"
```

### Task 3: Resize-aware centered viewer rendering

**Files:**
- Modify: `src/apps/photos/PictureViewer.tsx`
- Modify: `src/apps/photos/photos.css`
- Modify: `src/test/setup.ts`
- Test: `src/apps/photos/PictureViewer.test.tsx`

**Interfaces:**
- Consumes: `calculatePhotoLayout`, `calculateFocus`, `calculateScroll`
- Produces: viewport `data-zoom`, a `.picture-viewer__stage`, and `.picture-viewer__canvas`

- [ ] **Step 1: Add failing component tests**

Provide a controllable `ResizeObserver` test double in `src/test/setup.ts`. Test that:

- initial status is `100%`;
- Zoom in yields `125%` without an Actual size button;
- Zoom out from the initial state yields `75%`;
- Fit to window returns to `100%`;
- observer-driven viewport resizing changes explicit fitted image width/height while leaving the displayed percentage unchanged;
- zoom changes `scrollLeft`/`scrollTop` so the old center focal point remains centered.

```tsx
expect(screen.queryByRole("button", { name: "Actual size" })).not.toBeInTheDocument();
expect(viewport).toHaveAttribute("data-zoom", "100");
await user.click(screen.getByRole("button", { name: "Zoom in" }));
expect(viewport).toHaveAttribute("data-zoom", "125");
```

- [ ] **Step 2: Run and verify RED**

Run: `npm test -- src/apps/photos/PictureViewer.test.tsx`

Expected: FAIL because the 1:1 control still exists, layout uses intrinsic pixels, and no observer/focal restoration exists.

- [ ] **Step 3: Implement measured relative rendering**

In `PictureViewer`:

1. Store refs for viewport and canvas.
2. Store natural image size from `onLoad`.
3. Observe viewport dimensions with `ResizeObserver`.
4. Before zoom, fit, rotation, or observer resize, capture normalized X/Y focus from the current canvas.
5. Calculate the next `PhotoLayout` and apply explicit stage, canvas, and image dimensions.
6. In `useLayoutEffect`, restore `scrollLeft` and `scrollTop` from the saved focus.
7. Remove `sizeMode`, the Actual size button, and intrinsic-mode CSS.

Render the measured hierarchy:

```tsx
<div ref={viewportRef} className="picture-viewer__viewport" data-zoom={state.zoom}>
  <div className="picture-viewer__stage" style={{ width: layout.stage.width, height: layout.stage.height }}>
    <div ref={canvasRef} className="picture-viewer__canvas" style={{ width: layout.canvas.width, height: layout.canvas.height }}>
      <img
        style={{
          width: layout.image.width,
          height: layout.image.height,
          transform: `rotate(${state.rotation}deg)`,
        }}
      />
    </div>
  </div>
</div>
```

The stage uses grid centering; the canvas represents the rotated bounding box; the image is centered in the canvas. Transforms rotate only and never supply zoom.

- [ ] **Step 4: Verify component and state suites**

Run: `npm test -- src/apps/photos/photo-state.test.ts src/apps/photos/photo-geometry.test.ts src/apps/photos/PictureViewer.test.tsx`

Expected: PASS, including multi-instance, keyboard, rotation, and unavailable-image tests.

- [ ] **Step 5: Commit**

```bash
git add src/apps/photos/PictureViewer.tsx src/apps/photos/photos.css src/apps/photos/PictureViewer.test.tsx src/test/setup.ts
git commit -m "fix: center relative photo zoom on fitted size"
```

### Task 4: Browser regression and visual verification

**Files:**
- Modify: `tests/e2e/apps.spec.ts`
- Modify: `tests/e2e/visual.spec.ts-snapshots/*viewer*.png`

**Interfaces:**
- Consumes: the relative zoom DOM/status contract from Task 3
- Produces: end-to-end coverage for resize synchronization and center preservation

- [ ] **Step 1: Add browser assertions**

Open a viewer, record the image/canvas dimensions and viewport center, click Zoom in, assert `125%`, assert no Actual size button, and verify the image point at the old viewport center remains within one CSS pixel of the new viewport center. Resize the containing window and assert the 100% fitted dimensions change when Fit to window is restored.

- [ ] **Step 2: Run and verify the focused E2E test**

Run: `npm run test:e2e -- tests/e2e/apps.spec.ts`

Expected: PASS in Chromium.

- [ ] **Step 3: Update and inspect viewer snapshots**

Run: `npm run test:visual -- --update-snapshots`

Inspect desktop, standard, and mobile viewer screenshots. Confirm the photo starts centered, no 1:1 control remains, and the toolbar does not wrap or clip.

- [ ] **Step 4: Run full verification and commit**

Run: `npm test && npm run check && npm run build && npm run test:e2e && npm run test:visual`

Expected: all unit/component tests, TypeScript, production build, E2E tests, and visual comparisons pass.

```bash
git add tests/e2e/apps.spec.ts tests/e2e/visual.spec.ts-snapshots
git commit -m "test: cover fitted centered picture zoom"
```

