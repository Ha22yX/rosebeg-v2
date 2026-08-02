export type ProjectLocation =
  | { kind: "root" }
  | { kind: "project"; slug: string };

export type ExplorerView = "large-icons" | "list" | "details";

export type ExplorerState = {
  current: ProjectLocation;
  backStack: readonly ProjectLocation[];
  forwardStack: readonly ProjectLocation[];
  view: ExplorerView;
  query: string;
};

export type ExplorerAction =
  | { type: "OPEN_PROJECT"; slug: string }
  | { type: "BACK" }
  | { type: "FORWARD" }
  | { type: "UP" }
  | { type: "GO_ROOT" }
  | { type: "SET_VIEW"; view: ExplorerView }
  | { type: "SET_QUERY"; query: string };

export const initialExplorerState: ExplorerState = {
  current: { kind: "root" },
  backStack: [],
  forwardStack: [],
  view: "large-icons",
  query: "",
};

export function explorerReducer(
  state: ExplorerState,
  action: ExplorerAction,
): ExplorerState {
  switch (action.type) {
    case "OPEN_PROJECT":
      return {
        ...state,
        current: { kind: "project", slug: action.slug },
        backStack: [...state.backStack, state.current],
        forwardStack: [],
      };
    case "BACK": {
      const previous = state.backStack.at(-1);
      if (!previous) return state;
      return {
        ...state,
        current: previous,
        backStack: state.backStack.slice(0, -1),
        forwardStack: [state.current, ...state.forwardStack],
      };
    }
    case "FORWARD": {
      const [next, ...remaining] = state.forwardStack;
      if (!next) return state;
      return {
        ...state,
        current: next,
        backStack: [...state.backStack, state.current],
        forwardStack: remaining,
      };
    }
    case "UP":
      if (state.current.kind === "root") return state;
      return {
        ...state,
        current: { kind: "root" },
        backStack: [...state.backStack, state.current],
        forwardStack: [],
      };
    case "GO_ROOT":
      return {
        ...state,
        current: { kind: "root" },
        backStack: [],
        forwardStack: [],
      };
    case "SET_VIEW":
      return { ...state, view: action.view };
    case "SET_QUERY":
      return { ...state, query: action.query };
  }
}
