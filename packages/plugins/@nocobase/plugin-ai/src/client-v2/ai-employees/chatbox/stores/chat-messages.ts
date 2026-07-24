/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { randomId } from '@nocobase/flow-engine';
import type {
  Attachment,
  ChatCodingTarget,
  ChatCodingTargetBindingResult,
  ChatEditorRef,
  ContextItem,
  Message,
  SkillSettings,
  WebSearching,
  WorkspaceChatCodingTarget,
} from '../../types';
import { getOrCreateGlobalStore } from '../../stores/global-store';
import { createObservableStore } from './create-selectors';
import {
  parseWorkspaceCodingTargetMetadata,
  type WorkspaceCodingTargetMetadata,
} from '../../../../common/workspace-coding-target';

export const CHAT_DEFAULT_SESSION_KEY = '__draft__';

const chatApplicationKeys = new WeakMap<object, string>();
let chatApplicationKeySequence = 0;

export const getChatApplicationKey = (application: { name?: string }): string => {
  const existingKey = chatApplicationKeys.get(application);
  if (existingKey) {
    return existingKey;
  }
  chatApplicationKeySequence += 1;
  const key = `${application.name || 'application'}:${chatApplicationKeySequence.toString(36)}`;
  chatApplicationKeys.set(application, key);
  return key;
};

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
  codingTarget?: ChatCodingTarget;
  codingTargetMismatch?: ChatCodingTarget;
  currentEditorRefUid?: string;
  flowContext?: unknown;
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
  codingTarget: undefined,
  codingTargetMismatch: undefined,
  currentEditorRefUid: undefined,
  flowContext: undefined,
};

type ChatMessagesState = {
  sessions: Record<string, ChatSessionState>;
  editorRef: Record<string, Record<string, ChatEditorRef>>;
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

const isSameCodingTarget = (left: ChatCodingTarget, right: ChatCodingTarget) => {
  if (left.type !== right.type || left.applicationKey !== right.applicationKey) {
    return false;
  }
  if (left.type === 'workspace' && right.type === 'workspace') {
    return left.surfaceId === right.surfaceId;
  }
  return left.type === 'single-file' && right.type === 'single-file' && left.editorUid === right.editorUid;
};

type RestoredWorkspaceCodingContext = {
  target: Omit<WorkspaceChatCodingTarget, 'applicationKey'>;
  item: ContextItem;
};

const createRestoredWorkspaceCodingContext = (
  target: WorkspaceCodingTargetMetadata,
): RestoredWorkspaceCodingContext => ({
  target,
  item: {
    type: 'code-workspace',
    uid: target.surfaceId,
    title: target.title,
    content: {
      surfaceId: target.surfaceId,
      kind: target.kind,
      title: target.title,
    },
  },
});

export const getWorkspaceCodingTargetMetadata = (
  target?: ChatCodingTarget,
): WorkspaceCodingTargetMetadata | undefined => {
  if (target?.type !== 'workspace') {
    return undefined;
  }
  return {
    type: 'workspace',
    surfaceId: target.surfaceId,
    kind: target.kind,
    title: target.title,
  };
};

export const findWorkspaceCodingContext = (messages: Message[]): RestoredWorkspaceCodingContext | undefined => {
  for (const message of messages) {
    const workContext = Array.isArray(message.content?.workContext) ? message.content.workContext : [];
    for (const item of workContext) {
      if (item?.type !== 'code-workspace') {
        continue;
      }
      const content = item.content;
      const contentRecord = content && typeof content === 'object' && !Array.isArray(content) ? content : undefined;
      const contentSurfaceId =
        contentRecord && 'surfaceId' in contentRecord && typeof contentRecord.surfaceId === 'string'
          ? contentRecord.surfaceId
          : undefined;
      const itemSurfaceId = typeof item.uid === 'string' && item.uid ? item.uid : undefined;
      if (
        (contentSurfaceId && itemSurfaceId && contentSurfaceId !== itemSurfaceId) ||
        (!contentSurfaceId && !itemSurfaceId)
      ) {
        continue;
      }
      const surfaceId = contentSurfaceId || itemSurfaceId;
      if (!surfaceId) {
        continue;
      }
      const kind =
        contentRecord && 'kind' in contentRecord && typeof contentRecord.kind === 'string' && contentRecord.kind
          ? contentRecord.kind
          : 'code-workspace';
      const contentTitle =
        contentRecord && 'title' in contentRecord && typeof contentRecord.title === 'string'
          ? contentRecord.title
          : undefined;
      const title = (typeof item.title === 'string' && item.title) || contentTitle || surfaceId;
      const target = parseWorkspaceCodingTargetMetadata({ type: 'workspace', surfaceId, kind, title });
      if (target) {
        return createRestoredWorkspaceCodingContext(target);
      }
    }
  }
  return undefined;
};

export const restoreSessionWorkspaceCodingTargetFromMetadata = (
  sessionId: string,
  applicationKey: string,
  metadata: unknown,
): boolean => {
  const target = parseWorkspaceCodingTargetMetadata(metadata);
  if (!target) {
    return false;
  }
  const restoredWorkspace = createRestoredWorkspaceCodingContext(target);
  useChatMessagesStore
    .getState()
    .restoreSessionWorkspaceCodingTarget(
      sessionId,
      { ...restoredWorkspace.target, applicationKey },
      restoredWorkspace.item,
    );
  return true;
};

export const restoreSessionWorkspaceCodingTargetFromMessages = (
  sessionId: string,
  applicationKey: string,
  messages: Message[],
): boolean => {
  const restoredWorkspace = findWorkspaceCodingContext(messages);
  if (!restoredWorkspace) {
    return false;
  }
  useChatMessagesStore
    .getState()
    .restoreSessionWorkspaceCodingTarget(
      sessionId,
      { ...restoredWorkspace.target, applicationKey },
      restoredWorkspace.item,
    );
  return true;
};

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
  registerEditorRef: (applicationKey: string, uid: string, editorRef: ChatEditorRef) => () => void;
  bindSessionCodingTarget: (
    sessionId: string | undefined,
    target: ChatCodingTarget,
    flowContext?: unknown,
  ) => ChatCodingTargetBindingResult;
  restoreSessionWorkspaceCodingTarget: (
    sessionId: string,
    target: WorkspaceChatCodingTarget,
    item: ContextItem,
  ) => void;
  setSessionFlowContext: (sessionId: string | undefined, flowContext: unknown) => void;

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

export const useChatMessagesStore = getOrCreateGlobalStore('@nocobase/plugin-ai/chat-messages-store', () =>
  createObservableStore<ChatMessagesState & ChatMessagesActions>((set, get) => {
    const defaultSession = createInitialSessionState();

    return {
      sessions: {
        [CHAT_DEFAULT_SESSION_KEY]: defaultSession,
      },
      editorRef: {},

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

      registerEditorRef: (applicationKey, uid, editorRef) => {
        set((state) => ({
          editorRef: {
            ...state.editorRef,
            [applicationKey]: {
              ...state.editorRef[applicationKey],
              [uid]: editorRef,
            },
          },
        }));
        let registered = true;
        return () => {
          if (!registered) {
            return;
          }
          registered = false;
          set((state) => {
            const applicationEditors = state.editorRef[applicationKey];
            if (applicationEditors?.[uid] !== editorRef) {
              return state;
            }
            const nextApplicationEditors = { ...applicationEditors };
            delete nextApplicationEditors[uid];
            const nextEditorRef = { ...state.editorRef };
            if (Object.keys(nextApplicationEditors).length) {
              nextEditorRef[applicationKey] = nextApplicationEditors;
            } else {
              delete nextEditorRef[applicationKey];
            }
            return { editorRef: nextEditorRef };
          });
        };
      },

      bindSessionCodingTarget: (sessionId, target, flowContext) => {
        const session = resolveSessionState(get(), sessionId);
        const currentTarget = session.codingTarget;
        if (currentTarget && !isSameCodingTarget(currentTarget, target)) {
          set((state) =>
            updateSessionState(state, sessionId, (currentSession) => ({
              ...currentSession,
              codingTargetMismatch: target,
            })),
          );
          return { status: 'mismatch', target: currentTarget, requestedTarget: target };
        }

        set((state) =>
          updateSessionState(state, sessionId, (currentSession) => ({
            ...currentSession,
            codingTarget: target,
            codingTargetMismatch: undefined,
            currentEditorRefUid: target.type === 'single-file' ? target.editorUid : undefined,
            flowContext,
          })),
        );
        return { status: currentTarget ? 'already-bound' : 'bound', target };
      },

      restoreSessionWorkspaceCodingTarget: (sessionId, target, item) =>
        set((state) =>
          updateSessionState(state, sessionId, (session) => ({
            ...session,
            codingTarget: target,
            codingTargetMismatch: undefined,
            currentEditorRefUid: undefined,
            flowContext: undefined,
            contextItems: [
              ...session.contextItems.filter(
                (contextItem) => contextItem.type !== 'code-workspace' && contextItem.type !== 'code-editor',
              ),
              item,
            ],
          })),
        ),

      setSessionWebSearching: (sessionId, webSearching) =>
        set((state) =>
          updateSessionState(state, sessionId, (session) => ({
            ...session,
            webSearching,
          })),
        ),

      setSessionFlowContext: (sessionId, flowContext) =>
        set((state) =>
          updateSessionState(state, sessionId, (session) => ({
            ...session,
            flowContext,
          })),
        ),

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
