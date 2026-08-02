import {
  useId,
  useLayoutEffect,
  useRef,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { XpButton } from "@/shared/XpButton";
import "@/shared/xp-theme.css";

export type XpDialogProps = {
  title: string;
  children: ReactNode;
  actions?: ReactNode;
  onClose?: () => void;
  onDismiss?: () => void;
  className?: string;
  modal?: boolean;
};

export function XpDialog({
  title,
  children,
  actions,
  onClose,
  onDismiss,
  className = "",
  modal = false,
}: XpDialogProps) {
  const titleId = useId();
  const dialogRef = useRef<HTMLElement>(null);
  const actionsRef = useRef<HTMLElement>(null);
  const dismissibleModal = modal && onDismiss !== undefined;

  useLayoutEffect(() => {
    if (!dismissibleModal) return;
    const previousFocus =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const dialog = dialogRef.current;
    const initialFocus =
      dialog?.querySelector<HTMLElement>("[autofocus]") ??
      actionsRef.current?.querySelector<HTMLElement>(focusableSelector) ??
      dialog?.querySelector<HTMLElement>(focusableSelector) ??
      dialog;
    initialFocus?.focus({ preventScroll: true });

    return () => {
      if (previousFocus?.isConnected) {
        previousFocus.focus({ preventScroll: true });
      }
    };
  }, [dismissibleModal]);

  const containFocus = (event: KeyboardEvent<HTMLElement>) => {
    if (!dismissibleModal) return;
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      onDismiss();
      return;
    }
    if (event.key !== "Tab") return;

    const controls = Array.from(
      event.currentTarget.querySelectorAll<HTMLElement>(focusableSelector),
    );
    const first = controls[0];
    const last = controls.at(-1);
    if (!first || !last) {
      event.preventDefault();
      dialogRef.current?.focus({ preventScroll: true });
      return;
    }

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus({ preventScroll: true });
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus({ preventScroll: true });
    }
  };

  return (
    <section
      aria-modal={modal || undefined}
      aria-labelledby={titleId}
      className={["xp-dialog", className].filter(Boolean).join(" ")}
      onKeyDown={containFocus}
      ref={dialogRef}
      role="dialog"
      tabIndex={dismissibleModal ? -1 : undefined}
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
      {actions ? (
        <footer className="xp-dialog__actions" ref={actionsRef}>
          {actions}
        </footer>
      ) : null}
    </section>
  );
}

const focusableSelector =
  "button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex='-1'])";
