import {
  useEffect,
  useId,
  useRef,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import { XpButton } from "@/shared/XpButton";
import { XpIcon } from "@/shared/XpIcon";
import type {
  DesktopSize,
  Rect,
  WindowDefinition,
  WindowInstance,
} from "@/windowing/types";

type ResizeDirection =
  | "north"
  | "northeast"
  | "east"
  | "southeast"
  | "south"
  | "southwest"
  | "west"
  | "northwest";

type PointerOperation = {
  pointerId: number;
  target: HTMLElement;
  startX: number;
  startY: number;
  startBounds: Rect;
  direction?: ResizeDirection;
};

type WindowFrameProps = {
  active: boolean;
  children: ReactNode;
  definition: WindowDefinition;
  desktopSize: DesktopSize;
  windowInstance: WindowInstance;
  onClose(): void;
  onFocus(): void;
  onMaximize(): void;
  onMinimize(): void;
  onMove(x: number, y: number): void;
  onResize(bounds: Rect): void;
  onRestore(): void;
};

const resizeDirections: ResizeDirection[] = [
  "north",
  "northeast",
  "east",
  "southeast",
  "south",
  "southwest",
  "west",
  "northwest",
];

export function WindowFrame({
  active,
  children,
  definition,
  desktopSize,
  windowInstance,
  onClose,
  onFocus,
  onMaximize,
  onMinimize,
  onMove,
  onResize,
  onRestore,
}: WindowFrameProps) {
  const titleId = useId();
  const pointerOperation = useRef<PointerOperation | null>(null);
  const { bounds, mode, title } = windowInstance;

  useEffect(
    () => () => {
      releaseOperation(pointerOperation.current);
      pointerOperation.current = null;
    },
    [],
  );

  const style: CSSProperties = {
    left: bounds.x,
    top: bounds.y,
    width: bounds.width,
    height: bounds.height,
    zIndex: windowInstance.zIndex,
  };

  const startPointerOperation = (
    event: ReactPointerEvent<HTMLElement>,
    direction?: ResizeDirection,
  ) => {
    if (mode !== "normal" || event.button !== 0) return;
    if (!direction && (event.target as HTMLElement).closest("button")) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    pointerOperation.current = {
      pointerId: event.pointerId,
      target: event.currentTarget,
      startX: event.clientX,
      startY: event.clientY,
      startBounds: bounds,
      direction,
    };
  };

  const continuePointerOperation = (
    event: ReactPointerEvent<HTMLElement>,
  ) => {
    const operation = pointerOperation.current;
    if (!operation || operation.pointerId !== event.pointerId) return;
    const deltaX = event.clientX - operation.startX;
    const deltaY = event.clientY - operation.startY;

    if (operation.direction) {
      onResize(
        resizeBounds(
          operation.startBounds,
          operation.direction,
          deltaX,
          deltaY,
          definition.minimumSize,
          desktopSize,
        ),
      );
      return;
    }

    onMove(
      operation.startBounds.x + deltaX,
      operation.startBounds.y + deltaY,
    );
  };

  const finishPointerOperation = (
    event: ReactPointerEvent<HTMLElement>,
  ) => {
    const operation = pointerOperation.current;
    if (!operation || operation.pointerId !== event.pointerId) return;
    releaseOperation(operation);
    pointerOperation.current = null;
  };

  const losePointerCapture = (event: ReactPointerEvent<HTMLElement>) => {
    if (pointerOperation.current?.pointerId === event.pointerId) {
      pointerOperation.current = null;
    }
  };

  const toggleMaximize = (event: ReactPointerEvent<HTMLElement>) => {
    if ((event.target as HTMLElement).closest("button")) return;
    if (mode === "maximized") onRestore();
    else onMaximize();
  };

  return (
    <section
      aria-labelledby={titleId}
      className={`xp-window xp-window--${mode}${active ? " is-active" : ""}`}
      onPointerDownCapture={onFocus}
      role="dialog"
      style={style}
    >
      <header
        aria-label={`Move ${title} window`}
        className="xp-window__title-bar"
        onDoubleClick={toggleMaximize}
        onLostPointerCapture={losePointerCapture}
        onPointerCancel={finishPointerOperation}
        onPointerDown={startPointerOperation}
        onPointerMove={continuePointerOperation}
        onPointerUp={finishPointerOperation}
      >
        <XpIcon alt="" className="xp-window__icon" src={windowInstance.icon} />
        <h2 className="xp-window__title" id={titleId}>
          {title}
        </h2>
        <div className="xp-window__controls">
          <XpButton
            aria-label={`Minimize ${title}`}
            className="xp-window__control"
            onClick={onMinimize}
            title="Minimize"
          >
            <span aria-hidden="true">—</span>
          </XpButton>
          <XpButton
            aria-label={`${mode === "maximized" ? "Restore" : "Maximize"} ${title}`}
            className="xp-window__control"
            onClick={mode === "maximized" ? onRestore : onMaximize}
            title={mode === "maximized" ? "Restore" : "Maximize"}
          >
            <span aria-hidden="true">{mode === "maximized" ? "❐" : "□"}</span>
          </XpButton>
          <XpButton
            aria-label={`Close ${title}`}
            className="xp-window__control xp-window__control--close"
            onClick={onClose}
            title="Close"
          >
            <span aria-hidden="true">×</span>
          </XpButton>
        </div>
      </header>
      <div className="xp-window__body">{children}</div>
      {mode === "normal"
        ? resizeDirections.map((direction) => (
            <span
              aria-hidden="true"
              className={`xp-window__resize xp-window__resize--${direction}`}
              key={direction}
              onLostPointerCapture={losePointerCapture}
              onPointerCancel={finishPointerOperation}
              onPointerDown={(event) => startPointerOperation(event, direction)}
              onPointerMove={continuePointerOperation}
              onPointerUp={finishPointerOperation}
            />
          ))
        : null}
    </section>
  );
}

function resizeBounds(
  start: Rect,
  direction: ResizeDirection,
  deltaX: number,
  deltaY: number,
  minimumSize: DesktopSize,
  desktopSize: DesktopSize,
): Rect {
  const minimumWidth =
    desktopSize.width < minimumSize.width
      ? Math.min(start.width, desktopSize.width)
      : minimumSize.width;
  const minimumHeight =
    desktopSize.height < minimumSize.height
      ? Math.min(start.height, desktopSize.height)
      : minimumSize.height;
  const right = start.x + start.width;
  const bottom = start.y + start.height;
  let { x, y, width, height } = start;

  if (direction.includes("east")) {
    width = clamp(start.width + deltaX, minimumWidth, desktopSize.width - x);
  }
  if (direction.includes("west")) {
    x = clamp(start.x + deltaX, 0, right - minimumWidth);
    width = right - x;
  }
  if (direction.includes("south")) {
    height = clamp(
      start.height + deltaY,
      minimumHeight,
      desktopSize.height - y,
    );
  }
  if (direction.includes("north")) {
    y = clamp(start.y + deltaY, 0, bottom - minimumHeight);
    height = bottom - y;
  }

  return { x, y, width, height };
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(Math.max(value, minimum), Math.max(minimum, maximum));
}

function releaseOperation(operation: PointerOperation | null): void {
  if (!operation) return;
  try {
    operation.target.releasePointerCapture(operation.pointerId);
  } catch {
    // Browsers throw when capture was already lost; cleanup is still complete.
  }
}
