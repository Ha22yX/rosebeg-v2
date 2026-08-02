import type {
  KeyboardEvent,
  PointerEvent as ReactPointerEvent,
} from "react";
import { XpIcon } from "@/shared/XpIcon";

type DesktopIconProps = {
  icon: string;
  label: string;
  onOpen(): void;
};

export function DesktopIcon({ icon, label, onOpen }: DesktopIconProps) {
  const handlePointerUp = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (event.pointerType !== "touch") return;
    event.preventDefault();
    onOpen();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    onOpen();
  };

  return (
    <button
      aria-label={label}
      className="desktop-icon"
      onDoubleClick={onOpen}
      onKeyDown={handleKeyDown}
      onPointerUp={handlePointerUp}
      type="button"
    >
      <XpIcon alt="" className="desktop-icon__image" size={48} src={icon} />
      <span>{label}</span>
    </button>
  );
}
