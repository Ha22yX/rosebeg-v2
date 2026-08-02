import type {
  ChatMessage,
  ChatReply,
  ChatService,
} from "@/apps/messenger/chat-service";
import { localChatCopy } from "@/content/chat-responses";
import { contacts } from "@/content/contacts";
import { projects } from "@/content/projects";

type LocalIntent = Exclude<ChatReply["intent"], "fallback">;

const aiSubjectKeywords = ["ai", "artificial intelligence", "chatbot"] as const;
const aiStatusKeywords = ["api", "connected", "connection", "online", "service", "status"] as const;

const intentKeywords: Readonly<Record<LocalIntent, readonly string[]>> = {
  "ai-status": [...aiSubjectKeywords, "connected", "online"],
  projects: [
    "project",
    "projects",
    "portfolio",
    "built",
    "build",
    ...projects.flatMap((project) => [project.name, project.slug]),
  ],
  photography: ["photo", "photos", "photograph", "photography", "camera", "picture", "pictures"],
  contact: [
    "contact",
    "reach",
    "email",
    "github",
    "wechat",
    "instagram",
    ...contacts.flatMap((contact) => [contact.label, contact.handle]),
  ],
};

const responseText: Readonly<Record<LocalIntent, string>> = {
  projects: localChatCopy.projects,
  photography: localChatCopy.photography,
  contact: localChatCopy.contact,
  "ai-status": localChatCopy.aiNotConnected,
};

const intentOrder: readonly LocalIntent[] = [
  "projects",
  "ai-status",
  "photography",
  "contact",
];

function containsKeyword(message: string, keyword: string) {
  const normalizedKeyword = keyword.toLocaleLowerCase().trim();
  if (!normalizedKeyword) return false;

  const escapedKeyword = normalizedKeyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|[^a-z0-9])${escapedKeyword}([^a-z0-9]|$)`, "i").test(message);
}

export class LocalChatService implements ChatService {
  async send(message: string, _history: readonly ChatMessage[]): Promise<ChatReply> {
    const normalizedMessage = message.toLocaleLowerCase().trim();
    if (!normalizedMessage) throw new Error("Message is empty");

    const isAiStatusQuestion =
      aiSubjectKeywords.some((keyword) => containsKeyword(normalizedMessage, keyword)) &&
      aiStatusKeywords.some((keyword) => containsKeyword(normalizedMessage, keyword));
    if (isAiStatusQuestion) {
      return { intent: "ai-status", text: localChatCopy.aiNotConnected };
    }

    const intent = intentOrder.find((candidate) =>
      intentKeywords[candidate].some((keyword) => containsKeyword(normalizedMessage, keyword)),
    );

    if (!intent) {
      return { intent: "fallback", text: localChatCopy.fallback };
    }

    return { intent, text: responseText[intent] };
  }
}
