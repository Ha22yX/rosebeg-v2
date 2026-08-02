import { contacts } from "@/content/contacts";
import { photos } from "@/content/photos";
import { projects } from "@/content/projects";

describe("portfolio content", () => {
  it("contains the approved nine project folders in order", () => {
    expect(projects.map(({ slug }) => slug)).toEqual([
      "auto-email-system",
      "bridge-us-v2",
      "mother-ship-docking-drone-system",
      "dxf-auto-shape-tool",
      "esp32-sound-radar",
      "sat-ai-tutor",
      "photoback",
      "dayvault",
      "gridopoly",
    ]);
  });

  it("contains 15 uniquely addressed V1 photographs", () => {
    expect(photos).toHaveLength(15);
    expect(new Set(photos.map(({ slug }) => slug)).size).toBe(15);
    expect(
      photos.every(
        ({ thumbnailSrc, imageSrc }) =>
          thumbnailSrc.startsWith("/assets/photos/") && imageSrc.startsWith("/assets/photos/"),
      ),
    ).toBe(true);
  });

  it("keeps only the four already-public contact channels", () => {
    expect(contacts.map(({ label }) => label)).toEqual(["GitHub", "WeChat", "Instagram", "Email"]);
  });
});
