import {
  explorerReducer,
  initialExplorerState,
} from "@/apps/projects/project-history";

describe("project Explorer history", () => {
  it("navigates root, project, back, forward, and up", () => {
    const project = explorerReducer(initialExplorerState, {
      type: "OPEN_PROJECT",
      slug: "sat-ai-tutor",
    });
    expect(project.current).toEqual({ kind: "project", slug: "sat-ai-tutor" });

    const back = explorerReducer(project, { type: "BACK" });
    expect(back.current).toEqual({ kind: "root" });
    expect(explorerReducer(back, { type: "FORWARD" }).current).toEqual(
      project.current,
    );
    expect(explorerReducer(project, { type: "UP" }).current).toEqual({
      kind: "root",
    });
  });
});
