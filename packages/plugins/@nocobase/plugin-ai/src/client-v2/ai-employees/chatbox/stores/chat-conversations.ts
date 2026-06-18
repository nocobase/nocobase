/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Conversation } from '../../types';
import { createObservableStore, createSelectors } from './create-selectors';
import { getOrCreateGlobalStore } from './global-store';

interface ChatConversationsState {
  currentConversation?: string;
  conversations: Conversation[];
  keyword: string;
  webSearch: boolean;
  conversationSegmented: string;
  unreadCount: number;
}

interface ChatConversationsActions {
  setCurrentConversation: (id: string | undefined) => void;
  setKeyword: (keyword: string) => void;
  setConversations: (conversations: Conversation[] | ((prev: Conversation[]) => Conversation[])) => void;
  markConversationRead: (sessionId: string) => void;
  setWebSearch: (webSearch: boolean) => void;
  setConversationSegmented: (conversationSegmented: string) => void;
  setUnreadCount: (unreadCount: number | ((prev: number) => number)) => void;
}

const store = getOrCreateGlobalStore('@nocobase/plugin-ai/chat-conversations-store', () =>
  createObservableStore<ChatConversationsState & ChatConversationsActions>((set) => ({
    currentConversation: undefined,
    conversations: [],
    keyword: '',
    webSearch: false,
    conversationSegmented: 'conversations',
    unreadCount: 0,

    setCurrentConversation: (id) => set({ currentConversation: id }),
    setKeyword: (keyword) => set({ keyword }),
    setConversations: (conversations) =>
      set((state) => ({
        conversations: typeof conversations === 'function' ? conversations(state.conversations) : conversations,
      })),
    markConversationRead: (sessionId) =>
      set((state) => {
        const target = state.conversations.find((item) => item.sessionId === sessionId);
        if (!target || target.read) {
          return {
            conversations: state.conversations,
            unreadCount: state.unreadCount,
          };
        }
        return {
          conversations: state.conversations.map((item) =>
            item.sessionId === sessionId
              ? {
                  ...item,
                  read: true,
                }
              : item,
          ),
          unreadCount: Math.max(0, state.unreadCount - 1),
        };
      }),
    setWebSearch: (webSearch) => set({ webSearch }),
    setConversationSegmented: (conversationSegmented) => set({ conversationSegmented }),
    setUnreadCount: (unreadCount) =>
      set((state) => ({
        unreadCount: typeof unreadCount === 'function' ? unreadCount(state.unreadCount) : unreadCount,
      })),
  })),
);

export const useChatConversationsStore = createSelectors(store);
