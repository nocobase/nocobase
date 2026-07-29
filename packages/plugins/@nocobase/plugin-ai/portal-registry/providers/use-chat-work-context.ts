import { useCallback, useRef, useState } from "react";
import type { AIWorkContextItem } from "./types";

const EMPTY_CONTEXT: AIWorkContextItem[] = [];

const contextItemKey = (item: AIWorkContextItem) =>
  `${item.type}:${item.id ?? item.title ?? "context"}`;

export function useChatWorkContext(activeConversationId: string) {
  const [drafts, setDrafts] = useState<Record<string, AIWorkContextItem[]>>({});
  const draftsRef = useRef(drafts);
  draftsRef.current = drafts;

  const setConversationWorkContext = useCallback(
    (
      conversationId: string,
      value:
        | AIWorkContextItem[]
        | ((current: AIWorkContextItem[]) => AIWorkContextItem[])
    ) => {
      setDrafts((current) => ({
        ...current,
        [conversationId]:
          typeof value === "function"
            ? value(current[conversationId] ?? [])
            : value,
      }));
    },
    []
  );

  const addWorkContext = useCallback(
    (item: AIWorkContextItem) => {
      setConversationWorkContext(activeConversationId, (current) => {
        const key = contextItemKey(item);
        return [
          ...current.filter((entry) => contextItemKey(entry) !== key),
          item,
        ];
      });
    },
    [activeConversationId, setConversationWorkContext]
  );

  const removeWorkContext = useCallback(
    (item: AIWorkContextItem) => {
      const key = contextItemKey(item);
      setConversationWorkContext(activeConversationId, (current) =>
        current.filter((entry) => contextItemKey(entry) !== key)
      );
    },
    [activeConversationId, setConversationWorkContext]
  );

  const moveWorkContext = useCallback((from: string, to: string) => {
    setDrafts((current) => {
      if (!current[from]) return current;
      const next = { ...current, [to]: current[from] };
      delete next[from];
      return next;
    });
  }, []);

  const removeConversationWorkContext = useCallback(
    (conversationId: string) => {
      setDrafts((current) => {
        if (!current[conversationId]) return current;
        const next = { ...current };
        delete next[conversationId];
        return next;
      });
    },
    []
  );

  const clearWorkContext = useCallback(() => setDrafts({}), []);
  // Shared EMPTY_CONTEXT rather than a fresh `[]` — see getConversationAttachments: the send path
  // compares this by identity across an await, so a new array each call would read as "the user
  // changed the work context" and silently abort every send.
  const getConversationWorkContext = useCallback(
    (conversationId: string) => draftsRef.current[conversationId] ?? EMPTY_CONTEXT,
    []
  );
  const workContext = drafts[activeConversationId] ?? EMPTY_CONTEXT;

  return {
    workContext,
    addWorkContext,
    removeWorkContext,
    setConversationWorkContext,
    moveWorkContext,
    removeConversationWorkContext,
    clearWorkContext,
    getConversationWorkContext,
  };
}
