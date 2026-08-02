type PowerScreenProps = {
  phase: "logging-off" | "shutting-down" | "powered-off";
  onRestart: () => void;
};

const messages = {
  "logging-off": "Logging off...",
  "shutting-down": "Windows is shutting down...",
  "powered-off": "It is now safe to turn off your computer.",
} as const;

export function PowerScreen({ phase, onRestart }: PowerScreenProps) {
  const isPoweredOff = phase === "powered-off";

  return (
    <section className="system-screen power-screen" data-testid={`${phase}-screen`}>
      <p>{messages[phase]}</p>
      {isPoweredOff ? (
        <button onClick={onRestart} type="button">
          Restart
        </button>
      ) : null}
    </section>
  );
}
