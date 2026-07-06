/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { useChatBoxStore } from '../chat-box';
import { useChatConversationsStore } from '../chat-conversations';
import { CHAT_DEFAULT_SESSION_KEY, CHAT_EMPTY_SESSION_STATE, useChatMessagesStore } from '../chat-messages';

const resetStores = () => {
  useChatBoxStore.setState({
    open: false,
    expanded: false,
    collapsed: false,
    showConversations: false,
    minimize: false,
    currentEmployee: null,
    senderValue: '',
    senderPlaceholder: '',
    taskVariables: {},
    roles: {},
    isEditingMessage: false,
    editingMessageId: null,
    chatBoxRef: { current: null },
    senderRef: { current: null },
    showCodeHistory: false,
    model: null,
    showDebugPanel: false,
    readonly: false,
    isShowSenderHint: false,
  });
  useChatConversationsStore.setState({
    currentConversation: undefined,
    conversations: [],
    keyword: '',
    webSearch: false,
    conversationSegmented: 'conversations',
    unreadCount: 0,
  });
  useChatMessagesStore.setState({
    sessions: {
      [CHAT_DEFAULT_SESSION_KEY]: { ...CHAT_EMPTY_SESSION_STATE, messages: [], attachments: [], contextItems: [] },
    },
    editorRef: {},
    currentEditorRefUid: null,
    flowContext: null,
  });
};

afterEach(() => {
  resetStores();
});

describe('observable chatbox store facade', () => {
  it('keeps action references stable when state changes', () => {
    const setOpen = useChatBoxStore.getState().setOpen;
    const setConversations = useChatConversationsStore.getState().setConversations;
    const addSessionMessage = useChatMessagesStore.getState().addSessionMessage;

    useChatBoxStore.getState().setOpen(true);
    useChatConversationsStore.getState().setConversations([]);
    useChatMessagesStore.getState().setSessionMessages(undefined, []);

    expect(useChatBoxStore.getState().setOpen).toBe(setOpen);
    expect(useChatConversationsStore.getState().setConversations).toBe(setConversations);
    expect(useChatMessagesStore.getState().addSessionMessage).toBe(addSessionMessage);
  });

  it('rerenders selector hooks after action updates', () => {
    const { result } = renderHook(() => useChatBoxStore.use.open());

    expect(result.current).toBe(false);

    act(() => {
      useChatBoxStore.getState().setOpen(true);
    });

    expect(result.current).toBe(true);
  });

  it('restores a previous getState snapshot with replace setState', () => {
    const previousState = useChatMessagesStore.getState();

    useChatMessagesStore.getState().setSessionMessages(undefined, [
      {
        key: 'message-1',
        role: 'user',
        content: {
          type: 'text',
          content: 'hello',
        },
      },
    ]);

    expect(useChatMessagesStore.getState().getSessionState().messages).toHaveLength(1);

    useChatMessagesStore.setState(previousState, true);

    expect(useChatMessagesStore.getState().getSessionState().messages).toEqual([]);
  });
});
