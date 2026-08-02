# Desktop Icon Activation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow a desktop program icon to open with either one click or a double-click, without a double-click spawning duplicate windows.

**Architecture:** Use the native button click event for mouse, touch, Enter, and Space. Open on click detail 0 or 1 and ignore the second click (`detail >= 2`) in a double-click sequence; remove the separate pointer and keyboard activation paths that would otherwise duplicate native click behavior.

**Tech Stack:** React 19, TypeScript 7, Vitest, Testing Library, Playwright

## Global Constraints

- One single click opens exactly one window.
- One double-click opens exactly one window.
- Two intentional single clicks separated into distinct click sequences may open two windows, preserving multi-instance behavior.
- Touch, Enter, and Space activation continue to work.
- Start-menu behavior is unchanged.

---

### Task 1: Unify desktop activation through native click

**Files:**
- Modify: `src/desktop/DesktopIcon.tsx`
- Modify: `src/desktop/DesktopShell.test.tsx`
- Test: `tests/e2e/apps.spec.ts`

**Interfaces:**
- Consumes: existing `DesktopIconProps.onOpen(): void`
- Produces: one native click handler with click-sequence de-duplication

- [ ] **Step 1: Write failing activation tests**

Add separate tests using `userEvent`:

```tsx
it("opens once from a single mouse click", async () => {
  const user = userEvent.setup();
  renderDesktop();
  await user.click(screen.getByRole("button", { name: "About Harry" }));
  expect(screen.getAllByRole("heading", { name: "About Harry - Notepad" })).toHaveLength(1);
});

it("opens once from a mouse double-click", async () => {
  const user = userEvent.setup();
  renderDesktop();
  await user.dblClick(screen.getByRole("button", { name: "About Harry" }));
  expect(screen.getAllByRole("heading", { name: "About Harry - Notepad" })).toHaveLength(1);
});
```

Update desktop-icon tests that use `fireEvent.doubleClick` as a generic activation helper to use `fireEvent.click`; keep photo/project item double-click tests unchanged because they are not desktop icons.

- [ ] **Step 2: Run focused tests and verify RED**

Run: `npm test -- src/desktop/DesktopShell.test.tsx`

Expected: FAIL because a single mouse click currently does nothing.

- [ ] **Step 3: Implement native click de-duplication**

Replace pointer, keyboard, and double-click handlers with:

```tsx
const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
  if (event.detail >= 2) return;
  onOpen();
};

return (
  <button aria-label={label} className="desktop-icon" onClick={handleClick} type="button">
    {/* existing icon and label */}
  </button>
);
```

Native button semantics generate `detail === 0` clicks for keyboard activation and a first-click `detail === 1` for mouse/touch. The second click in a double-click sequence is ignored.

- [ ] **Step 4: Verify unit and E2E behavior**

Run: `npm test -- src/desktop/DesktopShell.test.tsx && npm run test:e2e -- tests/e2e/apps.spec.ts`

Expected: PASS with one window for single click, double-click, touch, Enter, and Space.

- [ ] **Step 5: Commit**

```bash
git add src/desktop/DesktopIcon.tsx src/desktop/DesktopShell.test.tsx tests/e2e/apps.spec.ts
git commit -m "fix: support single and double desktop icon activation"
```

