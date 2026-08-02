import { useEffect, useId, useReducer, useState } from "react";
import { photoStateReducer, type ViewerState } from "@/apps/photos/photo-state";
import { photos } from "@/content/photos";
import { XpButton } from "@/shared/XpButton";
import "@/apps/photos/photos.css";

export type PictureViewerProps = {
  initialSlug: string;
};

let activeViewerId: string | null = null;

export function PictureViewer({ initialSlug }: PictureViewerProps) {
  const viewerId = useId();
  const [state, dispatch] = useReducer(
    photoStateReducer,
    initialSlug,
    (slug): ViewerState => {
      const index = photos.findIndex((photo) => photo.slug === slug);
      return {
        index: index >= 0 ? index : 0,
        zoom: 100,
        rotation: 0,
        fitToWindow: true,
      };
    },
  );
  const [imageUnavailable, setImageUnavailable] = useState(false);
  const [sizeMode, setSizeMode] = useState<"fit" | "actual" | "zoom">("fit");
  const photo = photos[state.index] ?? photos[0];

  const navigate = (delta: -1 | 1) => {
    setImageUnavailable(false);
    dispatch({ type: "NAVIGATE", delta, length: photos.length });
  };

  useEffect(() => {
    activeViewerId = viewerId;

    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (activeViewerId !== viewerId) return;
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        navigate(-1);
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        navigate(1);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      if (activeViewerId === viewerId) activeViewerId = null;
    };
  }, [viewerId]);

  if (!photo) return null;

  const modeLabel =
    sizeMode === "fit"
      ? "Fit to window"
      : sizeMode === "actual"
        ? "Actual size"
        : `${state.zoom}%`;

  return (
    <section
      aria-label="Windows Picture and Fax Viewer"
      className="picture-viewer"
      onFocusCapture={() => {
        activeViewerId = viewerId;
      }}
      onPointerDownCapture={() => {
        activeViewerId = viewerId;
      }}
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
            setSizeMode("zoom");
            dispatch({ type: "ZOOM", delta: 1 });
          }}
        />
        <ViewerButton
          glyph="−"
          label="Zoom out"
          onClick={() => {
            setSizeMode("zoom");
            dispatch({ type: "ZOOM", delta: -1 });
          }}
        />
        <ViewerButton
          glyph="1:1"
          label="Actual size"
          onClick={() => {
            setSizeMode("actual");
            dispatch({ type: "ACTUAL_SIZE" });
          }}
        />
        <ViewerButton
          glyph="□"
          label="Fit to window"
          onClick={() => {
            setSizeMode("fit");
            dispatch({ type: "FIT_TO_WINDOW" });
          }}
        />
        <span aria-hidden="true" className="picture-viewer__separator" />
        <ViewerButton
          glyph="↶"
          label="Rotate counter-clockwise"
          onClick={() => dispatch({ type: "ROTATE", delta: -90 })}
        />
        <ViewerButton
          glyph="↷"
          label="Rotate clockwise"
          onClick={() => dispatch({ type: "ROTATE", delta: 90 })}
        />
      </nav>

      <div
        aria-label="Photo viewport"
        className={`picture-viewer__viewport ${
          state.fitToWindow
            ? "picture-viewer__viewport--fit"
            : "picture-viewer__viewport--actual"
        }`}
        data-fit-to-window={String(state.fitToWindow)}
      >
        {imageUnavailable ? (
          <div
            aria-label={`${photo.title} image unavailable`}
            className="picture-viewer__unavailable"
            role="img"
          >
            <span aria-hidden="true">×</span>
            <strong>Image unavailable</strong>
            <p>This picture could not be displayed.</p>
          </div>
        ) : (
          <img
            alt={photo.title}
            decoding="async"
            onError={() => setImageUnavailable(true)}
            src={photo.imageSrc}
            style={{
              aspectRatio: photo.aspectRatio,
              transform: `rotate(${state.rotation}deg) scale(${state.zoom / 100})`,
            }}
          />
        )}
      </div>

      <footer className="picture-viewer__information">
        <div className="picture-viewer__copy">
          <h1>{photo.title}</h1>
          <p>{photo.description}</p>
        </div>
        <div aria-live="polite" className="picture-viewer__status">
          <span>{state.index + 1} of {photos.length}</span>
          <span>{modeLabel}</span>
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
