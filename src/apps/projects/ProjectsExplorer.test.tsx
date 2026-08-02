import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { projects } from "@/content/projects";
import { ProjectsExplorer } from "@/apps/projects/ProjectsExplorer";

describe("ProjectsExplorer", () => {
  it("browses every project folder and opens a project detail", async () => {
    const user = userEvent.setup();
    render(<ProjectsExplorer />);

    expect(screen.getByText("9 objects")).toBeInTheDocument();
    for (const project of projects) {
      expect(
        screen.getByRole("button", { name: `${project.name} folder` }),
      ).toBeInTheDocument();
    }

    await user.dblClick(
      screen.getByRole("button", { name: "Auto Email System folder" }),
    );

    expect(
      screen.getByRole("heading", { name: "Auto Email System" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Address")).toBeInTheDocument();
    expect(screen.getByLabelText("Address")).toHaveValue(
      "C:\\My Projects\\Auto Email System",
    );
    expect(screen.getByText("6 objects")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "View repository" }),
    ).toHaveAttribute("href", "https://github.com/Ha22yX/auto-email-system");
    expect(
      screen.getByRole("link", { name: "View repository" }),
    ).toHaveAttribute("target", "_blank");
    expect(
      screen.getByRole("link", { name: "View repository" }),
    ).toHaveAttribute("rel", "noreferrer");
  });

  it("filters projects by name, kicker, category, and stack", async () => {
    const user = userEvent.setup();
    render(<ProjectsExplorer />);

    await user.click(screen.getByRole("button", { name: "Search" }));
    const search = screen.getByRole("searchbox", { name: "Search projects" });

    await user.type(search, "OpenAI");
    expect(
      screen.getByRole("button", { name: "SAT AI Tutor folder" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "PhotoBack folder" }),
    ).not.toBeInTheDocument();
    expect(screen.getByText("1 objects")).toBeInTheDocument();

    await user.clear(search);
    await user.type(search, "Factory Workflow");
    expect(
      screen.getByRole("button", {
        name: "Surfboard Vacuum Table DXF Generator folder",
      }),
    ).toBeInTheDocument();

    await user.clear(search);
    await user.type(search, "electronics");
    expect(
      screen.getByRole("button", { name: "ESP32 Sound Radar folder" }),
    ).toBeInTheDocument();
    expect(screen.getByText("3 objects")).toBeInTheDocument();
  });

  it("filters by the category label shown in project details", async () => {
    const user = userEvent.setup();
    render(<ProjectsExplorer />);

    await user.click(screen.getByRole("button", { name: "Search" }));
    await user.type(
      screen.getByRole("searchbox", { name: "Search projects" }),
      "Creative tool",
    );

    expect(
      screen.getByRole("button", {
        name: "Surfboard Vacuum Table DXF Generator folder",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "PhotoBack folder" }),
    ).toBeInTheDocument();
    expect(screen.getByText("2 objects")).toBeInTheDocument();
  });

  it("keeps form labels and detail headings scoped to each Explorer instance", async () => {
    const user = userEvent.setup();
    render(
      <>
        <ProjectsExplorer />
        <ProjectsExplorer />
      </>,
    );
    const explorers = screen.getAllByRole("region", {
      name: "My Projects Explorer",
    });
    const associationIds: string[] = [];

    for (const explorer of explorers) {
      const address = within(explorer).getByRole("textbox", { name: "Address" });
      const addressLabel = within(explorer).getByText("Address");
      expect(addressLabel).toHaveAttribute("for", address.id);
      expect(explorer).toContainElement(document.getElementById(address.id));
      associationIds.push(address.id);

      await user.click(within(explorer).getByRole("button", { name: "Search" }));
      const search = within(explorer).getByRole("searchbox", {
        name: "Search projects",
      });
      const searchLabel = within(explorer).getByText("Search projects");
      expect(searchLabel).toHaveAttribute("for", search.id);
      expect(explorer).toContainElement(document.getElementById(search.id));
      associationIds.push(search.id);
    }

    await user.dblClick(
      within(explorers[0]).getByRole("button", { name: "PhotoBack folder" }),
    );
    await user.dblClick(
      within(explorers[1]).getByRole("button", { name: "DayVault folder" }),
    );

    for (const explorer of explorers) {
      for (const name of [
        "Project overview",
        "Technology",
        "Repository snapshot",
      ]) {
        const section = within(explorer).getByRole("region", { name });
        const headingId = section.getAttribute("aria-labelledby");
        expect(headingId).toBeTruthy();
        expect(explorer).toContainElement(document.getElementById(headingId!));
        associationIds.push(headingId!);
      }
    }

    expect(new Set(associationIds).size).toBe(associationIds.length);
  });

  it("keeps the same folders available in Large Icons, List, and Details views", async () => {
    const user = userEvent.setup();
    render(<ProjectsExplorer />);

    await user.click(screen.getByRole("button", { name: "Views" }));
    for (const view of ["Large Icons", "List", "Details"]) {
      await user.click(screen.getByRole("button", { name: view }));
      expect(screen.getByRole("button", { name: view })).toHaveAttribute(
        "aria-pressed",
        "true",
      );
      expect(
        screen.getByRole("button", { name: "Gridopoly folder" }),
      ).toBeInTheDocument();
    }
    expect(screen.getByRole("columnheader", { name: "Name" })).toBeInTheDocument();
    expect(
      screen.getByRole("columnheader", { name: "Category" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("columnheader", { name: "Technology" }),
    ).toBeInTheDocument();
  });

  it("enables Back, Forward, and Up only when their navigation is available", async () => {
    const user = userEvent.setup();
    render(<ProjectsExplorer />);

    const back = screen.getByRole("button", { name: "Back" });
    const forward = screen.getByRole("button", { name: "Forward" });
    const up = screen.getByRole("button", { name: "Up" });
    expect(back).toBeDisabled();
    expect(forward).toBeDisabled();
    expect(up).toBeDisabled();

    await user.dblClick(
      screen.getByRole("button", { name: "DayVault folder" }),
    );
    expect(back).toBeEnabled();
    expect(forward).toBeDisabled();
    expect(up).toBeEnabled();

    await user.click(back);
    expect(screen.getByText("9 objects")).toBeInTheDocument();
    expect(forward).toBeEnabled();
    expect(up).toBeDisabled();

    await user.click(forward);
    expect(screen.getByRole("heading", { name: "DayVault" })).toBeInTheDocument();
  });

  it("opens a focused project folder with native keyboard activation", async () => {
    const user = userEvent.setup();
    render(<ProjectsExplorer />);
    const folder = screen.getByRole("button", { name: "Gridopoly folder" });

    folder.focus();
    await user.keyboard(" ");

    expect(screen.getByRole("heading", { name: "Gridopoly" })).toBeInTheDocument();
  });

  it("opens a valid initial project location", () => {
    render(<ProjectsExplorer initialProjectSlug="photoback" />);

    expect(screen.getByRole("heading", { name: "PhotoBack" })).toBeInTheDocument();
    expect(screen.getByLabelText("Address")).toHaveValue(
      "C:\\My Projects\\PhotoBack",
    );
  });

  it("warns about an invalid initial slug and returns to My Projects", () => {
    render(<ProjectsExplorer initialProjectSlug="missing-project" />);

    expect(
      screen.getByRole("dialog", { name: "Windows Explorer" }),
    ).toHaveTextContent("The project folder could not be found.");
    expect(screen.getByLabelText("Address")).toHaveValue("C:\\My Projects");
    expect(screen.getByText("9 objects")).toBeInTheDocument();
  });
});
