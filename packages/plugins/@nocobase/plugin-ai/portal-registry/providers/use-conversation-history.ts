import type { Chat } from "@ai-sdk/react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { NocoBaseChatTransport } from "./chat-transport";
import { reconcileRefreshedMessages } from "./chat-message-utils";
import { AI_DRAFT_CONVERSATION_ID, type AIChatMessage } from "./types";

const isChatRunning = (chat: Chat<AIChatMessage>) =>
  chat.status === "streaming" || chat.status === "submitted";

export function useConversationHistory({
  chatSurfaceOpen,
  activeConversationId,
  getActiveConversationId,
  getChat,
  getTransport,
  getConversationMessages,
  getConversationActiveState,
  onMarkRead,
  onError,
}: {
  chatSurfaceOpen: boolean;
  activeConversationId: string;
  getActiveConversationId: () => string;
  getChat: (conversationId: string) => Chat<AIChatMessage>;
  getTransport: (conversationId: string) => NocoBaseChatTransport | undefined;
  getConversationMessages: (
    conversationId: string,
    options?: { updateRead?: boolean }
  ) => Promise<AIChatMessage[]>;
  getConversationActiveState: (
    conversationId: string
  ) => Promise<string | undefined>;
  onMarkRead: (conversationId: string) => void;
  onError: (error?: Error) => void;
}) {
  const surfaceOpenRef = useRef(chatSurfaceOpen);
  const openVersionRef = useRef(0);
  const pendingRequestsRef = useRef(
    new Map<string, Promise<AIChatMessage[]>>()
  );
  const [loadingId, setLoadingId] = useState<string>();
  surfaceOpenRef.current = chatSurfaceOpen;

  const refresh = useCallback(
    (
      conversationId: string,
      targetChat: Chat<AIChatMessage>,
      options: { updateRead?: boolean } = {}
    ) => {
      const updateRead = options.updateRead === true;
      const requestKey = `${conversationId}:${updateRead ? "read" : "peek"}`;
      const pending = pendingRequestsRef.current.get(requestKey);
      if (pending) return pending;

      const request = getConversationMessages(conversationId, { updateRead })
        .then((messages) => {
          const reconciled = reconcileRefreshedMessages(
            targetChat.messages,
            messages
          );
          targetChat.messages = reconciled;
          return reconciled;
        })
        .finally(() => pendingRequestsRef.current.delete(requestKey));
      pendingRequestsRef.current.set(requestKey, request);
      return request;
    },
    [getConversationMessages]
  );

  const load = useCallback(
    async (conversationId: string) => {
      const targetChat = getChat(conversationId);
      if (isChatRunning(targetChat)) return;

      const openVersion = openVersionRef.current + 1;
      openVersionRef.current = openVersion;
      setLoadingId(conversationId);
      onError(undefined);
      try {
        await refresh(conversationId, targetChat, { updateRead: true });
        onMarkRead(conversationId);
      } catch (error) {
        onError(
          error instanceof Error
            ? error
            : new Error("Unable to load conversation messages")
        );
        return;
      } finally {
        setLoadingId((current) =>
          current === conversationId ? undefined : current
        );
      }

      if (
        openVersionRef.current !== openVersion ||
        getActiveConversationId() !== conversationId ||
        isChatRunning(targetChat)
      ) {
        return;
      }

      try {
        const activeState = await getConversationActiveState(conversationId);
        if (
          openVersionRef.current !== openVersion ||
          getActiveConversationId() !== conversationId ||
          isChatRunning(targetChat) ||
          activeState !== "streaming"
        ) {
          return;
        }
        getTransport(conversationId)?.prepareConversationResume(
          targetChat.messages
        );
        await targetChat.resumeStream();
      } catch (error) {
        onError(
          error instanceof Error
            ? error
            : new Error("Unable to resume the conversation stream")
        );
      }
    },
    [
      getActiveConversationId,
      getChat,
      getConversationActiveState,
      getTransport,
      onError,
      onMarkRead,
      refresh,
    ]
  );

  useEffect(() => {
    if (
      !chatSurfaceOpen ||
      activeConversationId === AI_DRAFT_CONVERSATION_ID
    ) {
      return;
    }
    const targetChat = getChat(activeConversationId);
    if (isChatRunning(targetChat)) return;

    void refresh(activeConversationId, targetChat, { updateRead: true })
      .then(() => {
        if (
          surfaceOpenRef.current &&
          getActiveConversationId() === activeConversationId
        ) {
          onMarkRead(activeConversationId);
        }
      })
      .catch((error: unknown) => {
        onError(
          error instanceof Error
            ? error
            : new Error("Unable to mark the conversation as read")
        );
      });
  }, [
    activeConversationId,
    chatSurfaceOpen,
    getActiveConversationId,
    getChat,
    onError,
    onMarkRead,
    refresh,
  ]);

  const invalidate = useCallback(() => {
    openVersionRef.current += 1;
  }, []);

  return { invalidate, load, loadingId, refresh };
}
