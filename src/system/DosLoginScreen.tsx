import { useEffect, useState } from "react";

const DOS_TRANSCRIPT = [
  "Rosebeg DOS [Version 1.0.2008]",
  "Copyright (C) Zhiyuan Xing. All rights reserved.",
  "",
  "C:\\ROSEBEG> portfolio.exe /user:Harry",
  "",
  "WELCOME TO ROSEBEG.",
  "This website is Harry Xing's portfolio.",
  "Every project displayed here was independently developed by Zhiyuan Xing.",
  "Every photograph was independently captured by Zhiyuan Xing.",
  "This website was independently designed and developed by Zhiyuan Xing.",
  "",
  "Portfolio verification complete.",
].join("\n");

const TYPING_RHYTHM_MS = [18, 26, 21, 34, 17, 24, 29] as const;

export const DOS_LOGIN_READING_HOLD_MS = 5_000;

function getTypingDelayMs(character: string, index: number): number {
  if (character === "\n") return 210;
  if (/[.!?]/.test(character)) return 160;
  if (/[,;:]/.test(character)) return 90;
  if (character === " ") return 14;
  return TYPING_RHYTHM_MS[index % TYPING_RHYTHM_MS.length];
}

export const DOS_TYPING_DURATION_MS = Array.from(DOS_TRANSCRIPT).reduce(
  (duration, character, index) => duration + getTypingDelayMs(character, index),
  0,
);

export const DOS_SIGN_IN_DURATION_MS =
  DOS_TYPING_DURATION_MS + DOS_LOGIN_READING_HOLD_MS;

type DosLoginScreenProps = {
  reducedMotion: boolean;
};

export function DosLoginScreen({ reducedMotion }: DosLoginScreenProps) {
  const [visibleCharacters, setVisibleCharacters] = useState(
    reducedMotion ? DOS_TRANSCRIPT.length : 0,
  );

  useEffect(() => {
    if (reducedMotion) {
      setVisibleCharacters(DOS_TRANSCRIPT.length);
      return;
    }

    let nextCharacterIndex = 0;
    let timeoutId = 0;
    let cancelled = false;

    const typeNextCharacter = () => {
      if (cancelled) return;

      nextCharacterIndex += 1;
      setVisibleCharacters(nextCharacterIndex);

      if (nextCharacterIndex < DOS_TRANSCRIPT.length) {
        timeoutId = window.setTimeout(
          typeNextCharacter,
          getTypingDelayMs(
            DOS_TRANSCRIPT[nextCharacterIndex],
            nextCharacterIndex,
          ),
        );
      }
    };

    setVisibleCharacters(0);
    timeoutId = window.setTimeout(
      typeNextCharacter,
      getTypingDelayMs(DOS_TRANSCRIPT[0], 0),
    );

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [reducedMotion]);

  const transcriptComplete = visibleCharacters === DOS_TRANSCRIPT.length;

  return (
    <section
      aria-label="Logging in to Rosebeg XP"
      className="system-screen dos-login-screen"
      data-testid="signing-in-screen"
    >
      <div className="dos-window">
        <header aria-hidden="true" className="dos-window__titlebar">
          <span className="dos-window__icon">&gt;_</span>
          <span>C:\WINDOWS\system32\cmd.exe</span>
        </header>
        <div className="dos-terminal">
          <p
            aria-label="Rosebeg portfolio login introduction"
            className="dos-login__sr-summary"
            role="status"
          >
            Welcome to Rosebeg. This website is Harry Xing&apos;s portfolio.
            Every project displayed here was independently developed by Zhiyuan Xing.
            Every photograph was independently captured by Zhiyuan Xing. This website
            was also independently designed and developed by Zhiyuan Xing.
          </p>
          <pre aria-hidden="true" data-testid="dos-transcript">
            {DOS_TRANSCRIPT.slice(0, visibleCharacters)}
            {!transcriptComplete ? <span className="dos-cursor">_</span> : null}
          </pre>
          {transcriptComplete ? (
            <p aria-label="Logging in" className="dos-login__status">
              <span>C:\ROSEBEG&gt; </span>
              <span>Log In</span>
              <span aria-hidden="true" className="dos-login__dots">
                <span>.</span>
                <span>.</span>
                <span>.</span>
              </span>
              <span aria-hidden="true" className="dos-cursor">
                _
              </span>
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
