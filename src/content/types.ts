export type ProjectCategory = "software" | "robotics" | "electronics" | "creative-tool";

export type ProjectFile = {
  kind: "folder" | "file" | "shortcut";
  name: string;
  label?: string;
  href?: string;
};

export type Project = {
  slug: string;
  name: string;
  kicker: string;
  tagline: string;
  story: string;
  category: ProjectCategory;
  stack: readonly string[];
  sourceUrl: string;
  websiteUrl?: string;
  websiteLabel?: string;
  files: readonly ProjectFile[];
};

export type PhotoItem = {
  slug: string;
  title: string;
  description: string;
  thumbnailSrc: string;
  thumbnailFallbackSrc: string;
  thumbnailWidth: number;
  thumbnailHeight: number;
  imageSrc: string;
  imageSrcSet: string;
  imageSizes: string;
  imageWidth: number;
  imageHeight: number;
  aspectRatio: number;
};

export type ContactChannel = {
  label: "GitHub" | "WeChat" | "Instagram" | "Email";
  handle: string;
  href: string;
  description: string;
};
