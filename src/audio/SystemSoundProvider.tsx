import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

export type SystemSoundName =
  | "login"
  | "open"
  | "minimize"
  | "maximize"
  | "restore"
  | "close"
  | "start"
  | "logoff"
  | "shutdown";

type SystemSoundApi = {
  muted: boolean;
  play(name: SystemSoundName): void;
  toggleMuted(): void;
};

const MUTE_KEY = "rosebeg-xp:sound-muted:v1";
const silentApi: SystemSoundApi = {
  muted: false,
  play: () => undefined,
  toggleMuted: () => undefined,
};
const SystemSoundContext = createContext<SystemSoundApi>(silentApi);

type Note = {
  frequency: number;
  offset: number;
  duration: number;
  gain?: number;
  type?: OscillatorType;
};

const cues: Record<SystemSoundName, readonly Note[]> = {
  login: [
    { frequency: 392, offset: 0, duration: 0.18, gain: 0.055 },
    { frequency: 523.25, offset: 0.12, duration: 0.22, gain: 0.055 },
    { frequency: 659.25, offset: 0.27, duration: 0.34, gain: 0.06 },
  ],
  open: [
    { frequency: 520, offset: 0, duration: 0.07, gain: 0.025 },
    { frequency: 690, offset: 0.045, duration: 0.11, gain: 0.025 },
  ],
  minimize: [
    { frequency: 620, offset: 0, duration: 0.08, gain: 0.025 },
    { frequency: 380, offset: 0.05, duration: 0.12, gain: 0.022 },
  ],
  maximize: [
    { frequency: 390, offset: 0, duration: 0.08, gain: 0.025 },
    { frequency: 650, offset: 0.055, duration: 0.13, gain: 0.026 },
  ],
  restore: [
    { frequency: 440, offset: 0, duration: 0.08, gain: 0.022 },
    { frequency: 560, offset: 0.05, duration: 0.11, gain: 0.023 },
  ],
  close: [
    { frequency: 520, offset: 0, duration: 0.075, gain: 0.022 },
    { frequency: 330, offset: 0.045, duration: 0.1, gain: 0.02 },
  ],
  start: [{ frequency: 720, offset: 0, duration: 0.085, gain: 0.022 }],
  logoff: [
    { frequency: 659.25, offset: 0, duration: 0.16, gain: 0.045 },
    { frequency: 523.25, offset: 0.12, duration: 0.2, gain: 0.043 },
    { frequency: 392, offset: 0.27, duration: 0.28, gain: 0.04 },
  ],
  shutdown: [
    { frequency: 523.25, offset: 0, duration: 0.18, gain: 0.045 },
    { frequency: 392, offset: 0.15, duration: 0.22, gain: 0.042 },
    { frequency: 293.66, offset: 0.31, duration: 0.32, gain: 0.04 },
  ],
};

export function SystemSoundProvider({ children }: { children: ReactNode }) {
  const [muted, setMuted] = useState(readMutedPreference);
  const audioContext = useRef<AudioContext | null>(null);

  useEffect(
    () => () => {
      void audioContext.current?.close();
    },
    [],
  );

  const play = useCallback(
    (name: SystemSoundName) => {
      if (muted || typeof window === "undefined" || !window.AudioContext) return;

      try {
        const context = audioContext.current ?? new window.AudioContext();
        audioContext.current = context;
        if (context.state === "suspended") void context.resume();
        const startAt = context.currentTime + 0.008;

        for (const note of cues[name]) {
          const oscillator = context.createOscillator();
          const gain = context.createGain();
          const noteStart = startAt + note.offset;
          const noteEnd = noteStart + note.duration;
          oscillator.type = note.type ?? "sine";
          oscillator.frequency.setValueAtTime(note.frequency, noteStart);
          gain.gain.setValueAtTime(0.0001, noteStart);
          gain.gain.exponentialRampToValueAtTime(note.gain ?? 0.03, noteStart + 0.012);
          gain.gain.exponentialRampToValueAtTime(0.0001, noteEnd);
          oscillator.connect(gain);
          gain.connect(context.destination);
          oscillator.start(noteStart);
          oscillator.stop(noteEnd + 0.01);
        }
      } catch {
        // Audio is decorative and must never block a desktop action.
      }
    },
    [muted],
  );

  const toggleMuted = useCallback(() => {
    setMuted((current) => {
      const next = !current;
      try {
        window.localStorage.setItem(MUTE_KEY, String(next));
      } catch {
        // Keep the in-memory preference when storage is unavailable.
      }
      return next;
    });
  }, []);

  const value = useMemo(() => ({ muted, play, toggleMuted }), [muted, play, toggleMuted]);
  return <SystemSoundContext.Provider value={value}>{children}</SystemSoundContext.Provider>;
}

export function useSystemSound(): SystemSoundApi {
  return useContext(SystemSoundContext);
}

function readMutedPreference(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(MUTE_KEY) === "true";
  } catch {
    return false;
  }
}
