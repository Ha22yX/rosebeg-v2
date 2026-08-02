import { render, screen } from "@testing-library/react";
import { App } from "@/app/App";

describe("App", () => {
  it("mounts the Rosebeg XP system root", () => {
    render(<App />);
    expect(screen.getByLabelText("Rosebeg XP system")).toBeInTheDocument();
  });
});
