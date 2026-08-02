# Rosebeg V2 Windows XP Portfolio Design

**Date:** 2026-08-02  
**Status:** Approved in conversation; awaiting written-spec review  
**Owner:** Zhiyuan Xing / HarryX (`Ha22yX`)

## 1. Goal

Build a public personal portfolio as a self-contained Windows XP-style desktop experience. The site presents Harry's software, robotics and electronic-design projects, photography, personal introduction, and a future AI chat surface. It must feel and behave like Windows XP rather than merely applying an XP color palette to a conventional portfolio page.

The implementation is a greenfield Vite, React, and TypeScript application in `C:\Users\Administrator\Desktop\Rosebeg V2`. It uses Git from the first committed artifact and will ultimately be published as the public GitHub repository `Ha22yX/rosebeg-v2` with GitHub CLI.

## 2. Authoritative Content Sources

The V1 source tree at `C:\Users\Administrator\Desktop\Rosebeg` is the authoritative source for personal copy and photography. V2 copies the required content and assets into its own repository and has no runtime dependency on V1 or `harry.rosebeg.com`.

Approved V1 sources:

- `src/App.tsx`: identity copy, the 15-photo catalog, and the seven selected-project summaries.
- `public/project-card-swap/script.js`: expanded project stories, stacks, simulated directory contents, GitHub URLs, and demo URLs.
- `src/components/SocialSignalPorts.tsx`: public GitHub, WeChat, Instagram, and email contacts.
- `public/assets/photography/`: original large photos and thumbnails.

The GitHub profile and public repository metadata for `Ha22yX` may be used to verify links and add the approved electronic-design projects. Runtime GitHub API requests are explicitly excluded so API availability or rate limits cannot empty the portfolio.

## 3. Product Scope

### Included

- Short boot sequence, XP-style account-selection screen, desktop, logoff, shutdown, and restart states.
- A custom window manager with multi-instance windows, focus stacking, dragging, resizing, minimizing, maximizing, restoring, and closing.
- XP taskbar, Start menu, task buttons, notification area, and live clock.
- Four desktop entries: My Projects, My Pictures, About Harry, and Harry Messenger.
- An XP Explorer project portfolio.
- An all-photo browser plus separate Picture and Fax Viewer windows.
- A read-only XP Notepad shell containing Markdown-rendered About content.
- A one-contact Messenger interface prepared for a later AI integration.
- Responsive window sizing without automatic maximization.
- Keyboard support, reduced-motion handling, automated functional tests, and visual screenshot checks.

### Excluded from the first release

- A real AI backend, model credentials, or server-side chat persistence.
- Editing, uploading, deleting, renaming, or writing files and photos.
- Live GitHub statistics or authenticated GitHub API calls in the browser.
- User accounts, passwords, or real operating-system authentication.
- Persisting open windows across a hard page refresh.
- Deployment to a production host. This scope ends with a verified public GitHub repository.
- Windows system audio or autoplaying sound.

## 4. Technical Architecture

### 4.1 Stack

- Vite
- React 19
- TypeScript
- Hand-authored CSS for the XP Luna visual system
- React Markdown for the About document
- Vitest and React Testing Library for component and state tests
- Playwright for end-to-end and screenshot verification

No XP component library such as `xp.css` is used. Window behavior and the Luna visual language are built in the project so the interaction model can match the brief precisely.

### 4.2 System state machine

The root application owns a finite system phase:

```ts
type SystemPhase = "booting" | "login" | "signing-in" | "desktop" | "logging-off" | "shutting-down" | "powered-off";
```

The normal sequence is:

```text
hard load -> booting -> login -> signing-in -> desktop
desktop -> logging-off -> login
desktop -> shutting-down -> powered-off
powered-off -> booting (Restart)
```

- Booting lasts about 1.8 seconds and shows a compact progress animation.
- Signing in lasts about 650 milliseconds after selecting Harry.
- Logging off lasts about 450 milliseconds, closes all windows, and returns to the login screen without replaying boot.
- Shutting down lasts about 1.2 seconds before the powered-off screen appears.
- Reduced-motion mode shortens decorative transitions to approximately 150 milliseconds while preserving every state change.
- A hard refresh always starts from booting.

### 4.3 Window manager

All application windows are described by a shared registry and managed by a reducer. Each launch creates a new instance, including launches of an app that is already open.

```ts
type WindowState = "normal" | "minimized" | "maximized";

type WindowInstance = {
  id: string;
  appId: AppId;
  title: string;
  state: WindowState;
  position: { x: number; y: number };
  size: { width: number; height: number };
  restoreBounds: { x: number; y: number; width: number; height: number };
  zIndex: number;
  payload?: Record<string, string>;
};
```

Required behavior:

- Launching creates a centered window; subsequent windows cascade by a small offset.
- Clicking or dragging a window brings it to the front.
- Title-bar controls minimize, maximize or restore, and close.
- Double-clicking a title bar toggles maximize and restore.
- Normal windows resize from edges and corners when the viewport permits it.
- Dragging and resizing are clamped to the usable desktop above the taskbar.
- Maximized windows occupy the usable desktop and never cover the taskbar.
- Every instance has its own taskbar button.
- Clicking an active task button minimizes it. Clicking a minimized or background task restores and focuses it.
- Closing a window removes its task button.
- No modern snapping behavior is added.

Application content is isolated behind an error boundary. A failed application renders an XP error dialog and can be closed without crashing the shell.

## 5. Adaptive Window Sizing

Windows do not default to full-screen or near-full-screen. Each app has an ideal size, minimum usable size, and maximum size. The initial bounds are calculated from the available desktop, then clamped so large monitors do not create oversized windows and small screens do not create unusably tiny or off-screen windows.

Representative ideal rules:

- My Projects: approximately `clamp(520px, 72vw, 960px)` wide and `clamp(420px, 70dvh, 680px)` high.
- My Pictures: approximately 880 by 600 CSS pixels when space permits.
- Picture and Fax Viewer: approximately 760 by 580 CSS pixels.
- About Harry: approximately 660 by 520 CSS pixels.
- Harry Messenger: approximately 420 by 560 CSS pixels.

The viewport-safe maximum is always the available width and height minus a 12-pixel desktop margin. If a viewport is narrower than an app's nominal minimum, the window fits the remaining space while retaining that margin. Toolbars may wrap or collapse into compact controls, but the window is not automatically maximized. Only the maximize button fills the usable desktop.

## 6. XP Shell and Visual System

The visual reference is Windows XP's Luna blue theme:

- Tahoma-first typography.
- Rounded blue gradient title bars with brighter active and muted inactive states.
- Green Start button, blue taskbar, individual inset task buttons, notification tray, and live local clock.
- Beveled borders, one-pixel highlights, pressed states, dotted focus outlines, and restrained XP-style shadows.
- A locally stored Bliss-style pastoral wallpaper and locally stored XP-style icons; the production UI has no hotlinked assets.
- Custom tribute graphics are used rather than shipping Microsoft binaries or presenting the site as an official Microsoft product.

The four desktop entries appear down the left side in this order:

1. My Projects
2. My Pictures
3. About Harry
4. Harry Messenger

Mouse users open desktop items with a double-click. Touch users open them with a single tap. Keyboard users can focus icons and press Enter.

### 6.1 Start menu

The Start menu follows the XP two-column composition:

- Header with Harry's name and avatar.
- Left column containing the four primary apps.
- Right column containing GitHub, My Pictures, and About Harry shortcuts.
- Footer actions for Log Off and Turn Off Computer.
- It closes when the user clicks the desktop, presses Escape, clicks Start again, or launches an app.

### 6.2 Logoff and power controls

- Log Off opens an XP confirmation dialog. Confirmation closes all windows and returns to account selection.
- Turn Off Computer opens an XP-style choice dialog with Turn Off, Restart, and Cancel.
- Turn Off plays the shutdown state and ends at a powered-off screen.
- Restart plays shutdown, then re-enters the boot sequence.

## 7. Applications

### 7.1 My Projects

My Projects opens a Windows XP Explorer window rather than a conventional portfolio grid.

Explorer chrome includes:

- Back, Forward, Up, Search, Folders, and Views controls.
- Address bar with portfolio-local paths.
- Left XP task pane.
- Main file area.
- Status bar with selection and item counts.
- Large Icons, List, and Details views.

The root path directly contains one folder per project. The initial project set is:

1. Auto Email System
2. Bridge US V2
3. Mother-Ship Docking Drone System
4. Surfboard Vacuum Table DXF Generator
5. ESP32 Sound Radar
6. SAT AI Tutor
7. PhotoBack
8. DayVault
9. Gridopoly

The root can filter projects through the Search control. Double-clicking a folder navigates within the same Explorer instance to a project detail path. History is maintained independently per Explorer window, so Back, Forward, and Up behave naturally.

Project detail views use XP Folder Web View rather than separate webpages. Each contains:

- Project name and approved V1 or GitHub description.
- First-person project story when V1 provides one.
- Technology stack and category.
- A simulated repository snapshot with folders, files, and URL shortcuts.
- GitHub shortcut and an optional live Demo shortcut.
- Left-pane project tasks and related locations.

Simulated files are presentation data and cannot be edited. Unknown portfolio paths display an XP warning and return the Explorer instance to My Projects.

### 7.2 My Pictures and Picture and Fax Viewer

My Pictures opens an XP Explorer-style photo browser that shows the complete 15-image V1 catalog. It does not open directly into a single-photo carousel.

The photo browser includes:

- XP Picture Tasks in the left pane.
- Thumbnails, Filmstrip, and List views.
- All 15 photographs visible in the browsing modes.
- Single-click selection with title, description, dimensions or aspect, and a larger filmstrip preview.
- Status bar with total and selected counts.
- Double-click to open that photo in a separate Picture and Fax Viewer window.

The separate viewer includes:

- Previous and next controls, also mapped to the keyboard arrow keys.
- Fit to window and actual-size modes.
- Zoom controls with safe limits.
- Clockwise and counter-clockwise display rotation.
- Current image number, total image count, title, and description.
- Aspect-ratio-preserving rendering without stretching.

The source photo is never modified. Closing a viewer leaves the original My Pictures browser open. Multiple viewer instances may be open at once and each receives its own taskbar button.

If one photo fails to load, that item shows a missing-image state while the rest of the catalog remains usable.

### 7.3 About Harry - Notepad

About Harry opens a read-only XP Notepad window. The document is stored as Markdown and rendered with headings, paragraphs, lists, separators, emphasis, and links while retaining the sparse Notepad page surface.

The approved content covers:

- Zhiyuan Xing / HarryX.
- Developer: AI systems, full-stack development, and creative coding.
- Researcher: UAV autonomy, sensor fusion, and prototyping.
- Photographer: architecture, street, and visual storytelling.
- Designer: interface, motion, and visual identity.
- Selected interests, current work, and public contact channels derived from V1.

The document cannot be edited or saved, but users can select and copy text. Menus expose only working or explicitly disabled actions:

- File: Close.
- Edit: Copy and Select All.
- Format: Word Wrap toggle.
- View: Status Bar toggle.
- Help: About This Portfolio.

### 7.4 Harry Messenger

Harry Messenger is an XP Messenger-style chat window with exactly one contact, Harry. The contact is selected by default.

The first release includes:

- A local welcome message that identifies the surface as a portfolio preview.
- Text-only user messages rendered as plain text.
- Scripted local responses for projects, photography, contact information, and the site's AI-not-connected status.
- A clear offline fallback for unmatched questions.
- Session-only history, optionally mirrored to `sessionStorage`, and no cross-device persistence.
- Online/offline/error presentation states.

The UI talks only to a typed `ChatService` interface. The initial local adapter can later be replaced with an API adapter without changing the Messenger window. No secret or API endpoint is shipped in V1 of this chat feature.

## 8. Content Organization

Content is separated from application behavior:

```text
src/content/projects.ts
src/content/photos.ts
src/content/contacts.ts
src/content/about.md
src/content/chat-responses.ts
public/assets/photos/
public/assets/icons/
public/assets/wallpaper/
```

Project and photo records have stable slugs. External links open in a new tab with `rel="noreferrer"`. Contact details reused from V1 are limited to channels already published by Harry: GitHub, WeChat, Instagram, and email.

## 9. Accessibility and Interaction Safety

- All title-bar buttons, desktop icons, taskbar buttons, Start items, Explorer controls, and viewer controls have accessible names.
- Keyboard focus is visible and follows window focus.
- Enter opens focused desktop icons; Escape closes menus and non-destructive dialogs.
- Arrow keys navigate photos when a viewer is focused.
- Reduced-motion mode shortens boot and window transitions without skipping functional states.
- Text contrast is checked across active and inactive XP chrome.
- User chat text is rendered as text, not injected HTML.
- External links are visually distinguishable and never replace the desktop session.

## 10. Error Handling

- Application render failures are isolated and shown as closable XP error dialogs.
- Invalid Explorer paths warn and return to the project root.
- Missing project Demo URLs do not hide GitHub or the local description.
- Photo failures affect only the failed photo.
- Chat adapter failures preserve existing messages and show Harry as offline.
- Boot and login transitions use explicit state changes rather than relying only on animation completion events.

## 11. Verification

### Unit and component tests

Vitest and React Testing Library cover:

- System phase transitions.
- Window launch, cascade, focus, minimize, maximize, restore, close, and bounds calculations.
- Taskbar toggle behavior.
- Explorer history and invalid-path fallback.
- Project and photo data integrity.
- Viewer navigation, wrapping, zoom bounds, and rotation state.
- Markdown About rendering and working menu actions.
- Local chat intents, fallback, and error state.

### End-to-end tests

Playwright covers:

- Boot to login to desktop.
- Opening multiple instances and controlling them from the taskbar.
- Start menu launch and dismissal.
- Explorer root, project navigation, Back, Forward, Up, views, and external-link presence.
- My Pictures all-photo browsing and opening multiple viewer windows.
- Notepad Markdown hierarchy and copy/select behavior.
- Messenger send and local response flow.
- Logoff, shutdown, cancel, and restart.
- Keyboard and reduced-motion paths.

### Visual checks

Screenshots are reviewed at:

- 1440 by 900
- 1024 by 768
- 390 by 844

Checks cover login, desktop, Start menu, overlapping windows, maximized windows, Explorer, My Pictures, Picture and Fax Viewer, Notepad, Messenger, shutdown, and powered-off states. Windows must remain bounded and readable at every target size.

## 12. Git and Publication

- The repository uses the `main` branch.
- Commits are separated into meaningful milestones: system shell, window manager, applications, V1 content migration, and final QA.
- No secrets, API keys, generated test output, dependency folders, or V1 repository history are copied into V2.
- After the complete build and test suite pass, GitHub CLI creates `Ha22yX/rosebeg-v2` as a public repository, adds it as `origin`, pushes `main`, and verifies the remote URL and branch status.

## 13. Acceptance Criteria

The release is complete when:

1. A fresh load shows the short boot sequence and account-selection screen before the desktop.
2. The desktop and system surfaces convincingly reproduce the approved XP Luna composition and interaction logic.
3. Every app can be opened multiple times and every window can be focused, moved, resized, minimized, maximized, restored, and closed.
4. Taskbar and Start menu behavior remain synchronized with the window manager.
5. My Projects exposes all nine approved project folders and working local detail navigation.
6. My Pictures exposes all 15 real V1 photos at once and can launch independent viewer windows.
7. About Harry renders the approved hierarchical Markdown content inside a read-only Notepad shell.
8. Harry Messenger works through the local service adapter and makes the missing AI integration explicit.
9. Logoff, shutdown, cancel, powered-off, and restart paths work.
10. Automated tests and target-viewport screenshot checks pass.
11. The complete source is committed and pushed to the public `Ha22yX/rosebeg-v2` repository with no secrets or runtime dependency on V1.
