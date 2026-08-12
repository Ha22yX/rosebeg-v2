import { contacts } from "@/content/contacts";
import { photos } from "@/content/photos";
import { projects } from "@/content/projects";

describe("portfolio content", () => {
  it("contains the approved ten project folders in order", () => {
    expect(projects.map(({ slug }) => slug)).toEqual([
      "gridopoly",
      "onlypt-recruiting",
      "dayvault",
      "bridge-us-v2",
      "esp32-sound-radar",
      "mother-ship-docking-drone-system",
      "auto-email-system",
      "photoback",
      "sat-ai-tutor",
      "dxf-auto-shape-tool",
    ]);
  });

  it("keeps the personal origin stories and public links for the new work", () => {
    const dayVault = projects.find(({ slug }) => slug === "dayvault");
    const gridopoly = projects.find(({ slug }) => slug === "gridopoly");
    const onlyPt = projects.find(({ slug }) => slug === "onlypt-recruiting");

    expect(dayVault?.story).toContain("archive of my life");
    expect(dayVault?.story).toContain("language model");
    expect(gridopoly?.story).toContain("traveling with friends");
    expect(gridopoly?.story).toContain("drawing its circuit boards");
    expect(onlyPt?.sourceUrl).toBe("https://github.com/Ha22yX/onlypt-recruiting");
    expect(onlyPt?.websiteUrl).toBe("https://onlypt.co/");
    expect(onlyPt?.story).toContain("for free");
    expect(onlyPt?.story).toContain("more than a month");
  });

  it("contains 15 uniquely addressed V1 photographs", () => {
    expect(photos).toHaveLength(15);
    expect(new Set(photos.map(({ slug }) => slug)).size).toBe(15);
    expect(
      photos.every(
        ({
          thumbnailSrc,
          thumbnailFallbackSrc,
          thumbnailWidth,
          thumbnailHeight,
          imageSrc,
          imageSrcSet,
          imageWidth,
          imageHeight,
        }) =>
          thumbnailSrc.startsWith("/assets/photos/") &&
          thumbnailSrc.endsWith("-thumb.webp") &&
          thumbnailFallbackSrc.endsWith("-thumb.jpg") &&
          thumbnailWidth <= 320 &&
          thumbnailHeight <= 320 &&
          imageSrc.startsWith("/assets/photos/") &&
          imageSrc.endsWith("-large.jpg") &&
          imageSrcSet.includes("-1280.webp 1280w") &&
          imageSrcSet.includes("-large.webp") &&
          imageWidth >= 1280 &&
          imageHeight > 0,
      ),
    ).toBe(true);
  });

  it("keeps only the four already-public contact channels", () => {
    expect(contacts.map(({ label }) => label)).toEqual(["GitHub", "WeChat", "Instagram", "Email"]);
  });
});
