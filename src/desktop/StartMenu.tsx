import { useEffect, useRef, type KeyboardEvent } from "react";
import { XpIcon } from "@/shared/XpIcon";
import type { AppId } from "@/windowing/types";

type StartMenuProps = {
  onDismiss(): void;
  onLaunch(appId: AppId): void;
  onLogOff(): void;
  onTurnOff(): void;
};

const primaryEntries: ReadonlyArray<{
  appId: AppId;
  icon: string;
  label: string;
  detail: string;
}> = [
  {
    appId: "projects-explorer",
    icon: "/assets/icons/projects.png",
    label: "My Projects",
    detail: "Explore selected work",
  },
  {
    appId: "pictures-browser",
    icon: "/assets/icons/pictures.png",
    label: "My Pictures",
    detail: "Browse the photo archive",
  },
  {
    appId: "about-notepad",
    icon: "/assets/icons/notepad.png",
    label: "About Harry",
    detail: "Read the portfolio notes",
  },
  {
    appId: "harry-messenger",
    icon: "/assets/icons/messenger.png",
    label: "Harry Messenger",
    detail: "Start a local conversation",
  },
];

const placeEntries: ReadonlyArray<{
  appId: AppId;
  icon: string;
  label: string;
}> = [
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
];

export function StartMenu({
  onDismiss,
  onLaunch,
  onLogOff,
  onTurnOff,
}: StartMenuProps) {
  const menuRef = useRef<HTMLElement>(null);

  useEffect(() => {
    menuRef.current?.querySelector<HTMLElement>("[role='menuitem']")?.focus();
  }, []);

  const launch = (appId: AppId) => {
    onDismiss();
    onLaunch(appId);
  };

  const navigateMenu = (event: KeyboardEvent<HTMLElement>) => {
    if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;

    const items = Array.from(
      event.currentTarget.querySelectorAll<HTMLElement>("[role='menuitem']"),
    );
    if (items.length === 0) return;

    const currentIndex = items.indexOf(document.activeElement as HTMLElement);
    let nextIndex: number;
    if (event.key === "Home") nextIndex = 0;
    else if (event.key === "End") nextIndex = items.length - 1;
    else if (event.key === "ArrowDown") nextIndex = (currentIndex + 1) % items.length;
    else nextIndex = currentIndex <= 0 ? items.length - 1 : currentIndex - 1;

    event.preventDefault();
    items[nextIndex]?.focus();
  };

  return (
    <section
      aria-label="Start menu"
      className="start-menu"
      onKeyDown={navigateMenu}
      ref={menuRef}
      role="menu"
    >
      <header className="start-menu__header" role="presentation">
        <span aria-hidden="true" className="start-menu__avatar">
          H
        </span>
        <strong>Harry</strong>
      </header>

      <div className="start-menu__columns" role="presentation">
        <div className="start-menu__primary">
          {primaryEntries.map((entry) => (
            <button
              className="start-menu__item start-menu__item--primary"
              key={entry.appId}
              onClick={() => launch(entry.appId)}
              role="menuitem"
              type="button"
            >
              <XpIcon alt="" size={36} src={entry.icon} />
              <span>
                <strong>{entry.label}</strong>
                <small>{entry.detail}</small>
              </span>
            </button>
          ))}
        </div>

        <div className="start-menu__places">
          <a
            className="start-menu__item start-menu__item--place"
            href="https://github.com/Ha22yX"
            onClick={onDismiss}
            rel="noreferrer"
            role="menuitem"
            target="_blank"
          >
            <XpIcon alt="" size={26} src="/assets/icons/github.png" />
            <strong>GitHub</strong>
          </a>
          <span aria-hidden="true" className="start-menu__divider" />
          {placeEntries.map((entry) => (
            <button
              className="start-menu__item start-menu__item--place"
              key={entry.appId}
              onClick={() => launch(entry.appId)}
              role="menuitem"
              type="button"
            >
              <XpIcon alt="" size={26} src={entry.icon} />
              <strong>{entry.label}</strong>
            </button>
          ))}
        </div>
      </div>

      <footer className="start-menu__footer" role="presentation">
        <button
          className="start-menu__power-action"
          onClick={() => {
            onDismiss();
            onLogOff();
          }}
          role="menuitem"
          type="button"
        >
          <span aria-hidden="true" className="start-menu__power-icon start-menu__power-icon--logoff" />
          Log Off
        </button>
        <button
          className="start-menu__power-action"
          onClick={() => {
            onDismiss();
            onTurnOff();
          }}
          role="menuitem"
          type="button"
        >
          <span aria-hidden="true" className="start-menu__power-icon start-menu__power-icon--off" />
          Turn Off Computer
        </button>
      </footer>
    </section>
  );
}
