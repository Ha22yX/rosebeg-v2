import { StrictMode } from "react";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HarryMessenger } from "@/apps/messenger/HarryMessenger";
import type { ChatMessage, ChatService } from "@/apps/messenger/chat-service";
import { LocalChatService } from "@/apps/messenger/local-chat-service";
import { localChatCopy } from "@/content/chat-responses";

const storageKey = "rosebeg-v2:messenger";

beforeEach(() => {
  sessionStorage.clear();
});

describe("HarryMessenger", () => {
  it("renders one selected Harry contact, the welcome, and an accessible composer", () => {
    render(<HarryMessenger />);

    expect(screen.getAllByRole("button", { name: "Harry, online" })).toHaveLength(1);
    expect(screen.getByRole("button", { name: "Harry, online" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByText(localChatCopy.welcome)).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Message Harry" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Send" })).toBeDisabled();
  });

  it("establishes a size query container for constrained layouts", () => {
    const { container } = render(<HarryMessenger />);

    const messenger = screen.getByRole("region", { name: "Harry Messenger" });
    expect(messenger.style.getPropertyValue("container-type")).toBe("size");
    expect(messenger.style.getPropertyValue("container-name")).toBe("harry-messenger");

    const layout = container.querySelector(".harry-messenger__layout");
    expect(layout).not.toBeNull();
  });

  it("keeps Send disabled for whitespace and submits visitor and Harry bubbles", async () => {
    const user = userEvent.setup();
    render(<HarryMessenger service={new LocalChatService()} />);

    const textbox = screen.getByRole("textbox", { name: "Message Harry" });
    await user.type(textbox, "   ");
    expect(screen.getByRole("button", { name: "Send" })).toBeDisabled();

    await user.clear(textbox);
    await user.type(textbox, "projects");
    await user.click(screen.getByRole("button", { name: "Send" }));

    expect(screen.getByText("projects")).toHaveAttribute("data-sender", "visitor");
    expect(await screen.findByText(localChatCopy.projects)).toHaveAttribute(
      "data-sender",
      "harry",
    );
    expect(screen.getAllByText(/sent|delivered/i).length).toBeGreaterThan(0);
  });

  it("sends with Enter and keeps Shift+Enter as a newline", async () => {
    const user = userEvent.setup();
    render(<HarryMessenger service={new LocalChatService()} />);

    const textbox = screen.getByRole("textbox", { name: "Message Harry" });
    await user.type(textbox, "first line{Shift>}{Enter}{/Shift}second line");
    expect(textbox).toHaveValue("first line\nsecond line");
    expect(screen.queryByText("first line", { exact: false })).not.toHaveAttribute(
      "data-sender",
      "visitor",
    );

    await user.keyboard("{Enter}");
    expect(
      screen.getByText((_, element) => element?.textContent === "first line\nsecond line"),
    ).toHaveAttribute(
      "data-sender",
      "visitor",
    );
    expect(await screen.findByText(localChatCopy.fallback)).toBeInTheDocument();
  });

  it("renders visitor input as inert text", async () => {
    const user = userEvent.setup();
    const { container } = render(<HarryMessenger service={new LocalChatService()} />);

    const unsafeText = '<img src=x onerror="alert(1)">';
    await user.type(screen.getByRole("textbox", { name: "Message Harry" }), unsafeText);
    await user.click(screen.getByRole("button", { name: "Send" }));

    expect(screen.getByText(unsafeText)).toBeInTheDocument();
    expect(container.querySelector("img")).toBeNull();
  });

  it("restores valid session history", () => {
    const restored: ChatMessage[] = [
      {
        id: "restored-message",
        sender: "visitor",
        text: "A restored question",
        createdAt: "2026-08-02T09:30:00.000Z",
        status: "delivered",
      },
    ];
    sessionStorage.setItem(storageKey, JSON.stringify(restored));

    render(<HarryMessenger />);

    expect(screen.getByText("A restored question")).toHaveAttribute(
      "data-sender",
      "visitor",
    );
    expect(screen.queryByText(localChatCopy.welcome)).not.toBeInTheDocument();
  });

  it("ignores malformed session data and starts with the welcome", () => {
    sessionStorage.setItem(storageKey, '{"not":"messages"}');

    expect(() => render(<HarryMessenger />)).not.toThrow();
    expect(screen.getByText(localChatCopy.welcome)).toBeInTheDocument();
  });

  it("injects the service, exposes typing, and prevents duplicate pending sends", async () => {
    const user = userEvent.setup();
    let resolveReply: ((value: { intent: "fallback"; text: string }) => void) | undefined;
    const send = vi.fn(
      (_message: string, _history: readonly ChatMessage[]) =>
        new Promise<{ intent: "fallback"; text: string }>((resolve) => {
          resolveReply = resolve;
        }),
    );
    const service: ChatService = { send };
    render(<HarryMessenger service={service} />);

    await user.type(screen.getByRole("textbox", { name: "Message Harry" }), "hello");
    await user.click(screen.getByRole("button", { name: "Send" }));

    expect(screen.getByRole("status", { name: "Harry is typing" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Send" })).toBeDisabled();
    expect(send).toHaveBeenCalledTimes(1);
    expect(send.mock.calls[0]?.[0]).toBe("hello");
    expect(send.mock.calls[0]?.[1]).toHaveLength(2);

    await user.keyboard("another{Enter}");
    expect(send).toHaveBeenCalledTimes(1);

    resolveReply?.({ intent: "fallback", text: "Injected reply" });
    expect(await screen.findByText("Injected reply")).toBeInTheDocument();
  });

  it("completes a deferred service reply after StrictMode replays effects", async () => {
    const user = userEvent.setup();
    let resolveReply: ((value: { intent: "fallback"; text: string }) => void) | undefined;
    const service: ChatService = {
      send: () =>
        new Promise((resolve) => {
          resolveReply = resolve;
        }),
    };
    render(
      <StrictMode>
        <HarryMessenger service={service} />
      </StrictMode>,
    );

    await user.type(screen.getByRole("textbox", { name: "Message Harry" }), "hello{Enter}");
    expect(screen.getByRole("status", { name: "Harry is typing" })).toBeInTheDocument();

    resolveReply?.({ intent: "fallback", text: "StrictMode reply" });

    expect(await screen.findByText("StrictMode reply")).toBeInTheDocument();
    expect(screen.queryByRole("status", { name: "Harry is typing" })).not.toBeInTheDocument();
    expect(screen.getByText("hello")).toHaveAttribute("data-status", "delivered");
  });

  it("marks only the failed visitor message and retains earlier messages when the service rejects", async () => {
    const user = userEvent.setup();
    const service: ChatService = {
      send: vi.fn().mockRejectedValue(new Error("offline")),
    };
    render(<HarryMessenger service={service} />);

    await user.type(screen.getByRole("textbox", { name: "Message Harry" }), "Can you reply?");
    await user.keyboard("{Enter}");

    expect(await screen.findByRole("button", { name: "Harry, offline" })).toBeInTheDocument();
    expect(screen.getByText(localChatCopy.welcome)).toBeInTheDocument();
    const failedBubble = screen.getByText("Can you reply?");
    expect(failedBubble).toHaveAttribute("data-status", "error");
    expect(screen.getByText("Not delivered")).toBeInTheDocument();
  });

  it("keeps simultaneous Messenger instances isolated", async () => {
    const user = userEvent.setup();
    const first = render(<HarryMessenger service={new LocalChatService()} />);
    const second = render(<HarryMessenger service={new LocalChatService()} />);

    await user.type(
      within(first.container).getByRole("textbox", { name: "Message Harry" }),
      "projects{Enter}",
    );
    await waitFor(() => {
      expect(within(first.container).getByText(localChatCopy.projects)).toBeInTheDocument();
    });
    expect(within(second.container).queryByText("projects")).not.toBeInTheDocument();
    expect(within(second.container).queryByText(localChatCopy.projects)).not.toBeInTheDocument();
  });
});
