import { AboutNotepad } from "@/apps/about/AboutNotepad";
import { HarryMessenger } from "@/apps/messenger/HarryMessenger";
import { PicturesBrowser } from "@/apps/photos/PicturesBrowser";
import { PictureViewer } from "@/apps/photos/PictureViewer";
import { ProjectsExplorer } from "@/apps/projects/ProjectsExplorer";
import { photos } from "@/content/photos";
import type { WindowRegistry } from "@/windowing/types";

export const appRegistry = {
  "projects-explorer": {
    appId: "projects-explorer",
    title: "My Projects",
    icon: "/assets/icons/projects.png",
    idealSize: { width: 900, height: 620 },
    minimumSize: { width: 520, height: 420 },
    render: ({ payload }) => (
      <ProjectsExplorer initialProjectSlug={payload.projectSlug} />
    ),
  },
  "pictures-browser": {
    appId: "pictures-browser",
    title: "My Pictures",
    icon: "/assets/icons/pictures.png",
    idealSize: { width: 880, height: 600 },
    minimumSize: { width: 500, height: 360 },
    render: ({ launch }) => (
      <PicturesBrowser
        onOpenPhoto={(photoSlug) =>
          launch("picture-viewer", { photoSlug })
        }
      />
    ),
  },
  "picture-viewer": {
    appId: "picture-viewer",
    title: "Windows Picture and Fax Viewer",
    icon: "/assets/icons/pictures.png",
    idealSize: { width: 760, height: 580 },
    minimumSize: { width: 420, height: 320 },
    render: ({ payload }) => (
      <PictureViewer initialSlug={payload.photoSlug ?? photos[0]!.slug} />
    ),
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
