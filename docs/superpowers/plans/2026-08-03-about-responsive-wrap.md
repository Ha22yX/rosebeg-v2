# About Notepad Responsive Wrap Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make About Harry wrap to the current Notepad window width by default while preserving the XP Word Wrap menu toggle.

**Architecture:** Keep the existing local `wordWrap` state and menu behavior, but initialize it enabled and make the wrapped document participate in the editor's available width. No window-manager sizing changes are needed.

**Tech Stack:** React 19, TypeScript 7, CSS, Vitest, Testing Library, Playwright

## Global Constraints

- About content remains Markdown-rendered and English.
- Word Wrap remains user-toggleable from Format.
- Wrapped content must reflow automatically when the application window is resized.
- Do not alter the Notepad ideal or minimum window sizes.

---

### Task 1: Default responsive wrapping

**Files:**
- Modify: `src/apps/about/AboutNotepad.tsx`
- Modify: `src/apps/about/about.css`
- Test: `src/apps/about/AboutNotepad.test.tsx`
- Test: `tests/e2e/apps.spec.ts`

**Interfaces:**
- Consumes: existing `wordWrap` boolean and Format menu checkbox
- Produces: wrapped-by-default document with an opt-out toggle

- [ ] **Step 1: Write failing unit and E2E expectations**

Update the first-render assertion and E2E menu expectation:

```tsx
expect(screen.getByTestId("notepad-document")).toHaveClass("is-word-wrapped");
expect(screen.getByRole("menuitemcheckbox", { name: "Word Wrap" })).toHaveAttribute(
  "aria-checked",
  "true",
);
```

Add a browser assertion that the wrapped document does not exceed its editor's client width after resizing the Notepad window.

```ts
const editorWidth = await notepad.locator(".about-notepad__editor").evaluate((node) => node.clientWidth);
const documentWidth = await notepad.getByTestId("notepad-document").evaluate((node) => node.scrollWidth);
expect(documentWidth).toBeLessThanOrEqual(editorWidth);
```

- [ ] **Step 2: Run focused tests and verify RED**

Run: `npm test -- src/apps/about/AboutNotepad.test.tsx`

Expected: FAIL because Word Wrap currently defaults to false.

- [ ] **Step 3: Implement minimal responsive wrapping**

Initialize the state as enabled:

```tsx
const [wordWrap, setWordWrap] = useState(true);
```

Strengthen the wrapped class so the document width tracks its editor:

```css
.about-notepad__document.is-word-wrapped {
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
  overflow-wrap: anywhere;
  white-space: normal;
}
```

- [ ] **Step 4: Verify unit and browser behavior**

Run: `npm test -- src/apps/about/AboutNotepad.test.tsx && npm run test:e2e -- tests/e2e/apps.spec.ts`

Expected: PASS. Toggling Word Wrap off restores the horizontal Notepad behavior; toggling it on reflows immediately.

- [ ] **Step 5: Update the Notepad visual snapshot and commit**

Run: `npm run test:visual -- --update-snapshots`

Inspect desktop, standard, and mobile Notepad images, then commit:

```bash
git add src/apps/about/AboutNotepad.tsx src/apps/about/about.css src/apps/about/AboutNotepad.test.tsx tests/e2e/apps.spec.ts tests/e2e/visual.spec.ts-snapshots
git commit -m "fix: wrap About content to the Notepad window"
```

