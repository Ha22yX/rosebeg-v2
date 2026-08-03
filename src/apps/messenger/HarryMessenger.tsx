import {
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import type { ChatMessage, ChatService } from "@/apps/messenger/chat-service";
import { ApiChatService } from "@/apps/messenger/api-chat-service";
import { localChatCopy } from "@/content/chat-responses";
import { XpButton } from "@/shared/XpButton";
import "@/apps/messenger/messenger.css";

/** Session-storage key used by standalone Messenger mounts. */
export const defaultMessengerStorageKey = "rosebeg-v2:messenger";

export type HarryMessengerProps = {
  service?: ChatService;
  storageKey?: string;
};

function createMessageId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function createMessage(
  sender: ChatMessage["sender"],
  text: string,
  status: ChatMessage["status"],
): ChatMessage {
  return {
    id: createMessageId(),
    sender,
    text,
    createdAt: new Date().toISOString(),
    status,
  };
}

function isChatMessage(value: unknown): value is ChatMessage {
  if (!value || typeof value !== "object") return false;

  const message = value as Partial<ChatMessage>;
  return (
    typeof message.id === "string" &&
    (message.sender === "visitor" || message.sender === "harry") &&
    typeof message.text === "string" &&
    typeof message.createdAt === "string" &&
    !Number.isNaN(Date.parse(message.createdAt)) &&
    (message.status === "sent" ||
      message.status === "delivered" ||
      message.status === "error")
  );
}

function initialMessages(storageKey: string) {
  if (typeof window !== "undefined") {
    try {
      const stored = window.sessionStorage.getItem(storageKey);
      if (stored) {
        const parsed: unknown = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0 && parsed.every(isChatMessage)) {
          return parsed;
        }
      }
    } catch {
      // Storage can be unavailable or contain invalid data; the local welcome remains usable.
    }
  }

  return [createMessage("harry", localChatCopy.welcome, "delivered")];
}

export function HarryMessenger({
  service,
  storageKey = defaultMessengerStorageKey,
}: HarryMessengerProps) {
  const composerId = useId();
  const defaultServiceRef = useRef<ChatService | null>(null);
  if (!defaultServiceRef.current) defaultServiceRef.current = new ApiChatService();
  const activeService = service ?? defaultServiceRef.current;

  const [messages, setMessages] = useState<ChatMessage[]>(() =>
    initialMessages(storageKey),
  );
  const [draft, setDraft] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const isMountedRef = useRef(true);
  const isSendingRef = useRef(false);
  const transcriptRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    try {
      window.sessionStorage.setItem(storageKey, JSON.stringify(messages));
    } catch {
      // The in-memory conversation still works when session storage is unavailable.
    }

    const transcript = transcriptRef.current;
    if (transcript) transcript.scrollTop = transcript.scrollHeight;
  }, [messages, storageKey]);

  const sendMessage = async () => {
    const text = draft.trim();
    if (!text || isSendingRef.current) return;

    isSendingRef.current = true;
    setIsPending(true);
    setDraft("");

    const visitorMessage = createMessage("visitor", text, "sent");
    const history = [...messages, visitorMessage];
    setMessages(history);

    try {
      const reply = await activeService.send(text, history);
      if (!isMountedRef.current) return;

      setMessages((current) => [
        ...current.map((message) =>
          message.id === visitorMessage.id
            ? { ...message, status: "delivered" as const }
            : message,
        ),
        createMessage("harry", reply.text, "delivered"),
      ]);
      setIsOnline(true);
    } catch {
      if (!isMountedRef.current) return;

      setMessages((current) =>
        current.map((message) =>
          message.id === visitorMessage.id
            ? { ...message, status: "error" as const }
            : message,
        ),
      );
      setIsOnline(false);
    } finally {
      isSendingRef.current = false;
      if (isMountedRef.current) setIsPending(false);
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void sendMessage();
  };

  const handleComposerKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== "Enter" || event.shiftKey) return;

    event.preventDefault();
    void sendMessage();
  };

  return (
    <section
      aria-label="Harry Messenger"
      className="harry-messenger"
      style={{ containerName: "harry-messenger", containerType: "size" }}
    >
      <div className="harry-messenger__layout">
        <aside aria-label="Contacts" className="harry-messenger__contacts">
          <div className="harry-messenger__contacts-title">Contacts</div>
          <button
            aria-pressed="true"
            className="harry-messenger__contact"
            type="button"
            aria-label={`Harry, ${isOnline ? "online" : "offline"}`}
          >
            <span aria-hidden="true" className="harry-messenger__avatar">H</span>
            <span className="harry-messenger__contact-copy">
              <strong>Harry</strong>
              <small>{isOnline ? "Online" : "Offline"}</small>
            </span>
          </button>
        </aside>

        <div className="harry-messenger__conversation">
          <header className="harry-messenger__header">
            <span aria-hidden="true" className="harry-messenger__avatar harry-messenger__avatar--large">H</span>
            <div>
              <h2>Harry</h2>
              <p>{isOnline ? "Online — AI portfolio assistant" : "Offline — message not delivered"}</p>
            </div>
          </header>

          <div
            aria-label="Conversation with Harry"
            aria-live="polite"
            className="harry-messenger__transcript"
            ref={transcriptRef}
            role="log"
          >
            {messages.map((message) => (
              <article
                className={`harry-messenger__message harry-messenger__message--${message.sender}`}
                key={message.id}
              >
                <div className="harry-messenger__message-meta">
                  <strong>{message.sender === "harry" ? "Harry" : "You"}</strong>
                  <time dateTime={message.createdAt}>{formatTime(message.createdAt)}</time>
                </div>
                <p data-sender={message.sender} data-status={message.status}>{message.text}</p>
                <small className={`harry-messenger__delivery harry-messenger__delivery--${message.status}`}>
                  {message.status === "error"
                    ? "Not delivered"
                    : message.status === "delivered"
                      ? "Delivered"
                      : "Sent"}
                </small>
              </article>
            ))}

            {isPending ? (
              <div
                aria-label="Harry is typing"
                className="harry-messenger__typing"
                role="status"
              >
                Harry is typing...
              </div>
            ) : null}
          </div>

          <form
            aria-label="Message composer"
            className="harry-messenger__composer"
            onSubmit={handleSubmit}
          >
            <label htmlFor={composerId}>Message Harry</label>
            <div className="harry-messenger__composer-row">
              <textarea
                id={composerId}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={handleComposerKeyDown}
                placeholder="Type a message..."
                rows={3}
                value={draft}
              />
              <XpButton disabled={!draft.trim() || isPending} type="submit">Send</XpButton>
            </div>
            <p>AI replies are generated by OpenAI. Do not send sensitive information. Press Enter to send; Shift+Enter adds a new line.</p>
          </form>
        </div>
      </div>
    </section>
  );
}

function formatTime(createdAt: string) {
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(createdAt));
}
