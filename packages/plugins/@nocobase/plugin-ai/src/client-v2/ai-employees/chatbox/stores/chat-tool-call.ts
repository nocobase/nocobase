/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createObservableStore, createSelectors } from './create-selectors';
import { getChatSessionKey } from './chat-messages';
import { getOrCreateGlobalStore } from './global-store';

type ToolCallInvokeState = { id: string; invokeStatus: string };

export type ChatToolCallSessionState = {
  toolCalls: Record<string, ToolCallInvokeState[]>;
};

export const CHAT_EMPTY_TOOL_CALL_SESSION_STATE: ChatToolCallSessionState = {
  toolCalls: {},
};

type ChatToolCallState = {
  sessions: Record<string, ChatToolCallSessionState>;
};

const createInitialSessionState = (): ChatToolCallSessionState => ({
  toolCalls: {},
});

const cloneSessionState = (session: ChatToolCallSessionState): ChatToolCallSessionState => ({
  ...session,
  toolCalls: Object.entries(session.toolCalls).reduce<Record<string, ToolCallInvokeState[]>>((result, [key, list]) => {
    result[key] = list.map((item) => ({ ...item }));
    return result;
  }, {}),
});

const resolveSessionState = (state: { sessions: Record<string, ChatToolCallSessionState> }, sessionId: string) =>
  state.sessions[getChatSessionKey(sessionId)] ?? createInitialSessionState();

const updateSessionState = (
  state: ChatToolCallState,
  sessionId: string,
  updater: (session: ChatToolCallSessionState) => ChatToolCallSessionState,
) => {
  const key = getChatSessionKey(sessionId);
  const nextSession = updater(resolveSessionState(state, key));
  return {
    sessions: {
      ...state.sessions,
      [key]: nextSession,
    },
  };
};

export interface ChatToolCallActions {
  getSessionState: (sessionId: string) => ChatToolCallSessionState;
  resetSessionState: (sessionId: string) => void;
  migrateSessionState: (fromSessionId: string, toSessionId: string) => void;
  updateToolCallInvokeStatus: (sessionId: string, messageId: string, toolCallId: string, invokeStatus: string) => void;
  isAllWaiting: (sessionId: string, messageId: string) => boolean;
  isInterrupted: (sessionId: string, messageId: string, toolCallId: string) => boolean;
  getInvokeStatus: (sessionId: string, messageId: string, toolCallId: string) => string | undefined;
}

const store = getOrCreateGlobalStore('@nocobase/plugin-ai/chat-tool-call-store', () =>
  createObservableStore<ChatToolCallState & ChatToolCallActions>((set, get) => {
    return {
      sessions: {},

      getSessionState: (sessionId) => cloneSessionState(resolveSessionState(get(), sessionId)),

      resetSessionState: (sessionId) =>
        set((state) => updateSessionState(state, sessionId, () => createInitialSessionState())),

      migrateSessionState: (fromSessionId, toSessionId) => {
        const fromKey = getChatSessionKey(fromSessionId);
        const toKey = getChatSessionKey(toSessionId);
        if (fromKey === toKey) {
          return;
        }
        set((state) => {
          const sourceSession = resolveSessionState(state, fromKey);
          const nextSessions = { ...state.sessions, [toKey]: cloneSessionState(sourceSession) };

          delete nextSessions[fromKey];
          return {
            sessions: nextSessions,
          };
        });
      },

      updateToolCallInvokeStatus: (sessionId, messageId, toolCallId, invokeStatus) => {
        set((state) =>
          updateSessionState(state, sessionId, (session) => {
            const list = session.toolCalls[messageId] ?? [];

            const exists = list.some((tc) => tc.id === toolCallId);

            const nextList = exists
              ? list.map((tc) => (tc.id === toolCallId ? { ...tc, invokeStatus } : tc))
              : [...list, { id: toolCallId, invokeStatus }];

            return {
              toolCalls: {
                ...session.toolCalls,
                [messageId]: nextList,
              },
            };
          }),
        );
      },
      isAllWaiting: (sessionId, messageId) => {
        const list = resolveSessionState(get(), sessionId).toolCalls[messageId];
        if (!list || list.length === 0) return false;

        return list.every((x) => x.invokeStatus === 'waiting');
      },
      isInterrupted: (sessionId, messageId, toolCallId) => {
        const list = resolveSessionState(get(), sessionId).toolCalls[messageId] ?? [];
        const toolCall = list.find((x) => x.id === toolCallId);
        return toolCall?.invokeStatus === 'interrupted';
      },
      getInvokeStatus: (sessionId, messageId, toolCallId) => {
        const list = resolveSessionState(get(), sessionId).toolCalls[messageId] ?? [];
        const toolCall = list.find((x) => x.id === toolCallId);
        return toolCall?.invokeStatus;
      },
    };
  }),
);

export const useChatToolCallStore = createSelectors(store);
