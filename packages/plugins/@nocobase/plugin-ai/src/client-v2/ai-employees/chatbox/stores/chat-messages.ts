/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { randomId } from '@nocobase/flow-engine';
import type { Attachment, ChatEditorRef, ContextItem, Message, SkillSettings, WebSearching } from '../../types';
import { createObservableStore, createSelectors } from './create-selectors';
import { getOrCreateGlobalStore } from './global-store';

export const CHAT_DEFAULT_SESSION_KEY = '__draft__';

export const getChatSessionKey = (sessionId?: string) => sessionId || CHAT_DEFAULT_SESSION_KEY;

export type ChatSessionState = {
  messages: Message[];
  messagesLoading: boolean;
  messagesError?: unknown;
  messagesMeta: {
    cursor?: string;
    hasMore?: boolean;
  };
  attachments: Attachment[];
  contextItems: ContextItem[];
  systemMessage: string;
  responseLoading: boolean;
  abortController?: AbortController;
  skillSettings?: SkillSettings;
  webSearching?: WebSearching;
  backgroundWorking: boolean;
  resumeStreamFailed: boolean;
};

export const CHAT_EMPTY_SESSION_STATE: ChatSessionState = {
  messages: [],
  messagesLoading: false,
  messagesError: null,
  messagesMeta: {},
  attachments: [],
  contextItems: [],
  systemMessage: '',
  responseLoading: false,
  abortController: null,
  skillSettings: null,
  webSearching: null,
  backgroundWorking: false,
  resumeStreamFailed: false,
};

type ChatMessagesState = {
  sessions: Record<string, ChatSessionState>;
  editorRef?: Record<string, ChatEditorRef | null>;
  currentEditorRefUid?: string;
  flowContext?: unknown;
};

type SessionStateUpdater<T> = T | ((prev: T) => T);

const createInitialSessionState = (): ChatSessionState => ({
  ...CHAT_EMPTY_SESSION_STATE,
});

const cloneSessionState = (session: ChatSessionState): ChatSessionState => ({
  ...session,
  messages: [...session.messages],
  messagesMeta: { ...session.messagesMeta },
  attachments: [...session.attachments],
  contextItems: [...session.contextItems],
});

const resolveSessionState = (state: { sessions: Record<string, ChatSessionState> }, sessionId?: string) =>
  state.sessions[getChatSessionKey(sessionId)] ?? createInitialSessionState();

const updateSessionState = (
  state: ChatMessagesState,
  sessionId: string | undefined,
  updater: (session: ChatSessionState) => ChatSessionState,
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

export interface ChatMessagesActions {
  setEditorRef: (uid: string, editorRef: ChatEditorRef | null) => void;
  setCurrentEditorRefUid: (uid: string) => void;
  setFlowContext: (ctx: unknown) => void;

  getSessionState: (sessionId?: string) => ChatSessionState;
  resetSessionState: (sessionId?: string, patch?: Partial<ChatSessionState>) => void;
  migrateSessionState: (fromSessionId: string | undefined, toSessionId: string) => void;
  setSessionMessages: (sessionId: string | undefined, messages: SessionStateUpdater<Message[]>) => void;
  setSessionMessagesLoading: (sessionId: string | undefined, loading: boolean) => void;
  setSessionMessagesError: (sessionId: string | undefined, error: unknown) => void;
  setSessionMessagesMeta: (
    sessionId: string | undefined,
    meta:
      | ChatSessionState['messagesMeta']
      | ((prev: ChatSessionState['messagesMeta']) => ChatSessionState['messagesMeta']),
  ) => void;
  setSessionAttachments: (sessionId: string | undefined, attachments: SessionStateUpdater<Attachment[]>) => void;
  setSessionContextItems: (sessionId: string | undefined, items: SessionStateUpdater<ContextItem[]>) => void;
  setSessionSystemMessage: (sessionId: string | undefined, msg: string | ((prev: string) => string)) => void;
  setSessionResponseLoading: (sessionId: string | undefined, loading: boolean) => void;
  setSessionBackgroundWorking: (sessionId: string | undefined, backgroundWorking: boolean) => void;
  setSessionResumeStreamFailed: (sessionId: string | undefined, resumeStreamFailed: boolean) => void;
  addSessionMessage: (sessionId: string | undefined, msg: Message) => void;
  addSessionMessages: (sessionId: string | undefined, msgs: Message[]) => void;
  updateSessionLastMessage: (sessionId: string | undefined, updater: (msg: Message) => Message) => void;
  removeSessionMessage: (sessionId: string | undefined, key: string) => void;
  addSessionAttachments: (sessionId: string | undefined, attachments: Attachment | Attachment[]) => void;
  removeSessionAttachment: (sessionId: string | undefined, filename: string) => void;
  addSessionContextItems: (sessionId: string | undefined, items: ContextItem | ContextItem[]) => void;
  addContextItems: (items: ContextItem | ContextItem[]) => void;
  removeSessionContextItem: (sessionId: string | undefined, type: string, uid: string) => void;
  setSessionAbortController: (sessionId: string | undefined, controller: AbortController | undefined) => void;
  setSessionSkillSettings: (sessionId: string | undefined, settings: SkillSettings | undefined) => void;
  setSessionWebSearching: (sessionId: string | undefined, webSearching: WebSearching) => void;
  addSessionSubAgentMessage: (sessionId: string | undefined, subSessionId: string, msg: Message) => void;
  addSessionSubAgentMessages: (sessionId: string | undefined, subSessionId: string, msgs: Message[]) => void;
  updateSessionLastSubAgentMessage: (
    sessionId: string | undefined,
    subSessionId: string,
    username: string,
    updater: (msg: Message) => Message,
  ) => void;
  updateSessionSubAgentConversationStatus: (
    sessionId: string | undefined,
    subSessionId: string,
    status: 'pending' | 'completed',
  ) => void;
}

const store = getOrCreateGlobalStore('@nocobase/plugin-ai/chat-messages-store', () =>
  createObservableStore<ChatMessagesState & ChatMessagesActions>((set, get) => {
    const defaultSession = createInitialSessionState();

    return {
      sessions: {
        [CHAT_DEFAULT_SESSION_KEY]: defaultSession,
      },
      editorRef: {},
      currentEditorRefUid: null,
      flowContext: null,

      getSessionState: (sessionId) => cloneSessionState(resolveSessionState(get(), sessionId)),

      resetSessionState: (sessionId, patch) =>
        set((state) =>
          updateSessionState(state, sessionId, () => ({
            ...createInitialSessionState(),
            ...(patch ?? {}),
          })),
        ),

      migrateSessionState: (fromSessionId, toSessionId) => {
        const fromKey = getChatSessionKey(fromSessionId);
        const toKey = getChatSessionKey(toSessionId);
        if (fromKey === toKey) {
          return;
        }
        set((state) => {
          const sourceSession = resolveSessionState(state, fromKey);
          const nextSessions = { ...state.sessions, [toKey]: cloneSessionState(sourceSession) };

          if (fromKey === CHAT_DEFAULT_SESSION_KEY) {
            nextSessions[CHAT_DEFAULT_SESSION_KEY] = createInitialSessionState();
            return { sessions: nextSessions };
          }

          delete nextSessions[fromKey];
          return {
            sessions: nextSessions,
          };
        });
      },

      setSessionMessages: (sessionId, messages) =>
        set((state) =>
          updateSessionState(state, sessionId, (session) => ({
            ...session,
            messages: typeof messages === 'function' ? messages(session.messages) : messages,
          })),
        ),

      setSessionMessagesLoading: (sessionId, loading) =>
        set((state) =>
          updateSessionState(state, sessionId, (session) => ({
            ...session,
            messagesLoading: loading,
          })),
        ),

      setSessionMessagesError: (sessionId, error) =>
        set((state) =>
          updateSessionState(state, sessionId, (session) => ({
            ...session,
            messagesError: error,
          })),
        ),

      setSessionMessagesMeta: (sessionId, meta) =>
        set((state) =>
          updateSessionState(state, sessionId, (session) => ({
            ...session,
            messagesMeta: typeof meta === 'function' ? meta(session.messagesMeta) : meta,
          })),
        ),

      setSessionAttachments: (sessionId, attachments) =>
        set((state) =>
          updateSessionState(state, sessionId, (session) => ({
            ...session,
            attachments: typeof attachments === 'function' ? attachments(session.attachments) : attachments,
          })),
        ),

      setSessionContextItems: (sessionId, items) =>
        set((state) =>
          updateSessionState(state, sessionId, (session) => ({
            ...session,
            contextItems: typeof items === 'function' ? items(session.contextItems) : items,
          })),
        ),

      setSessionSystemMessage: (sessionId, msg) =>
        set((state) =>
          updateSessionState(state, sessionId, (session) => ({
            ...session,
            systemMessage: typeof msg === 'function' ? msg(session.systemMessage) : msg,
          })),
        ),

      setSessionResponseLoading: (sessionId, loading) =>
        set((state) =>
          updateSessionState(state, sessionId, (session) => ({
            ...session,
            responseLoading: loading,
          })),
        ),

      setSessionBackgroundWorking: (sessionId, backgroundWorking) =>
        set((state) =>
          updateSessionState(state, sessionId, (session) => ({
            ...session,
            backgroundWorking,
          })),
        ),

      setSessionResumeStreamFailed: (sessionId, resumeStreamFailed) =>
        set((state) =>
          updateSessionState(state, sessionId, (session) => ({
            ...session,
            resumeStreamFailed,
          })),
        ),

      addSessionMessage: (sessionId, message) =>
        set((state) =>
          updateSessionState(state, sessionId, (session) => ({
            ...session,
            messages: [...session.messages, message],
          })),
        ),

      addSessionMessages: (sessionId, msgs) =>
        set((state) =>
          updateSessionState(state, sessionId, (session) => ({
            ...session,
            messages: [...session.messages, ...msgs],
          })),
        ),

      updateSessionLastMessage: (sessionId, updater) =>
        set((state) =>
          updateSessionState(state, sessionId, (session) => {
            const messages = [...session.messages];
            const index = messages.length - 1;
            if (index >= 0) {
              messages[index] = updater(messages[index]);
            }
            return {
              ...session,
              messages,
            };
          }),
        ),

      removeSessionMessage: (sessionId, key) =>
        set((state) =>
          updateSessionState(state, sessionId, (session) => ({
            ...session,
            messages: session.messages.filter((msg) => msg.key !== key),
          })),
        ),

      addSessionAttachments: (sessionId, attachments) =>
        set((state) =>
          updateSessionState(state, sessionId, (session) => ({
            ...session,
            attachments: Array.isArray(attachments)
              ? [...session.attachments, ...attachments]
              : [...session.attachments, attachments],
          })),
        ),

      removeSessionAttachment: (sessionId, filename) =>
        set((state) =>
          updateSessionState(state, sessionId, (session) => ({
            ...session,
            attachments: session.attachments.filter((attachment) => attachment.filename !== filename),
          })),
        ),

      addSessionContextItems: (sessionId, items) => {
        const nextItems = Array.isArray(items) ? items : [items];
        set((state) =>
          updateSessionState(state, sessionId, (session) => {
            const map = new Map<string, ContextItem>();
            for (const item of session.contextItems) {
              map.set(`${item.type}:${item.uid}`, item);
            }
            for (const item of nextItems) {
              map.set(`${item.type}:${item.uid}`, item);
            }
            return {
              ...session,
              contextItems: Array.from(map.values()),
            };
          }),
        );
      },

      addContextItems: (items) => {
        get().addSessionContextItems(undefined, items);
      },

      removeSessionContextItem: (sessionId, type, uid) =>
        set((state) =>
          updateSessionState(state, sessionId, (session) => ({
            ...session,
            contextItems: session.contextItems.filter((item) => !(item.type === type && item.uid === uid)),
          })),
        ),

      setSessionAbortController: (sessionId, controller) =>
        set((state) =>
          updateSessionState(state, sessionId, (session) => ({
            ...session,
            abortController: controller,
          })),
        ),

      setSessionSkillSettings: (sessionId, settings) =>
        set((state) =>
          updateSessionState(state, sessionId, (session) => ({
            ...session,
            skillSettings: settings,
          })),
        ),

      setEditorRef: (uid, editorRef) => set((state) => ({ editorRef: { ...state.editorRef, [uid]: editorRef } })),

      setCurrentEditorRefUid: (uid) => set({ currentEditorRefUid: uid }),

      setSessionWebSearching: (sessionId, webSearching) =>
        set((state) =>
          updateSessionState(state, sessionId, (session) => ({
            ...session,
            webSearching,
          })),
        ),

      setFlowContext: (flowContext) => set({ flowContext }),

      addSessionSubAgentMessage: (sessionId, subSessionId, msg) => {
        get().addSessionSubAgentMessages(sessionId, subSessionId, [msg]);
      },

      addSessionSubAgentMessages: (sessionId, subSessionId, msgs) => {
        get().updateSessionLastMessage(sessionId, (last) => ({
          ...last,
          content: {
            ...last.content,
            subAgentConversations: last.content.subAgentConversations?.map((conversation) => {
              if (conversation.sessionId !== subSessionId) {
                return conversation;
              }
              return {
                ...conversation,
                messages: [...conversation.messages, ...msgs],
              };
            }) ?? [
              {
                sessionId: subSessionId,
                messages: msgs,
              },
            ],
          },
          loading: false,
        }));
      },

      updateSessionLastSubAgentMessage: (sessionId, subSessionId, username, updater) => {
        get().updateSessionLastMessage(sessionId, (last) => ({
          ...last,
          content: {
            ...last.content,
            subAgentConversations: last.content.subAgentConversations?.map((conversation) => {
              if (conversation.sessionId !== subSessionId) {
                return conversation;
              }
              const messages = [...conversation.messages];
              const index = messages.length - 1;
              if (index >= 0) {
                messages[index] = updater(messages[index]);
              }
              return {
                ...conversation,
                messages,
              };
            }) ?? [
              {
                sessionId: subSessionId,
                messages: [
                  updater({
                    key: randomId(),
                    role: username,
                    createdAt: new Date().toISOString(),
                    content: { type: 'text', content: '' },
                    loading: true,
                  }),
                ],
              },
            ],
          },
          loading: false,
        }));
      },

      updateSessionSubAgentConversationStatus: (sessionId, subSessionId, status) => {
        get().updateSessionLastMessage(sessionId, (last) => ({
          ...last,
          content: {
            ...last.content,
            subAgentConversations: last.content.subAgentConversations?.map((conversation) => {
              if (conversation.sessionId !== subSessionId) {
                return conversation;
              }
              return {
                ...conversation,
                status,
              };
            }),
          },
          loading: false,
        }));
      },
    };
  }),
);

export const useChatMessagesStore = createSelectors(store);
