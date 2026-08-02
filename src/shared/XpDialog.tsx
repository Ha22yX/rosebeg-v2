import { useId, type ReactNode } from "react";
import { XpButton } from "@/shared/XpButton";
import "@/shared/xp-theme.css";

export type XpDialogProps = {
  title: string;
  children: ReactNode;
  actions?: ReactNode;
  onClose?: () => void;
  className?: string;
  modal?: boolean;
};

export function XpDialog({
  title,
  children,
  actions,
  onClose,
  className = "",
  modal = false,
}: XpDialogProps) {
  const titleId = useId();

  return (
    <section
      aria-modal={modal || undefined}
      aria-labelledby={titleId}
      className={["xp-dialog", className].filter(Boolean).join(" ")}
      role="dialog"
    >
      <header className="xp-dialog__title-bar">
        <h2 id={titleId}>{title}</h2>
        {onClose ? (
          <XpButton
            aria-label={`Close ${title}`}
            className="xp-dialog__close"
            onClick={onClose}
          >
            ×
          </XpButton>
        ) : null}
      </header>
      <div className="xp-dialog__body">{children}</div>
      {actions ? <footer className="xp-dialog__actions">{actions}</footer> : null}
    </section>
  );
}
