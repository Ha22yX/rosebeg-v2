import { chromium } from "@playwright/test";
import { readdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const photoDirectory = path.join(rootDirectory, "public", "assets", "photos");
const thumbnailMaximumEdge = 320;
const thumbnailQuality = 0.76;
const viewerWidths = [1280, 1920];
const viewerQuality = 0.82;

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

try {
  const entries = (await readdir(photoDirectory))
    .filter((fileName) => fileName.endsWith("-large.jpg"))
    .sort();

  const manifest = [];

  for (const largeFileName of entries) {
    const stem = largeFileName.slice(0, -"-large.jpg".length);
    const thumbnailFileName = `${stem}-thumb.jpg`;
    const largeInput = path.join(photoDirectory, largeFileName);
    const thumbnailInput = path.join(photoDirectory, thumbnailFileName);

    const thumbnail = await encodeWebp(thumbnailInput, {
      maximumEdge: thumbnailMaximumEdge,
      quality: thumbnailQuality,
    });
    const thumbnailOutput = path.join(photoDirectory, `${stem}-thumb.webp`);
    await writeFile(thumbnailOutput, thumbnail.buffer);

    const original = await inspectImage(largeInput);
    const candidates = [];

    for (const width of viewerWidths) {
      if (width >= original.width) continue;

      const candidate = await encodeWebp(largeInput, {
        maximumWidth: width,
        quality: viewerQuality,
      });
      const candidateFileName = `${stem}-${width}.webp`;
      await writeFile(path.join(photoDirectory, candidateFileName), candidate.buffer);
      candidates.push({ fileName: candidateFileName, width: candidate.width });
    }

    const full = await encodeWebp(largeInput, { quality: viewerQuality });
    const fullFileName = `${stem}-large.webp`;
    await writeFile(path.join(photoDirectory, fullFileName), full.buffer);
    candidates.push({ fileName: fullFileName, width: full.width });

    manifest.push({
      stem,
      thumbnail: {
        fileName: `${stem}-thumb.webp`,
        width: thumbnail.width,
        height: thumbnail.height,
        bytes: (await stat(thumbnailOutput)).size,
      },
      original,
      candidates,
    });
  }

  process.stdout.write(`${JSON.stringify(manifest, null, 2)}\n`);
} finally {
  await browser.close();
}

async function inspectImage(filePath) {
  return evaluateImage(filePath, { inspectOnly: true });
}

async function encodeWebp(filePath, options) {
  const result = await evaluateImage(filePath, options);
  return {
    ...result,
    buffer: Buffer.from(result.base64, "base64"),
  };
}

async function evaluateImage(filePath, options) {
  const mimeType = path.extname(filePath).toLowerCase() === ".png" ? "image/png" : "image/jpeg";
  const source = `data:${mimeType};base64,${(await readFile(filePath)).toString("base64")}`;

  return page.evaluate(
    async ({ sourceUrl, imageOptions }) => {
      const image = new Image();
      image.src = sourceUrl;
      await image.decode();

      const sourceWidth = image.naturalWidth;
      const sourceHeight = image.naturalHeight;
      if (imageOptions.inspectOnly) {
        return { width: sourceWidth, height: sourceHeight };
      }

      const widthScale = imageOptions.maximumWidth
        ? imageOptions.maximumWidth / sourceWidth
        : 1;
      const edgeScale = imageOptions.maximumEdge
        ? imageOptions.maximumEdge / Math.max(sourceWidth, sourceHeight)
        : 1;
      const scale = Math.min(1, widthScale, edgeScale);
      const width = Math.max(1, Math.round(sourceWidth * scale));
      const height = Math.max(1, Math.round(sourceHeight * scale));
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const context = canvas.getContext("2d", { alpha: false });
      if (!context) throw new Error("Canvas 2D context is unavailable.");
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = "high";
      context.drawImage(image, 0, 0, width, height);

      const dataUrl = canvas.toDataURL("image/webp", imageOptions.quality ?? 0.82);
      return {
        width,
        height,
        base64: dataUrl.slice(dataUrl.indexOf(",") + 1),
      };
    },
    { sourceUrl: source, imageOptions: options },
  );
}
