import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AboutNotepad } from "@/apps/about/AboutNotepad";
import { aboutMarkdown } from "@/content/about";

describe("AboutNotepad", () => {
  it("renders the approved Markdown document with semantic headings", () => {
    render(<AboutNotepad closeWindow={vi.fn()} />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Zhiyuan Xing / HarryX" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 2, name: "Developer" }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("list")).toHaveLength(5);
    expect(screen.getByRole("link", { name: "GitHub" })).toHaveAttribute(
      "href",
      "https://github.com/Ha22yX",
    );
  });

  it("keeps one menu open and supports Word Wrap and Status Bar toggles", async () => {
    const user = userEvent.setup();
    render(<AboutNotepad closeWindow={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "Format" }));
    expect(screen.getByRole("menu", { name: "Format" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "View" }));
    expect(screen.queryByRole("menu", { name: "Format" })).not.toBeInTheDocument();
    expect(screen.getByRole("menu", { name: "View" })).toBeInTheDocument();

    await user.click(screen.getByRole("menuitemcheckbox", { name: "Status Bar" }));
    expect(screen.queryByRole("status")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Format" }));
    await user.click(screen.getByRole("menuitemcheckbox", { name: "Word Wrap" }));
    expect(screen.getByTestId("notepad-document")).toHaveClass("is-word-wrapped");
  });

  it("selects the complete document from Edit and closes the menu with Escape", async () => {
    const user = userEvent.setup();
    render(<AboutNotepad closeWindow={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "Edit" }));
    await user.click(screen.getByRole("menuitem", { name: "Select All" }));
    expect(window.getSelection()?.toString()).toContain("Zhiyuan Xing / HarryX");
    expect(window.getSelection()?.toString()).toContain("Visual identity");

    await user.click(screen.getByRole("button", { name: "File" }));
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("menu", { name: "File" })).not.toBeInTheDocument();
  });

  it("copies source Markdown, opens portfolio help, and closes through File", async () => {
    const user = userEvent.setup();
    const closeWindow = vi.fn();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });
    render(<AboutNotepad closeWindow={closeWindow} />);

    await user.click(screen.getByRole("button", { name: "Edit" }));
    await user.click(screen.getByRole("menuitem", { name: "Copy" }));
    expect(writeText).toHaveBeenCalledWith(aboutMarkdown);
    expect(screen.getByRole("status")).toHaveTextContent("Copied About Harry text");

    await user.click(screen.getByRole("button", { name: "Help" }));
    await user.click(screen.getByRole("menuitem", { name: "About This Portfolio" }));
    expect(screen.getByRole("dialog", { name: "About This Portfolio" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Close About This Portfolio" }));
    await user.click(screen.getByRole("button", { name: "File" }));
    const newCommand = screen.getByRole("menuitem", { name: "New" });
    expect(newCommand).toBeDisabled();
    await user.click(newCommand);
    expect(closeWindow).not.toHaveBeenCalled();
    await user.click(screen.getByRole("menuitem", { name: "Close" }));
    expect(closeWindow).toHaveBeenCalledTimes(1);
  });
});
