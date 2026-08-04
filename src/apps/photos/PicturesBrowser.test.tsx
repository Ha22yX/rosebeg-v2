import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PicturesBrowser } from "@/apps/photos/PicturesBrowser";
import { photos } from "@/content/photos";

describe("PicturesBrowser", () => {
  it("browses all photographs and opens the selected photo independently", async () => {
    const user = userEvent.setup();
    const onOpenPhoto = vi.fn();
    render(<PicturesBrowser onOpenPhoto={onOpenPhoto} />);

    expect(screen.getAllByRole("button", { name: /photo$/i })).toHaveLength(15);
    expect(screen.getByText("15 objects")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Filmstrip view" }));
    expect(screen.getByRole("button", { name: "Filmstrip view" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await user.click(screen.getByRole("button", { name: "Stone Gate photo" }));
    expect(
      screen.getByText("A quiet threshold held in old masonry and winter light."),
    ).toBeInTheDocument();

    await user.dblClick(screen.getByRole("button", { name: "Stone Gate photo" }));
    expect(onOpenPhoto).toHaveBeenCalledWith("stone-gate");
  });

  it("prioritizes only the selected optimized thumbnail and declares intrinsic dimensions", async () => {
    const user = userEvent.setup();
    render(<PicturesBrowser onOpenPhoto={vi.fn()} />);

    const stonePhoto = photos[0]!;
    const underlinePhoto = photos[1]!;
    const stoneButton = screen.getByRole("button", { name: "Stone Gate photo" });
    const stoneImage = within(stoneButton).getByRole("img", { name: "Stone Gate" });
    const stoneWebpSource = stoneButton.querySelector('source[type="image/webp"]');
    const underlineImage = within(
      screen.getByRole("button", { name: "Underline Skyline photo" }),
    ).getByRole("img", { name: "Underline Skyline" });

    expect(stoneWebpSource).toHaveAttribute("srcset", stonePhoto.thumbnailSrc);
    expect(stoneImage).toHaveAttribute("src", stonePhoto.thumbnailFallbackSrc);
    expect(stoneImage).toHaveAttribute("src", expect.stringMatching(/\.jpg$/));
    expect(stoneImage).toHaveAttribute("loading", "eager");
    expect(stoneImage).toHaveAttribute("fetchpriority", "high");
    expect(stoneImage).toHaveAttribute("decoding", "async");
    expect(stoneImage).toHaveAttribute("width", String(stonePhoto.thumbnailWidth));
    expect(stoneImage).toHaveAttribute("height", String(stonePhoto.thumbnailHeight));

    expect(underlineImage).toHaveAttribute("loading", "lazy");
    expect(underlineImage).not.toHaveAttribute("fetchpriority");
    expect(underlineImage).toHaveAttribute("width", String(underlinePhoto.thumbnailWidth));
    expect(underlineImage).toHaveAttribute("height", String(underlinePhoto.thumbnailHeight));

    await user.click(screen.getByRole("button", { name: "Underline Skyline photo" }));

    expect(underlineImage).toHaveAttribute("loading", "eager");
    expect(underlineImage).toHaveAttribute("fetchpriority", "high");
    expect(stoneImage).toHaveAttribute("loading", "lazy");
    expect(stoneImage).not.toHaveAttribute("fetchpriority");
  });

  it("keeps the filmstrip preview eager with responsive sources and a JPEG fallback", async () => {
    const user = userEvent.setup();
    render(<PicturesBrowser onOpenPhoto={vi.fn()} />);
    const photo = photos[0]!;

    await user.click(screen.getByRole("button", { name: "Filmstrip view" }));

    const preview = screen.getByRole("region", {
      name: "Selected picture preview",
    });
    const previewImage = within(preview).getByRole("img", { name: "Stone Gate" });
    const previewWebpSource = preview.querySelector('source[type="image/webp"]');
    if (!photo.imageSrcSet || !photo.imageSizes) {
      throw new Error("The selected photo is missing responsive preview metadata");
    }

    expect(previewImage).toHaveAttribute("src", photo.imageSrc);
    expect(previewImage).toHaveAttribute("src", expect.stringMatching(/\.jpg$/));
    expect(previewWebpSource).toHaveAttribute("srcset", photo.imageSrcSet);
    expect(previewWebpSource).toHaveAttribute("sizes", photo.imageSizes);
    expect(previewImage).toHaveAttribute("loading", "eager");
    expect(previewImage).toHaveAttribute("fetchpriority", "high");
    expect(previewImage).toHaveAttribute("decoding", "async");
    expect(previewImage).toHaveAttribute("width", String(photo.imageWidth));
    expect(previewImage).toHaveAttribute("height", String(photo.imageHeight));
  });

  it.each(["List view", "Filmstrip view"] as const)(
    "keeps off-selection tiles lazy in %s",
    async (viewName) => {
      const user = userEvent.setup();
      render(<PicturesBrowser onOpenPhoto={vi.fn()} />);

      await user.click(screen.getByRole("button", { name: viewName }));

      const selectedImage = within(
        screen.getByRole("button", { name: "Stone Gate photo" }),
      ).getByRole("img", { name: "Stone Gate" });
      const deferredImage = within(
        screen.getByRole("button", { name: "Underline Skyline photo" }),
      ).getByRole("img", { name: "Underline Skyline" });
      expect(selectedImage).toHaveAttribute("loading", "eager");
      expect(selectedImage).toHaveAttribute("fetchpriority", "high");
      expect(deferredImage).toHaveAttribute("loading", "lazy");
      expect(deferredImage).not.toHaveAttribute("fetchpriority");
    },
  );

  it("switches between list and thumbnail views without losing selection", async () => {
    const user = userEvent.setup();
    render(<PicturesBrowser onOpenPhoto={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "Cloud Needle photo" }));
    await user.click(screen.getByRole("button", { name: "List view" }));

    expect(screen.getByRole("button", { name: "List view" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: "Cloud Needle photo" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("columnheader", { name: "Name" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Thumbnails view" }));
    expect(screen.getByRole("button", { name: "Thumbnails view" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.queryByRole("columnheader", { name: "Name" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cloud Needle photo" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("opens a focused photo with the keyboard", async () => {
    const user = userEvent.setup();
    const onOpenPhoto = vi.fn();
    render(<PicturesBrowser onOpenPhoto={onOpenPhoto} />);

    const photo = screen.getByRole("button", { name: "Amber Room photo" });
    photo.focus();
    await user.keyboard("{Enter}");

    expect(onOpenPhoto).toHaveBeenCalledWith("amber-room");
  });

  it("marks only the failed image as unavailable", () => {
    render(<PicturesBrowser onOpenPhoto={vi.fn()} />);

    const stone = screen.getByRole("button", { name: "Stone Gate photo" });
    fireEvent.error(within(stone).getByRole("img", { name: "Stone Gate" }));

    expect(
      within(stone).getByRole("img", { name: "Stone Gate image unavailable" }),
    ).toBeInTheDocument();
    expect(
      within(screen.getByRole("button", { name: "Underline Skyline photo" })).getByRole(
        "img",
        { name: "Underline Skyline" },
      ),
    ).toBeInTheDocument();
  });

  it("exposes unfinished Explorer and task actions as non-interactive", () => {
    render(<PicturesBrowser onOpenPhoto={vi.fn()} />);

    expect(screen.getByRole("button", { name: "Search" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Folders" })).toBeDisabled();
    expect(screen.getByText("View as a slide show")).toHaveAttribute(
      "aria-disabled",
      "true",
    );
    expect(screen.getByText("Order prints online")).toHaveAttribute(
      "aria-disabled",
      "true",
    );
    expect(screen.getByText("My Documents")).toHaveAttribute("aria-disabled", "true");
  });
});
