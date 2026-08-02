import { expect, test } from "@playwright/test";
import { loginToDesktop } from "./helpers";

test("manages two My Projects windows through the complete window lifecycle", async ({
  page,
}) => {
  await page.goto("/");
  await loginToDesktop(page);

  const projectsIcon = page.getByRole("button", {
    name: "My Projects",
    exact: true,
  });
  await projectsIcon.dblclick();
  await projectsIcon.dblclick();

  const projectWindows = page.getByRole("dialog", {
    name: "My Projects",
    exact: true,
  });
  const firstTask = page.getByRole("button", {
    name: "My Projects task 1",
    exact: true,
  });
  const secondTask = page.getByRole("button", {
    name: "My Projects task 2",
    exact: true,
  });
  await expect(projectWindows).toHaveCount(2);
  await expect(secondTask).toHaveAttribute("aria-pressed", "true");

  await firstTask.click();
  await expect(firstTask).toHaveAttribute("aria-pressed", "true");
  await expect(secondTask).toHaveAttribute("aria-pressed", "false");

  const firstWindow = projectWindows.first();
  const titleBar = page
    .getByLabel("Move My Projects window", { exact: true })
    .first();
  const beforeMove = await firstWindow.boundingBox();
  expect(beforeMove).not.toBeNull();
  await titleBar.hover({ position: { x: 120, y: 12 } });
  await page.mouse.down();
  await page.mouse.move(beforeMove!.x + 200, beforeMove!.y + 72);
  await page.mouse.up();
  const afterMove = await firstWindow.boundingBox();
  expect(afterMove).not.toBeNull();
  expect(afterMove!.x).toBeGreaterThan(beforeMove!.x);
  expect(afterMove!.y).toBeGreaterThan(beforeMove!.y);

  await page.mouse.move(
    afterMove!.x + afterMove!.width - 5,
    afterMove!.y + afterMove!.height - 5,
  );
  await page.mouse.down();
  await page.mouse.move(
    afterMove!.x + afterMove!.width - 65,
    afterMove!.y + afterMove!.height - 29,
  );
  await page.mouse.up();
  const afterResize = await firstWindow.boundingBox();
  expect(afterResize).not.toBeNull();
  expect(afterResize!.width).toBeLessThan(afterMove!.width);
  expect(afterResize!.height).toBeLessThan(afterMove!.height);

  await firstWindow
    .getByRole("button", { name: "Minimize My Projects", exact: true })
    .click();
  await expect(projectWindows).toHaveCount(1);
  await expect(firstTask).toHaveAttribute("aria-pressed", "false");

  await firstTask.click();
  await expect(projectWindows).toHaveCount(2);
  await expect(firstTask).toHaveAttribute("aria-pressed", "true");

  await firstWindow
    .getByRole("button", { name: "Maximize My Projects", exact: true })
    .click();
  await expect(
    firstWindow.getByRole("button", {
      name: "Restore My Projects",
      exact: true,
    }),
  ).toBeVisible();
  const maximizedBounds = await firstWindow.boundingBox();
  const viewport = page.viewportSize();
  expect(maximizedBounds).toEqual({
    x: 0,
    y: 0,
    width: viewport!.width,
    height: viewport!.height - 32,
  });

  await firstWindow
    .getByRole("button", { name: "Restore My Projects", exact: true })
    .click();
  await expect(
    firstWindow.getByRole("button", {
      name: "Maximize My Projects",
      exact: true,
    }),
  ).toBeVisible();
  await expect
    .poll(() => firstWindow.boundingBox())
    .toEqual(afterResize);

  await firstWindow
    .getByRole("button", { name: "Close My Projects", exact: true })
    .click();
  await expect(projectWindows).toHaveCount(1);
  await projectWindows
    .getByRole("button", { name: "Close My Projects", exact: true })
    .click();
  await expect(projectWindows).toHaveCount(0);
});
