import { RosebegXpLogo } from "@/system/RosebegXpLogo";

export function BootScreen() {
  return (
    <section className="system-screen boot-screen" data-testid="boot-screen">
      <RosebegXpLogo inverse />
      <div aria-hidden="true" className="boot-progress" data-testid="boot-progress">
        <span className="boot-progress__block" />
        <span className="boot-progress__block" />
        <span className="boot-progress__block" />
      </div>
    </section>
  );
}
