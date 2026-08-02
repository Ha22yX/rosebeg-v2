import { LocalChatService } from "@/apps/messenger/local-chat-service";
import { localChatCopy } from "@/content/chat-responses";

describe("LocalChatService", () => {
  const service = new LocalChatService();

  it.each([
    ["What projects have you built?", "projects", localChatCopy.projects],
    ["Tell me about your photography", "photography", localChatCopy.photography],
    ["How can I contact Harry?", "contact", localChatCopy.contact],
    ["Are you connected to AI?", "ai-status", localChatCopy.aiNotConnected],
  ] as const)("routes %s to %s", async (message, intent, text) => {
    await expect(service.send(message, [])).resolves.toEqual({ intent, text });
  });

  it.each([
    ["Tell me about DayVault", "projects", localChatCopy.projects],
    ["Where is @Ha22yX?", "contact", localChatCopy.contact],
  ] as const)("recognizes approved portfolio content in %s", async (message, intent, text) => {
    await expect(service.send(message, [])).resolves.toEqual({ intent, text });
  });

  it("uses the honest offline fallback", async () => {
    await expect(service.send("unmatched sentence", [])).resolves.toEqual({
      intent: "fallback",
      text: localChatCopy.fallback,
    });
  });

  it("rejects input that is empty after trimming", async () => {
    await expect(service.send("  \n ", [])).rejects.toThrow("Message is empty");
  });
});
