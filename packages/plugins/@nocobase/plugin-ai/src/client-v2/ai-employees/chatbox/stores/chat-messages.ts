/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { action, define, observable, randomId } from '@nocobase/flow-engine';
import type { Attachment, ChatEditorRef, ContextItem, Message, SkillSettings, WebSearching } from '../../types';

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
  abortController?: AbortController | null;
  skillSettings?: SkillSettings | null;
  webSearching?: WebSearching | null;
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

type SessionStateUpdater<T> = T | ((prev: T) => T);

const createInitialSessionState = (): ChatSessionState => ({
  ...CHAT_EMPTY_SESSION_STATE,
});

const createObservableSessionState = (state?: Partial<ChatSessionState>): ChatSessionState =>
  observable.shallow({
    ...createInitialSessionState(),
    ...(state ?? {}),
  });

const cloneSessionState = (session: ChatSessionState): ChatSessionState => ({
  ...session,
  messages: [...session.messages],
  messagesMeta: { ...session.messagesMeta },
  attachments: [...session.attachments],
  contextItems: [...session.contextItems],
});

export class ChatMessageModel {
  sessions: Record<string, ChatSessionState> = observable.shallow({
    [CHAT_DEFAULT_SESSION_KEY]: createObservableSessionState(),
  });
  editorRef: Record<string, ChatEditorRef | null> = observable.shallow({});
  currentEditorRefUid: string | null | undefined = null;
  flowContext: unknown = null;

  constructor() {
    define(this, {
      sessions: observable.shallow,
      editorRef: observable.shallow,
      currentEditorRefUid: observable.ref,
      flowContext: observable.ref,
      setEditorRef: action,
      unregisterEditorRef: action,
      setCurrentEditorRefUid: action,
      setFlowContext: action,
      resetSessionState: action,
      migrateSessionState: action,
      setSessionMessages: action,
      setSessionMessagesLoading: action,
      setSessionMessagesError: action,
      setSessionMessagesMeta: action,
      setSessionAttachments: action,
      setSessionContextItems: action,
      setSessionSystemMessage: action,
      setSessionResponseLoading: action,
      setSessionBackgroundWorking: action,
      setSessionResumeStreamFailed: action,
      addSessionMessage: action,
      addSessionMessages: action,
      updateSessionLastMessage: action,
      removeSessionMessage: action,
      addSessionAttachments: action,
      removeSessionAttachment: action,
      addSessionContextItems: action,
      addContextItems: action,
      removeSessionContextItem: action,
      setSessionAbortController: action,
      setSessionSkillSettings: action,
      setSessionWebSearching: action,
      addSessionSubAgentMessage: action,
      addSessionSubAgentMessages: action,
      updateSessionLastSubAgentMessage: action,
      updateSessionSubAgentConversationStatus: action,
    });
  }

  private resolveSessionState(sessionId?: string) {
    return this.sessions[getChatSessionKey(sessionId)] ?? createObservableSessionState();
  }

  private ensureSessionState(sessionId?: string) {
    const key = getChatSessionKey(sessionId);
    const session = this.sessions[key];
    if (session) {
      return session;
    }

    const nextSession = createObservableSessionState();
    this.sessions = {
      ...this.sessions,
      [key]: nextSession,
    };
    return nextSession;
  }

  private updateSessionState(sessionId: string | undefined, updater: (session: ChatSessionState) => ChatSessionState) {
    const session = this.ensureSessionState(sessionId);
    Object.assign(session, updater(session));
  }

  setEditorRef = (uid: string, editorRef: ChatEditorRef | null) => {
    this.editorRef = { ...this.editorRef, [uid]: editorRef };
  };

  unregisterEditorRef = (uid: string, editorRef: ChatEditorRef) => {
    if (this.editorRef[uid] !== editorRef) {
      return;
    }
    this.editorRef = { ...this.editorRef, [uid]: null };
    if (this.currentEditorRefUid === uid) {
      this.currentEditorRefUid = null;
    }
  };

  setCurrentEditorRefUid = (uid: string | null | undefined) => {
    this.currentEditorRefUid = uid;
  };

  setFlowContext = (flowContext: unknown) => {
    this.flowContext = flowContext;
  };

  getSessionState = (sessionId?: string) => cloneSessionState(this.resolveSessionState(sessionId));

  resetSessionState = (sessionId?: string, patch?: Partial<ChatSessionState>) => {
    this.updateSessionState(sessionId, () => ({
      ...createInitialSessionState(),
      ...(patch ?? {}),
    }));
  };

  migrateSessionState = (fromSessionId: string | undefined, toSessionId: string) => {
    const fromKey = getChatSessionKey(fromSessionId);
    const toKey = getChatSessionKey(toSessionId);
    if (fromKey === toKey) {
      return;
    }

    const sourceSession = this.resolveSessionState(fromKey);
    const nextSessions = { ...this.sessions, [toKey]: createObservableSessionState(cloneSessionState(sourceSession)) };
    if (fromKey === CHAT_DEFAULT_SESSION_KEY) {
      nextSessions[CHAT_DEFAULT_SESSION_KEY] = createObservableSessionState();
      this.sessions = nextSessions;
      return;
    }

    delete nextSessions[fromKey];
    this.sessions = nextSessions;
  };

  setSessionMessages = (sessionId: string | undefined, messages: SessionStateUpdater<Message[]>) => {
    this.updateSessionState(sessionId, (session) => ({
      ...session,
      messages: typeof messages === 'function' ? messages(session.messages) : messages,
    }));
  };

  setSessionMessagesLoading = (sessionId: string | undefined, loading: boolean) => {
    this.updateSessionState(sessionId, (session) => ({
      ...session,
      messagesLoading: loading,
    }));
  };

  setSessionMessagesError = (sessionId: string | undefined, error: unknown) => {
    this.updateSessionState(sessionId, (session) => ({
      ...session,
      messagesError: error,
    }));
  };

  setSessionMessagesMeta = (
    sessionId: string | undefined,
    meta:
      | ChatSessionState['messagesMeta']
      | ((prev: ChatSessionState['messagesMeta']) => ChatSessionState['messagesMeta']),
  ) => {
    this.updateSessionState(sessionId, (session) => ({
      ...session,
      messagesMeta: typeof meta === 'function' ? meta(session.messagesMeta) : meta,
    }));
  };

  setSessionAttachments = (sessionId: string | undefined, attachments: SessionStateUpdater<Attachment[]>) => {
    this.updateSessionState(sessionId, (session) => ({
      ...session,
      attachments: typeof attachments === 'function' ? attachments(session.attachments) : attachments,
    }));
  };

  setSessionContextItems = (sessionId: string | undefined, items: SessionStateUpdater<ContextItem[]>) => {
    this.updateSessionState(sessionId, (session) => ({
      ...session,
      contextItems: typeof items === 'function' ? items(session.contextItems) : items,
    }));
  };

  setSessionSystemMessage = (sessionId: string | undefined, msg: string | ((prev: string) => string)) => {
    this.updateSessionState(sessionId, (session) => ({
      ...session,
      systemMessage: typeof msg === 'function' ? msg(session.systemMessage) : msg,
    }));
  };

  setSessionResponseLoading = (sessionId: string | undefined, loading: boolean) => {
    this.updateSessionState(sessionId, (session) => ({
      ...session,
      responseLoading: loading,
    }));
  };

  setSessionBackgroundWorking = (sessionId: string | undefined, backgroundWorking: boolean) => {
    this.updateSessionState(sessionId, (session) => ({
      ...session,
      backgroundWorking,
    }));
  };

  setSessionResumeStreamFailed = (sessionId: string | undefined, resumeStreamFailed: boolean) => {
    this.updateSessionState(sessionId, (session) => ({
      ...session,
      resumeStreamFailed,
    }));
  };

  addSessionMessage = (sessionId: string | undefined, message: Message) => {
    this.updateSessionState(sessionId, (session) => ({
      ...session,
      messages: [...session.messages, message],
    }));
  };

  addSessionMessages = (sessionId: string | undefined, msgs: Message[]) => {
    this.updateSessionState(sessionId, (session) => ({
      ...session,
      messages: [...session.messages, ...msgs],
    }));
  };

  updateSessionLastMessage = (sessionId: string | undefined, updater: (msg: Message) => Message) => {
    this.updateSessionState(sessionId, (session) => {
      const messages = [...session.messages];
      const index = messages.length - 1;
      if (index >= 0) {
        messages[index] = updater(messages[index]);
      }
      return {
        ...session,
        messages,
      };
    });
  };

  removeSessionMessage = (sessionId: string | undefined, key: string) => {
    this.updateSessionState(sessionId, (session) => ({
      ...session,
      messages: session.messages.filter((msg) => msg.key !== key),
    }));
  };

  addSessionAttachments = (sessionId: string | undefined, attachments: Attachment | Attachment[]) => {
    this.updateSessionState(sessionId, (session) => ({
      ...session,
      attachments: Array.isArray(attachments)
        ? [...session.attachments, ...attachments]
        : [...session.attachments, attachments],
    }));
  };

  removeSessionAttachment = (sessionId: string | undefined, filename: string) => {
    this.updateSessionState(sessionId, (session) => ({
      ...session,
      attachments: session.attachments.filter((attachment) => attachment.filename !== filename),
    }));
  };

  addSessionContextItems = (sessionId: string | undefined, items: ContextItem | ContextItem[]) => {
    const nextItems = Array.isArray(items) ? items : [items];
    this.updateSessionState(sessionId, (session) => {
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
    });
  };

  addContextItems = (items: ContextItem | ContextItem[]) => {
    this.addSessionContextItems(undefined, items);
  };

  removeSessionContextItem = (sessionId: string | undefined, type: string, uid: string) => {
    this.updateSessionState(sessionId, (session) => ({
      ...session,
      contextItems: session.contextItems.filter((item) => !(item.type === type && item.uid === uid)),
    }));
  };

  setSessionAbortController = (sessionId: string | undefined, controller: AbortController | undefined | null) => {
    this.updateSessionState(sessionId, (session) => ({
      ...session,
      abortController: controller,
    }));
  };

  setSessionSkillSettings = (sessionId: string | undefined, settings: SkillSettings | undefined | null) => {
    this.updateSessionState(sessionId, (session) => ({
      ...session,
      skillSettings: settings,
    }));
  };

  setSessionWebSearching = (sessionId: string | undefined, webSearching: WebSearching | null | undefined) => {
    this.updateSessionState(sessionId, (session) => ({
      ...session,
      webSearching,
    }));
  };

  addSessionSubAgentMessage = (sessionId: string | undefined, subSessionId: string, msg: Message) => {
    this.addSessionSubAgentMessages(sessionId, subSessionId, [msg]);
  };

  addSessionSubAgentMessages = (sessionId: string | undefined, subSessionId: string, msgs: Message[]) => {
    this.updateSessionLastMessage(sessionId, (last) => ({
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
  };

  updateSessionLastSubAgentMessage = (
    sessionId: string | undefined,
    subSessionId: string,
    username: string,
    updater: (msg: Message) => Message,
  ) => {
    this.updateSessionLastMessage(sessionId, (last) => ({
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
  };

  updateSessionSubAgentConversationStatus = (
    sessionId: string | undefined,
    subSessionId: string,
    status: 'pending' | 'completed',
  ) => {
    this.updateSessionLastMessage(sessionId, (last) => ({
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
  };
}
