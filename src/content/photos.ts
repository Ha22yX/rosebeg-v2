import type { PhotoItem } from "@/content/types";

type PhotoDefinition = {
  slug: string;
  title: string;
  description: string;
  assetStem: string;
  thumbnailWidth: number;
  thumbnailHeight: number;
  imageWidth: number;
  imageHeight: number;
};

const PHOTO_ASSET_DIRECTORY = "/assets/photos";
const FILMSTRIP_PREVIEW_SIZES = "720px";

function definePhoto({ assetStem, ...definition }: PhotoDefinition): PhotoItem {
  const responsiveWidths = [
    1280,
    ...(definition.imageWidth > 1920 ? [1920] : []),
    definition.imageWidth,
  ];

  return {
    ...definition,
    thumbnailSrc: `${PHOTO_ASSET_DIRECTORY}/${assetStem}-thumb.webp`,
    thumbnailFallbackSrc: `${PHOTO_ASSET_DIRECTORY}/${assetStem}-thumb.jpg`,
    imageSrc: `${PHOTO_ASSET_DIRECTORY}/${assetStem}-large.jpg`,
    imageSrcSet: responsiveWidths
      .map((width) => {
        const suffix = width === definition.imageWidth ? "large" : String(width);
        return `${PHOTO_ASSET_DIRECTORY}/${assetStem}-${suffix}.webp ${width}w`;
      })
      .join(", "),
    imageSizes: FILMSTRIP_PREVIEW_SIZES,
    aspectRatio: definition.imageWidth / definition.imageHeight,
  };
}

export const photos = [
  definePhoto({
    slug: "stone-gate",
    title: "Stone Gate",
    description: "A quiet threshold held in old masonry and winter light.",
    assetStem: "signal-plain",
    thumbnailWidth: 320,
    thumbnailHeight: 320,
    imageWidth: 2400,
    imageHeight: 1800,
  }),
  definePhoto({
    slug: "underline-skyline",
    title: "Underline Skyline",
    description: "A city cut by shadow, steel, and a distant tower.",
    assetStem: "violet-street",
    thumbnailWidth: 320,
    thumbnailHeight: 320,
    imageWidth: 2400,
    imageHeight: 1800,
  }),
  definePhoto({
    slug: "crosswalk-heat",
    title: "Crosswalk Heat",
    description: "Street geometry washed in red light and noon glare.",
    assetStem: "quiet-edge",
    thumbnailWidth: 320,
    thumbnailHeight: 320,
    imageWidth: 2400,
    imageHeight: 1800,
  }),
  definePhoto({
    slug: "library-drift",
    title: "Library Drift",
    description: "A soft corridor of books dissolving into focus.",
    assetStem: "night-current",
    thumbnailWidth: 320,
    thumbnailHeight: 320,
    imageWidth: 2400,
    imageHeight: 1173,
  }),
  definePhoto({
    slug: "harbor-weather",
    title: "Harbor Weather",
    description: "Blue air, water, and towers held in a clean horizon.",
    assetStem: "glass-weather",
    thumbnailWidth: 320,
    thumbnailHeight: 320,
    imageWidth: 2400,
    imageHeight: 1597,
  }),
  definePhoto({
    slug: "window-afterimage",
    title: "Window Afterimage",
    description: "The city reduced to panes, silhouettes, and late light.",
    assetStem: "afterimage",
    thumbnailWidth: 320,
    thumbnailHeight: 320,
    imageWidth: 1655,
    imageHeight: 2400,
  }),
  definePhoto({
    slug: "wall-feathers",
    title: "Wall Feathers",
    description: "A black wall bird turning masonry into motion.",
    assetStem: "mural-bird",
    thumbnailWidth: 320,
    thumbnailHeight: 240,
    imageWidth: 2200,
    imageHeight: 1650,
  }),
  definePhoto({
    slug: "cloud-needle",
    title: "Cloud Needle",
    description: "Glass towers held under fast blue weather.",
    assetStem: "skyline-cloud",
    thumbnailWidth: 240,
    thumbnailHeight: 320,
    imageWidth: 1650,
    imageHeight: 2200,
  }),
  definePhoto({
    slug: "avenue-signal",
    title: "Avenue Signal",
    description: "Warm traffic, vertical signs, and a tower cutting through.",
    assetStem: "avenue-signal",
    thumbnailWidth: 240,
    thumbnailHeight: 320,
    imageWidth: 1650,
    imageHeight: 2200,
  }),
  definePhoto({
    slug: "atrium-pulse",
    title: "Atrium Pulse",
    description: "A stained ceiling folding light into a radial frame.",
    assetStem: "glass-roof",
    thumbnailWidth: 320,
    thumbnailHeight: 240,
    imageWidth: 2200,
    imageHeight: 1650,
  }),
  definePhoto({
    slug: "amber-room",
    title: "Amber Room",
    description: "Quiet chairs and red window light inside a still library.",
    assetStem: "reading-room",
    thumbnailWidth: 320,
    thumbnailHeight: 240,
    imageWidth: 2200,
    imageHeight: 1650,
  }),
  definePhoto({
    slug: "white-cross",
    title: "White Cross",
    description: "Architecture reduced to edge, shadow, and negative space.",
    assetStem: "architectural-cross",
    thumbnailWidth: 320,
    thumbnailHeight: 240,
    imageWidth: 2200,
    imageHeight: 1650,
  }),
  definePhoto({
    slug: "grid-horizon",
    title: "Grid Horizon",
    description: "A skyline seen through the measured rhythm of glass.",
    assetStem: "window-grid",
    thumbnailWidth: 320,
    thumbnailHeight: 240,
    imageWidth: 2200,
    imageHeight: 1650,
  }),
  definePhoto({
    slug: "gold-recital",
    title: "Gold Recital",
    description: "Seasonal light, music, and a small crowd gathered in warmth.",
    assetStem: "holiday-stage",
    thumbnailWidth: 320,
    thumbnailHeight: 240,
    imageWidth: 2200,
    imageHeight: 1650,
  }),
  definePhoto({
    slug: "night-pavilion",
    title: "Night Pavilion",
    description: "A luminous frame glowing against the evening field.",
    assetStem: "night-pavilion",
    thumbnailWidth: 320,
    thumbnailHeight: 133,
    imageWidth: 2200,
    imageHeight: 911,
  }),
] satisfies readonly PhotoItem[];
