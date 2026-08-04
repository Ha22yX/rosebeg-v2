import { useState } from "react";
import { photos } from "@/content/photos";
import type { PhotoItem } from "@/content/types";
import type { PictureBrowserView } from "@/apps/photos/photo-state";
import { XpButton } from "@/shared/XpButton";
import "@/apps/photos/photos.css";

export type PicturesBrowserProps = {
  onOpenPhoto(slug: string): void;
};

const views: ReadonlyArray<{
  value: PictureBrowserView;
  label: string;
  glyph: string;
}> = [
  { value: "thumbnails", label: "Thumbnails view", glyph: "▦" },
  { value: "filmstrip", label: "Filmstrip view", glyph: "▣" },
  { value: "list", label: "List view", glyph: "☷" },
];

export function PicturesBrowser({ onOpenPhoto }: PicturesBrowserProps) {
  const [view, setView] = useState<PictureBrowserView>("thumbnails");
  const [selectedSlug, setSelectedSlug] = useState(photos[0]?.slug ?? "");
  const [failedSources, setFailedSources] = useState<ReadonlySet<string>>(
    () => new Set(),
  );
  const selectedPhoto =
    photos.find((photo) => photo.slug === selectedSlug) ?? photos[0];

  const markUnavailable = (src: string) => {
    setFailedSources((current) => {
      const next = new Set(current);
      next.add(src);
      return next;
    });
  };

  return (
    <section aria-label="My Pictures" className="pictures-browser">
      <nav aria-label="Picture Explorer toolbar" className="pictures-browser__toolbar">
        <XpButton className="pictures-browser__toolbar-button" disabled>
          <span aria-hidden="true">←</span>
          Back
        </XpButton>
        <XpButton className="pictures-browser__toolbar-button" disabled>
          <span aria-hidden="true">→</span>
          Forward
        </XpButton>
        <span aria-hidden="true" className="pictures-browser__separator" />
        <XpButton className="pictures-browser__toolbar-button" disabled>
          <span aria-hidden="true">⌕</span>
          Search
        </XpButton>
        <XpButton
          aria-pressed="true"
          className="pictures-browser__toolbar-button"
          disabled
        >
          <span aria-hidden="true">▤</span>
          Folders
        </XpButton>
        <span className="pictures-browser__toolbar-spacer" />
        <div aria-label="Picture views" className="pictures-browser__view-controls" role="group">
          {views.map((choice) => (
            <XpButton
              aria-label={choice.label}
              aria-pressed={view === choice.value}
              className="pictures-browser__view-button"
              key={choice.value}
              onClick={() => setView(choice.value)}
              title={choice.label}
            >
              <span aria-hidden="true">{choice.glyph}</span>
            </XpButton>
          ))}
        </div>
      </nav>

      <div className="pictures-browser__address-row">
        <span>Address</span>
        <span aria-hidden="true" className="pictures-browser__address-icon">▧</span>
        <span className="pictures-browser__address">C:\My Pictures</span>
        <span aria-hidden="true" className="pictures-browser__go">→</span>
      </div>

      <div className="pictures-browser__workspace">
        <PictureTasks selectedPhoto={selectedPhoto} />
        <main className="pictures-browser__content">
          {view === "filmstrip" && selectedPhoto ? (
            <FilmstripPreview
              failed={failedSources.has(selectedPhoto.imageSrc)}
              onError={() => markUnavailable(selectedPhoto.imageSrc)}
              photo={selectedPhoto}
            />
          ) : null}

          <PhotoCollection
            failedSources={failedSources}
            onError={markUnavailable}
            onOpenPhoto={onOpenPhoto}
            onSelect={setSelectedSlug}
            selectedSlug={selectedSlug}
            view={view}
          />
        </main>
      </div>

      <footer className="pictures-browser__status" role="status">
        <span>{photos.length} objects</span>
        <span className="pictures-browser__status-fill" />
        <span>{selectedPhoto ? `1 object selected: ${selectedPhoto.title}` : "My Pictures"}</span>
      </footer>
    </section>
  );
}

function PictureTasks({ selectedPhoto }: { selectedPhoto: PhotoItem | undefined }) {
  return (
    <aside aria-label="Picture tasks" className="pictures-browser__task-pane">
      <TaskGroup title="Picture Tasks">
        <DisabledAction>View as a slide show</DisabledAction>
        <DisabledAction>Order prints online</DisabledAction>
        <DisabledAction>Print this picture</DisabledAction>
      </TaskGroup>
      <TaskGroup title="Other Places">
        <DisabledAction>My Documents</DisabledAction>
        <DisabledAction>Shared Pictures</DisabledAction>
        <DisabledAction>Desktop</DisabledAction>
      </TaskGroup>
      <TaskGroup title="Details">
        {selectedPhoto ? (
          <>
            <strong>{selectedPhoto.title}</strong>
            <p>JPEG image</p>
            <p>{formatAspectRatio(selectedPhoto.aspectRatio)} photograph</p>
          </>
        ) : (
          <p>{photos.length} pictures</p>
        )}
      </TaskGroup>
    </aside>
  );
}

function DisabledAction({ children }: { children: React.ReactNode }) {
  return (
    <span
      aria-disabled="true"
      className="pictures-browser__disabled-action"
      title="Unavailable in this version"
    >
      {children}
    </span>
  );
}

function TaskGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="pictures-browser__task-group">
      <h2>{title}</h2>
      <div className="pictures-browser__task-body">{children}</div>
    </section>
  );
}

type PhotoCollectionProps = {
  view: PictureBrowserView;
  selectedSlug: string;
  failedSources: ReadonlySet<string>;
  onSelect(slug: string): void;
  onOpenPhoto(slug: string): void;
  onError(src: string): void;
};

function PhotoCollection({
  view,
  selectedSlug,
  failedSources,
  onSelect,
  onOpenPhoto,
  onError,
}: PhotoCollectionProps) {
  if (view === "list") {
    return (
      <div aria-label="Pictures" className="pictures-browser__list" role="table">
        <div className="pictures-browser__list-header" role="row">
          <span role="columnheader">Name</span>
          <span role="columnheader">Type</span>
          <span role="columnheader">Dimensions</span>
        </div>
        {photos.map((photo) => (
          <div className="pictures-browser__list-row" key={photo.slug} role="row">
            <span role="cell">
              <PhotoButton
                failed={failedSources.has(photo.thumbnailSrc)}
                onError={() => onError(photo.thumbnailSrc)}
                onOpenPhoto={onOpenPhoto}
                onSelect={onSelect}
                photo={photo}
                selected={selectedSlug === photo.slug}
                view={view}
              />
            </span>
            <span role="cell">JPEG image</span>
            <span role="cell">{formatAspectRatio(photo.aspectRatio)}</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div
      aria-label="Pictures"
      className={`pictures-browser__photos pictures-browser__photos--${view}`}
    >
      {photos.map((photo) => (
        <PhotoButton
          failed={failedSources.has(photo.thumbnailSrc)}
          key={photo.slug}
          onError={() => onError(photo.thumbnailSrc)}
          onOpenPhoto={onOpenPhoto}
          onSelect={onSelect}
          photo={photo}
          selected={selectedSlug === photo.slug}
          view={view}
        />
      ))}
    </div>
  );
}

type PhotoButtonProps = {
  photo: PhotoItem;
  view: PictureBrowserView;
  selected: boolean;
  failed: boolean;
  onSelect(slug: string): void;
  onOpenPhoto(slug: string): void;
  onError(): void;
};

function PhotoButton({
  photo,
  view,
  selected,
  failed,
  onSelect,
  onOpenPhoto,
  onError,
}: PhotoButtonProps) {
  return (
    <button
      aria-label={`${photo.title} photo`}
      aria-pressed={selected}
      className={`pictures-browser__photo pictures-browser__photo--${view}`}
      onClick={(event) => {
        if (event.detail === 0) {
          onOpenPhoto(photo.slug);
        } else {
          onSelect(photo.slug);
        }
      }}
      onDoubleClick={() => onOpenPhoto(photo.slug)}
      type="button"
    >
      <PhotoImage
        fetchPriority={selected ? "high" : undefined}
        failed={failed}
        height={photo.thumbnailHeight}
        loading={selected ? "eager" : "lazy"}
        onError={onError}
        photo={photo}
        src={photo.thumbnailFallbackSrc}
        srcSet={photo.thumbnailSrc}
        width={photo.thumbnailWidth}
      />
      <span className="pictures-browser__photo-copy">
        <strong>{photo.title}</strong>
        {view === "filmstrip" ? <small>JPEG image</small> : null}
      </span>
    </button>
  );
}

function FilmstripPreview({
  photo,
  failed,
  onError,
}: {
  photo: PhotoItem;
  failed: boolean;
  onError(): void;
}) {
  return (
    <section aria-label="Selected picture preview" className="pictures-browser__preview">
      <div className="pictures-browser__preview-image">
        <PhotoImage
          fetchPriority="high"
          failed={failed}
          height={photo.imageHeight}
          loading="eager"
          onError={onError}
          photo={photo}
          sizes={photo.imageSizes}
          src={photo.imageSrc}
          srcSet={photo.imageSrcSet}
          width={photo.imageWidth}
        />
      </div>
      <div className="pictures-browser__preview-copy">
        <h1>{photo.title}</h1>
        <p>{photo.description}</p>
      </div>
    </section>
  );
}

function PhotoImage({
  photo,
  src,
  failed,
  onError,
  loading,
  fetchPriority,
  height,
  sizes,
  srcSet,
  width,
}: {
  photo: PhotoItem;
  src: string;
  failed: boolean;
  onError(): void;
  loading: "eager" | "lazy";
  fetchPriority?: "high" | "low" | "auto";
  height?: number;
  sizes?: string;
  srcSet?: string;
  width?: number;
}) {
  if (failed) {
    return (
      <span
        aria-label={`${photo.title} image unavailable`}
        className="pictures-browser__unavailable"
        role="img"
      >
        <span aria-hidden="true">×</span>
        Image unavailable
      </span>
    );
  }

  return (
    <picture className="pictures-browser__picture">
      {srcSet ? <source sizes={sizes} srcSet={srcSet} type="image/webp" /> : null}
      <img
        alt={photo.title}
        decoding="async"
        fetchPriority={fetchPriority}
        height={height}
        loading={loading}
        onError={onError}
        src={src}
        style={{ aspectRatio: photo.aspectRatio }}
        width={width}
      />
    </picture>
  );
}

function formatAspectRatio(aspectRatio: number): string {
  return aspectRatio >= 1 ? "Landscape" : "Portrait";
}
