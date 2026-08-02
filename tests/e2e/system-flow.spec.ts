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
