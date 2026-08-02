import {
  useEffect,
  useId,
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
  const notepadId = useId();
  const documentRef = useRef<HTMLElement>(null);
  const triggerRefs = useRef<Partial<Record<MenuName, HTMLButtonElement | null>>>({});
  const [openMenu, setOpenMenu] = useState<MenuName | null>(null);
  const [wordWrap, setWordWrap] = useState(false);
  const [statusBarVisible, setStatusBarVisible] = useState(true);
  const [statusMessage, setStatusMessage] = useState("Ready");
  const [aboutVisible, setAboutVisible] = useState(false);

  const toggleMenu = (menu: MenuName) => {
    setOpenMenu((current) => (current === menu ? null : menu));
  };

  const openMenuWithKeyboard = (menu: MenuName) => {
    setOpenMenu(menu);
  };

  const closeMenu = (menu: MenuName) => {
    setOpenMenu(null);
    triggerRefs.current[menu]?.focus();
  };

  const selectAll = () => {
    const documentElement = documentRef.current;
    const selection = window.getSelection();
    if (!documentElement || !selection) return;

    const range = document.createRange();
    range.selectNodeContents(documentElement);
    selection.removeAllRanges();
    selection.addRange(range);
    setStatusMessage("All About Harry text selected");
  };

  const copyDocument = async () => {
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
              aria-controls={`${notepadId}-${menu}-menu`}
              aria-expanded={openMenu === menu}
              aria-haspopup="menu"
              className="about-notepad__menu-trigger"
              id={`${notepadId}-${menu}-trigger`}
              onClick={() => toggleMenu(menu)}
              onKeyDown={(event) => {
                if (event.key === "ArrowDown" || event.key === "ArrowUp") {
                  event.preventDefault();
                  openMenuWithKeyboard(menu);
                }
              }}
              ref={(element) => {
                triggerRefs.current[menu] = element;
              }}
              type="button"
            >
              {menuLabels[menu]}
            </button>
            {openMenu === menu ? (
              <MenuPanel
                closeWindow={closeWindow}
                menuId={`${notepadId}-${menu}-menu`}
                menu={menu}
                onCopy={() => {
                  closeMenu(menu);
                  void copyDocument();
                }}
                onOpenAbout={() => {
                  closeMenu(menu);
                  setAboutVisible(true);
                }}
                onDismiss={() => closeMenu(menu)}
                onSelectAll={() => {
                  selectAll();
                  setOpenMenu(null);
                }}
                onToggleStatusBar={() => {
                  setStatusBarVisible((visible) => !visible);
                  closeMenu(menu);
                }}
                onToggleWordWrap={() => {
                  setWordWrap((wrapped) => !wrapped);
                  closeMenu(menu);
                }}
                statusBarVisible={statusBarVisible}
                triggerId={`${notepadId}-${menu}-trigger`}
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
          <MarkdownDocument markdown={aboutMarkdown} />
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
  menuId: string;
  triggerId: string;
  wordWrap: boolean;
  statusBarVisible: boolean;
  closeWindow(): void;
  onCopy(): void;
  onSelectAll(): void;
  onToggleWordWrap(): void;
  onToggleStatusBar(): void;
  onOpenAbout(): void;
  onDismiss(): void;
};

function MenuPanel({
  menu,
  menuId,
  triggerId,
  wordWrap,
  statusBarVisible,
  closeWindow,
  onCopy,
  onSelectAll,
  onToggleWordWrap,
  onToggleStatusBar,
  onOpenAbout,
  onDismiss,
}: MenuPanelProps) {
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const [activeItemIndex, setActiveItemIndex] = useState(0);

  useEffect(() => {
    const firstEnabledIndex = itemRefs.current.findIndex(
      (item) => item && !item.disabled,
    );
    if (firstEnabledIndex < 0) return;
    setActiveItemIndex(firstEnabledIndex);
    itemRefs.current[firstEnabledIndex]?.focus();
  }, []);

  const itemProps = (index: number) => ({
    itemRef: (element: HTMLButtonElement | null) => {
      itemRefs.current[index] = element;
    },
    onFocus: () => setActiveItemIndex(index),
    tabIndex: activeItemIndex === index ? 0 : -1,
  });

  const moveFocus = (direction: "first" | "last" | "next" | "previous") => {
    const enabledItems = itemRefs.current.filter(
      (item): item is HTMLButtonElement => Boolean(item && !item.disabled),
    );
    if (enabledItems.length === 0) return;

    const currentIndex = enabledItems.indexOf(document.activeElement as HTMLButtonElement);
    const startsAtLast = direction === "previous" || direction === "last";
    const targetIndex =
      direction === "first"
        ? 0
        : direction === "last"
          ? enabledItems.length - 1
          : currentIndex === -1
            ? startsAtLast
              ? enabledItems.length - 1
              : 0
          : direction === "next"
            ? (currentIndex + 1 + enabledItems.length) % enabledItems.length
            : (currentIndex - 1 + enabledItems.length) % enabledItems.length;
    const target = enabledItems[targetIndex];
    setActiveItemIndex(itemRefs.current.indexOf(target));
    target.focus();
  };

  return (
    <div
      aria-labelledby={triggerId}
      className="about-notepad__menu"
      id={menuId}
      onKeyDown={(event) => {
        if (event.key === "ArrowDown") {
          event.preventDefault();
          moveFocus("next");
        } else if (event.key === "ArrowUp") {
          event.preventDefault();
          moveFocus("previous");
        } else if (event.key === "Home") {
          event.preventDefault();
          moveFocus("first");
        } else if (event.key === "End") {
          event.preventDefault();
          moveFocus("last");
        } else if (event.key === "Escape") {
          event.preventDefault();
          onDismiss();
        }
      }}
      role="menu"
    >
      {menu === "file" ? (
        <>
          <MenuItem disabled {...itemProps(0)}>New</MenuItem>
          <MenuItem disabled {...itemProps(1)}>Open...</MenuItem>
          <MenuItem disabled {...itemProps(2)}>Save</MenuItem>
          <MenuSeparator />
          <MenuItem {...itemProps(3)} onClick={closeWindow}>Close</MenuItem>
        </>
      ) : null}
      {menu === "edit" ? (
        <>
          <MenuItem disabled {...itemProps(0)}>Undo</MenuItem>
          <MenuSeparator />
          <MenuItem disabled {...itemProps(1)}>Cut</MenuItem>
          <MenuItem {...itemProps(2)} onClick={onCopy}>Copy</MenuItem>
          <MenuItem disabled {...itemProps(3)}>Paste</MenuItem>
          <MenuSeparator />
          <MenuItem {...itemProps(4)} onClick={onSelectAll}>Select All</MenuItem>
        </>
      ) : null}
      {menu === "format" ? (
        <MenuCheckbox {...itemProps(0)} checked={wordWrap} onClick={onToggleWordWrap}>
          Word Wrap
        </MenuCheckbox>
      ) : null}
      {menu === "view" ? (
        <MenuCheckbox {...itemProps(0)} checked={statusBarVisible} onClick={onToggleStatusBar}>
          Status Bar
        </MenuCheckbox>
      ) : null}
      {menu === "help" ? (
        <MenuItem {...itemProps(0)} onClick={onOpenAbout}>About This Portfolio</MenuItem>
      ) : null}
    </div>
  );
}

type MenuItemProps = {
  children: string;
  disabled?: boolean;
  onClick?: () => void;
  onFocus(): void;
  tabIndex: number;
  itemRef(element: HTMLButtonElement | null): void;
};

function MenuItem({
  children,
  disabled = false,
  onClick,
  onFocus,
  tabIndex,
  itemRef,
}: MenuItemProps) {
  return (
    <button
      className="about-notepad__menu-item"
      disabled={disabled}
      onClick={onClick}
      onFocus={onFocus}
      ref={itemRef}
      role="menuitem"
      tabIndex={tabIndex}
      type="button"
    >
      {children}
    </button>
  );
}

type MenuCheckboxProps = {
  children: string;
  checked: boolean;
  onClick(): void;
  onFocus(): void;
  tabIndex: number;
  itemRef(element: HTMLButtonElement | null): void;
};

function MenuCheckbox({
  children,
  checked,
  onClick,
  onFocus,
  tabIndex,
  itemRef,
}: MenuCheckboxProps) {
  return (
    <button
      aria-checked={checked}
      className="about-notepad__menu-item"
      onClick={onClick}
      onFocus={onFocus}
      ref={itemRef}
      role="menuitemcheckbox"
      tabIndex={tabIndex}
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

export function MarkdownDocument({ markdown }: { markdown: string }) {
  return (
    <ReactMarkdown components={{ a: MarkdownLink }}>
      {markdown}
    </ReactMarkdown>
  );
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
