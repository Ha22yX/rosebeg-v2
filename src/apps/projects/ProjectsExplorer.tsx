import {
  useEffect,
  useId,
  useMemo,
  useReducer,
  useState,
} from "react";
import { projects } from "@/content/projects";
import type { Project, ProjectFile } from "@/content/types";
import {
  explorerReducer,
  initialExplorerState,
  type ExplorerState,
  type ExplorerView,
} from "@/apps/projects/project-history";
import { XpButton } from "@/shared/XpButton";
import { XpDialog } from "@/shared/XpDialog";
import "@/apps/projects/projects.css";

export type ProjectsExplorerProps = {
  initialProjectSlug?: string;
};

const viewLabels: ReadonlyArray<{ value: ExplorerView; label: string }> = [
  { value: "large-icons", label: "Large Icons" },
  { value: "list", label: "List" },
  { value: "details", label: "Details" },
];

export function ProjectsExplorer({
  initialProjectSlug,
}: ProjectsExplorerProps) {
  const explorerId = useId();
  const searchId = `${explorerId}-project-search`;
  const addressId = `${explorerId}-project-address`;
  const overviewId = `${explorerId}-project-overview`;
  const technologyId = `${explorerId}-project-technology`;
  const filesId = `${explorerId}-project-files`;
  const initialProject = projects.find(
    (project) => project.slug === initialProjectSlug,
  );
  const invalidInitialSlug = Boolean(initialProjectSlug && !initialProject);
  const [state, dispatch] = useReducer(
    explorerReducer,
    initialProject,
    (project): ExplorerState => ({
      ...initialExplorerState,
      current: project
        ? { kind: "project", slug: project.slug }
        : { kind: "root" },
    }),
  );
  const [searchVisible, setSearchVisible] = useState(false);
  const [viewsVisible, setViewsVisible] = useState(false);
  const [foldersVisible, setFoldersVisible] = useState(true);
  const [warningVisible, setWarningVisible] = useState(invalidInitialSlug);

  useEffect(() => {
    if (invalidInitialSlug) dispatch({ type: "GO_ROOT" });
  }, [invalidInitialSlug]);

  const activeProjectSlug =
    state.current.kind === "project" ? state.current.slug : undefined;
  const activeProject = activeProjectSlug
    ? projects.find((project) => project.slug === activeProjectSlug)
    : undefined;
  const normalizedQuery = state.query.trim().toLocaleLowerCase();
  const visibleProjects = useMemo(
    () =>
      normalizedQuery
        ? projects.filter((project) =>
            [
              project.name,
              project.kicker,
              formatCategory(project.category),
              ...project.stack,
            ].some((value) =>
              value.toLocaleLowerCase().includes(normalizedQuery),
            ),
          )
        : projects,
    [normalizedQuery],
  );

  const openProject = (slug: string) => {
    if (!projects.some((project) => project.slug === slug)) {
      setWarningVisible(true);
      dispatch({ type: "GO_ROOT" });
      return;
    }
    dispatch({ type: "OPEN_PROJECT", slug });
  };

  const address = activeProject
    ? `C:\\My Projects\\${activeProject.name}`
    : "C:\\My Projects";

  return (
    <section aria-label="My Projects Explorer" className="projects-explorer">
      <ExplorerToolbar
        backDisabled={state.backStack.length === 0}
        foldersVisible={foldersVisible}
        forwardDisabled={state.forwardStack.length === 0}
        onBack={() => dispatch({ type: "BACK" })}
        onFolders={() => setFoldersVisible((visible) => !visible)}
        onForward={() => dispatch({ type: "FORWARD" })}
        onSearch={() => setSearchVisible((visible) => !visible)}
        onUp={() => dispatch({ type: "UP" })}
        onViews={() => setViewsVisible((visible) => !visible)}
        searchVisible={searchVisible}
        upDisabled={state.current.kind === "root"}
        viewsVisible={viewsVisible}
      />

      {viewsVisible ? (
        <div aria-label="Project view choices" className="projects-explorer__views" role="group">
          {viewLabels.map((view) => (
            <XpButton
              aria-pressed={state.view === view.value}
              className="projects-explorer__view-choice"
              key={view.value}
              onClick={() => dispatch({ type: "SET_VIEW", view: view.value })}
            >
              {view.label}
            </XpButton>
          ))}
        </div>
      ) : null}

      {searchVisible && state.current.kind === "root" ? (
        <div className="projects-explorer__search">
          <label htmlFor={searchId}>Search projects</label>
          <input
            autoFocus
            id={searchId}
            onChange={(event) =>
              dispatch({ type: "SET_QUERY", query: event.currentTarget.value })
            }
            placeholder="Type a project, category, or technology"
            type="search"
            value={state.query}
          />
        </div>
      ) : null}

      <div className="projects-explorer__address-row">
        <label htmlFor={addressId}>Address</label>
        <span aria-hidden="true" className="projects-explorer__address-icon">
          📁
        </span>
        <input id={addressId} readOnly value={address} />
        <span aria-hidden="true" className="projects-explorer__go">
          ➜
        </span>
      </div>

      <div className="projects-explorer__workspace">
        {foldersVisible ? (
          activeProject ? (
            <ProjectTaskPane project={activeProject} />
          ) : (
            <RootTaskPane visibleCount={visibleProjects.length} />
          )
        ) : null}

        <main className="projects-explorer__content">
          {activeProject ? (
            <ProjectDetail
              filesId={filesId}
              overviewId={overviewId}
              project={activeProject}
              technologyId={technologyId}
            />
          ) : (
            <ProjectRoot
              onOpenProject={openProject}
              projects={visibleProjects}
              view={state.view}
            />
          )}
        </main>
      </div>

      <footer className="projects-explorer__status" role="status">
        <span>{activeProject ? activeProject.files.length : visibleProjects.length} objects</span>
        <span className="projects-explorer__status-fill" />
        <span>{activeProject ? "Project folder" : "My Projects"}</span>
      </footer>

      {warningVisible ? (
        <div className="projects-explorer__warning">
          <XpDialog
            actions={
              <XpButton onClick={() => setWarningVisible(false)}>OK</XpButton>
            }
            className="projects-explorer__warning-dialog"
            modal
            onClose={() => setWarningVisible(false)}
            onDismiss={() => setWarningVisible(false)}
            title="Windows Explorer"
          >
            <div className="projects-explorer__warning-message">
              <span aria-hidden="true" className="projects-explorer__warning-icon">
                !
              </span>
              <p>The project folder could not be found. Returning to My Projects.</p>
            </div>
          </XpDialog>
        </div>
      ) : null}
    </section>
  );
}

type ExplorerToolbarProps = {
  backDisabled: boolean;
  forwardDisabled: boolean;
  upDisabled: boolean;
  searchVisible: boolean;
  foldersVisible: boolean;
  viewsVisible: boolean;
  onBack(): void;
  onForward(): void;
  onUp(): void;
  onSearch(): void;
  onFolders(): void;
  onViews(): void;
};

function ExplorerToolbar({
  backDisabled,
  forwardDisabled,
  upDisabled,
  searchVisible,
  foldersVisible,
  viewsVisible,
  onBack,
  onForward,
  onUp,
  onSearch,
  onFolders,
  onViews,
}: ExplorerToolbarProps) {
  return (
    <nav aria-label="Explorer toolbar" className="projects-explorer__toolbar">
      <ToolbarButton disabled={backDisabled} icon="←" label="Back" onClick={onBack} />
      <ToolbarButton disabled={forwardDisabled} icon="→" label="Forward" onClick={onForward} />
      <span aria-hidden="true" className="projects-explorer__separator" />
      <ToolbarButton disabled={upDisabled} icon="↰" label="Up" onClick={onUp} />
      <span aria-hidden="true" className="projects-explorer__separator" />
      <ToolbarButton
        ariaExpanded={searchVisible}
        icon="⌕"
        label="Search"
        onClick={onSearch}
      />
      <ToolbarButton
        ariaPressed={foldersVisible}
        icon="▥"
        label="Folders"
        onClick={onFolders}
      />
      <span aria-hidden="true" className="projects-explorer__toolbar-spacer" />
      <ToolbarButton
        ariaExpanded={viewsVisible}
        icon="▦"
        label="Views"
        onClick={onViews}
      />
    </nav>
  );
}

type ToolbarButtonProps = {
  label: string;
  icon: string;
  disabled?: boolean;
  ariaExpanded?: boolean;
  ariaPressed?: boolean;
  onClick(): void;
};

function ToolbarButton({
  label,
  icon,
  disabled,
  ariaExpanded,
  ariaPressed,
  onClick,
}: ToolbarButtonProps) {
  return (
    <XpButton
      aria-expanded={ariaExpanded}
      aria-pressed={ariaPressed}
      className="projects-explorer__toolbar-button"
      disabled={disabled}
      onClick={onClick}
    >
      <span aria-hidden="true" className="projects-explorer__toolbar-icon">
        {icon}
      </span>
      <span>{label}</span>
    </XpButton>
  );
}

function RootTaskPane({ visibleCount }: { visibleCount: number }) {
  return (
    <aside aria-label="Folder tasks" className="projects-explorer__task-pane">
      <TaskGroup title="File and Folder Tasks">
        <p>Open a project folder to see its repository snapshot.</p>
        <p>Use Search to filter the folders in this location.</p>
      </TaskGroup>
      <TaskGroup title="Other Places">
        <p>Desktop</p>
        <p>My Pictures</p>
        <p>About Harry</p>
      </TaskGroup>
      <TaskGroup title="Details">
        <strong>My Projects</strong>
        <p>{visibleCount} project folders</p>
      </TaskGroup>
    </aside>
  );
}

function ProjectTaskPane({ project }: { project: Project }) {
  return (
    <aside aria-label="Project tasks" className="projects-explorer__task-pane">
      <TaskGroup title="Project Tasks">
        <ExternalLink href={project.sourceUrl}>Open GitHub repository</ExternalLink>
        {project.websiteUrl ? (
          <ExternalLink href={project.websiteUrl}>Open live demo</ExternalLink>
        ) : null}
      </TaskGroup>
      <TaskGroup title="Other Places">
        <p>My Projects</p>
        <p>Desktop</p>
      </TaskGroup>
      <TaskGroup title="Details">
        <strong>{project.name}</strong>
        <p>{formatCategory(project.category)}</p>
        <p>{project.files.length} items</p>
      </TaskGroup>
    </aside>
  );
}

function TaskGroup({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="projects-explorer__task-group">
      <h2>{title}</h2>
      <div className="projects-explorer__task-group-body">{children}</div>
    </section>
  );
}

type ProjectRootProps = {
  projects: readonly Project[];
  view: ExplorerView;
  onOpenProject(slug: string): void;
};

function ProjectRoot({
  projects: visibleProjects,
  view,
  onOpenProject,
}: ProjectRootProps) {
  if (visibleProjects.length === 0) {
    return (
      <div className="projects-explorer__empty">
        <span aria-hidden="true" className="projects-explorer__empty-icon">⌕</span>
        <h1>No projects found</h1>
        <p>No projects match your search.</p>
      </div>
    );
  }

  if (view === "details") {
    return (
      <div aria-label="Projects" className="projects-explorer__details-table" role="table">
        <div className="projects-explorer__details-header" role="row">
          <span role="columnheader">Name</span>
          <span role="columnheader">Category</span>
          <span role="columnheader">Technology</span>
        </div>
        {visibleProjects.map((project) => (
          <div className="projects-explorer__details-row" key={project.slug} role="row">
            <span role="cell">
              <ProjectFolderButton
                onOpenProject={onOpenProject}
                project={project}
                view={view}
              />
            </span>
            <span role="cell">{formatCategory(project.category)}</span>
            <span role="cell">{project.stack.join(", ")}</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={`projects-explorer__folders projects-explorer__folders--${view}`}>
      {visibleProjects.map((project) => (
        <ProjectFolderButton
          key={project.slug}
          onOpenProject={onOpenProject}
          project={project}
          view={view}
        />
      ))}
    </div>
  );
}

type ProjectFolderButtonProps = {
  project: Project;
  view: ExplorerView;
  onOpenProject(slug: string): void;
};

function ProjectFolderButton({
  project,
  view,
  onOpenProject,
}: ProjectFolderButtonProps) {
  return (
    <button
      aria-label={`${project.name} folder`}
      className={`projects-explorer__folder projects-explorer__folder--${view}`}
      onClick={(event) => {
        if (event.detail === 0) onOpenProject(project.slug);
      }}
      onDoubleClick={() => onOpenProject(project.slug)}
      type="button"
    >
      <span aria-hidden="true" className="projects-explorer__folder-icon" />
      <span className="projects-explorer__folder-copy">
        <strong>{project.name}</strong>
        {view === "large-icons" ? <small>{project.kicker}</small> : null}
      </span>
    </button>
  );
}

type ProjectDetailProps = {
  project: Project;
  overviewId: string;
  technologyId: string;
  filesId: string;
};

function ProjectDetail({
  project,
  overviewId,
  technologyId,
  filesId,
}: ProjectDetailProps) {
  return (
    <article className="projects-explorer__project-detail">
      <header className="projects-explorer__project-header">
        <span aria-hidden="true" className="projects-explorer__project-folder" />
        <div>
          <p>{project.kicker}</p>
          <h1>{project.name}</h1>
          <span>{formatCategory(project.category)}</span>
        </div>
      </header>

      <section className="projects-explorer__story" aria-labelledby={overviewId}>
        <h2 id={overviewId}>Project overview</h2>
        <p className="projects-explorer__tagline">{project.tagline}</p>
        <p>{project.story}</p>
      </section>

      <section aria-labelledby={technologyId} className="projects-explorer__stack">
        <h2 id={technologyId}>Technology</h2>
        <ul>
          {project.stack.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section aria-labelledby={filesId} className="projects-explorer__snapshot">
        <div className="projects-explorer__section-heading">
          <div>
            <h2 id={filesId}>Repository snapshot</h2>
            <p>{project.files.length} items in this folder</p>
          </div>
          <div className="projects-explorer__shortcuts">
            <ExternalLink className="projects-explorer__shortcut" href={project.sourceUrl}>
              View repository
            </ExternalLink>
            {project.websiteUrl ? (
              <ExternalLink className="projects-explorer__shortcut" href={project.websiteUrl}>
                View demo
              </ExternalLink>
            ) : null}
          </div>
        </div>
        <ul className="projects-explorer__file-list">
          {project.files.map((file, index) => (
            <li key={`${file.kind}-${file.name}-${index}`}>
              <FileItem file={file} />
            </li>
          ))}
        </ul>
      </section>
    </article>
  );
}

function FileItem({ file }: { file: ProjectFile }) {
  const content = (
    <>
      <span
        aria-hidden="true"
        className={`projects-explorer__file-icon projects-explorer__file-icon--${file.kind}`}
      >
        {file.kind === "folder" ? "" : file.label ?? (file.kind === "shortcut" ? "URL" : "FILE")}
      </span>
      <span>
        <strong>{file.name}</strong>
        <small>{file.kind === "shortcut" ? "Internet Shortcut" : file.kind}</small>
      </span>
    </>
  );

  return file.href ? (
    <ExternalLink className="projects-explorer__file" href={file.href}>
      {content}
    </ExternalLink>
  ) : (
    <div className="projects-explorer__file">{content}</div>
  );
}

function ExternalLink({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <a className={className} href={href} rel="noreferrer" target="_blank">
      {children}
    </a>
  );
}

function formatCategory(category: Project["category"]): string {
  return category.replace("-", " ").replace(/^./, (letter) => letter.toUpperCase());
}
