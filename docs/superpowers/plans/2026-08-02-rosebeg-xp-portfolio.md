# Rosebeg V2 Windows XP Portfolio Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and publish a faithful Windows XP-style personal portfolio with a boot/login flow, custom multi-window desktop, project Explorer, complete photo browser and viewer, Markdown Notepad, and AI-ready Harry Messenger.

**Architecture:** A Vite React 19 single-page app owns two explicit state domains: a system-phase reducer for boot/login/power transitions and a window-manager reducer for application instances. Static typed content copied from Rosebeg V1 feeds isolated application components; the desktop shell composes those apps through a registry and keeps Start, taskbar, window focus, and power actions synchronized.

**Tech Stack:** React 19, TypeScript, Vite, hand-authored CSS, React Markdown, Vitest, React Testing Library, Playwright, Git, GitHub CLI.

## Global Constraints

- Work only in `C:\Users\Administrator\Desktop\Rosebeg V2`; read V1 from `C:\Users\Administrator\Desktop\Rosebeg` without modifying it.
- Use React 19, TypeScript, and Vite; do not use `xp.css` or another XP component library.
- Build XP Luna chrome and behavior in the repository with locally stored production assets and no runtime hotlinks.
- Preserve all 15 approved V1 photographs and the nine approved project folders.
- Every app launch creates a separate window instance with its own taskbar button.
- Windows use bounded adaptive defaults and never maximize automatically.
- A hard load starts at boot; Log Off returns to login; Turn Off reaches powered-off; Restart replays boot.
- The first Messenger release is local and explicit about AI not being connected; never ship an API key or secret.
- Do not call the GitHub API at runtime. Project and contact content is static and source-controlled.
- Keep all user-facing website copy in English.
- Support keyboard operation and `prefers-reduced-motion` without removing functional states.
- Task 1 configuration/scaffolding files and Task 9 generated bitmap assets are approved TDD exceptions. Validate configuration through install, type-check, test, and build commands, and validate bitmap assets through native-size visual inspection. All runtime behavior still follows strict red-green-refactor.
- Use `npm.cmd` rather than `npm` in PowerShell commands because the local execution policy blocks `npm.ps1`.
- Keep the Git default branch as `main`; publish only after every verification command passes.
- Final remote is the public repository `Ha22yX/rosebeg-v2`.

---

## File Map

### Foundation

- `.gitignore`: dependency, build, coverage, Playwright, environment, and editor exclusions.
- `package.json` / `package-lock.json`: scripts and locked dependencies.
- `tsconfig.json`: strict TypeScript configuration.
- `vite.config.ts`: React, `@` alias, and Vitest configuration.
- `playwright.config.ts`: Chromium and local Vite server configuration.
- `index.html`: application host and public metadata.
- `src/main.tsx`: React root.
- `src/app/App.tsx`: final system composition.
- `src/app/app.css`: global reset, sizing, and root stage.
- `src/test/setup.ts`: Testing Library setup.

### Content

- `src/content/types.ts`: project, photo, contact, and chat content types.
- `src/content/projects.ts`: nine project records.
- `src/content/photos.ts`: 15 V1 photo records.
- `src/content/contacts.ts`: four already-public contact channels.
- `src/content/about.md`: About document.
- `src/content/about.ts`: raw Markdown export.
- `src/content/chat-responses.ts`: local Messenger copy.
- `public/assets/photos/`: copied V1 large and thumbnail images.
- `public/assets/wallpaper/`: original XP-inspired wallpaper.
- `public/assets/icons/`: original XP-style application icons.

### System and windowing

- `src/system/types.ts`: system phases and events.
- `src/system/system-reducer.ts`: pure phase transitions.
- `src/system/SystemRoot.tsx`: timers and phase rendering.
- `src/system/BootScreen.tsx`: short boot experience.
- `src/system/LoginScreen.tsx`: Harry account selection.
- `src/system/PowerScreen.tsx`: logging-off, shutting-down, and powered-off states.
- `src/system/system.css`: full-screen phase styling.
- `src/windowing/types.ts`: window IDs, payloads, definitions, bounds, and actions.
- `src/windowing/bounds.ts`: adaptive initial and clamped bounds.
- `src/windowing/window-reducer.ts`: pure multi-window state transitions.
- `src/windowing/WindowManager.tsx`: provider, app resolution, and window layer.
- `src/windowing/WindowFrame.tsx`: XP frame, controls, drag, and resize.
- `src/windowing/windowing.css`: active/inactive frames and resizing handles.

### XP shell and shared controls

- `src/shared/XpButton.tsx`: reusable pressed/focus button.
- `src/shared/XpDialog.tsx`: modal XP dialog.
- `src/shared/XpIcon.tsx`: local icon asset mapping.
- `src/shared/AppErrorBoundary.tsx`: per-window crash containment.
- `src/shared/usePrefersReducedMotion.ts`: media-query subscription.
- `src/shared/xp-theme.css`: Luna tokens, bevels, typography, and control states.
- `src/desktop/DesktopShell.tsx`: wallpaper, icons, Start, taskbar, and dialogs.
- `src/desktop/DesktopIcon.tsx`: mouse, touch, and keyboard launch behavior.
- `src/desktop/StartMenu.tsx`: two-column XP menu.
- `src/desktop/Taskbar.tsx`: Start, task buttons, tray, and clock.
- `src/desktop/PowerDialog.tsx`: Log Off and Turn Off choices.
- `src/desktop/app-registry.tsx`: application definitions and render adapters.
- `src/desktop/desktop.css`: desktop, menu, taskbar, and responsive shell.

### Applications

- `src/apps/projects/project-history.ts`: Explorer location and history reducer.
- `src/apps/projects/ProjectsExplorer.tsx`: project root and detail Folder Web View.
- `src/apps/projects/projects.css`: Explorer toolbar, task pane, file area, and views.
- `src/apps/photos/photo-state.ts`: index, zoom, rotation, and view helpers.
- `src/apps/photos/PicturesBrowser.tsx`: all-photo thumbnails, filmstrip, and list.
- `src/apps/photos/PictureViewer.tsx`: independent image viewer window.
- `src/apps/photos/photos.css`: browser and viewer layouts.
- `src/apps/about/AboutNotepad.tsx`: read-only Markdown document.
- `src/apps/about/about.css`: Notepad menus, page, and status bar.
- `src/apps/messenger/chat-service.ts`: typed service contract.
- `src/apps/messenger/local-chat-service.ts`: deterministic first-release adapter.
- `src/apps/messenger/HarryMessenger.tsx`: one-contact chat UI.
- `src/apps/messenger/messenger.css`: XP Messenger layout.

### Tests and documentation

- `src/**/*.test.ts(x)`: colocated state and component tests.
- `tests/e2e/system-flow.spec.ts`: boot, login, logoff, shutdown, and restart.
- `tests/e2e/windows.spec.ts`: multi-instance and taskbar behavior.
- `tests/e2e/apps.spec.ts`: Explorer, photos, Notepad, and Messenger.
- `tests/e2e/visual.spec.ts`: target-viewport screenshots.
- `tests/e2e/helpers.ts`: login and window-query helpers.
- `docs/screenshots/`: final README screenshots.
- `README.md`: project overview, controls, local commands, content source, and verification.

---

### Task 1: Create the Tested React Foundation

**Files:**
- Create: `.gitignore`
- Create: `package.json`
- Create: `package-lock.json`
- Create: `tsconfig.json`
- Create: `vite.config.ts`
- Create: `playwright.config.ts`
- Create: `index.html`
- Create: `src/vite-env.d.ts`
- Create: `src/test/setup.ts`
- Create: `src/main.tsx`
- Create: `src/app/App.tsx`
- Create: `src/app/App.test.tsx`
- Create: `src/app/app.css`

**Interfaces:**
- Consumes: Approved design spec at `docs/superpowers/specs/2026-08-02-rosebeg-xp-portfolio-design.md`.
- Produces: `App(): JSX.Element`, `@` path alias, `npm.cmd test`, `npm.cmd run check`, `npm.cmd run build`, `npm.cmd run test:e2e`, and a Playwright Chromium server target.

- [ ] **Step 1: Write the foundation configuration and failing smoke test**

Create `package.json` with these scripts and dependency ranges:

```json
{
  "name": "rosebeg-v2",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite --host 127.0.0.1",
    "check": "tsc --noEmit",
    "build": "tsc --noEmit && vite build",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test",
    "test:visual": "playwright test tests/e2e/visual.spec.ts"
  },
  "dependencies": {
    "react": "^19.2.7",
    "react-dom": "^19.2.7",
    "react-markdown": "^10.1.0"
  },
  "devDependencies": {
    "@playwright/test": "^1.55.0",
    "@testing-library/jest-dom": "^6.9.1",
    "@testing-library/react": "^16.3.0",
    "@testing-library/user-event": "^14.6.1",
    "@types/react": "^19.2.0",
    "@types/react-dom": "^19.2.0",
    "@vitejs/plugin-react": "^5.2.0",
    "jsdom": "^26.1.0",
    "typescript": "^7.0.2",
    "vite": "^7.0.0",
    "vitest": "^3.2.4"
  }
}
```

Configure strict TypeScript, the `@ -> src` alias, jsdom tests with `globals: true`, `src/test/setup.ts`, and Playwright's `webServer` command `npm.cmd run dev`. Include `vite/client`, `vitest/globals`, and `@testing-library/jest-dom` in TypeScript test types. Exclude `node_modules`, `dist`, `coverage`, `playwright-report`, `test-results`, `.env`, `.env.*`, and debug images in `.gitignore`.

Write the failing smoke test:

```tsx
import { render, screen } from "@testing-library/react";
import { App } from "@/app/App";

describe("App", () => {
  it("mounts the Rosebeg XP system root", () => {
    render(<App />);
    expect(screen.getByLabelText("Rosebeg XP system")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Install dependencies and verify the smoke test fails for the missing app**

Run:

```powershell
npm.cmd install
npx.cmd playwright install chromium
npm.cmd test -- --run src/app/App.test.tsx
```

Expected: dependency installation succeeds; the test command fails because `@/app/App` does not exist yet.

- [ ] **Step 3: Implement the minimal typed application root**

Create `src/app/App.tsx` and root wiring:

```tsx
import "@/app/app.css";

export function App() {
  return <div aria-label="Rosebeg XP system" className="app-root" />;
}
```

`src/main.tsx` must render `<App />` inside `StrictMode`, and `app.css` must make `html`, `body`, `#root`, and `.app-root` fill `100%` with no page scrolling.

- [ ] **Step 4: Run the foundation checks**

Run:

```powershell
npm.cmd test -- --run src/app/App.test.tsx
npm.cmd run check
npm.cmd run build
```

Expected: one smoke test passes, TypeScript exits 0, and Vite creates `dist`.

- [ ] **Step 5: Commit the foundation**

```powershell
git add .gitignore package.json package-lock.json tsconfig.json vite.config.ts playwright.config.ts index.html src
git commit -m "chore: scaffold tested React portfolio"
```

---

### Task 2: Migrate and Validate the V1 Content

**Files:**
- Create: `src/content/types.ts`
- Create: `src/content/projects.ts`
- Create: `src/content/photos.ts`
- Create: `src/content/contacts.ts`
- Create: `src/content/about.md`
- Create: `src/content/about.ts`
- Create: `src/content/chat-responses.ts`
- Create: `src/content/content.test.ts`
- Create: `public/assets/photos/*`

**Interfaces:**
- Consumes: V1 `src/App.tsx`, `public/project-card-swap/script.js`, `src/components/SocialSignalPorts.tsx`, and `public/assets/photography/`.
- Produces: `projects: readonly Project[]`, `photos: readonly PhotoItem[]`, `contacts: readonly ContactChannel[]`, `aboutMarkdown: string`, and `localChatCopy`.

- [ ] **Step 1: Write failing content-integrity tests**

```ts
import { contacts } from "@/content/contacts";
import { photos } from "@/content/photos";
import { projects } from "@/content/projects";

describe("portfolio content", () => {
  it("contains the approved nine project folders in order", () => {
    expect(projects.map(({ slug }) => slug)).toEqual([
      "auto-email-system",
      "bridge-us-v2",
      "mother-ship-docking-drone-system",
      "dxf-auto-shape-tool",
      "esp32-sound-radar",
      "sat-ai-tutor",
      "photoback",
      "dayvault",
      "gridopoly",
    ]);
  });

  it("contains 15 uniquely addressed V1 photographs", () => {
    expect(photos).toHaveLength(15);
    expect(new Set(photos.map(({ slug }) => slug)).size).toBe(15);
    expect(photos.every(({ thumbnailSrc, imageSrc }) =>
      thumbnailSrc.startsWith("/assets/photos/") && imageSrc.startsWith("/assets/photos/"),
    )).toBe(true);
  });

  it("keeps only the four already-public contact channels", () => {
    expect(contacts.map(({ label }) => label)).toEqual(["GitHub", "WeChat", "Instagram", "Email"]);
  });
});
```

- [ ] **Step 2: Run the content test and verify it fails**

Run:

```powershell
npm.cmd test -- --run src/content/content.test.ts
```

Expected: FAIL because the content modules do not exist.

- [ ] **Step 3: Define exact content types and the nine project records**

Use these public shapes:

```ts
export type ProjectCategory = "software" | "robotics" | "electronics" | "creative-tool";

export type ProjectFile = {
  kind: "folder" | "file" | "shortcut";
  name: string;
  label?: string;
  href?: string;
};

export type Project = {
  slug: string;
  name: string;
  kicker: string;
  tagline: string;
  story: string;
  category: ProjectCategory;
  stack: readonly string[];
  sourceUrl: string;
  websiteUrl?: string;
  files: readonly ProjectFile[];
};

export type PhotoItem = {
  slug: string;
  title: string;
  description: string;
  thumbnailSrc: string;
  imageSrc: string;
  aspectRatio: number;
};

export type ContactChannel = {
  label: "GitHub" | "WeChat" | "Instagram" | "Email";
  handle: string;
  href: string;
  description: string;
};
```

Transcribe the approved V1 stories and file snapshots from `C:\Users\Administrator\Desktop\Rosebeg\public\project-card-swap\script.js` lines 31-228. Use this exact manifest for identity, ordering, categories, stacks, and links:

| Slug | Name | Kicker | Category | Stack | Source | Demo |
|---|---|---|---|---|---|---|
| `auto-email-system` | Auto Email System | Personal Attention Filter | software | React, Express, IMAP, WeChat | `https://github.com/Ha22yX/auto-email-system` | none |
| `bridge-us-v2` | Bridge US V2 | Student-Life Mutual Aid Platform | software | React, FastAPI, Tailwind, AI Q&A | `https://github.com/Ha22yX/Bridge-US-V2` | `https://bridge-us.org/` |
| `mother-ship-docking-drone-system` | Mother-Ship Docking Drone System | Layered Drone Localization | robotics | PX4, UWB, AprilTag, Python | `https://github.com/Ha22yX/Mother-Ship-Docking-Drone-System` | `https://isef.rosebeg.com/` |
| `dxf-auto-shape-tool` | Surfboard Vacuum Table DXF Generator | Factory Workflow Automation | creative-tool | Python, FastAPI, ezdxf, SVG | `https://github.com/Ha22yX/dxf-auto-shape-tool` | none |
| `esp32-sound-radar` | ESP32 Sound Radar | Sound Direction Experiment | electronics | ESP32-S3, Arduino, I2S, TDOA | `https://github.com/Ha22yX/ESP32-Sound-Radar` | none |
| `sat-ai-tutor` | SAT AI Tutor | Human-Like Study Companion | software | Next.js, Flask, OpenAI, Docker | `https://github.com/Ha22yX/SAT-AI-Tutor` | `https://sat.rosebeg.com/auth/login?demo=1` |
| `photoback` | PhotoBack | Photography Delivery Workflow | creative-tool | Flask, SQLite, Pillow, Google Drive | `https://github.com/Ha22yX/PhotoBack` | `https://photoback.rosebeg.com/view/8b6ab9d9` |
| `dayvault` | DayVault | All-Day Voice Logger | electronics | STM32L452, dual PDM microphones, microSD, USB-C, RTC | `https://github.com/Ha22yX/DayVault` | none |
| `gridopoly` | Gridopoly | Modular Smart Board Platform | electronics | ESP32-S3, RS485, 125 kHz RFID, ST7789, addressable LEDs | `https://github.com/Ha22yX/Gridopoly` | none |

Use the V1 tagline as `tagline` and V1 summary as `story` for the first seven rows. DayVault uses `tagline: "A compact all-day voice logger designed around low-power recording, dual digital microphones, removable storage, and dependable timekeeping."` and `story: "DayVault turns a complete embedded audio-capture concept into documented hardware: STM32L452 control, two PDM microphones, microSD storage, USB-C, and an RTC in a compact wearable-oriented design."`. Gridopoly uses `tagline: "A modular electronic board-game platform made from rearrangeable smart tiles that sense pieces, display state, and communicate over a shared bus."` and `story: "Each tile combines RFID, a color display, addressable light, and RS485 networking around an ESP32-S3 so physical board layouts can become programmable game systems."`.

Copy the first seven `files` arrays exactly from V1. DayVault uses folder entries `DayVault` and `hardware`, file `README.md`, file `voice-logger.kicad`, and shortcut `github.url`. Gridopoly uses folder entries `Gridopoly`, `hardware`, and `firmware`, file `README.md`, and shortcut `github.url`. These are labeled portfolio snapshots, not claims about live repository tree enumeration. Do not add a GitHub language or topics field for DayVault or Gridopoly.

- [ ] **Step 4: Copy the 15 real photo pairs and create the exact catalog**

Copy V1's photography directory without editing V1:

```powershell
Copy-Item -LiteralPath 'C:\Users\Administrator\Desktop\Rosebeg\public\assets\photography' -Destination 'C:\Users\Administrator\Desktop\Rosebeg V2\public\assets\photos' -Recurse
```

Create records in this exact order, preserving V1 filenames, titles, descriptions, and aspect ratios: Stone Gate, Underline Skyline, Crosswalk Heat, Library Drift, Harbor Weather, Window Afterimage, Wall Feathers, Cloud Needle, Avenue Signal, Atrium Pulse, Amber Room, White Cross, Grid Horizon, Gold Recital, Night Pavilion.

Use this complete catalog:

```ts
export const photos = [
  {
    slug: "stone-gate",
    title: "Stone Gate",
    description: "A quiet threshold held in old masonry and winter light.",
    thumbnailSrc: "/assets/photos/signal-plain-thumb.jpg",
    imageSrc: "/assets/photos/signal-plain-large.jpg",
    aspectRatio: 2400 / 1800,
  },
  {
    slug: "underline-skyline",
    title: "Underline Skyline",
    description: "A city cut by shadow, steel, and a distant tower.",
    thumbnailSrc: "/assets/photos/violet-street-thumb.jpg",
    imageSrc: "/assets/photos/violet-street-large.jpg",
    aspectRatio: 2400 / 1800,
  },
  {
    slug: "crosswalk-heat",
    title: "Crosswalk Heat",
    description: "Street geometry washed in red light and noon glare.",
    thumbnailSrc: "/assets/photos/quiet-edge-thumb.jpg",
    imageSrc: "/assets/photos/quiet-edge-large.jpg",
    aspectRatio: 2400 / 1800,
  },
  {
    slug: "library-drift",
    title: "Library Drift",
    description: "A soft corridor of books dissolving into focus.",
    thumbnailSrc: "/assets/photos/night-current-thumb.jpg",
    imageSrc: "/assets/photos/night-current-large.jpg",
    aspectRatio: 2400 / 1173,
  },
  {
    slug: "harbor-weather",
    title: "Harbor Weather",
    description: "Blue air, water, and towers held in a clean horizon.",
    thumbnailSrc: "/assets/photos/glass-weather-thumb.jpg",
    imageSrc: "/assets/photos/glass-weather-large.jpg",
    aspectRatio: 2400 / 1597,
  },
  {
    slug: "window-afterimage",
    title: "Window Afterimage",
    description: "The city reduced to panes, silhouettes, and late light.",
    thumbnailSrc: "/assets/photos/afterimage-thumb.jpg",
    imageSrc: "/assets/photos/afterimage-large.jpg",
    aspectRatio: 1655 / 2400,
  },
  {
    slug: "wall-feathers",
    title: "Wall Feathers",
    description: "A black wall bird turning masonry into motion.",
    thumbnailSrc: "/assets/photos/mural-bird-thumb.jpg",
    imageSrc: "/assets/photos/mural-bird-large.jpg",
    aspectRatio: 8657 / 6493,
  },
  {
    slug: "cloud-needle",
    title: "Cloud Needle",
    description: "Glass towers held under fast blue weather.",
    thumbnailSrc: "/assets/photos/skyline-cloud-thumb.jpg",
    imageSrc: "/assets/photos/skyline-cloud-large.jpg",
    aspectRatio: 7453 / 9937,
  },
  {
    slug: "avenue-signal",
    title: "Avenue Signal",
    description: "Warm traffic, vertical signs, and a tower cutting through.",
    thumbnailSrc: "/assets/photos/avenue-signal-thumb.jpg",
    imageSrc: "/assets/photos/avenue-signal-large.jpg",
    aspectRatio: 6422 / 8562,
  },
  {
    slug: "atrium-pulse",
    title: "Atrium Pulse",
    description: "A stained ceiling folding light into a radial frame.",
    thumbnailSrc: "/assets/photos/glass-roof-thumb.jpg",
    imageSrc: "/assets/photos/glass-roof-large.jpg",
    aspectRatio: 9868 / 7401,
  },
  {
    slug: "amber-room",
    title: "Amber Room",
    description: "Quiet chairs and red window light inside a still library.",
    thumbnailSrc: "/assets/photos/reading-room-thumb.jpg",
    imageSrc: "/assets/photos/reading-room-large.jpg",
    aspectRatio: 10567 / 7925,
  },
  {
    slug: "white-cross",
    title: "White Cross",
    description: "Architecture reduced to edge, shadow, and negative space.",
    thumbnailSrc: "/assets/photos/architectural-cross-thumb.jpg",
    imageSrc: "/assets/photos/architectural-cross-large.jpg",
    aspectRatio: 11656 / 8742,
  },
  {
    slug: "grid-horizon",
    title: "Grid Horizon",
    description: "A skyline seen through the measured rhythm of glass.",
    thumbnailSrc: "/assets/photos/window-grid-thumb.jpg",
    imageSrc: "/assets/photos/window-grid-large.jpg",
    aspectRatio: 11656 / 8742,
  },
  {
    slug: "gold-recital",
    title: "Gold Recital",
    description: "Seasonal light, music, and a small crowd gathered in warmth.",
    thumbnailSrc: "/assets/photos/holiday-stage-thumb.jpg",
    imageSrc: "/assets/photos/holiday-stage-large.jpg",
    aspectRatio: 11656 / 8742,
  },
  {
    slug: "night-pavilion",
    title: "Night Pavilion",
    description: "A luminous frame glowing against the evening field.",
    thumbnailSrc: "/assets/photos/night-pavilion-thumb.jpg",
    imageSrc: "/assets/photos/night-pavilion-large.jpg",
    aspectRatio: 11656 / 4826,
  },
] satisfies readonly PhotoItem[];
```

- [ ] **Step 5: Create contacts, About Markdown, and local chat copy**

Contacts must contain these exact public endpoints:

```ts
export const contacts = [
  { label: "GitHub", handle: "@Ha22yX", href: "https://github.com/Ha22yX", description: "Code archive" },
  { label: "WeChat", handle: "imxzy945", href: "weixin://contacts/profile/imxzy945", description: "Private signal" },
  { label: "Instagram", handle: "@ha22yx", href: "https://www.instagram.com/ha22yx/", description: "Field images" },
  { label: "Email", handle: "ha22y.xing@gmail.com", href: "mailto:ha22y.xing@gmail.com", description: "Direct channel" },
] satisfies readonly ContactChannel[];
```

Write `about.md` with this hierarchy and the approved V1 claims:

```markdown
# Zhiyuan Xing / HarryX

Student developer, researcher, photographer, and designer building AI tools, autonomous systems, full-stack products, and intentional interfaces.

## Developer

I build intelligent systems, web experiences, and tools that turn ideas into working products.

- AI systems
- Full-stack development
- Creative coding

## Researcher

I explore autonomous systems, multi-sensor fusion, and high-precision UAV coordination.

- UAV autonomy
- Sensor fusion
- Prototyping

## Photographer

I document architecture, street light, and quiet moments that are easy to overlook.

- Architecture
- Street
- Visual storytelling

## Designer

I shape interfaces, identities, and digital atmospheres where technology feels intentional.

- Interface
- Motion
- Visual identity

## Contact

- [GitHub](https://github.com/Ha22yX)
- [Instagram](https://www.instagram.com/ha22yx/)
- [Email](mailto:ha22y.xing@gmail.com)
```

Export it through `about.ts` with `import aboutMarkdown from "./about.md?raw"`. Define `localChatCopy` with a welcome sentence, project response, photography response, contact response, AI-not-connected response, and offline fallback.

- [ ] **Step 6: Run content checks and verify binary coverage**

Run:

```powershell
npm.cmd test -- --run src/content/content.test.ts
npm.cmd run check
(Get-ChildItem -LiteralPath 'public\assets\photos' -File).Count
```

Expected: all content tests pass, TypeScript exits 0, and the photo directory contains 30 JPEG files.

- [ ] **Step 7: Commit the content migration**

```powershell
git add src/content public/assets/photos
git commit -m "feat: migrate verified portfolio content"
```

---

### Task 3: Implement the Boot, Login, and Power State Machine

**Files:**
- Create: `src/system/types.ts`
- Create: `src/system/system-reducer.ts`
- Create: `src/system/system-reducer.test.ts`
- Create: `src/system/SystemRoot.tsx`
- Create: `src/system/SystemRoot.test.tsx`
- Create: `src/system/BootScreen.tsx`
- Create: `src/system/LoginScreen.tsx`
- Create: `src/system/PowerScreen.tsx`
- Create: `src/system/system.css`
- Modify: `src/app/App.tsx`

**Interfaces:**
- Consumes: `usePrefersReducedMotion` will be introduced in Task 10; until then `SystemRoot` accepts `reducedMotion?: boolean` for deterministic tests.
- Produces: `SystemPhase`, `SystemEvent`, `systemReducer`, and `SystemRoot({ children, reducedMotion? })`.

- [ ] **Step 1: Write failing reducer tests for every approved transition**

```ts
import { initialSystemState, systemReducer } from "@/system/system-reducer";

describe("systemReducer", () => {
  it("boots, signs in, logs off, shuts down, and restarts", () => {
    const login = systemReducer(initialSystemState, { type: "BOOT_FINISHED" });
    expect(login.phase).toBe("login");

    const signingIn = systemReducer(login, { type: "SELECT_ACCOUNT" });
    expect(systemReducer(signingIn, { type: "SIGN_IN_FINISHED" }).phase).toBe("desktop");

    const loggingOff = systemReducer({ phase: "desktop" }, { type: "CONFIRM_LOG_OFF" });
    expect(systemReducer(loggingOff, { type: "LOG_OFF_FINISHED" }).phase).toBe("login");

    const shuttingDown = systemReducer({ phase: "desktop" }, { type: "CONFIRM_TURN_OFF" });
    const poweredOff = systemReducer(shuttingDown, { type: "SHUTDOWN_FINISHED" });
    expect(poweredOff.phase).toBe("powered-off");
    expect(systemReducer(poweredOff, { type: "RESTART" }).phase).toBe("booting");
  });
});
```

- [ ] **Step 2: Run the reducer test and verify it fails**

Run:

```powershell
npm.cmd test -- --run src/system/system-reducer.test.ts
```

Expected: FAIL because the state modules do not exist.

- [ ] **Step 3: Implement the pure state model**

Use these exact public types:

```ts
export type SystemPhase =
  | "booting"
  | "login"
  | "signing-in"
  | "desktop"
  | "logging-off"
  | "shutting-down"
  | "powered-off";

export type SystemEvent =
  | { type: "BOOT_FINISHED" }
  | { type: "SELECT_ACCOUNT" }
  | { type: "SIGN_IN_FINISHED" }
  | { type: "CONFIRM_LOG_OFF" }
  | { type: "LOG_OFF_FINISHED" }
  | { type: "CONFIRM_TURN_OFF" }
  | { type: "CONFIRM_RESTART" }
  | { type: "SHUTDOWN_FINISHED" }
  | { type: "RESTART" };
```

`CONFIRM_RESTART` enters `shutting-down` and stores `restartAfterShutdown: true`; `SHUTDOWN_FINISHED` then returns `booting`. Invalid events return the current state unchanged.

- [ ] **Step 4: Write failing component timing and account-selection tests**

Use fake timers to assert `booting -> login`, click the uniquely named `Harry` account button, advance 650 ms, and assert the desktop child appears. Add a powered-off test that clicks `Restart` and returns to the boot screen.

```tsx
render(<SystemRoot reducedMotion><div>Desktop child</div></SystemRoot>);
expect(screen.getByTestId("boot-screen")).toBeInTheDocument();
act(() => vi.advanceTimersByTime(150));
await user.click(screen.getByRole("button", { name: "Harry" }));
act(() => vi.advanceTimersByTime(150));
expect(screen.getByText("Desktop child")).toBeInTheDocument();
```

- [ ] **Step 5: Implement the timed phase renderer and XP screens**

`SystemRoot` owns `useReducer(systemReducer, initialSystemState)`, uses effect timers with cleanup, renders phase-specific screens, and exposes logoff/power callbacks to its desktop child through a typed `SystemActionsContext`:

```ts
export type SystemActions = {
  requestLogOff(): void;
  requestTurnOff(): void;
  requestRestart(): void;
};
```

Boot, login, and power screens must use `data-testid` values `boot-screen`, `login-screen`, `signing-in-screen`, `logging-off-screen`, `shutting-down-screen`, and `powered-off-screen`. The login account is an actual button named `Harry`.

- [ ] **Step 6: Verify the state feature**

Run:

```powershell
npm.cmd test -- --run src/system
npm.cmd run check
```

Expected: reducer and component tests pass with no orphan timer warnings.

- [ ] **Step 7: Commit the system flow**

```powershell
git add src/system src/app/App.tsx
git commit -m "feat: add XP boot and power state machine"
```

---

### Task 4: Build the Adaptive Multi-Window Manager and XP Frame

**Files:**
- Create: `src/windowing/types.ts`
- Create: `src/windowing/bounds.ts`
- Create: `src/windowing/bounds.test.ts`
- Create: `src/windowing/window-reducer.ts`
- Create: `src/windowing/window-reducer.test.ts`
- Create: `src/windowing/WindowManager.tsx`
- Create: `src/windowing/WindowManager.test.tsx`
- Create: `src/windowing/WindowFrame.tsx`
- Create: `src/windowing/windowing.css`
- Create: `src/shared/XpButton.tsx`
- Create: `src/shared/XpDialog.tsx`
- Create: `src/shared/XpIcon.tsx`
- Create: `src/shared/xp-theme.css`

**Interfaces:**
- Consumes: Available desktop rectangle from `DesktopShell` in Task 9.
- Produces: `AppId`, `WindowPayload`, `WindowDefinition`, `WindowInstance`, `fitInitialBounds`, `clampBounds`, `windowReducer`, `WindowManagerProvider`, and `useWindowManager()`.

- [ ] **Step 1: Write failing bounds and reducer tests**

```ts
import { fitInitialBounds } from "@/windowing/bounds";
import { initialWindowState, windowReducer } from "@/windowing/window-reducer";
import type { WindowDefinition } from "@/windowing/types";

const projectWindowDefinition: WindowDefinition = {
  appId: "projects-explorer",
  title: "My Projects",
  icon: "/assets/icons/projects.png",
  idealSize: { width: 900, height: 620 },
  minimumSize: { width: 520, height: 420 },
};

describe("windowing", () => {
  it("fits an Explorer window on narrow and wide desktops without maximizing", () => {
    expect(fitInitialBounds(projectWindowDefinition, { width: 390, height: 812 }, 0))
      .toMatchObject({ width: 366, height: 788 });
    expect(fitInitialBounds(projectWindowDefinition, { width: 1920, height: 1048 }, 0))
      .toMatchObject({ width: 900, height: 620 });
  });

  it("creates independent instances and restores maximized bounds", () => {
    const once = windowReducer(initialWindowState, { type: "LAUNCH", id: "w1", definition: projectWindowDefinition, payload: {} });
    const twice = windowReducer(once, { type: "LAUNCH", id: "w2", definition: projectWindowDefinition, payload: {} });
    expect(twice.windows.map(({ id }) => id)).toEqual(["w1", "w2"]);
    const maximized = windowReducer(twice, { type: "MAXIMIZE", id: "w1" });
    expect(windowReducer(maximized, { type: "RESTORE", id: "w1" }).windows[0].state).toBe("normal");
  });
});
```

- [ ] **Step 2: Run the windowing tests and verify they fail**

Run:

```powershell
npm.cmd test -- --run src/windowing/bounds.test.ts src/windowing/window-reducer.test.ts
```

Expected: FAIL because the modules do not exist.

- [ ] **Step 3: Define the exact public window types**

```ts
import type { ReactNode } from "react";

export type AppId =
  | "projects-explorer"
  | "pictures-browser"
  | "picture-viewer"
  | "about-notepad"
  | "harry-messenger";

export type WindowPayload = { photoSlug?: string; projectSlug?: string };
export type WindowMode = "normal" | "minimized" | "maximized";
export type Rect = { x: number; y: number; width: number; height: number };

export type WindowDefinition = {
  appId: AppId;
  title: string;
  icon: string;
  idealSize: { width: number; height: number };
  minimumSize: { width: number; height: number };
};

export type WindowAppContext = {
  windowId: string;
  payload: WindowPayload;
  close(): void;
  launch(appId: AppId, payload?: WindowPayload): string;
};

export type WindowRegistryEntry = WindowDefinition & {
  render(context: WindowAppContext): ReactNode;
};

export type WindowRegistry = Partial<Record<AppId, WindowRegistryEntry>>;

export type WindowInstance = {
  id: string;
  appId: AppId;
  title: string;
  icon: string;
  mode: WindowMode;
  bounds: Rect;
  restoreBounds: Rect;
  zIndex: number;
  payload: WindowPayload;
};
```

Define reducer actions for `LAUNCH`, `FOCUS`, `MOVE`, `RESIZE`, `MINIMIZE`, `MAXIMIZE`, `RESTORE`, `TOGGLE_TASKBAR`, `CLOSE`, `CLOSE_ALL`, and `SET_DESKTOP_SIZE`. `LAUNCH` has the exact shape `{ type: "LAUNCH"; id: string; definition: WindowDefinition; payload: WindowPayload }`, allowing the pure reducer to calculate bounds without importing the React registry.

- [ ] **Step 4: Implement adaptive bounds and pure reducer behavior**

`fitInitialBounds` uses a 12-pixel margin, preserves the ideal size when it fits, shrinks below nominal minimum only when the viewport requires it, centers the first window, and applies a 22-pixel cascade offset that wraps before leaving the desktop. `clampBounds` keeps at least the entire title bar and all resize handles inside the usable desktop.

`MAXIMIZE` stores the current normal bounds, `RESTORE` reinstates them, `MINIMIZE` preserves them, `TOGGLE_TASKBAR` minimizes the focused visible window and restores/focuses a minimized or background window, and `SET_DESKTOP_SIZE` reclamps every normal window.

- [ ] **Step 5: Write a failing provider/frame interaction test**

Render a provider with a one-entry registry, launch two windows, assert two headings and two frame controls, click the first window's Minimize button, then invoke its task action and assert it becomes visible again. Use accessible names that include each window title.

- [ ] **Step 6: Implement the provider, context, frame controls, dragging, and resizing**

Export this exact context contract:

```ts
export type WindowManagerApi = {
  windows: readonly WindowInstance[];
  activeWindowId: string | null;
  launch(appId: AppId, payload?: WindowPayload): string;
  focus(id: string): void;
  minimize(id: string): void;
  maximize(id: string): void;
  restore(id: string): void;
  toggleTaskbar(id: string): void;
  close(id: string): void;
  closeAll(): void;
};
```

Pointer events on the title bar move normal windows. Eight resize handles resize normal windows. Pointer capture is released on completion and cleanup. Buttons are actual `<button>` elements named `Minimize <title>`, `Maximize <title>` or `Restore <title>`, and `Close <title>`. Double-clicking the title bar toggles maximize/restore.

- [ ] **Step 7: Verify all window behavior**

Run:

```powershell
npm.cmd test -- --run src/windowing
npm.cmd run check
```

Expected: bounds, reducer, provider, and frame tests pass; no window starts maximized.

- [ ] **Step 8: Commit the window manager**

```powershell
git add src/windowing src/shared
git commit -m "feat: build adaptive XP window manager"
```

---

### Task 5: Build My Projects Explorer

**Files:**
- Create: `src/apps/projects/project-history.ts`
- Create: `src/apps/projects/project-history.test.ts`
- Create: `src/apps/projects/ProjectsExplorer.tsx`
- Create: `src/apps/projects/ProjectsExplorer.test.tsx`
- Create: `src/apps/projects/projects.css`

**Interfaces:**
- Consumes: `projects: readonly Project[]` from Task 2 and XP controls from Task 4.
- Produces: `ProjectLocation`, `ExplorerState`, `explorerReducer`, and `ProjectsExplorer({ initialProjectSlug? })`.

- [ ] **Step 1: Write failing Explorer history tests**

```ts
import { explorerReducer, initialExplorerState } from "@/apps/projects/project-history";

describe("project Explorer history", () => {
  it("navigates root, project, back, forward, and up", () => {
    const project = explorerReducer(initialExplorerState, { type: "OPEN_PROJECT", slug: "sat-ai-tutor" });
    expect(project.current).toEqual({ kind: "project", slug: "sat-ai-tutor" });
    const back = explorerReducer(project, { type: "BACK" });
    expect(back.current).toEqual({ kind: "root" });
    expect(explorerReducer(back, { type: "FORWARD" }).current).toEqual(project.current);
    expect(explorerReducer(project, { type: "UP" }).current).toEqual({ kind: "root" });
  });
});
```

- [ ] **Step 2: Run the history test and verify it fails**

Run:

```powershell
npm.cmd test -- --run src/apps/projects/project-history.test.ts
```

Expected: FAIL because the Explorer state module does not exist.

- [ ] **Step 3: Implement independent history per Explorer instance**

Use this public state shape:

```ts
export type ProjectLocation = { kind: "root" } | { kind: "project"; slug: string };
export type ExplorerView = "large-icons" | "list" | "details";
export type ExplorerState = {
  current: ProjectLocation;
  backStack: readonly ProjectLocation[];
  forwardStack: readonly ProjectLocation[];
  view: ExplorerView;
  query: string;
};
```

Opening a project pushes the previous location to `backStack` and clears `forwardStack`. Invalid slugs are rejected by the component, which shows an XP warning and dispatches `GO_ROOT`.

- [ ] **Step 4: Write failing component tests for root browsing and detail navigation**

```tsx
render(<ProjectsExplorer />);
expect(screen.getByText("9 objects")).toBeInTheDocument();
await user.dblClick(screen.getByRole("button", { name: "Auto Email System folder" }));
expect(screen.getByRole("heading", { name: "Auto Email System" })).toBeInTheDocument();
expect(screen.getByText("Address")).toBeInTheDocument();
expect(screen.getByRole("link", { name: "View repository" })).toHaveAttribute(
  "href",
  "https://github.com/Ha22yX/auto-email-system",
);
```

Add tests for Search filtering, all three Views choices, Back/Forward/Up disabled states, and invalid initial slug fallback.

- [ ] **Step 5: Implement the XP Explorer root and Folder Web View**

The component must render:

- Toolbar buttons named Back, Forward, Up, Search, Folders, and Views.
- Read-only address display `C:\My Projects` or `C:\My Projects\<project name>`.
- Root left pane sections File and Folder Tasks, Other Places, and Details.
- Nine actual folder buttons with double-click navigation.
- Search input shown by Search and filtering name, kicker, category, and stack.
- Large Icons, List, and Details rendering of the same filtered data.
- Project detail header, first-person story, stack, file snapshot, GitHub shortcut, optional Demo shortcut, and item count.
- Status text `<visible> objects` on root and `<files> objects` on a detail page.

All external links use `target="_blank"` and `rel="noreferrer"`.

- [ ] **Step 6: Verify Explorer behavior and data coverage**

Run:

```powershell
npm.cmd test -- --run src/apps/projects
npm.cmd run check
```

Expected: every history and UI test passes, including all nine folder names.

- [ ] **Step 7: Commit My Projects**

```powershell
git add src/apps/projects
git commit -m "feat: add XP project Explorer"
```

---

### Task 6: Build the All-Photo Browser and Independent Viewer

**Files:**
- Create: `src/apps/photos/photo-state.ts`
- Create: `src/apps/photos/photo-state.test.ts`
- Create: `src/apps/photos/PicturesBrowser.tsx`
- Create: `src/apps/photos/PicturesBrowser.test.tsx`
- Create: `src/apps/photos/PictureViewer.tsx`
- Create: `src/apps/photos/PictureViewer.test.tsx`
- Create: `src/apps/photos/photos.css`

**Interfaces:**
- Consumes: `photos: readonly PhotoItem[]` and a shell callback that launches `picture-viewer` windows.
- Produces: `PictureBrowserView`, `ViewerState`, `photoStateReducer`, `PicturesBrowser({ onOpenPhoto })`, and `PictureViewer({ initialSlug })`.

- [ ] **Step 1: Write failing pure photo-state tests**

```ts
import { clampZoom, nextIndex, rotate } from "@/apps/photos/photo-state";

describe("photo state", () => {
  it("wraps navigation, clamps zoom, and normalizes rotation", () => {
    expect(nextIndex(14, 1, 15)).toBe(0);
    expect(nextIndex(0, -1, 15)).toBe(14);
    expect(clampZoom(500)).toBe(400);
    expect(clampZoom(10)).toBe(25);
    expect(rotate(270, 90)).toBe(0);
  });
});
```

- [ ] **Step 2: Run the photo-state test and verify it fails**

Run:

```powershell
npm.cmd test -- --run src/apps/photos/photo-state.test.ts
```

Expected: FAIL because the helpers do not exist.

- [ ] **Step 3: Implement typed photo state helpers**

```ts
export type PictureBrowserView = "thumbnails" | "filmstrip" | "list";
export type ViewerState = {
  index: number;
  zoom: number;
  rotation: 0 | 90 | 180 | 270;
  fitToWindow: boolean;
};

export function nextIndex(index: number, delta: -1 | 1, length: number): number;
export function clampZoom(value: number): number;
export function rotate(current: ViewerState["rotation"], delta: -90 | 90): ViewerState["rotation"];
```

Zoom steps are 25, 50, 75, 100, 125, 150, 200, 300, and 400 percent. Manual zoom disables fit-to-window.

- [ ] **Step 4: Write failing all-photo browser tests**

Render with a spy and assert:

```tsx
const onOpenPhoto = vi.fn();
render(<PicturesBrowser onOpenPhoto={onOpenPhoto} />);
expect(screen.getAllByRole("button", { name: /photo$/i })).toHaveLength(15);
expect(screen.getByText("15 objects")).toBeInTheDocument();
await user.click(screen.getByRole("button", { name: "Filmstrip view" }));
await user.click(screen.getByRole("button", { name: "Stone Gate photo" }));
expect(screen.getByText("A quiet threshold held in old masonry and winter light.")).toBeInTheDocument();
await user.dblClick(screen.getByRole("button", { name: "Stone Gate photo" }));
expect(onOpenPhoto).toHaveBeenCalledWith("stone-gate");
```

Add List and Thumbnails view assertions and verify a failed `<img>` switches only that item to a named unavailable-image state.

- [ ] **Step 5: Implement My Pictures browsing views**

Render XP Picture Tasks, Other Places, Details, Views controls, all 15 photos, current selection, large filmstrip preview, title, description, and status counts. Maintain view and selection inside each browser instance. Use buttons for selectable photo items so keyboard activation works.

- [ ] **Step 6: Write failing viewer tests**

Render `initialSlug="stone-gate"`, press ArrowRight, and assert Underline Skyline. Click Previous on the first item and assert Night Pavilion. Test Zoom In, Zoom Out, Actual Size, Fit to Window, Rotate Clockwise, Rotate Counter-clockwise, `1 of 15`, and invalid slug fallback to the first photo.

- [ ] **Step 7: Implement Picture and Fax Viewer**

The viewer accepts only `initialSlug`, derives its initial index from `photos`, and keeps navigation local to the window. The image uses `object-fit: contain`, a transform for rotation and zoom, and a bounded scroll surface for actual-size mode. Controls have unique accessible names and include title/description in a bottom information bar.

- [ ] **Step 8: Verify the complete photo feature**

Run:

```powershell
npm.cmd test -- --run src/apps/photos
npm.cmd run check
```

Expected: pure state, all-photo browser, and viewer tests pass with 15 usable records.

- [ ] **Step 9: Commit the photo applications**

```powershell
git add src/apps/photos
git commit -m "feat: add XP photo browser and viewer"
```

---

### Task 7: Build the Markdown About Notepad

**Files:**
- Create: `src/apps/about/AboutNotepad.tsx`
- Create: `src/apps/about/AboutNotepad.test.tsx`
- Create: `src/apps/about/about.css`

**Interfaces:**
- Consumes: `aboutMarkdown` from Task 2 and a `closeWindow()` callback from the registry adapter.
- Produces: `AboutNotepad({ closeWindow })` with controlled Word Wrap and Status Bar state.

- [ ] **Step 1: Write failing Notepad behavior tests**

```tsx
const closeWindow = vi.fn();
render(<AboutNotepad closeWindow={closeWindow} />);
expect(screen.getByRole("heading", { level: 1, name: "Zhiyuan Xing / HarryX" })).toBeInTheDocument();
expect(screen.getByRole("heading", { level: 2, name: "Developer" })).toBeInTheDocument();
await user.click(screen.getByRole("button", { name: "Format" }));
await user.click(screen.getByRole("menuitemcheckbox", { name: "Word Wrap" }));
expect(screen.getByTestId("notepad-document")).toHaveClass("is-word-wrapped");
```

Add tests for View > Status Bar, Edit > Select All, Help > About This Portfolio, File > Close, and one open menu at a time.

- [ ] **Step 2: Run the Notepad test and verify it fails**

Run:

```powershell
npm.cmd test -- --run src/apps/about/AboutNotepad.test.tsx
```

Expected: FAIL because the component does not exist.

- [ ] **Step 3: Implement working XP Notepad menus and Markdown rendering**

Use `react-markdown` inside a selectable article. Keep File, Edit, Format, View, and Help as buttons that open role `menu` panels. Disabled commands are rendered disabled and never silently respond. `Select All` uses a ref plus `Range`/`Selection`; `Copy` uses `navigator.clipboard.writeText(aboutMarkdown)` when available and reports success in the status bar. Escape closes the current menu.

- [ ] **Step 4: Verify the Notepad feature**

Run:

```powershell
npm.cmd test -- --run src/apps/about
npm.cmd run check
```

Expected: Markdown hierarchy and every enabled menu action pass.

- [ ] **Step 5: Commit About Notepad**

```powershell
git add src/apps/about
git commit -m "feat: add Markdown About Notepad"
```

---

### Task 8: Build the AI-Ready Local Harry Messenger

**Files:**
- Create: `src/apps/messenger/chat-service.ts`
- Create: `src/apps/messenger/local-chat-service.ts`
- Create: `src/apps/messenger/local-chat-service.test.ts`
- Create: `src/apps/messenger/HarryMessenger.tsx`
- Create: `src/apps/messenger/HarryMessenger.test.tsx`
- Create: `src/apps/messenger/messenger.css`

**Interfaces:**
- Consumes: `localChatCopy`, `projects`, and `contacts` from Task 2.
- Produces: `ChatService`, `ChatMessage`, `LocalChatService`, and `HarryMessenger({ service? })`.

- [ ] **Step 1: Write failing service intent and fallback tests**

```ts
import { LocalChatService } from "@/apps/messenger/local-chat-service";

describe("LocalChatService", () => {
  const service = new LocalChatService();

  it.each([
    ["What projects have you built?", "projects"],
    ["Tell me about your photography", "photography"],
    ["How can I contact Harry?", "contact"],
    ["Are you connected to AI?", "ai-status"],
  ])("routes %s to %s", async (message, intent) => {
    await expect(service.send(message, [])).resolves.toMatchObject({ intent });
  });

  it("uses the honest offline fallback", async () => {
    await expect(service.send("unmatched sentence", [])).resolves.toMatchObject({ intent: "fallback" });
  });
});
```

- [ ] **Step 2: Run the service test and verify it fails**

Run:

```powershell
npm.cmd test -- --run src/apps/messenger/local-chat-service.test.ts
```

Expected: FAIL because the service does not exist.

- [ ] **Step 3: Define the stable AI adapter boundary and local implementation**

```ts
export type ChatMessage = {
  id: string;
  sender: "visitor" | "harry";
  text: string;
  createdAt: string;
  status: "sent" | "delivered" | "error";
};

export type ChatReply = {
  intent: "projects" | "photography" | "contact" | "ai-status" | "fallback";
  text: string;
};

export interface ChatService {
  send(message: string, history: readonly ChatMessage[]): Promise<ChatReply>;
}
```

The local adapter lowercases and trims input, matches explicit keyword sets, returns only approved local copy, and never uses timers longer than 350 ms. Empty input rejects with `Error("Message is empty")`.

- [ ] **Step 4: Write failing Messenger UI tests**

Assert one Harry contact, the welcome message, a labeled message textbox, disabled Send for whitespace, visitor and Harry bubbles after submit, Enter-to-send, Shift+Enter newline, sessionStorage restoration, and service rejection showing Harry offline without deleting earlier messages.

```tsx
const service = new LocalChatService();
render(<HarryMessenger service={service} />);
expect(screen.getByRole("button", { name: "Harry, online" })).toBeInTheDocument();
await user.type(screen.getByRole("textbox", { name: "Message Harry" }), "projects{Enter}");
expect(await screen.findByText(/selected projects/i)).toBeInTheDocument();
```

- [ ] **Step 5: Implement the one-contact XP Messenger UI**

Render contact header, status, scrollable transcript, timestamps, composer, typing state, and Send button. Store only the current browser session under `rosebeg-v2:messenger`. Render user input as text nodes. On adapter failure, retain transcript, mark the visitor message `error`, and show Harry as offline.

- [ ] **Step 6: Verify Messenger**

Run:

```powershell
npm.cmd test -- --run src/apps/messenger
npm.cmd run check
```

Expected: service and UI tests pass without network access.

- [ ] **Step 7: Commit Messenger**

```powershell
git add src/apps/messenger
git commit -m "feat: add AI-ready Harry Messenger"
```

---

### Task 9: Compose the XP Desktop, Start Menu, Taskbar, and Applications

**Files:**
- Create: `src/desktop/app-registry.tsx`
- Create: `src/desktop/DesktopIcon.tsx`
- Create: `src/desktop/StartMenu.tsx`
- Create: `src/desktop/Taskbar.tsx`
- Create: `src/desktop/PowerDialog.tsx`
- Create: `src/desktop/DesktopShell.tsx`
- Create: `src/desktop/DesktopShell.test.tsx`
- Create: `src/desktop/desktop.css`
- Create: `public/assets/wallpaper/rosebeg-bliss.webp`
- Create: `public/assets/icons/projects.png`
- Create: `public/assets/icons/pictures.png`
- Create: `public/assets/icons/notepad.png`
- Create: `public/assets/icons/messenger.png`
- Create: `public/assets/icons/github.png`
- Modify: `src/app/App.tsx`
- Modify: `src/app/app.css`

**Interfaces:**
- Consumes: `SystemRoot`, `SystemActionsContext`, `WindowManagerProvider`, `WindowRegistry`, all four app surfaces, project/photo payloads, and local icon paths.
- Produces: `appRegistry: WindowRegistry`, `DesktopShell`, synchronized Start/taskbar/window behavior, and final application composition.

- [ ] **Step 1: Write failing desktop integration tests**

```tsx
vi.useFakeTimers();
const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
render(<App />);
act(() => vi.advanceTimersByTime(1_800));
await user.click(screen.getByRole("button", { name: "Harry" }));
act(() => vi.advanceTimersByTime(650));

expect(screen.getByTestId("desktop-shell")).toBeInTheDocument();
await user.dblClick(screen.getByRole("button", { name: "My Projects" }));
await user.dblClick(screen.getByRole("button", { name: "My Projects" }));
expect(screen.getAllByRole("heading", { name: "My Projects" })).toHaveLength(2);
expect(screen.getAllByRole("button", { name: /My Projects task/i })).toHaveLength(2);
```

Add tests for Start dismissal, one-tap touch launch, taskbar minimize/restore, My Pictures launching a separate viewer, Log Off confirmation closing all windows, and Turn Off Cancel leaving the desktop intact.

- [ ] **Step 2: Run the desktop integration test and verify it fails**

Run:

```powershell
npm.cmd test -- --run src/desktop/DesktopShell.test.tsx
```

Expected: FAIL because desktop composition does not exist.

- [ ] **Step 3: Create original local bitmap assets**

Before generating bitmap assets, invoke the `imagegen` skill. Generate the wallpaper with this prompt and save the selected result as `public/assets/wallpaper/rosebeg-bliss.webp`:

```text
A photorealistic early-2000s desktop wallpaper, one vivid rolling green hill beneath a deep cobalt-blue sky, bright soft cumulus clouds, optimistic clear daylight, clean horizon, natural grass texture, no buildings, no people, no text, no logos, no interface, 16:9 landscape, crisp at 1920x1080.
```

Generate five separate transparent-background 64-by-64 application icons: a glossy golden project folder, a landscape photograph with small camera, a white spiral notepad with blue pen, two friendly messenger silhouettes, and a dark code-repository mark. Each prompt must request early-2000s glossy desktop icon rendering, clear silhouette at 32 pixels, no words, no trademarked logo, and transparent background. Inspect every asset at native size before accepting it.

- [ ] **Step 4: Implement the application registry**

Construct `appRegistry` with the `WindowRegistryEntry` and `WindowAppContext` types exported by Task 4:

```ts
export const appRegistry = {
  "projects-explorer": {
    appId: "projects-explorer",
    title: "My Projects",
    icon: "/assets/icons/projects.png",
    idealSize: { width: 900, height: 620 },
    minimumSize: { width: 520, height: 420 },
    render: ({ payload }) => <ProjectsExplorer initialProjectSlug={payload.projectSlug} />,
  },
  "pictures-browser": {
    appId: "pictures-browser",
    title: "My Pictures",
    icon: "/assets/icons/pictures.png",
    idealSize: { width: 880, height: 600 },
    minimumSize: { width: 500, height: 360 },
    render: ({ launch }) => (
      <PicturesBrowser onOpenPhoto={(photoSlug) => launch("picture-viewer", { photoSlug })} />
    ),
  },
  "picture-viewer": {
    appId: "picture-viewer",
    title: "Windows Picture and Fax Viewer",
    icon: "/assets/icons/pictures.png",
    idealSize: { width: 760, height: 580 },
    minimumSize: { width: 420, height: 320 },
    render: ({ payload }) => <PictureViewer initialSlug={payload.photoSlug ?? photos[0]!.slug} />,
  },
  "about-notepad": {
    appId: "about-notepad",
    title: "About Harry - Notepad",
    icon: "/assets/icons/notepad.png",
    idealSize: { width: 660, height: 520 },
    minimumSize: { width: 360, height: 300 },
    render: ({ close }) => <AboutNotepad closeWindow={close} />,
  },
  "harry-messenger": {
    appId: "harry-messenger",
    title: "Harry Messenger",
    icon: "/assets/icons/messenger.png",
    idealSize: { width: 420, height: 560 },
    minimumSize: { width: 320, height: 360 },
    render: () => <HarryMessenger />,
  },
} satisfies WindowRegistry;
```

Import `photos` so the viewer has a safe first-photo fallback. Every call to the render-context `launch` creates a new instance.

- [ ] **Step 5: Implement desktop icons, Start menu, taskbar, and clock**

Desktop order is My Projects, My Pictures, About Harry, Harry Messenger. Mouse double-click opens; touch pointer single-tap opens; Enter opens a focused icon. Start uses the approved two-column entries and closes on Escape, desktop click, Start re-click, or launch.

Taskbar renders one button per instance, including minimized windows, and calls `toggleTaskbar(id)`. The notification area clock updates at the next minute boundary and then every 60 seconds. Use a fixed-width clock region so layout does not shift.

- [ ] **Step 6: Implement power dialogs and root composition**

`PowerDialog` has two modes:

```ts
type PowerDialogMode = "log-off" | "turn-off" | null;
```

Log Off offers Log Off and Cancel. Turn Off offers Turn Off, Restart, and Cancel. Confirming Log Off calls `closeAll()` before `requestLogOff()`. Turn Off and Restart call their system actions. `App` composes `SystemRoot -> WindowManagerProvider -> DesktopShell`.

- [ ] **Step 7: Apply the Luna visual system and adaptive shell rules**

Define Tahoma-first typography, Luna blue active and inactive title gradients, one-pixel bevel tokens, 32-pixel taskbar, green Start button, two-column Start menu, icon focus rectangles, and inactive/pressed task states. Use `100dvh`, not `100vh`. At narrow widths, keep a 12-pixel desktop margin, compact the Explorer toolbar, and retain normal window mode.

- [ ] **Step 8: Verify desktop integration**

Run:

```powershell
npm.cmd test -- --run src/desktop src/windowing src/system
npm.cmd run check
npm.cmd run build
```

Expected: multi-instance, taskbar, Start, photo-launch, and power-dialog tests pass; production build succeeds.

- [ ] **Step 9: Commit the composed desktop**

```powershell
git add src/app src/desktop src/shared src/system src/windowing public/assets/wallpaper public/assets/icons
git commit -m "feat: compose the Rosebeg XP desktop"
```

---

### Task 10: Add Crash Isolation, Reduced Motion, and Responsive Hardening

**Files:**
- Create: `src/shared/AppErrorBoundary.tsx`
- Create: `src/shared/AppErrorBoundary.test.tsx`
- Create: `src/shared/usePrefersReducedMotion.ts`
- Create: `src/shared/usePrefersReducedMotion.test.tsx`
- Modify: `src/system/SystemRoot.tsx`
- Modify: `src/windowing/WindowManager.tsx`
- Modify: `src/windowing/WindowFrame.tsx`
- Modify: `src/desktop/DesktopShell.tsx`
- Modify: `src/shared/xp-theme.css`
- Modify: `src/desktop/desktop.css`
- Modify: `src/windowing/windowing.css`
- Modify: `src/apps/projects/projects.css`
- Modify: `src/apps/photos/photos.css`
- Modify: `src/apps/about/about.css`
- Modify: `src/apps/messenger/messenger.css`

**Interfaces:**
- Consumes: Registry-rendered applications and all approved target viewports.
- Produces: `AppErrorBoundary`, `usePrefersReducedMotion()`, phase timing adaptation, bounded compact layouts, and keyboard-visible focus.

- [ ] **Step 1: Write failing crash-boundary and media-query tests**

```tsx
const onClose = vi.fn();

function BrokenApp(): never {
  throw new Error("broken app");
}

render(<AppErrorBoundary windowTitle="Broken" onClose={onClose}><BrokenApp /></AppErrorBoundary>);
expect(screen.getByRole("alertdialog", { name: "Broken has encountered a problem" })).toBeInTheDocument();
expect(screen.getByRole("button", { name: "Close Broken" })).toBeInTheDocument();
```

Mock `matchMedia` for `(prefers-reduced-motion: reduce)`, render a probe using the hook, dispatch a change event, and assert live updates.

- [ ] **Step 2: Run the hardening tests and verify they fail**

Run:

```powershell
npm.cmd test -- --run src/shared/AppErrorBoundary.test.tsx src/shared/usePrefersReducedMotion.test.tsx
```

Expected: FAIL because both modules do not exist.

- [ ] **Step 3: Implement per-window error containment and reduced-motion timing**

`AppErrorBoundary` accepts `{ windowTitle: string; onClose(): void; children: ReactNode }`. Wrap each registry-rendered app, not the entire desktop, and pass the current window's close action. The XP alert shows the error title, a short safe message, and Close. Do not print a production stack trace. Wire the hook into `SystemRoot` so decorative phase durations use 150 ms when reduced motion is requested.

- [ ] **Step 4: Add viewport and keyboard regression tests**

At simulated 1920x1080, assert Explorer remains 900x620 initially. At simulated 390x844, assert its width is 366 and mode remains `normal`. Tab through Start, desktop icons, window controls, and app toolbar buttons; assert each control receives focus in logical order and has an accessible name.

- [ ] **Step 5: Harden all CSS breakpoints and overflow paths**

Use container and media queries to compact toolbars below 620 pixels, wrap Notepad menus without hiding them, keep Messenger composer visible, preserve photo aspect ratio, and allow Explorer detail content to scroll inside the window rather than the page. Add `:focus-visible`, forced-colors fallbacks, and inactive-window contrast. Keep the taskbar visible above every window.

- [ ] **Step 6: Run complete unit/component verification**

Run:

```powershell
npm.cmd test
npm.cmd run check
npm.cmd run build
```

Expected: every test passes, TypeScript exits 0, and the production build succeeds.

- [ ] **Step 7: Commit hardening**

```powershell
git add src
git commit -m "fix: harden XP desktop accessibility and sizing"
```

---

### Task 11: Add End-to-End and Visual Regression Coverage

**Files:**
- Create: `tests/e2e/helpers.ts`
- Create: `tests/e2e/system-flow.spec.ts`
- Create: `tests/e2e/windows.spec.ts`
- Create: `tests/e2e/apps.spec.ts`
- Create: `tests/e2e/visual.spec.ts`
- Create: `tests/e2e/visual.spec.ts-snapshots/*`
- Modify: `playwright.config.ts`

**Interfaces:**
- Consumes: Accessible names and `data-testid` contracts created in Tasks 3-10.
- Produces: `loginToDesktop(page)`, stable Chromium flows, and screenshots for 1440x900, 1024x768, and 390x844.

- [ ] **Step 1: Write the failing system-flow E2E test**

```ts
import { expect, test } from "@playwright/test";
import { loginToDesktop } from "./helpers";

test("boots, logs in, logs off, and restarts after shutdown", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("boot-screen")).toBeVisible();
  await loginToDesktop(page);
  await expect(page.getByTestId("desktop-shell")).toBeVisible();
  await page.getByRole("button", { name: "Start" }).click();
  await page.getByRole("button", { name: "Log Off" }).click();
  await page.getByRole("button", { name: "Confirm Log Off" }).click();
  await expect(page.getByTestId("login-screen")).toBeVisible();
});
```

Extend the same file with Turn Off, Cancel, powered-off, and Restart assertions.

- [ ] **Step 2: Run the focused E2E test and verify any uncovered contract fails**

Run:

```powershell
npm.cmd run test:e2e -- tests/e2e/system-flow.spec.ts
```

Expected: the new test initially exposes at least the missing helper or any mismatched accessible contract; correct the product contract rather than weakening assertions.

- [ ] **Step 3: Implement stable helpers and all functional E2E flows**

`loginToDesktop(page)` waits up to 3 seconds for login, clicks Harry, and waits for the desktop. Add:

- `windows.spec.ts`: open two My Projects windows, focus, drag, resize, minimize, restore through taskbar, maximize, restore, and close.
- `apps.spec.ts`: navigate a project and Back/Forward/Up; filter projects; verify all 15 photos; open two viewer windows; use ArrowRight; toggle Notepad Word Wrap; send a Messenger message and observe the local reply.
- `system-flow.spec.ts`: Start dismissal, Log Off, Turn Off Cancel, Turn Off, powered-off, and Restart.

Use semantic locators and exact accessible names. Do not target visual CSS classes.

- [ ] **Step 4: Add the target-viewport visual test**

For each viewport, capture login, desktop, open Start menu, overlapping apps, maximized Explorer, all-photo browser, viewer, Notepad, Messenger, shutdown, and powered-off. Mask only the live clock. Use these exact viewport entries:

```ts
const viewports = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "standard", width: 1024, height: 768 },
  { name: "mobile", width: 390, height: 844 },
] as const;
```

- [ ] **Step 5: Generate baselines, inspect every screenshot, and correct regressions**

Run:

```powershell
npm.cmd run test:visual -- --update-snapshots
npm.cmd run test:visual
```

Open each generated PNG. Confirm window bounds, title controls, taskbar clearance, Start menu containment, photo aspect ratios, toolbar wrapping, text legibility, and no horizontal page overflow. Fix product CSS and regenerate only after inspection.

- [ ] **Step 6: Run the full verification matrix**

Run:

```powershell
npm.cmd test
npm.cmd run check
npm.cmd run build
npm.cmd run test:e2e
npm.cmd run test:visual
```

Expected: every command exits 0 without retries.

- [ ] **Step 7: Commit end-to-end coverage**

```powershell
git add tests playwright.config.ts src tests/e2e/visual.spec.ts-snapshots
git commit -m "test: cover XP desktop end to end"
```

---

### Task 12: Document, Audit, and Publish the Public Repository

**Files:**
- Create: `README.md`
- Create: `docs/screenshots/desktop.png`
- Create: `docs/screenshots/projects.png`
- Create: `docs/screenshots/photos.png`
- Create: `docs/screenshots/messenger.png`
- Modify: `.gitignore`
- Modify: `package.json`

**Interfaces:**
- Consumes: Fully verified build and visual output from Task 11.
- Produces: public onboarding documentation, clean Git history, and `https://github.com/Ha22yX/rosebeg-v2`.

- [ ] **Step 1: Capture final screenshots and write README**

Copy inspected Playwright outputs into the four named `docs/screenshots` files. Write a concise English README with a centered project title, desktop hero screenshot, feature overview, controls for pointer, touch, and keyboard use, technology, V1 content provenance, local chat-adapter status, local development commands, test matrix, repository structure, the V1 website link, and public contact links. Do not claim production deployment.

- [ ] **Step 2: Manually verify the README**

Render the Markdown and verify that every screenshot loads, every internal anchor works, public links resolve to the intended destinations, and install, development, test, type-check, build, end-to-end, and visual-test commands are documented accurately. Human-facing prose is accepted through this checklist rather than a brittle exact-phrase test.

- [ ] **Step 3: Run a repository safety audit**

Run:

```powershell
rg -n "(api[_-]?key|secret|token|password)\s*[:=]" . -g '!package-lock.json' -g '!docs/superpowers/**'
git status --short
git diff --check
```

Expected: the secret-pattern scan finds no credentials, `git diff --check` reports nothing, and only intended README/screenshot/package changes are present.

- [ ] **Step 4: Run fresh final verification**

Run from a clean dependency install:

```powershell
npm.cmd ci
npm.cmd test
npm.cmd run check
npm.cmd run build
npm.cmd run test:e2e
npm.cmd run test:visual
```

Expected: all commands exit 0. Record the command outputs in the final handoff, not in generated repository files.

- [ ] **Step 5: Commit final documentation and QA adjustments**

```powershell
git add README.md docs/screenshots .gitignore package.json package-lock.json src tests
git commit -m "docs: prepare Rosebeg XP portfolio release"
git status --short --branch
```

Expected: the implementation branch is clean. Publication waits until the task-by-task review and final whole-branch review are complete.

---

## Post-Implementation Release Procedure

After all task reviews and the final whole-branch review are clean, use `superpowers:finishing-a-development-branch` to integrate the implementation branch into local `main` and re-run the required verification on the integrated result.

- [ ] **Step 1: Verify GitHub destination safety from the primary `main` worktree**

Run `gh auth status` and `gh repo view Ha22yX/rosebeg-v2`. Authentication must report active account `Ha22yX`. If the repository does not exist, proceed. If it already exists, inspect its ownership and remote state instead of overwriting it.

- [ ] **Step 2: Create and push the public repository**

When the destination is confirmed absent, run:

```powershell
gh repo create Ha22yX/rosebeg-v2 --public --source . --remote origin --push
gh repo view Ha22yX/rosebeg-v2 --json nameWithOwner,isPrivate,url,defaultBranchRef
git remote -v
git status --short --branch
```

Expected: `nameWithOwner` is `Ha22yX/rosebeg-v2`, `isPrivate` is `false`, default branch is `main`, `origin` points to the new repository, and local `main` tracks `origin/main` with a clean worktree.

---

## Plan Self-Review Checklist

- Every design-spec section maps to a task: content (Task 2), system phases (Task 3), windows (Task 4), projects (Task 5), photos (Task 6), Notepad (Task 7), Messenger (Task 8), XP shell (Task 9), accessibility/error handling (Task 10), automated and visual verification (Task 11), Git/publication (Task 12).
- Public type names are stable across tasks: `AppId`, `WindowPayload`, `WindowDefinition`, `WindowInstance`, `WindowManagerApi`, `Project`, `PhotoItem`, `ContactChannel`, `ChatService`, and `SystemActions`.
- Every runtime feature task follows a failing-test, implementation, verification, and commit cycle; only the approved configuration and generated-bitmap exceptions bypass the initial failing test.
- No runtime request depends on V1, GitHub API, or a third-party image host.
- The plan never creates or pushes the GitHub repository before task reviews, final whole-branch review, integration to `main`, and fresh final verification pass.
