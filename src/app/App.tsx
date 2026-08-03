import { useEffect, useState } from "react";
import "@/app/app.css";
import { SystemSoundProvider } from "@/audio/SystemSoundProvider";
import { appRegistry } from "@/desktop/app-registry";
import { DesktopShell } from "@/desktop/DesktopShell";
import { SystemRoot } from "@/system/SystemRoot";
import { WindowManagerProvider } from "@/windowing/WindowManager";

const taskbarHeight = 32;

export function App() {
  const desktopSize = useDesktopSize();

  return (
    <main aria-label="Rosebeg XP system" className="app-root">
      <SystemSoundProvider>
        <SystemRoot>
          <WindowManagerProvider
            desktopSize={desktopSize}
            registry={appRegistry}
          >
            <DesktopShell />
          </WindowManagerProvider>
        </SystemRoot>
      </SystemSoundProvider>
    </main>
  );
}

function useDesktopSize() {
  const readDesktopSize = () => ({
    width: typeof window === "undefined" ? 1024 : window.innerWidth,
    height:
      typeof window === "undefined"
        ? 736
        : Math.max(0, window.innerHeight - taskbarHeight),
  });
  const [desktopSize, setDesktopSize] = useState(readDesktopSize);

  useEffect(() => {
    const handleResize = () => setDesktopSize(readDesktopSize());
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return desktopSize;
}
