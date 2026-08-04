import { expect, test, type Page } from "@playwright/test";
import { loginToDesktop } from "./helpers";

const viewports = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "standard", width: 1024, height: 768 },
  { name: "mobile", width: 390, height: 844 },
] as const;

for (const viewport of viewports) {
  test(`${viewport.name} visual states`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.clock.install({
      time: new Date("2026-08-02T04:34:00.000Z"),
    });
    await page.clock.pauseAt(new Date("2026-08-02T04:34:00.000Z"));
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");

    await expect(page.getByTestId("boot-screen")).toBeVisible();
    await capture(page, `${viewport.name}-boot.png`);

    await page.clock.fastForward(150);

    await expect(page.getByTestId("login-screen")).toBeVisible({
      timeout: 3_000,
    });
    await capture(page, `${viewport.name}-login.png`);
    await page.clock.resume();

    await loginToDesktop(page);
    await capture(page, `${viewport.name}-desktop.png`);

    await openStart(page);
    await capture(page, `${viewport.name}-start-menu.png`);

    await page
      .getByRole("menuitem", { name: "My Projects", exact: true })
      .click();
    await openStart(page);
    await page
      .getByRole("menuitem", { name: "My Pictures", exact: true })
      .first()
      .click();
    await expect(
      page.getByRole("dialog", { name: "My Projects", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("dialog", { name: "My Pictures", exact: true }),
    ).toBeVisible();
    await waitForImages(page);
    await capture(page, `${viewport.name}-overlapping-apps.png`);

    await page
      .getByRole("button", { name: "My Projects task 1", exact: true })
      .click();
    const projects = page.getByRole("dialog", {
      name: "My Projects",
      exact: true,
    });
    await projects
      .getByRole("button", { name: "Maximize My Projects", exact: true })
      .click();
    await capture(page, `${viewport.name}-maximized-explorer.png`);

    await page
      .getByRole("button", { name: "My Pictures task 2", exact: true })
      .click();
    const pictures = page.getByRole("dialog", {
      name: "My Pictures",
      exact: true,
    });
    await pictures
      .getByRole("button", { name: "Maximize My Pictures", exact: true })
      .click();
    await waitForImages(page);
    await capture(page, `${viewport.name}-all-photo-browser.png`);

    await pictures
      .getByRole("button", { name: "Stone Gate photo", exact: true })
      .press("Enter");
    await expect(
      page.getByRole("dialog", {
        name: "Windows Picture and Fax Viewer",
        exact: true,
      }),
    ).toBeVisible();
    await waitForImages(page);
    await capture(page, `${viewport.name}-viewer.png`);

    await openStart(page);
    await page
      .getByRole("menuitem", { name: "About Harry", exact: true })
      .first()
      .click();
    await expect(
      page.getByRole("dialog", {
        name: "About Harry - Notepad",
        exact: true,
      }),
    ).toBeVisible();
    await capture(page, `${viewport.name}-notepad.png`);

    await openStart(page);
    await page
      .getByRole("menuitem", { name: "Harry Messenger", exact: true })
      .click();
    await expect(
      page.getByRole("dialog", { name: "Harry Messenger", exact: true }),
    ).toBeVisible();
    await capture(page, `${viewport.name}-messenger.png`);

    await openStart(page);
    await page
      .getByRole("menuitem", { name: "Turn Off Computer", exact: true })
      .click();
    const shutdownDialog = page.getByRole("dialog", {
      name: "Turn Off Computer",
      exact: true,
    });
    await expect(shutdownDialog).toBeVisible();
    await capture(page, `${viewport.name}-shutdown.png`);

    await shutdownDialog
      .getByRole("button", { name: "Turn Off", exact: true })
      .click();
    await expect(page.getByTestId("powered-off-screen")).toBeVisible({
      timeout: 3_000,
    });
    await capture(page, `${viewport.name}-powered-off.png`);
  });
}

async function openStart(page: Page): Promise<void> {
  const menu = page.getByRole("menu", { name: "Start menu", exact: true });
  if (await menu.isVisible()) return;
  await page.getByRole("button", { name: "Start", exact: true }).click();
  await expect(menu).toBeVisible();
}

async function waitForImages(page: Page): Promise<void> {
  await page.waitForFunction(() =>
    Array.from(document.images).every((image) => {
      const bounds = image.getBoundingClientRect();
      const visible =
        bounds.width > 0 &&
        bounds.height > 0 &&
        bounds.right > 0 &&
        bounds.bottom > 0 &&
        bounds.left < window.innerWidth &&
        bounds.top < window.innerHeight;

      return !visible || image.complete;
    }),
  );
}

async function capture(page: Page, name: string): Promise<void> {
  await page.evaluate(() => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  });
  const viewportHasHorizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth,
  );
  expect(viewportHasHorizontalOverflow, `${name} has horizontal overflow`).toBe(
    false,
  );
  await expect(page).toHaveScreenshot(name, {
    maskColor: "#0b83d5",
    mask: [
      page
        .getByRole("complementary", {
          name: "Notification area",
          exact: true,
        })
        .getByText("12:34 PM", { exact: true }),
    ],
  });
}
