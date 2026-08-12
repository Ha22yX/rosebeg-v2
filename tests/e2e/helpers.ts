import { expect, type Page } from "@playwright/test";

export async function loginToDesktop(page: Page): Promise<void> {
  await expect(page.getByTestId("login-screen")).toBeVisible({ timeout: 3_000 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.getByRole("button", { name: "Harry", exact: true }).click();
  await expect(page.getByTestId("signing-in-screen")).toBeVisible();
  await expect(page.getByTestId("desktop-shell")).toBeVisible({ timeout: 7_000 });
  await page.emulateMedia({ reducedMotion: "no-preference" });
}
