import type { ButtonHTMLAttributes } from "react";
import "@/shared/xp-theme.css";

export type XpButtonProps = ButtonHTMLAttributes<HTMLButtonElement>;

export function XpButton({
  className = "",
  type = "button",
  ...props
}: XpButtonProps) {
  return (
    <button
      className={["xp-button", className].filter(Boolean).join(" ")}
      type={type}
      {...props}
    />
  );
}
