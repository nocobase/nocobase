/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useMemo } from 'react';
import { Attachment, ChatEditorRef, ContextItem, Message, SkillSettings, WebSearching } from '../../types';
import {
  CHAT_EMPTY_SESSION_STATE,
  ChatSessionState,
  getChatSessionKey,
  useChatMessagesStore,
} from '../stores/chat-messages';

const selectSessionState = (state: ReturnType<typeof useChatMessagesStore.getState>, sessionId?: string) =>
  state.sessions[getChatSessionKey(sessionId)] ?? CHAT_EMPTY_SESSION_STATE;

type MessagesMeta = ChatSessionState['messagesMeta'];

const createChatFacade = (sessionId?: string) => {
  const sessionKey = getChatSessionKey(sessionId);
  const actions = {
    setMessages: (messages: Message[] | ((prev: Message[]) => Message[])) =>
      useChatMessagesStore.getState().setSessionMessages(sessionKey, messages),
    setMessagesLoading: (loading: boolean) =>
      useChatMessagesStore.getState().setSessionMessagesLoading(sessionKey, loading),
    setMessagesError: (error: unknown) => useChatMessagesStore.getState().setSessionMessagesError(sessionKey, error),
    setMessagesMeta: (meta: MessagesMeta | ((prev: MessagesMeta) => MessagesMeta)) =>
      useChatMessagesStore.getState().setSessionMessagesMeta(sessionKey, meta),
    setAttachments: (attachments: Attachment[] | ((prev: Attachment[]) => Attachment[])) =>
      useChatMessagesStore.getState().setSessionAttachments(sessionKey, attachments),
    setContextItems: (items: ContextItem[] | ((prev: ContextItem[]) => ContextItem[])) =>
      useChatMessagesStore.getState().setSessionContextItems(sessionKey, items),
    setSystemMessage: (msg: string | ((prev: string) => string)) =>
      useChatMessagesStore.getState().setSessionSystemMessage(sessionKey, msg),
    setResponseLoading: (loading: boolean) =>
      useChatMessagesStore.getState().setSessionResponseLoading(sessionKey, loading),
    setBackgroundWorking: (backgroundWorking: boolean) =>
      useChatMessagesStore.getState().setSessionBackgroundWorking(sessionKey, backgroundWorking),
    setResumeStreamFailed: (resumeStreamFailed: boolean) =>
      useChatMessagesStore.getState().setSessionResumeStreamFailed(sessionKey, resumeStreamFailed),
    addMessage: (msg: Message) => useChatMessagesStore.getState().addSessionMessage(sessionKey, msg),
    addMessages: (msgs: Message[]) => useChatMessagesStore.getState().addSessionMessages(sessionKey, msgs),
    updateLastMessage: (updater: (msg: Message) => Message) =>
      useChatMessagesStore.getState().updateSessionLastMessage(sessionKey, updater),
    removeMessage: (key: string) => useChatMessagesStore.getState().removeSessionMessage(sessionKey, key),
    addAttachments: (attachments: Attachment | Attachment[]) =>
      useChatMessagesStore.getState().addSessionAttachments(sessionKey, attachments),
    removeAttachment: (filename: string) =>
      useChatMessagesStore.getState().removeSessionAttachment(sessionKey, filename),
    addContextItems: (items: ContextItem | ContextItem[]) =>
      useChatMessagesStore.getState().addSessionContextItems(sessionKey, items),
    removeContextItem: (type: string, uid: string) =>
      useChatMessagesStore.getState().removeSessionContextItem(sessionKey, type, uid),
    setAbortController: (controller: AbortController | undefined) =>
      useChatMessagesStore.getState().setSessionAbortController(sessionKey, controller),
    setSkillSettings: (settings: SkillSettings | undefined) =>
      useChatMessagesStore.getState().setSessionSkillSettings(sessionKey, settings),
    setWebSearching: (webSearching: WebSearching) =>
      useChatMessagesStore.getState().setSessionWebSearching(sessionKey, webSearching),
    addSubAgentMessage: (subSessionId: string, msg: Message) =>
      useChatMessagesStore.getState().addSessionSubAgentMessage(sessionKey, subSessionId, msg),
    addSubAgentMessages: (subSessionId: string, msgs: Message[]) =>
      useChatMessagesStore.getState().addSessionSubAgentMessages(sessionKey, subSessionId, msgs),
    updateLastSubAgentMessage: (subSessionId: string, username: string, updater: (msg: Message) => Message) =>
      useChatMessagesStore.getState().updateSessionLastSubAgentMessage(sessionKey, subSessionId, username, updater),
    updateSubAgentConversationStatus: (subSessionId: string, status: 'pending' | 'completed') =>
      useChatMessagesStore.getState().updateSessionSubAgentConversationStatus(sessionKey, subSessionId, status),
    setEditorRef: (uid: string, editorRef: ChatEditorRef) =>
      useChatMessagesStore.getState().setEditorRef(uid, editorRef),
    setCurrentEditorRefUid: (uid: string) => useChatMessagesStore.getState().setCurrentEditorRefUid(uid),
    setFlowContext: (flowContext: unknown) => useChatMessagesStore.getState().setFlowContext(flowContext),
    migrateSessionState: (toSessionId: string) =>
      useChatMessagesStore.getState().migrateSessionState(sessionKey, toSessionId),
    resetSessionState: (patch?: Partial<ChatSessionState>) =>
      useChatMessagesStore.getState().resetSessionState(sessionKey, patch),
  };

  return {
    sessionKey,
    for: (targetSessionId?: string) => createChatFacade(targetSessionId),
    ...actions,
    use: {
      messages: function useMessages() {
        return useChatMessagesStore((state) => selectSessionState(state, sessionKey).messages);
      },
      messagesLoading: function useMessagesLoading() {
        return useChatMessagesStore((state) => selectSessionState(state, sessionKey).messagesLoading);
      },
      messagesError: function useMessagesError() {
        return useChatMessagesStore((state) => selectSessionState(state, sessionKey).messagesError);
      },
      messagesMeta: function useMessagesMeta() {
        return useChatMessagesStore((state) => selectSessionState(state, sessionKey).messagesMeta);
      },
      attachments: function useAttachments() {
        return useChatMessagesStore((state) => selectSessionState(state, sessionKey).attachments);
      },
      contextItems: function useContextItems() {
        return useChatMessagesStore((state) => selectSessionState(state, sessionKey).contextItems);
      },
      systemMessage: function useSystemMessage() {
        return useChatMessagesStore((state) => selectSessionState(state, sessionKey).systemMessage);
      },
      responseLoading: function useResponseLoading() {
        return useChatMessagesStore((state) => selectSessionState(state, sessionKey).responseLoading);
      },
      backgroundWorking: function useBackgroundWorking() {
        return useChatMessagesStore((state) => selectSessionState(state, sessionKey).backgroundWorking);
      },
      resumeStreamFailed: function useResumeStreamFailed() {
        return useChatMessagesStore((state) => selectSessionState(state, sessionKey).resumeStreamFailed);
      },
      abortController: function useAbortController() {
        return useChatMessagesStore((state) => selectSessionState(state, sessionKey).abortController);
      },
      skillSettings: function useSkillSettings() {
        return useChatMessagesStore((state) => selectSessionState(state, sessionKey).skillSettings);
      },
      webSearching: function useWebSearching() {
        return useChatMessagesStore((state) => selectSessionState(state, sessionKey).webSearching);
      },

      editorRef: function useEditorRef() {
        return useChatMessagesStore.use.editorRef();
      },
      currentEditorRefUid: function useCurrentEditorRefUid() {
        return useChatMessagesStore.use.currentEditorRefUid();
      },
      flowContext: function useFlowContext() {
        return useChatMessagesStore.use.flowContext();
      },
    },
    getState: () => {
      const state = useChatMessagesStore.getState();
      const sessionState = state.getSessionState(sessionKey);
      return {
        ...sessionState,
        editorRef: state.editorRef,
        currentEditorRefUid: state.currentEditorRefUid,
        flowContext: state.flowContext,
        ...actions,
      };
    },
  };
};

export const useChat = (sessionId?: string) => {
  const sessionKey = getChatSessionKey(sessionId);
  return useMemo(() => createChatFacade(sessionKey), [sessionKey]);
};
