/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { create } from 'zustand';
import { Conversation } from '../../types';
import { createSelectors } from './create-selectors';

interface ChatConversationsState {
  currentConversation?: string;
  conversations: Conversation[];
  keyword: string;
  webSearch: boolean;
}

interface ChatConversationsActions {
  setCurrentConversation: (id: string | undefined) => void;
  setKeyword: (keyword: string) => void;
  setConversations: (conversations: Conversation[] | ((prev: Conversation[]) => Conversation[])) => void;
  setWebSearch: (webSearch: boolean) => void;
}

const store = create<ChatConversationsState & ChatConversationsActions>((set) => ({
  currentConversation: undefined,
  conversations: [],
  keyword: '',
  webSearch: false,

  setCurrentConversation: (id) => set({ currentConversation: id }),
  setKeyword: (keyword) => set({ keyword }),
  setConversations: (conversations) =>
    set((state) => ({
      conversations: typeof conversations === 'function' ? conversations(state.conversations) : conversations,
    })),
  setWebSearch: (webSearch) => set({ webSearch }),
}));

export const useChatConversationsStore = createSelectors(store);
