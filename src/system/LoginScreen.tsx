type LoginScreenProps = {
  signingIn?: boolean;
  onSelectAccount: () => void;
};

export function LoginScreen({
  signingIn = false,
  onSelectAccount,
}: LoginScreenProps) {
  if (signingIn) {
    return (
      <section className="system-screen login-screen" data-testid="signing-in-screen">
        <div aria-hidden="true" className="account-avatar">
          H
        </div>
        <p>Welcome, Harry</p>
        <p className="system-status">Loading your personal settings...</p>
      </section>
    );
  }

  return (
    <section className="system-screen login-screen" data-testid="login-screen">
      <div className="login-panel">
        <p className="login-heading">Welcome</p>
        <p>To begin, click your user name.</p>
        <button className="account-button" onClick={onSelectAccount} type="button">
          <span aria-hidden="true" className="account-avatar">
            H
          </span>
          Harry
        </button>
      </div>
    </section>
  );
}
