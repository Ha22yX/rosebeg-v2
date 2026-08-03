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

test("opens exactly one desktop window for click and double-click", async ({ page }) => {
  await page.goto("/");
  await loginToDesktop(page);
  await page.getByRole("button", { name: "My Projects", exact: true }).click();
  await expect(
    page.getByRole("dialog", { name: "My Projects", exact: true }),
  ).toHaveCount(1);

  await page.evaluate(() =>
    localStorage.removeItem("rosebeg-xp:desktop-session:v1"),
  );
  await page.goto("/");
  await loginToDesktop(page);
  await page
    .getByRole("button", { name: "My Projects", exact: true })
    .dblclick();
  await expect(
    page.getByRole("dialog", { name: "My Projects", exact: true }),
  ).toHaveCount(1);
});

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

test("zooms relative to fit, preserves the viewport center, and refits on resize", async ({
  page,
}) => {
  await page.goto("/");
  await loginToDesktop(page);
  await page.getByRole("button", { name: "My Pictures", exact: true }).click();

  const browser = page.getByRole("dialog", {
    name: "My Pictures",
    exact: true,
  });
  await browser
    .getByRole("button", { name: "Stone Gate photo", exact: true })
    .press("Enter");

  const viewer = page.getByRole("dialog", {
    name: "Windows Picture and Fax Viewer",
    exact: true,
  });
  const viewport = viewer.getByLabel("Photo viewport", { exact: true });
  const canvas = viewer.locator(".picture-viewer__canvas");
  const image = viewer.getByRole("img", { name: "Stone Gate", exact: true });

  await expect(image).toBeVisible();
  await expect(viewport).toHaveAttribute("data-zoom", "100");
  await expect(viewer.getByText("100%", { exact: true })).toBeVisible();
  await expect(
    viewer.getByRole("button", { name: "Actual size", exact: true }),
  ).toHaveCount(0);

  const centerBefore = await viewport.evaluate((viewportNode) => {
    const canvasNode = viewportNode.querySelector<HTMLElement>(
      ".picture-viewer__canvas",
    );
    if (!canvasNode) throw new Error("Picture canvas is missing");
    const viewportRect = viewportNode.getBoundingClientRect();
    const canvasRect = canvasNode.getBoundingClientRect();
    return {
      x: (viewportRect.left + viewportRect.width / 2 - canvasRect.left) /
        canvasRect.width,
      y: (viewportRect.top + viewportRect.height / 2 - canvasRect.top) /
        canvasRect.height,
    };
  });

  await viewer.getByRole("button", { name: "Zoom in", exact: true }).click();
  await expect(viewport).toHaveAttribute("data-zoom", "125");
  await expect(viewer.getByText("125%", { exact: true })).toBeVisible();

  const centerAfter = await canvas.evaluate((canvasNode) => {
    const viewportNode = canvasNode.parentElement?.parentElement;
    if (!(viewportNode instanceof HTMLElement)) {
      throw new Error("Picture viewport is missing");
    }
    const viewportRect = viewportNode.getBoundingClientRect();
    const canvasRect = canvasNode.getBoundingClientRect();
    return {
      x: (viewportRect.left + viewportRect.width / 2 - canvasRect.left) /
        canvasRect.width,
      y: (viewportRect.top + viewportRect.height / 2 - canvasRect.top) /
        canvasRect.height,
    };
  });
  expect(centerAfter.x).toBeCloseTo(centerBefore.x, 2);
  expect(centerAfter.y).toBeCloseTo(centerBefore.y, 2);

  await viewer
    .getByRole("button", { name: "Fit to window", exact: true })
    .click();
  await expect(viewport).toHaveAttribute("data-zoom", "100");
  const widthBeforeResize = await image.evaluate((node) => node.getBoundingClientRect().width);

  const resizeHandle = viewer.locator(".xp-window__resize--east");
  const resizeHandleBox = await resizeHandle.boundingBox();
  if (!resizeHandleBox) throw new Error("Viewer east resize handle is not visible");
  await page.mouse.move(
    resizeHandleBox.x + resizeHandleBox.width / 2,
    resizeHandleBox.y + resizeHandleBox.height / 2,
  );
  await page.mouse.down();
  await page.mouse.move(
    resizeHandleBox.x + resizeHandleBox.width / 2 - 140,
    resizeHandleBox.y + resizeHandleBox.height / 2,
  );
  await page.mouse.up();

  await expect.poll(async () =>
    image.evaluate((node) => node.getBoundingClientRect().width),
  ).not.toBe(widthBeforeResize);
  await expect(viewport).toHaveAttribute("data-zoom", "100");
});

test("wraps Notepad content by default and allows Word Wrap to be toggled", async ({ page }) => {
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
  await expect(wordWrap).toHaveAttribute("aria-checked", "true");

  const resizeHandle = notepad.locator(".xp-window__resize--east");
  const resizeHandleBox = await resizeHandle.boundingBox();
  if (!resizeHandleBox) throw new Error("Notepad east resize handle is not visible");
  await page.mouse.move(
    resizeHandleBox.x + resizeHandleBox.width / 2,
    resizeHandleBox.y + resizeHandleBox.height / 2,
  );
  await page.mouse.down();
  await page.mouse.move(
    resizeHandleBox.x + resizeHandleBox.width / 2 - 180,
    resizeHandleBox.y + resizeHandleBox.height / 2,
  );
  await page.mouse.up();

  const editorWidth = await notepad
    .locator(".about-notepad__editor")
    .evaluate((node) => node.clientWidth);
  const documentWidth = await notepad
    .getByTestId("notepad-document")
    .evaluate((node) => node.scrollWidth);
  expect(documentWidth).toBeLessThanOrEqual(editorWidth);

  await wordWrap.click();
  await notepad.getByRole("button", { name: "Format", exact: true }).click();
  await expect(
    notepad.getByRole("menuitemcheckbox", {
      name: "Word Wrap",
      exact: true,
    }),
  ).toHaveAttribute("aria-checked", "false");
});

test("sends Messenger context to the AI endpoint across multiple turns", async ({ page }) => {
  const requests: Array<{
    history: Array<{ sender: string; text: string }>;
    message: string;
  }> = [];
  const replies = [
    "I build software, electronics, and autonomous-system projects.",
    "Your first question was about my projects.",
  ];
  await page.route("**/api/chat", async (route) => {
    requests.push(route.request().postDataJSON());
    await route.fulfill({
      contentType: "application/json",
      json: { reply: replies.shift() },
      status: 200,
    });
  });
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
      "I build software, electronics, and autonomous-system projects.",
      { exact: true },
    ),
  ).toBeVisible();

  await messenger
    .getByRole("textbox", { name: "Message Harry", exact: true })
    .fill("What did I ask first?");
  await messenger.getByRole("button", { name: "Send", exact: true }).click();
  await expect(
    conversation.getByText("Your first question was about my projects.", {
      exact: true,
    }),
  ).toBeVisible();

  expect(requests).toHaveLength(2);
  expect(requests[1]?.message).toBe("What did I ask first?");
  expect(requests[1]?.history.map(({ sender, text }) => ({ sender, text }))).toEqual([
    {
      sender: "harry",
      text: "Hi — I'm Harry's AI portfolio assistant. Ask me about his projects, photography, background, or how to get in touch.",
    },
    { sender: "visitor", text: "Tell me about your projects" },
    {
      sender: "harry",
      text: "I build software, electronics, and autonomous-system projects.",
    },
    { sender: "visitor", text: "What did I ask first?" },
  ]);
});
