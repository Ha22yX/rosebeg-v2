# Rosebeg XP Boot and Login Fidelity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the minimal startup screens with responsive, high-fidelity XP boot, login, and signing-in screens branded Rosebeg XP.

**Architecture:** Add one reusable presentational logo component and compose both screens from semantic regions. Keep all state and timing in `SystemRoot`; the new components are presentational and CSS owns responsive layout and reduced-motion animation.

**Tech Stack:** React 19, TypeScript 7, CSS, Vitest, Testing Library, Playwright

## Global Constraints

- Visible startup branding must read `Rosebeg XP` or `Rosebeg`, never `Windows XP`.
- Normal boot remains exactly 1,800 ms and normal sign-in remains exactly 650 ms.
- Reduced-motion timed phases remain exactly 150 ms.
- Do not add remote assets or dependencies.
- The layout must remain composed at 2048×1152 and usable without horizontal scrolling at 320×568.
- Keep the website copy in English.

---

### Task 1: Rosebeg XP identity and semantic startup structure

**Files:**
- Create: `src/system/RosebegXpLogo.tsx`
- Modify: `src/system/BootScreen.tsx`
- Modify: `src/system/LoginScreen.tsx`
- Test: `src/system/SystemRoot.test.tsx`

**Interfaces:**
- Produces: `RosebegXpLogo({ compact?: boolean; inverse?: boolean }): JSX.Element`
- Consumes: existing `LoginScreenProps` and `SystemRoot` phase transitions unchanged

- [ ] **Step 1: Write failing component assertions**

Add assertions that the boot screen exposes a `Rosebeg XP` image and a decorative progress bar, does not contain `Starting Windows...`, and that both login and signing-in states retain header/main/footer regions plus the Harry account tile/status.

```tsx
expect(screen.getByRole("img", { name: "Rosebeg XP" })).toBeInTheDocument();
expect(screen.getByTestId("boot-progress")).toBeInTheDocument();
expect(screen.queryByText("Starting Windows...")).not.toBeInTheDocument();

expect(screen.getByTestId("login-header")).toBeInTheDocument();
expect(screen.getByTestId("login-main")).toBeInTheDocument();
expect(screen.getByTestId("login-footer")).toBeInTheDocument();
expect(screen.getByRole("button", { name: "Harry" })).toBeInTheDocument();
```

- [ ] **Step 2: Run the focused test and verify RED**

Run: `npm test -- src/system/SystemRoot.test.tsx`

Expected: FAIL because the new logo, progress indicator, and structural test ids do not exist.

- [ ] **Step 3: Add the reusable logo and screen markup**

Implement a repository-owned inline SVG mark with four colored panes and a text lockup. `BootScreen` renders the logo plus a decorative progress track. `LoginScreen` always renders the same three-zone shell; only the tile copy changes when `signingIn` is true.

```tsx
export type RosebegXpLogoProps = {
  compact?: boolean;
  inverse?: boolean;
};

export function RosebegXpLogo({ compact = false, inverse = false }: RosebegXpLogoProps) {
  return (
    <div
      aria-label="Rosebeg XP"
      className={`rosebeg-xp-logo${compact ? " rosebeg-xp-logo--compact" : ""}${inverse ? " rosebeg-xp-logo--inverse" : ""}`}
      role="img"
    >
      <svg aria-hidden="true" className="rosebeg-xp-logo__mark" viewBox="0 0 64 56">
        <path className="rosebeg-xp-logo__pane rosebeg-xp-logo__pane--red" d="M5 8 29 3v23L5 29Z" />
        <path className="rosebeg-xp-logo__pane rosebeg-xp-logo__pane--green" d="m33 2 26-5v25l-26 4Z" />
        <path className="rosebeg-xp-logo__pane rosebeg-xp-logo__pane--blue" d="M5 33 29 30v23L5 57Z" />
        <path className="rosebeg-xp-logo__pane rosebeg-xp-logo__pane--yellow" d="m33 29 26-3v25l-26 5Z" />
      </svg>
      <span className="rosebeg-xp-logo__wordmark">Rosebeg</span>
      <span className="rosebeg-xp-logo__xp">XP</span>
    </div>
  );
}
```

- [ ] **Step 4: Run the focused test and verify GREEN**

Run: `npm test -- src/system/SystemRoot.test.tsx`

Expected: PASS, including all pre-existing phase timing tests.

- [ ] **Step 5: Commit the structural change**

```bash
git add src/system/RosebegXpLogo.tsx src/system/BootScreen.tsx src/system/LoginScreen.tsx src/system/SystemRoot.test.tsx
git commit -m "feat: structure authentic Rosebeg XP startup screens"
```

### Task 2: High-fidelity responsive styling and animation

**Files:**
- Modify: `src/system/system.css`
- Test: `tests/e2e/visual.spec.ts`

**Interfaces:**
- Consumes: the BEM classes emitted by Task 1
- Produces: desktop and narrow responsive layouts; reduced-motion-safe progress animation

- [ ] **Step 1: Extend visual coverage before changing styles**

Install Playwright clock control before navigation, capture the boot state while timers are paused, advance to login, and retain the existing desktop/standard/mobile login captures.

```ts
await page.clock.install({ time: new Date("2026-08-02T04:34:00.000Z") });
await page.emulateMedia({ reducedMotion: "reduce" });
await page.goto("/");
await expect(page.getByTestId("boot-screen")).toBeVisible();
await capture(page, `${viewport.name}-boot.png`);
await page.clock.fastForward(150);
await expect(page.getByTestId("login-screen")).toBeVisible();
```

- [ ] **Step 2: Run the visual test and verify RED**

Run: `npm run test:visual`

Expected: FAIL because boot snapshots do not exist and login snapshots still represent the old minimal layout.

- [ ] **Step 3: Implement the XP visual system**

In `system.css`, implement:

- black boot canvas with the lockup slightly above center;
- beveled progress track and three clipped blue blocks;
- deep-blue header/footer, periwinkle main field, warm separator rules;
- bounded two-column login stage with a center divider;
- right-aligned identity/instruction column and XP-style Harry tile;
- footer power affordance/help copy;
- stacked layout below 680 px;
- bounded `clamp()` sizing and `100dvh` overflow safety;
- `@media (prefers-reduced-motion: reduce)` static/pulsing progress blocks.

Use these core tokens consistently:

```css
:root {
  --xp-login-dark: #003399;
  --xp-login-mid: #5a7ed1;
  --xp-login-light: #6f91df;
  --xp-login-rule: #f4a32c;
  --xp-login-select: #1f5fbd;
}
```

- [ ] **Step 4: Regenerate and inspect visual baselines**

Run: `npm run test:visual -- --update-snapshots`

Expected: PASS after generating boot/login snapshots for 1440×900, 1024×768, and 390×844. Inspect every new PNG for clipping, sparse ultrawide composition, and mobile overflow before accepting it.

- [ ] **Step 5: Run the startup regression suite**

Run: `npm test -- src/system/SystemRoot.test.tsx && npm run check`

Expected: PASS with unchanged timing behavior and no type errors.

- [ ] **Step 6: Commit the visual implementation**

```bash
git add src/system/system.css tests/e2e/visual.spec.ts tests/e2e/visual.spec.ts-snapshots
git commit -m "feat: recreate Rosebeg XP boot and login visuals"
```

