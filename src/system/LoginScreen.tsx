import { RosebegXpLogo } from "@/system/RosebegXpLogo";

type LoginScreenProps = {
  signingIn?: boolean;
  onSelectAccount: () => void;
};

export function LoginScreen({
  signingIn = false,
  onSelectAccount,
}: LoginScreenProps) {
  return (
    <section
      className="system-screen login-screen"
      data-testid={signingIn ? "signing-in-screen" : "login-screen"}
    >
      <header className="login-header" data-testid="login-header">
        <RosebegXpLogo compact inverse />
      </header>
      <main className="login-main" data-testid="login-main">
        <div className="login-panel">
          {signingIn ? (
            <>
              <button
                aria-pressed="true"
                className="account-button account-button--selected"
                disabled
                type="button"
              >
                <span aria-hidden="true" className="account-avatar">
                  H
                </span>
                Harry
              </button>
              <p className="login-heading">Welcome</p>
              <p className="system-status">Loading your personal settings...</p>
            </>
          ) : (
            <>
              <p className="login-heading">Welcome</p>
              <p>To begin, click your user name</p>
              <button className="account-button" onClick={onSelectAccount} type="button">
                <span aria-hidden="true" className="account-avatar">
                  H
                </span>
                Harry
              </button>
            </>
          )}
        </div>
      </main>
      <footer className="login-footer" data-testid="login-footer">
        To shut down or restart your computer, click Turn off computer.
      </footer>
    </section>
  );
}
