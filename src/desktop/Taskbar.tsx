import { useEffect, useState, type KeyboardEvent, type RefObject } from "react";
import { useSystemSound } from "@/audio/SystemSoundProvider";
import { XpIcon } from "@/shared/XpIcon";
import { useWindowManager } from "@/windowing/WindowManager";

type TaskbarProps = {
  startOpen: boolean;
  startButtonRef: RefObject<HTMLButtonElement | null>;
  onToggleStart(): void;
};

export function Taskbar({ startButtonRef, startOpen, onToggleStart }: TaskbarProps) {
  const { activeWindowId, toggleTaskbar, windows } = useWindowManager();
  const { muted, toggleMuted } = useSystemSound();
  const clock = useMinuteClock();

  const navigateTasks = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;

    const tasks = Array.from(
      event.currentTarget.querySelectorAll<HTMLButtonElement>(".taskbar__task"),
    );
    if (tasks.length === 0) return;

    const currentIndex = tasks.indexOf(document.activeElement as HTMLButtonElement);
    let nextIndex: number;
    if (event.key === "Home") nextIndex = 0;
    else if (event.key === "End") nextIndex = tasks.length - 1;
    else if (event.key === "ArrowRight") nextIndex = (currentIndex + 1) % tasks.length;
    else nextIndex = currentIndex <= 0 ? tasks.length - 1 : currentIndex - 1;

    event.preventDefault();
    tasks[nextIndex]?.focus();
  };

  return (
    <footer aria-label="Taskbar" className="taskbar">
      <button
        aria-expanded={startOpen}
        aria-label="Start"
        className={`taskbar__start${startOpen ? " is-open" : ""}`}
        onClick={onToggleStart}
        ref={startButtonRef}
        type="button"
      >
        <span aria-hidden="true" className="taskbar__start-mark">
          <i />
          <i />
          <i />
          <i />
        </span>
        <strong>start</strong>
      </button>

      <div
        aria-label="Open applications"
        className="taskbar__tasks"
        onKeyDown={navigateTasks}
        role="group"
        tabIndex={0}
      >
        {windows.map((windowInstance, index) => {
          const active =
            activeWindowId === windowInstance.id &&
            windowInstance.mode !== "minimized";

          return (
            <button
              aria-label={`${windowInstance.title} task ${index + 1}`}
              aria-pressed={active}
              className={`taskbar__task${active ? " is-active" : ""}${
                windowInstance.mode === "minimized" ? " is-minimized" : ""
              }`}
              key={windowInstance.id}
              onClick={() => toggleTaskbar(windowInstance.id)}
              title={windowInstance.title}
              type="button"
            >
              <XpIcon alt="" size={16} src={windowInstance.icon} />
              <span>{windowInstance.title}</span>
            </button>
          );
        })}
      </div>

      <aside aria-label="Notification area" className="taskbar__tray">
        <span aria-hidden="true" className="taskbar__tray-status" title="Portfolio is ready" />
        <button
          aria-label={muted ? "Enable system sounds" : "Mute system sounds"}
          aria-pressed={muted}
          className={`taskbar__sound${muted ? " is-muted" : ""}`}
          onClick={toggleMuted}
          title={muted ? "System sounds are muted" : "Mute system sounds"}
          type="button"
        >
          <span aria-hidden="true" />
        </button>
        <time aria-label={`Local time ${clock}`} dateTime={new Date().toISOString()}>
          {clock}
        </time>
      </aside>
    </footer>
  );
}

function useMinuteClock() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const current = new Date();
    const millisecondsToNextMinute =
      60_000 - (current.getSeconds() * 1_000 + current.getMilliseconds());
    let intervalId: number | undefined;
    const timeoutId = window.setTimeout(() => {
      setNow(new Date());
      intervalId = window.setInterval(() => setNow(new Date()), 60_000);
    }, millisecondsToNextMinute);

    return () => {
      window.clearTimeout(timeoutId);
      if (intervalId !== undefined) window.clearInterval(intervalId);
    };
  }, []);

  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(now);
}
