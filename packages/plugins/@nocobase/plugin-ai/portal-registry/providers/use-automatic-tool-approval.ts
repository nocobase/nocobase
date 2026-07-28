import type { Chat } from "@ai-sdk/react";
import { useCallback, useRef } from "react";
import { getChatToolParts, getNocoBaseToolMetadata } from "./chat-message-utils";
import type { AIChatMessage, AIToolCallDecision } from "./types";

const isChatRunning = (chat: Chat<AIChatMessage>) =>
  chat.status === "streaming" || chat.status === "submitted";

export function useAutomaticToolApproval({
  enabled,
  decide,
}: {
  enabled: boolean;
  decide: (
    conversationId: string,
    targetChat: Chat<AIChatMessage>,
    decision: AIToolCallDecision,
    options?: { automatic?: boolean }
  ) => Promise<void>;
}) {
  const approvedRef = useRef(new Set<string>());
  const runningRef = useRef(new Set<string>());
  const rerunRef = useRef(new Set<string>());

  const process = useCallback(
    async (conversationId: string, targetChat: Chat<AIChatMessage>) => {
      if (!enabled || isChatRunning(targetChat)) return;
      if (runningRef.current.has(conversationId)) {
        rerunRef.current.add(conversationId);
        return;
      }

      runningRef.current.add(conversationId);
      try {
        do {
          rerunRef.current.delete(conversationId);
          const pending = getChatToolParts(targetChat.messages)
            .filter(
              ({ part }) => getNocoBaseToolMetadata(part)?.autoApprove === true
            )
            .flatMap(({ message, part }) => {
              const key = `${conversationId}:${message.id}:${part.toolCallId}`;
              return approvedRef.current.has(key)
                ? []
                : [{ key, message, part }];
            });

          for (const { key, message, part } of pending) {
            approvedRef.current.add(key);
            try {
              await decide(
                conversationId,
                targetChat,
                {
                  messageId: message.id,
                  toolCallId: part.toolCallId,
                  toolName:
                    part.type === "dynamic-tool"
                      ? part.toolName
                      : part.type.slice(5),
                  decision: "approve",
                },
                { automatic: true }
              );
            } catch (error) {
              approvedRef.current.delete(key);
              throw error;
            }
          }
        } while (rerunRef.current.has(conversationId));
      } finally {
        runningRef.current.delete(conversationId);
        rerunRef.current.delete(conversationId);
      }
    },
    [decide, enabled]
  );

  const clearConversation = useCallback((conversationId: string) => {
    for (const key of approvedRef.current) {
      if (key.startsWith(`${conversationId}:`)) approvedRef.current.delete(key);
    }
    runningRef.current.delete(conversationId);
    rerunRef.current.delete(conversationId);
  }, []);

  const reset = useCallback(() => {
    approvedRef.current.clear();
    runningRef.current.clear();
    rerunRef.current.clear();
  }, []);

  return { clearConversation, process, reset };
}
