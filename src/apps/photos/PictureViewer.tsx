import {
  useCallback,
  useLayoutEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type KeyboardEvent,
  type SyntheticEvent,
} from "react";
import {
  calculateFocus,
  calculatePhotoLayout,
  calculateScroll,
  type PhotoLayout,
  type Size,
} from "@/apps/photos/photo-geometry";
import {
  fitAxisForRotation,
  photoStateReducer,
  type ViewerState,
} from "@/apps/photos/photo-state";
import { photos } from "@/content/photos";
import { XpButton } from "@/shared/XpButton";
import "@/apps/photos/photos.css";

export type PictureViewerProps = {
  initialSlug: string;
};

type LoadedImage = Size & { slug: string };

type FocalPoint = { x: number; y: number };

const EMPTY_SIZE: Size = { width: 0, height: 0 };
const INITIAL_RESPONSIVE_IMAGE_WIDTH = 900;

export function PictureViewer({ initialSlug }: PictureViewerProps) {
  const [state, dispatch] = useReducer(
    photoStateReducer,
    initialSlug,
    (slug): ViewerState => {
      const index = photos.findIndex((photo) => photo.slug === slug);
      return {
        index: index >= 0 ? index : 0,
        zoom: 100,
        rotation: 0,
      };
    },
  );
  const [unavailableImageSrc, setUnavailableImageSrc] = useState<string | null>(
    null,
  );
  const [loadedImage, setLoadedImage] = useState<LoadedImage | null>(null);
  const [viewportSize, setViewportSize] = useState<Size>(EMPTY_SIZE);
  const viewportRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLElement>(null);
  const viewportSizeRef = useRef(viewportSize);
  const pendingFocalRef = useRef<FocalPoint | null>(null);
  const photo = photos[state.index] ?? photos[0];
  const activePhotoRef = useRef(photo);
  activePhotoRef.current = photo;
  const imageUnavailable = unavailableImageSrc === photo?.imageSrc;

  const naturalSize =
    loadedImage?.slug === photo?.slug ? loadedImage : EMPTY_SIZE;
  const layout = useMemo(
    () =>
      calculatePhotoLayout(
        naturalSize,
        viewportSize,
        state.rotation,
        state.zoom,
      ),
    [naturalSize, state.rotation, state.zoom, viewportSize],
  );
  const layoutRef = useRef<PhotoLayout>(layout);
  layoutRef.current = layout;
  viewportSizeRef.current = viewportSize;
  const responsiveImageSizes = `${Math.ceil(
    layout.image.width || viewportSize.width || INITIAL_RESPONSIVE_IMAGE_WIDTH,
  )}px`;
  const setCanvasRef = useCallback((element: HTMLElement | null) => {
    canvasRef.current = element;
  }, []);

  const captureViewportCenter = () => {
    const viewport = viewportRef.current;
    const canvas = canvasRef.current;
    const currentLayout = layoutRef.current;
    if (!viewport || !canvas || !currentLayout.canvas.width || !currentLayout.canvas.height) {
      pendingFocalRef.current ??= { x: 0.5, y: 0.5 };
      return;
    }

    const measuredViewport = viewportSizeRef.current;
    pendingFocalRef.current = {
      x: calculateFocus(
        viewport.scrollLeft,
        viewport.clientWidth || measuredViewport.width,
        canvas.offsetLeft,
        currentLayout.canvas.width,
      ),
      y: calculateFocus(
        viewport.scrollTop,
        viewport.clientHeight || measuredViewport.height,
        canvas.offsetTop,
        currentLayout.canvas.height,
      ),
    };
  };

  useLayoutEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries.find((candidate) => candidate.target === viewport);
      if (!entry) return;

      const nextSize = {
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      };
      const currentSize = viewportSizeRef.current;
      if (
        nextSize.width === currentSize.width &&
        nextSize.height === currentSize.height
      ) {
        return;
      }

      captureViewportCenter();
      viewportSizeRef.current = nextSize;
      setViewportSize(nextSize);
    });

    observer.observe(viewport);
    return () => observer.disconnect();
  }, []);

  useLayoutEffect(() => {
    const focus = pendingFocalRef.current;
    const viewport = viewportRef.current;
    const canvas = canvasRef.current;
    if (!focus || !viewport || !canvas || !layout.canvas.width || !layout.canvas.height) {
      return;
    }

    viewport.scrollLeft = calculateScroll(
      focus.x,
      viewport.clientWidth || viewportSize.width,
      canvas.offsetLeft,
      layout.canvas.width,
      layout.stage.width,
    );
    viewport.scrollTop = calculateScroll(
      focus.y,
      viewport.clientHeight || viewportSize.height,
      canvas.offsetTop,
      layout.canvas.height,
      layout.stage.height,
    );
    pendingFocalRef.current = null;
  }, [layout, viewportSize]);

  const navigate = (delta: -1 | 1) => {
    setUnavailableImageSrc(null);
    pendingFocalRef.current = { x: 0.5, y: 0.5 };
    dispatch({ type: "NAVIGATE", delta, length: photos.length });
  };

  if (!photo) return null;

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      navigate(-1);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      navigate(1);
    }
  };

  const dispatchWithFocus = (action: Parameters<typeof dispatch>[0]) => {
    captureViewportCenter();
    dispatch(action);
  };

  const handleImageLoad = (event: SyntheticEvent<HTMLImageElement>) => {
    const imageSrc = event.currentTarget.getAttribute("src");
    const activePhoto = activePhotoRef.current;
    if (!activePhoto || imageSrc !== activePhoto.imageSrc) return;

    const { naturalHeight, naturalWidth } = event.currentTarget;
    if (!naturalWidth || !naturalHeight) return;

    pendingFocalRef.current = { x: 0.5, y: 0.5 };
    setUnavailableImageSrc((failedSrc) =>
      failedSrc === activePhoto.imageSrc ? null : failedSrc,
    );
    setLoadedImage({
      slug: activePhoto.slug,
      width: naturalWidth,
      height: naturalHeight,
    });
  };

  const handleImageError = (event: SyntheticEvent<HTMLImageElement>) => {
    const failedSrc = event.currentTarget.getAttribute("src") ?? photo.imageSrc;
    if (activePhotoRef.current?.imageSrc === failedSrc) {
      pendingFocalRef.current = null;
    }
    setLoadedImage((currentImage) =>
      currentImage?.slug === photo.slug ? null : currentImage,
    );
    setUnavailableImageSrc(failedSrc);
  };

  return (
    <section
      aria-label="Windows Picture and Fax Viewer"
      className="picture-viewer"
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      <nav aria-label="Picture viewer controls" className="picture-viewer__toolbar">
        <ViewerButton
          glyph="‹"
          label="Previous photo"
          onClick={() => navigate(-1)}
        />
        <ViewerButton glyph="›" label="Next photo" onClick={() => navigate(1)} />
        <span aria-hidden="true" className="picture-viewer__separator" />
        <ViewerButton
          glyph="＋"
          label="Zoom in"
          onClick={() => {
            dispatchWithFocus({ type: "ZOOM", delta: 1 });
          }}
        />
        <ViewerButton
          glyph="−"
          label="Zoom out"
          onClick={() => {
            dispatchWithFocus({ type: "ZOOM", delta: -1 });
          }}
        />
        <ViewerButton
          glyph="□"
          label="Fit to window"
          onClick={() => {
            dispatchWithFocus({ type: "FIT_TO_WINDOW" });
          }}
        />
        <span aria-hidden="true" className="picture-viewer__separator" />
        <ViewerButton
          glyph="↶"
          label="Rotate counter-clockwise"
          onClick={() => dispatchWithFocus({ type: "ROTATE", delta: -90 })}
        />
        <ViewerButton
          glyph="↷"
          label="Rotate clockwise"
          onClick={() => dispatchWithFocus({ type: "ROTATE", delta: 90 })}
        />
      </nav>

      <div
        aria-label="Photo viewport"
        className="picture-viewer__viewport"
        data-zoom={state.zoom}
        ref={viewportRef}
      >
        <div
          className="picture-viewer__stage"
          style={{ height: layout.stage.height, width: layout.stage.width }}
        >
          {imageUnavailable ? (
            <div
              className="picture-viewer__canvas"
              ref={setCanvasRef}
              style={{ height: layout.canvas.height, width: layout.canvas.width }}
            >
              <div
                aria-label={`${photo.title} image unavailable`}
                className="picture-viewer__unavailable"
                role="img"
              >
                <span aria-hidden="true">×</span>
                <strong>Image unavailable</strong>
                <p>This picture could not be displayed.</p>
              </div>
            </div>
          ) : (
            <picture
              className="picture-viewer__canvas"
              key={photo.slug}
              ref={setCanvasRef}
              style={{ height: layout.canvas.height, width: layout.canvas.width }}
            >
              <source
                sizes={responsiveImageSizes}
                srcSet={photo.imageSrcSet}
                type="image/webp"
              />
              <img
                alt={photo.title}
                data-fit-axis={fitAxisForRotation(state.rotation)}
                decoding="async"
                height={photo.imageHeight}
                onError={handleImageError}
                onLoad={handleImageLoad}
                src={photo.imageSrc}
                style={{
                  height: layout.image.height,
                  transform: `rotate(${state.rotation}deg)`,
                  width: layout.image.width,
                }}
                width={photo.imageWidth}
              />
            </picture>
          )}
        </div>
      </div>

      <footer className="picture-viewer__information">
        <div className="picture-viewer__copy">
          <h1>{photo.title}</h1>
          <p>{photo.description}</p>
        </div>
        <div aria-live="polite" className="picture-viewer__status">
          <span>{state.index + 1} of {photos.length}</span>
          <span>{state.zoom}%</span>
        </div>
      </footer>
    </section>
  );
}

function ViewerButton({
  label,
  glyph,
  onClick,
}: {
  label: string;
  glyph: string;
  onClick(): void;
}) {
  return (
    <XpButton
      aria-label={label}
      className="picture-viewer__tool"
      onClick={onClick}
      title={label}
    >
      <span aria-hidden="true">{glyph}</span>
    </XpButton>
  );
}
