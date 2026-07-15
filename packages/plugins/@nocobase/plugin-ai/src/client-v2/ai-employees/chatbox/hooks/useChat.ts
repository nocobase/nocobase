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
  ChatMessageModel,
  ChatSessionState,
  getChatSessionKey,
} from '../stores/chat-messages';
import { useChatBoxRuntime } from '../stores/runtime';

const selectSessionState = (model: ChatMessageModel, sessionId?: string) =>
  model.sessions[getChatSessionKey(sessionId)] ?? CHAT_EMPTY_SESSION_STATE;

type MessagesMeta = ChatSessionState['messagesMeta'];

const createChatFacade = (chatMessageModel: ChatMessageModel, sessionId?: string) => {
  const sessionKey = getChatSessionKey(sessionId);
  const actions = {
    setMessages: (messages: Message[] | ((prev: Message[]) => Message[])) =>
      chatMessageModel.setSessionMessages(sessionKey, messages),
    setMessagesLoading: (loading: boolean) => chatMessageModel.setSessionMessagesLoading(sessionKey, loading),
    setMessagesError: (error: unknown) => chatMessageModel.setSessionMessagesError(sessionKey, error),
    setMessagesMeta: (meta: MessagesMeta | ((prev: MessagesMeta) => MessagesMeta)) =>
      chatMessageModel.setSessionMessagesMeta(sessionKey, meta),
    setAttachments: (attachments: Attachment[] | ((prev: Attachment[]) => Attachment[])) =>
      chatMessageModel.setSessionAttachments(sessionKey, attachments),
    setContextItems: (items: ContextItem[] | ((prev: ContextItem[]) => ContextItem[])) =>
      chatMessageModel.setSessionContextItems(sessionKey, items),
    setSystemMessage: (msg: string | ((prev: string) => string)) =>
      chatMessageModel.setSessionSystemMessage(sessionKey, msg),
    setResponseLoading: (loading: boolean) => chatMessageModel.setSessionResponseLoading(sessionKey, loading),
    setBackgroundWorking: (backgroundWorking: boolean) =>
      chatMessageModel.setSessionBackgroundWorking(sessionKey, backgroundWorking),
    setResumeStreamFailed: (resumeStreamFailed: boolean) =>
      chatMessageModel.setSessionResumeStreamFailed(sessionKey, resumeStreamFailed),
    addMessage: (msg: Message) => chatMessageModel.addSessionMessage(sessionKey, msg),
    addMessages: (msgs: Message[]) => chatMessageModel.addSessionMessages(sessionKey, msgs),
    updateLastMessage: (updater: (msg: Message) => Message) =>
      chatMessageModel.updateSessionLastMessage(sessionKey, updater),
    removeMessage: (key: string) => chatMessageModel.removeSessionMessage(sessionKey, key),
    addAttachments: (attachments: Attachment | Attachment[]) =>
      chatMessageModel.addSessionAttachments(sessionKey, attachments),
    removeAttachment: (filename: string) => chatMessageModel.removeSessionAttachment(sessionKey, filename),
    addContextItems: (items: ContextItem | ContextItem[]) => chatMessageModel.addSessionContextItems(sessionKey, items),
    removeContextItem: (type: string, uid: string) => chatMessageModel.removeSessionContextItem(sessionKey, type, uid),
    setAbortController: (controller: AbortController | undefined | null) =>
      chatMessageModel.setSessionAbortController(sessionKey, controller),
    setSkillSettings: (settings: SkillSettings | undefined) =>
      chatMessageModel.setSessionSkillSettings(sessionKey, settings),
    setWebSearching: (webSearching: WebSearching | null | undefined) =>
      chatMessageModel.setSessionWebSearching(sessionKey, webSearching),
    addSubAgentMessage: (subSessionId: string, msg: Message) =>
      chatMessageModel.addSessionSubAgentMessage(sessionKey, subSessionId, msg),
    addSubAgentMessages: (subSessionId: string, msgs: Message[]) =>
      chatMessageModel.addSessionSubAgentMessages(sessionKey, subSessionId, msgs),
    updateLastSubAgentMessage: (subSessionId: string, username: string, updater: (msg: Message) => Message) =>
      chatMessageModel.updateSessionLastSubAgentMessage(sessionKey, subSessionId, username, updater),
    updateSubAgentConversationStatus: (subSessionId: string, status: 'pending' | 'completed') =>
      chatMessageModel.updateSessionSubAgentConversationStatus(sessionKey, subSessionId, status),
    setEditorRef: (uid: string, editorRef: ChatEditorRef | null) => chatMessageModel.setEditorRef(uid, editorRef),
    setCurrentEditorRefUid: (uid: string) => chatMessageModel.setCurrentEditorRefUid(uid),
    setFlowContext: (flowContext: unknown) => chatMessageModel.setFlowContext(flowContext),
    migrateSessionState: (toSessionId: string) => chatMessageModel.migrateSessionState(sessionKey, toSessionId),
    resetSessionState: (patch?: Partial<ChatSessionState>) => chatMessageModel.resetSessionState(sessionKey, patch),
  };

  return {
    sessionKey,
    for: (targetSessionId?: string) => createChatFacade(chatMessageModel, targetSessionId),
    ...actions,
    use: {
      messages: function useMessages() {
        return selectSessionState(chatMessageModel, sessionKey).messages;
      },
      messagesLoading: function useMessagesLoading() {
        return selectSessionState(chatMessageModel, sessionKey).messagesLoading;
      },
      messagesError: function useMessagesError() {
        return selectSessionState(chatMessageModel, sessionKey).messagesError;
      },
      messagesMeta: function useMessagesMeta() {
        return selectSessionState(chatMessageModel, sessionKey).messagesMeta;
      },
      attachments: function useAttachments() {
        return selectSessionState(chatMessageModel, sessionKey).attachments;
      },
      contextItems: function useContextItems() {
        return selectSessionState(chatMessageModel, sessionKey).contextItems;
      },
      systemMessage: function useSystemMessage() {
        return selectSessionState(chatMessageModel, sessionKey).systemMessage;
      },
      responseLoading: function useResponseLoading() {
        return selectSessionState(chatMessageModel, sessionKey).responseLoading;
      },
      backgroundWorking: function useBackgroundWorking() {
        return selectSessionState(chatMessageModel, sessionKey).backgroundWorking;
      },
      resumeStreamFailed: function useResumeStreamFailed() {
        return selectSessionState(chatMessageModel, sessionKey).resumeStreamFailed;
      },
      abortController: function useAbortController() {
        return selectSessionState(chatMessageModel, sessionKey).abortController;
      },
      skillSettings: function useSkillSettings() {
        return selectSessionState(chatMessageModel, sessionKey).skillSettings;
      },
      webSearching: function useWebSearching() {
        return selectSessionState(chatMessageModel, sessionKey).webSearching;
      },

      editorRef: function useEditorRef() {
        return chatMessageModel.editorRef;
      },
      currentEditorRefUid: function useCurrentEditorRefUid() {
        return chatMessageModel.currentEditorRefUid;
      },
      flowContext: function useFlowContext() {
        return chatMessageModel.flowContext;
      },
    },
    getState: () => {
      const sessionState = chatMessageModel.getSessionState(sessionKey);
      return {
        ...sessionState,
        editorRef: chatMessageModel.editorRef,
        currentEditorRefUid: chatMessageModel.currentEditorRefUid,
        flowContext: chatMessageModel.flowContext,
        ...actions,
      };
    },
  };
};

export const useChat = (sessionId?: string) => {
  const { chatMessageModel } = useChatBoxRuntime();
  const sessionKey = getChatSessionKey(sessionId);
  return useMemo(() => createChatFacade(chatMessageModel, sessionKey), [chatMessageModel, sessionKey]);
};
