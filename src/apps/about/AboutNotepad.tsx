import {
  useRef,
  useState,
  type ComponentPropsWithoutRef,
} from "react";
import ReactMarkdown from "react-markdown";
import { aboutMarkdown } from "@/content/about";
import { XpButton } from "@/shared/XpButton";
import { XpDialog } from "@/shared/XpDialog";
import "@/apps/about/about.css";

export type AboutNotepadProps = {
  closeWindow(): void;
};

type MenuName = "file" | "edit" | "format" | "view" | "help";

const menuLabels: Readonly<Record<MenuName, string>> = {
  file: "File",
  edit: "Edit",
  format: "Format",
  view: "View",
  help: "Help",
};

export function AboutNotepad({ closeWindow }: AboutNotepadProps) {
  const documentRef = useRef<HTMLElement>(null);
  const [openMenu, setOpenMenu] = useState<MenuName | null>(null);
  const [wordWrap, setWordWrap] = useState(false);
  const [statusBarVisible, setStatusBarVisible] = useState(true);
  const [statusMessage, setStatusMessage] = useState("Ready");
  const [aboutVisible, setAboutVisible] = useState(false);

  const toggleMenu = (menu: MenuName) => {
    setOpenMenu((current) => (current === menu ? null : menu));
  };

  const selectAll = () => {
    const documentElement = documentRef.current;
    const selection = window.getSelection();
    if (!documentElement || !selection) return;

    const range = document.createRange();
    range.selectNodeContents(documentElement);
    selection.removeAllRanges();
    selection.addRange(range);
    setOpenMenu(null);
    setStatusMessage("All About Harry text selected");
  };

  const copyDocument = async () => {
    setOpenMenu(null);
    if (!navigator.clipboard?.writeText) {
      setStatusMessage("Copy is unavailable in this browser");
      return;
    }

    try {
      await navigator.clipboard.writeText(aboutMarkdown);
      setStatusMessage("Copied About Harry text to clipboard");
    } catch {
      setStatusMessage("Could not copy About Harry text");
    }
  };

  return (
    <section
      aria-label="About Harry Notepad"
      className="about-notepad"
      onKeyDown={(event) => {
        if (event.key === "Escape" && openMenu) {
          event.preventDefault();
          setOpenMenu(null);
        }
      }}
    >
      <nav aria-label="Notepad menu bar" className="about-notepad__menu-bar">
        {(Object.keys(menuLabels) as MenuName[]).map((menu) => (
          <div className="about-notepad__menu-group" key={menu}>
            <button
              aria-expanded={openMenu === menu}
              aria-haspopup="menu"
              className="about-notepad__menu-trigger"
              onClick={() => toggleMenu(menu)}
              type="button"
            >
              {menuLabels[menu]}
            </button>
            {openMenu === menu ? (
              <MenuPanel
                closeWindow={closeWindow}
                menu={menu}
                onCopy={() => void copyDocument()}
                onOpenAbout={() => {
                  setOpenMenu(null);
                  setAboutVisible(true);
                }}
                onSelectAll={selectAll}
                onToggleStatusBar={() => {
                  setStatusBarVisible((visible) => !visible);
                  setOpenMenu(null);
                }}
                onToggleWordWrap={() => {
                  setWordWrap((wrapped) => !wrapped);
                  setOpenMenu(null);
                }}
                statusBarVisible={statusBarVisible}
                wordWrap={wordWrap}
              />
            ) : null}
          </div>
        ))}
      </nav>

      <main className="about-notepad__editor">
        <article
          aria-label="About Harry document"
          className={`about-notepad__document${wordWrap ? " is-word-wrapped" : ""}`}
          data-testid="notepad-document"
          ref={documentRef}
        >
          <ReactMarkdown components={{ a: MarkdownLink }}>
            {aboutMarkdown}
          </ReactMarkdown>
        </article>
      </main>

      {statusBarVisible ? (
        <footer className="about-notepad__status" role="status">
          {statusMessage}
        </footer>
      ) : null}

      {aboutVisible ? (
        <div className="about-notepad__dialog-layer">
          <XpDialog
            onClose={() => setAboutVisible(false)}
            title="About This Portfolio"
          >
            <p>
              A Windows XP-inspired portfolio for Zhiyuan Xing / HarryX.
            </p>
          </XpDialog>
        </div>
      ) : null}
    </section>
  );
}

type MenuPanelProps = {
  menu: MenuName;
  wordWrap: boolean;
  statusBarVisible: boolean;
  closeWindow(): void;
  onCopy(): void;
  onSelectAll(): void;
  onToggleWordWrap(): void;
  onToggleStatusBar(): void;
  onOpenAbout(): void;
};

function MenuPanel({
  menu,
  wordWrap,
  statusBarVisible,
  closeWindow,
  onCopy,
  onSelectAll,
  onToggleWordWrap,
  onToggleStatusBar,
  onOpenAbout,
}: MenuPanelProps) {
  return (
    <div
      aria-label={menuLabels[menu]}
      className="about-notepad__menu"
      role="menu"
    >
      {menu === "file" ? (
        <>
          <MenuItem disabled>New</MenuItem>
          <MenuItem disabled>Open...</MenuItem>
          <MenuItem disabled>Save</MenuItem>
          <MenuSeparator />
          <MenuItem onClick={closeWindow}>Close</MenuItem>
        </>
      ) : null}
      {menu === "edit" ? (
        <>
          <MenuItem disabled>Undo</MenuItem>
          <MenuSeparator />
          <MenuItem disabled>Cut</MenuItem>
          <MenuItem onClick={onCopy}>Copy</MenuItem>
          <MenuItem disabled>Paste</MenuItem>
          <MenuSeparator />
          <MenuItem onClick={onSelectAll}>Select All</MenuItem>
        </>
      ) : null}
      {menu === "format" ? (
        <MenuCheckbox checked={wordWrap} onClick={onToggleWordWrap}>
          Word Wrap
        </MenuCheckbox>
      ) : null}
      {menu === "view" ? (
        <MenuCheckbox checked={statusBarVisible} onClick={onToggleStatusBar}>
          Status Bar
        </MenuCheckbox>
      ) : null}
      {menu === "help" ? (
        <MenuItem onClick={onOpenAbout}>About This Portfolio</MenuItem>
      ) : null}
    </div>
  );
}

function MenuItem({
  children,
  disabled = false,
  onClick,
}: {
  children: string;
  disabled?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      className="about-notepad__menu-item"
      disabled={disabled}
      onClick={onClick}
      role="menuitem"
      type="button"
    >
      {children}
    </button>
  );
}

function MenuCheckbox({
  children,
  checked,
  onClick,
}: {
  children: string;
  checked: boolean;
  onClick(): void;
}) {
  return (
    <button
      aria-checked={checked}
      className="about-notepad__menu-item"
      onClick={onClick}
      role="menuitemcheckbox"
      type="button"
    >
      <span aria-hidden="true" className="about-notepad__menu-check">
        {checked ? "✓" : ""}
      </span>
      {children}
    </button>
  );
}

function MenuSeparator() {
  return <span className="about-notepad__menu-separator" role="separator" />;
}

function MarkdownLink({
  href,
  children,
}: ComponentPropsWithoutRef<"a">) {
  const safeHref = href && /^(https?:\/\/|mailto:)/i.test(href) ? href : undefined;

  if (!safeHref) return <span>{children}</span>;

  const opensInNewWindow = /^https?:\/\//i.test(safeHref);
  return (
    <a
      href={safeHref}
      rel={opensInNewWindow ? "noreferrer" : undefined}
      target={opensInNewWindow ? "_blank" : undefined}
    >
      {children}
    </a>
  );
}
