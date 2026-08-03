import type {
  ChatMessage,
  ChatReply,
  ChatService,
} from "@/apps/messenger/chat-service";

type ChatApiResponse = {
  code?: unknown;
  reply?: unknown;
};

export class ApiChatService implements ChatService {
  private readonly fetchImpl: typeof fetch;

  constructor(
    private readonly endpoint = "/api/chat",
    fetchImpl: typeof fetch = (...arguments_) => globalThis.fetch(...arguments_),
  ) {
    this.fetchImpl = fetchImpl;
  }

  async send(
    message: string,
    history: readonly ChatMessage[],
  ): Promise<ChatReply> {
    const response = await this.fetchImpl(this.endpoint, {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message,
        history: history.map(({ sender, text, createdAt, status }) => ({
          sender,
          text,
          createdAt,
          status,
        })),
      }),
    });

    const payload = (await response.json().catch(() => ({}))) as ChatApiResponse;
    if (!response.ok) {
      const code = typeof payload.code === "string" ? payload.code : "CHAT_FAILED";
      throw new Error(code);
    }

    if (typeof payload.reply !== "string" || !payload.reply.trim()) {
      throw new Error("INVALID_CHAT_RESPONSE");
    }

    return { intent: "fallback", text: payload.reply.trim() };
  }
}
