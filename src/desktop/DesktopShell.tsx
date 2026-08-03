import { useCallback, useEffect, useRef, useState } from "react";
import { useSystemSound } from "@/audio/SystemSoundProvider";
import { DesktopIcon } from "@/desktop/DesktopIcon";
import { PowerDialog, type PowerDialogMode } from "@/desktop/PowerDialog";
import { StartMenu } from "@/desktop/StartMenu";
import { Taskbar } from "@/desktop/Taskbar";
import { useSystemActions } from "@/system/SystemRoot";
import { useWindowManager } from "@/windowing/WindowManager";
import type { AppId } from "@/windowing/types";
import "@/desktop/desktop.css";

const desktopEntries: ReadonlyArray<{
  appId: AppId;
  icon: string;
  label: string;
}> = [
  {
    appId: "projects-explorer",
    icon: "/assets/icons/projects.png",
    label: "My Projects",
  },
  {
    appId: "pictures-browser",
    icon: "/assets/icons/pictures.png",
    label: "My Pictures",
  },
  {
    appId: "about-notepad",
    icon: "/assets/icons/notepad.png",
    label: "About Harry",
  },
  {
    appId: "harry-messenger",
    icon: "/assets/icons/messenger.png",
    label: "Harry Messenger",
  },
];

export function DesktopShell() {
  const [startOpen, setStartOpen] = useState(false);
  const [powerDialog, setPowerDialog] = useState<PowerDialogMode>(null);
  const startButtonRef = useRef<HTMLButtonElement>(null);
  const { requestLogOff, requestRestart, requestTurnOff } = useSystemActions();
  const { closeAll, launch } = useWindowManager();
  const { play } = useSystemSound();

  const dismissStart = useCallback(() => {
    setStartOpen(false);
    startButtonRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!startOpen && powerDialog === null) return;

    const dismissOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      if (powerDialog !== null) setPowerDialog(null);
      else dismissStart();
    };

    document.addEventListener("keydown", dismissOnEscape);
    return () => document.removeEventListener("keydown", dismissOnEscape);
  }, [dismissStart, powerDialog, startOpen]);

  const confirmLogOff = () => {
    closeAll();
    setPowerDialog(null);
    requestLogOff();
  };

  return (
    <section className="desktop-shell" data-testid="desktop-shell">
      <div
        aria-label="Desktop"
        className="desktop-background"
        data-testid="desktop-background"
        onPointerDown={() => {
          if (startOpen) dismissStart();
        }}
        role="group"
      >
        <div className="desktop-icons">
          {desktopEntries.map((entry) => (
            <DesktopIcon
              icon={entry.icon}
              key={entry.appId}
              label={entry.label}
              onOpen={() => launch(entry.appId)}
            />
          ))}
        </div>
      </div>

      {startOpen ? (
        <StartMenu
          onDismiss={dismissStart}
          onLaunch={launch}
          onLogOff={() => setPowerDialog("log-off")}
          onTurnOff={() => setPowerDialog("turn-off")}
        />
      ) : null}

      <Taskbar
        onToggleStart={() => {
          play("start");
          if (startOpen) dismissStart();
          else setStartOpen(true);
        }}
        startButtonRef={startButtonRef}
        startOpen={startOpen}
      />

      {powerDialog ? (
        <PowerDialog
          mode={powerDialog}
          onCancel={() => {
            setPowerDialog(null);
            startButtonRef.current?.focus();
          }}
          onLogOff={confirmLogOff}
          onRestart={() => {
            setPowerDialog(null);
            requestRestart();
          }}
          onTurnOff={() => {
            setPowerDialog(null);
            requestTurnOff();
          }}
        />
      ) : null}
    </section>
  );
}
