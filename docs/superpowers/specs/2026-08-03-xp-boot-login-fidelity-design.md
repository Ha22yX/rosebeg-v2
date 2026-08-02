# Rosebeg XP Boot and Login Fidelity Design

**Date:** 2026-08-03  
**Status:** Approved direction; pending implementation-plan approval  
**Scope:** Boot, login, and signing-in presentation only

## 1. Goal

Replace the current minimal boot and login screens with a high-fidelity recreation of the Windows XP visual language while using the original portfolio brand name **Rosebeg XP**.

The result should feel like a real operating-system startup sequence rather than a conventional web splash screen. It must preserve the existing state-machine timing and remain usable across large desktop displays, laptops, tablets, and narrow mobile viewports.

## 2. Chosen Direction

Use **Approach A: High-fidelity XP recreation**.

- Reproduce the defining XP composition, proportions, color zones, beveled controls, typography, user-tile treatment, and restrained animation.
- Replace Windows/Microsoft branding with Rosebeg/Rosebeg XP branding.
- Keep the interface in English.
- Build the visuals from repository-owned React, CSS, and inline SVG/CSS artwork so the screens do not depend on remote assets.
- Preserve the current 1.8-second boot and 650-millisecond sign-in durations.

This design intentionally avoids a modern reinterpretation. Accuracy to the reference interaction and composition is more important than introducing contemporary visual decoration.

## 3. Boot Screen

### 3.1 Composition

The boot screen fills the application viewport with pure black and centers a compact startup lockup slightly above the true vertical center, matching the original XP balance.

The lockup contains:

1. A small four-color waving-pane symbol rendered as repository-owned vector/CSS artwork.
2. A wordmark with `Rosebeg` in white and `XP` in orange, using XP-like proportions without copying the Microsoft wordmark.
3. A recessed progress track beneath the wordmark.
4. Three blue progress blocks moving horizontally inside the track.

The current visible `Starting Windows...` text is removed. The original screen communicates activity through the progress indicator, and removing the generic status line produces a more authentic silhouette.

### 3.2 Animation

- The three progress blocks travel left to right in a clipped, recessed track.
- Motion loops smoothly during the existing 1.8-second boot state.
- The progress bar is decorative and does not claim deterministic loading progress.
- Under `prefers-reduced-motion: reduce`, the blocks remain visible but use a subtle opacity pulse or static active position rather than horizontal travel.

### 3.3 Scaling

The logo and progress indicator use bounded responsive sizing with `clamp()`. They should grow enough to remain legible on high-resolution displays but never become oversized. On narrow screens the complete lockup remains centered with safe side padding and no horizontal overflow.

## 4. Login Screen

### 4.1 Page Structure

The screen uses the classic three-zone XP welcome layout:

- A deep-blue header band.
- A periwinkle-blue central field.
- A deep-blue footer band.
- Thin warm highlight rules separating the central field from the header and footer.

The central field contains a bounded login stage rather than distributing elements across the entire monitor. On desktop, the stage is a two-column composition divided by a subtle vertical rule.

### 4.2 Left Column

The left column contains:

- A compact Rosebeg XP mark using the same artwork and wordmark system as the boot screen.
- The instruction `To begin, click your user name` in bold white XP-style typography.

The content is right-aligned toward the center divider, reproducing the visual pull of the original welcome screen.

### 4.3 Right Column and User Tile

The right column contains one interactive account tile for Harry.

The tile includes:

- A larger square avatar with an XP-style double border and an original orange `H` portrait treatment.
- The account name `Harry` in large white text.
- A small status line used during sign-in.
- A blue selection surface with XP-era bevels, highlights, and hover/pressed states.

The tile must remain a semantic button named `Harry`, support keyboard activation, and show a high-contrast focus indicator consistent with the XP palette.

### 4.4 Footer

The footer contains:

- Left: a red/orange power icon and `Turn off computer` label presented as a non-destructive visual affordance on the login page. Because the existing login state does not expose a shutdown callback, this change does not add new system behavior.
- Right: the help copy `After you log on, you can explore Harry's work, photography, and story.`

The footer copy is supportive but subordinate to the user tile.

## 5. Signing-in State

Selecting Harry keeps the visitor inside the same three-zone login shell. The layout must not collapse into the current centered avatar and text treatment.

During the existing 650-millisecond transition:

- The Harry tile appears selected.
- The primary status changes to `Welcome`.
- The secondary status reads `Loading your personal settings...`.
- The screen then transitions to the desktop using the existing system state machine.

No new timing or asynchronous dependency is introduced.

## 6. Responsive Behavior

### Desktop and laptop

- The central login stage is capped at a readable maximum width and remains centered.
- The two columns retain roughly equal visual weight.
- Header and footer bands use bounded heights so ultrawide and high-resolution screens do not create excessive empty blue space.

### Narrow viewport

- Below the layout breakpoint, the two columns stack vertically.
- The central divider becomes a horizontal divider.
- Branding and instructions remain above the Harry tile.
- The footer can wrap into two rows while retaining the power affordance and help text.
- Minimum touch-target size is maintained and no content is clipped at 320 CSS pixels wide.

The responsive treatment preserves the XP visual hierarchy instead of shrinking the desktop layout until it becomes unreadable.

## 7. Accessibility

- The boot mark remains a labeled image with the accessible name `Rosebeg XP`.
- Decorative logo pieces and progress blocks are hidden from assistive technology.
- The login page keeps a clear heading and instruction relationship.
- Harry remains a native button with visible hover, pressed, and keyboard-focus states.
- Text and controls maintain strong contrast against all blue surfaces.
- Animation follows `prefers-reduced-motion` without skipping system states.

## 8. Implementation Boundaries

Expected changes are limited to:

- `src/system/BootScreen.tsx`
- `src/system/LoginScreen.tsx`
- `src/system/system.css`
- Focused system/component tests
- Playwright visual snapshots for affected startup states

Reusable presentational pieces such as the Rosebeg XP logo may be extracted within `src/system` if doing so improves clarity. The system state machine, desktop applications, window manager, taskbar, Start menu, portfolio data, and chat adapter remain unchanged.

## 9. Testing Strategy

Implementation will follow test-driven development.

### Component coverage

- Boot screen exposes the Rosebeg XP identity and progress indicator.
- The removed `Starting Windows...` copy is absent.
- Login screen exposes its main structural regions and Harry button.
- Login footer copy is present.
- Signing-in state preserves the login shell and exposes both status messages.
- Accessibility names remain stable.

### Existing behavioral regression

- Normal boot remains exactly 1,800 ms.
- Normal sign-in remains exactly 650 ms.
- Reduced-motion timed phases remain exactly 150 ms.
- Logoff returns to the redesigned login screen.
- Restart still enters a new boot sequence.

### Visual regression

Playwright snapshots will cover at least:

- Desktop boot screen.
- Desktop login screen.
- Narrow/mobile login screen.
- Signing-in state where timing control permits a deterministic capture.

## 10. Acceptance Criteria

The work is accepted when:

- The boot screen is immediately recognizable as an XP-style boot sequence without relying on the words `Windows XP`.
- All visible system branding on the new screens reads `Rosebeg XP` or `Rosebeg`.
- The login screen contains the characteristic header, central field, footer, divider, instruction block, and account tile.
- The screens remain composed rather than sparse at 2048×1152 and remain readable without horizontal scrolling at 320×568.
- Existing system timings and transitions still pass their tests.
- Reduced-motion behavior, keyboard operation, and focus visibility are preserved.
- Unit/component tests, type checking, production build, end-to-end tests, and updated visual comparisons pass before completion.

