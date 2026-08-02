export type ChatMessage = {
  id: string;
  sender: "visitor" | "harry";
  text: string;
  createdAt: string;
  status: "sent" | "delivered" | "error";
};

export type ChatReply = {
  intent: "projects" | "photography" | "contact" | "ai-status" | "fallback";
  text: string;
};

export interface ChatService {
  send(message: string, history: readonly ChatMessage[]): Promise<ChatReply>;
}
