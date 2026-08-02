import type { KeyboardEvent } from "react";
import { XpButton } from "@/shared/XpButton";
import { XpDialog } from "@/shared/XpDialog";

export type PowerDialogMode = "log-off" | "turn-off" | null;

type PowerDialogProps = {
  mode: Exclude<PowerDialogMode, null>;
  onCancel(): void;
  onLogOff(): void;
  onRestart(): void;
  onTurnOff(): void;
};

export function PowerDialog({
  mode,
  onCancel,
  onLogOff,
  onRestart,
  onTurnOff,
}: PowerDialogProps) {
  const containFocus = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      onCancel();
      return;
    }
    if (event.key !== "Tab") return;

    const controls = Array.from(
      event.currentTarget.querySelectorAll<HTMLElement>(
        "button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex='-1'])",
      ),
    );
    const first = controls[0];
    const last = controls.at(-1);
    if (!first || !last) return;

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  if (mode === "log-off") {
    return (
      <div
        className="power-dialog-backdrop"
        onKeyDown={containFocus}
      >
        <XpDialog
          actions={
            <>
              <XpButton autoFocus aria-label="Confirm Log Off" onClick={onLogOff}>
                Log Off
              </XpButton>
              <XpButton onClick={onCancel}>Cancel</XpButton>
            </>
          }
          className="power-dialog power-dialog--logoff"
          modal
          title="Log Off Windows"
        >
          <div className="power-dialog__message">
            <span aria-hidden="true" className="power-dialog__symbol power-dialog__symbol--logoff" />
            <p>Are you sure you want to log off?</p>
          </div>
        </XpDialog>
      </div>
    );
  }

  return (
    <div
      className="power-dialog-backdrop power-dialog-backdrop--turnoff"
      onKeyDown={containFocus}
    >
      <XpDialog
        actions={
          <XpButton className="power-dialog__cancel" onClick={onCancel}>
            Cancel
          </XpButton>
        }
        className="power-dialog power-dialog--turnoff"
        modal
        title="Turn Off Computer"
      >
        <p className="power-dialog__prompt">What do you want the computer to do?</p>
        <div className="power-dialog__choices">
          <button autoFocus onClick={onTurnOff} type="button">
            <span aria-hidden="true" className="power-dialog__choice-icon power-dialog__choice-icon--off" />
            <strong>Turn Off</strong>
          </button>
          <button onClick={onRestart} type="button">
            <span aria-hidden="true" className="power-dialog__choice-icon power-dialog__choice-icon--restart" />
            <strong>Restart</strong>
          </button>
        </div>
      </XpDialog>
    </div>
  );
}
