import { ApiChatService } from "@/apps/messenger/api-chat-service";
import type { ChatMessage } from "@/apps/messenger/chat-service";

const history: ChatMessage[] = [
  {
    id: "welcome",
    sender: "harry",
    text: "Hello",
    createdAt: "2026-08-03T08:00:00.000Z",
    status: "delivered",
  },
  {
    id: "question",
    sender: "visitor",
    text: "Remember that my name is Alex.",
    createdAt: "2026-08-03T08:01:00.000Z",
    status: "delivered",
  },
  {
    id: "answer",
    sender: "harry",
    text: "Nice to meet you, Alex.",
    createdAt: "2026-08-03T08:01:02.000Z",
    status: "delivered",
  },
];

describe("ApiChatService", () => {
  it("posts the newest message and complete current conversation history", async () => {
    const fetchMock = vi.fn(async (_input: RequestInfo | URL, _options?: RequestInit) =>
      new Response(JSON.stringify({ reply: "You told me your name is Alex." }), {
        headers: { "Content-Type": "application/json" },
        status: 200,
      }),
    );
    const service = new ApiChatService(
      "/api/chat",
      fetchMock as unknown as typeof fetch,
    );

    const reply = await service.send("我刚才说我叫什么？", history);

    expect(reply).toEqual({
      intent: "fallback",
      text: "You told me your name is Alex.",
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, options] = fetchMock.mock.calls[0]!;
    expect(url).toBe("/api/chat");
    expect(options?.method).toBe("POST");
    expect(options?.credentials).toBe("same-origin");
    expect(JSON.parse(String(options?.body))).toEqual({
      message: "我刚才说我叫什么？",
      history: history.map(({ sender, text, createdAt, status }) => ({
        sender,
        text,
        createdAt,
        status,
      })),
    });
  });

  it("rejects safe API errors without accepting an HTML error page", async () => {
    const fetchMock = vi.fn(async (_input: RequestInfo | URL, _options?: RequestInit) =>
      new Response("<h1>Bad gateway</h1>", {
        headers: { "Content-Type": "text/html" },
        status: 502,
      }),
    );
    const service = new ApiChatService(
      "/api/chat",
      fetchMock as unknown as typeof fetch,
    );

    await expect(service.send("Hello", history)).rejects.toThrow("CHAT_FAILED");
  });

  it("rejects a successful response without usable reply text", async () => {
    const fetchMock = vi.fn(async (_input: RequestInfo | URL, _options?: RequestInit) =>
      new Response(JSON.stringify({ reply: "   " }), {
        headers: { "Content-Type": "application/json" },
        status: 200,
      }),
    );
    const service = new ApiChatService(
      "/api/chat",
      fetchMock as unknown as typeof fetch,
    );

    await expect(service.send("Hello", history)).rejects.toThrow(
      "INVALID_CHAT_RESPONSE",
    );
  });
});
