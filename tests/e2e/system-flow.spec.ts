import { expect, test } from "@playwright/test";
import { loginToDesktop } from "./helpers";

test("boots, logs in, and logs off", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("boot-screen")).toBeVisible();
  await loginToDesktop(page);
  await expect(page.getByTestId("desktop-shell")).toBeVisible();
  await page.getByRole("button", { name: "Start", exact: true }).click();
  await page.getByRole("menuitem", { name: "Log Off", exact: true }).click();
  await page
    .getByRole("button", { name: "Confirm Log Off", exact: true })
    .click();
  await expect(page.getByTestId("login-screen")).toBeVisible();
});

test("finishes the DOS ownership message before entering the desktop", async ({ page }) => {
  await page.clock.install({
    time: new Date("2026-08-12T12:00:00.000Z"),
  });
  await page.clock.pauseAt(new Date("2026-08-12T12:00:00.000Z"));
  await page.goto("/");

  await page.clock.fastForward(1_800);
  await expect(page.getByTestId("login-screen")).toBeVisible();
  await page.getByRole("button", { name: "Harry", exact: true }).click();

  const dosScreen = page.getByTestId("signing-in-screen");
  await expect(dosScreen).toBeVisible();
  await expect(page.getByText("Log In", { exact: true })).toHaveCount(0);

  await page.clock.runFor(4_000);
  await expect(page.getByTestId("dos-transcript")).toContainText(
    "This website was independently designed and developed by Zhiyuan Xing.",
  );
  await expect(page.getByText("Log In", { exact: true })).toBeVisible();
  await expect(page.getByTestId("desktop-shell")).toHaveCount(0);

  await page.clock.runFor(1_199);
  await expect(dosScreen).toBeVisible();
  await page.clock.runFor(1);
  await expect(page.getByTestId("desktop-shell")).toBeVisible();
});

test("restores open and maximized windows after a page refresh", async ({ page }) => {
  await page.goto("/");
  await loginToDesktop(page);
  await page.getByRole("button", { name: "My Projects", exact: true }).click();
  await page
    .getByRole("button", { name: "Maximize My Projects", exact: true })
    .click();

  await page.reload();

  await expect(page.getByTestId("desktop-shell")).toBeVisible();
  await expect(
    page.getByRole("dialog", { name: "My Projects", exact: true }),
  ).toHaveAttribute("data-window-mode", "maximized");
  await expect(page.getByTestId("boot-screen")).toHaveCount(0);
});

test("returns to boot after refreshing a logged-off session", async ({ page }) => {
  await page.goto("/");
  await loginToDesktop(page);
  await page.getByRole("button", { name: "Start", exact: true }).click();
  await page.getByRole("menuitem", { name: "Log Off", exact: true }).click();
  await page
    .getByRole("button", { name: "Confirm Log Off", exact: true })
    .click();
  await expect(page.getByTestId("login-screen")).toBeVisible();

  await page.reload();

  await expect(page.getByTestId("boot-screen")).toBeVisible();
});

test("offers a persistent taskbar sound mute control", async ({ page }) => {
  await page.goto("/");
  await loginToDesktop(page);
  const mute = page.getByRole("button", { name: "Mute system sounds", exact: true });
  await expect(mute).toBeVisible();
  await mute.click();
  await expect(
    page.getByRole("button", { name: "Enable system sounds", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");

  await page.reload();

  await expect(
    page.getByRole("button", { name: "Enable system sounds", exact: true }),
  ).toBeVisible();
});

test("dismisses the Start menu from the desktop and with Escape", async ({ page }) => {
  await page.goto("/");
  await loginToDesktop(page);

  const startButton = page.getByRole("button", { name: "Start", exact: true });
  const startMenu = page.getByRole("menu", { name: "Start menu", exact: true });

  await startButton.click();
  await expect(startMenu).toBeVisible();
  await page.getByTestId("desktop-background").click({ position: { x: 300, y: 300 } });
  await expect(startMenu).toBeHidden();

  await startButton.click();
  await expect(startMenu).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(startMenu).toBeHidden();
  await expect(startButton).toBeFocused();
});

test("cancels Turn Off Computer and stays on the desktop", async ({ page }) => {
  await page.goto("/");
  await loginToDesktop(page);

  await page.getByRole("button", { name: "Start", exact: true }).click();
  await page
    .getByRole("menuitem", { name: "Turn Off Computer", exact: true })
    .click();
  const dialog = page.getByRole("dialog", {
    name: "Turn Off Computer",
    exact: true,
  });
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByTestId("desktop-shell")).toBeVisible();
});

test("turns off, reaches powered-off state, and boots again", async ({ page }) => {
  await page.goto("/");
  await loginToDesktop(page);

  await page.getByRole("button", { name: "Start", exact: true }).click();
  await page
    .getByRole("menuitem", { name: "Turn Off Computer", exact: true })
    .click();
  await page
    .getByRole("dialog", { name: "Turn Off Computer", exact: true })
    .getByRole("button", { name: "Turn Off", exact: true })
    .click();
  await expect(page.getByTestId("shutting-down-screen")).toBeVisible();
  await expect(page.getByTestId("powered-off-screen")).toBeVisible({
    timeout: 3_000,
  });

  await page.getByRole("button", { name: "Restart", exact: true }).click();
  await expect(page.getByTestId("boot-screen")).toBeVisible();
  await expect(page.getByTestId("login-screen")).toBeVisible({ timeout: 3_000 });
});

test("restarts from the Turn Off Computer dialog", async ({ page }) => {
  await page.goto("/");
  await loginToDesktop(page);

  await page.getByRole("button", { name: "Start", exact: true }).click();
  await page
    .getByRole("menuitem", { name: "Turn Off Computer", exact: true })
    .click();
  await page
    .getByRole("dialog", { name: "Turn Off Computer", exact: true })
    .getByRole("button", { name: "Restart", exact: true })
    .click();
  await expect(page.getByTestId("boot-screen")).toBeVisible();
  await expect(page.getByTestId("login-screen")).toBeVisible({ timeout: 3_000 });
});
