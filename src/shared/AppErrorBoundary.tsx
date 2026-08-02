import { Component, type ReactNode } from "react";
import { XpButton } from "@/shared/XpButton";

export type AppErrorBoundaryProps = {
  windowTitle: string;
  onClose(): void;
  children: ReactNode;
};

type AppErrorBoundaryState = {
  hasError: boolean;
};

export class AppErrorBoundary extends Component<
  AppErrorBoundaryProps,
  AppErrorBoundaryState
> {
  state: AppErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): AppErrorBoundaryState {
    return { hasError: true };
  }

  render() {
    const { children, onClose, windowTitle } = this.props;

    if (!this.state.hasError) return children;

    const errorTitle = `${windowTitle} has encountered a problem`;
    return (
      <section
        aria-label={errorTitle}
        className="app-error-boundary"
        role="alertdialog"
      >
        <div aria-hidden="true" className="app-error-boundary__icon">
          ×
        </div>
        <div className="app-error-boundary__copy">
          <h3>{errorTitle}</h3>
          <p>
            This application could not continue. Your desktop is still running.
          </p>
        </div>
        <XpButton
          aria-label={`Close ${windowTitle}`}
          autoFocus
          onClick={onClose}
        >
          Close
        </XpButton>
      </section>
    );
  }
}
