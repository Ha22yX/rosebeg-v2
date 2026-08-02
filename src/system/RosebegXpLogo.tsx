import type { JSX } from "react";

type RosebegXpLogoProps = {
  compact?: boolean;
  inverse?: boolean;
};

export function RosebegXpLogo({
  compact = false,
  inverse = false,
}: RosebegXpLogoProps): JSX.Element {
  const className = [
    "rosebeg-xp-logo",
    compact && "rosebeg-xp-logo--compact",
    inverse && "rosebeg-xp-logo--inverse",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div aria-label="Rosebeg XP" className={className} role="img">
      <svg aria-hidden="true" className="rosebeg-xp-logo__symbol" viewBox="0 0 48 48">
        <path d="M4 4h19v19H4Z" fill="#f25022" />
        <path d="M26 4h18v19H26Z" fill="#7fba00" />
        <path d="M4 26h19v18H4Z" fill="#00a4ef" />
        <path d="M26 26h18v18H26Z" fill="#ffb900" />
      </svg>
      <span className="rosebeg-xp-logo__wordmark">Rosebeg</span>
      <span className="rosebeg-xp-logo__xp" style={{ color: "#f89820" }}>
        XP
      </span>
    </div>
  );
}
