import { RosebegXpLogo } from "@/system/RosebegXpLogo";

type LoginScreenProps = {
  onSelectAccount: () => void;
};

export function LoginScreen({ onSelectAccount }: LoginScreenProps) {
  return (
    <section
      className="system-screen login-screen"
      data-testid="login-screen"
    >
      <header aria-hidden="true" className="login-header" data-testid="login-header">
        <span className="login-header__accent" />
      </header>
      <main className="login-main" data-testid="login-main">
        <div className="login-panel">
          <div className="login-intro" data-testid="login-intro">
            <RosebegXpLogo compact inverse />
            <p>To begin, click your user name</p>
          </div>
          <button
            className="account-button"
            onClick={onSelectAccount}
            type="button"
          >
            <span aria-hidden="true" className="account-avatar">
              H
            </span>
            Harry
          </button>
        </div>
      </main>
      <footer className="login-footer" data-testid="login-footer">
        <div aria-label="Power options" className="login-footer__power" role="group">
          <span aria-hidden="true" className="login-footer__power-icon" />
          <span>Turn off computer</span>
        </div>
        <p className="login-footer__help">
          After you log on, you can explore Harry&apos;s work, photography, and story.
        </p>
      </footer>
    </section>
  );
}
