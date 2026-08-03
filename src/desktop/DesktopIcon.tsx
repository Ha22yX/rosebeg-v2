import type { MouseEvent } from "react";
import { XpIcon } from "@/shared/XpIcon";

type DesktopIconProps = {
  icon: string;
  label: string;
  onOpen(): void;
};

export function DesktopIcon({ icon, label, onOpen }: DesktopIconProps) {
  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    if (event.detail >= 2) return;
    onOpen();
  };

  return (
    <button
      aria-label={label}
      className="desktop-icon"
      onClick={handleClick}
      type="button"
    >
      <XpIcon alt="" className="desktop-icon__image" size={48} src={icon} />
      <span>{label}</span>
    </button>
  );
}
