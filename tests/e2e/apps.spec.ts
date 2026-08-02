import { expect, test } from "@playwright/test";
import { loginToDesktop } from "./helpers";

const photoNames = [
  "Stone Gate",
  "Underline Skyline",
  "Crosswalk Heat",
  "Library Drift",
  "Harbor Weather",
  "Window Afterimage",
  "Wall Feathers",
  "Cloud Needle",
  "Avenue Signal",
  "Atrium Pulse",
  "Amber Room",
  "White Cross",
  "Grid Horizon",
  "Gold Recital",
  "Night Pavilion",
] as const;

test("navigates project history and filters project folders", async ({ page }) => {
  await page.goto("/");
  await loginToDesktop(page);
  await page
    .getByRole("button", { name: "My Projects", exact: true })
    .dblclick();

  const explorer = page.getByRole("dialog", {
    name: "My Projects",
    exact: true,
  });
  const toolbar = explorer.getByRole("navigation", {
    name: "Explorer toolbar",
    exact: true,
  });
  await explorer
    .getByRole("button", { name: "Auto Email System folder", exact: true })
    .dblclick();
  await expect(
    explorer.getByRole("heading", {
      name: "Auto Email System",
      exact: true,
      level: 1,
    }),
  ).toBeVisible();

  await toolbar.getByRole("button", { name: "Back", exact: true }).click();
  await expect(
    explorer.getByRole("button", {
      name: "Auto Email System folder",
      exact: true,
    }),
  ).toBeVisible();
  await toolbar.getByRole("button", { name: "Forward", exact: true }).click();
  await expect(
    explorer.getByRole("heading", {
      name: "Auto Email System",
      exact: true,
      level: 1,
    }),
  ).toBeVisible();
  await toolbar.getByRole("button", { name: "Up", exact: true }).click();

  await toolbar.getByRole("button", { name: "Search", exact: true }).click();
  await explorer
    .getByRole("searchbox", { name: "Search projects", exact: true })
    .fill("PhotoBack");
  await expect(
    explorer.getByRole("button", { name: "PhotoBack folder", exact: true }),
  ).toBeVisible();
  await expect(
    explorer.getByRole("button", {
      name: "Auto Email System folder",
      exact: true,
    }),
  ).toBeHidden();
  await expect(explorer.getByText("1 objects", { exact: true })).toBeVisible();
});

test("shows all photos, opens two viewers, and advances with ArrowRight", async ({
  page,
}) => {
  await page.goto("/");
  await loginToDesktop(page);
  await page
    .getByRole("button", { name: "My Pictures", exact: true })
    .dblclick();

  const browser = page.getByRole("dialog", {
    name: "My Pictures",
    exact: true,
  });
  for (const photoName of photoNames) {
    await expect(
      browser.getByRole("button", {
        name: `${photoName} photo`,
        exact: true,
      }),
    ).toBeAttached();
  }
  await browser
    .getByRole("button", { name: "Stone Gate photo", exact: true })
    .press("Enter");
  await page
    .getByRole("button", { name: "My Pictures task 1", exact: true })
    .click();
  await browser
    .getByRole("button", { name: "Underline Skyline photo", exact: true })
    .press("Enter");

  const viewers = page.getByRole("dialog", {
    name: "Windows Picture and Fax Viewer",
    exact: true,
  });
  await expect(viewers).toHaveCount(2);
  const secondViewer = viewers.nth(1);
  await secondViewer
    .getByRole("button", { name: "Previous photo", exact: true })
    .focus();
  await page.keyboard.press("ArrowRight");
  await expect(
    secondViewer.getByRole("heading", {
      name: "Crosswalk Heat",
      exact: true,
      level: 1,
    }),
  ).toBeVisible();
  await expect(secondViewer.getByText("3 of 15", { exact: true })).toBeVisible();
});

test("toggles Notepad Word Wrap", async ({ page }) => {
  await page.goto("/");
  await loginToDesktop(page);
  await page
    .getByRole("button", { name: "About Harry", exact: true })
    .dblclick();

  const notepad = page.getByRole("dialog", {
    name: "About Harry - Notepad",
    exact: true,
  });
  await notepad.getByRole("button", { name: "Format", exact: true }).click();
  const wordWrap = notepad.getByRole("menuitemcheckbox", {
    name: "Word Wrap",
    exact: true,
  });
  await expect(wordWrap).toHaveAttribute("aria-checked", "false");
  await wordWrap.click();
  await notepad.getByRole("button", { name: "Format", exact: true }).click();
  await expect(
    notepad.getByRole("menuitemcheckbox", {
      name: "Word Wrap",
      exact: true,
    }),
  ).toHaveAttribute("aria-checked", "true");
});

test("sends a Messenger message and receives the local reply", async ({ page }) => {
  await page.goto("/");
  await loginToDesktop(page);
  await page
    .getByRole("button", { name: "Harry Messenger", exact: true })
    .dblclick();

  const messenger = page.getByRole("dialog", {
    name: "Harry Messenger",
    exact: true,
  });
  const conversation = messenger.getByRole("log", {
    name: "Conversation with Harry",
    exact: true,
  });
  await messenger
    .getByRole("textbox", { name: "Message Harry", exact: true })
    .fill("Tell me about your projects");
  await messenger.getByRole("button", { name: "Send", exact: true }).click();

  await expect(
    conversation.getByText("Tell me about your projects", { exact: true }),
  ).toBeVisible();
  await expect(
    conversation.getByText(
      "Selected projects span AI tools, autonomous systems, embedded electronics, and full-stack products.",
      { exact: true },
    ),
  ).toBeVisible();
});
