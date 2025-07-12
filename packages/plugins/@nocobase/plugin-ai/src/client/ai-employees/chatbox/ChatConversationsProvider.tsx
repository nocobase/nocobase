/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useAPIClient, useRequest } from '@nocobase/client';
import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import { Conversation } from '../types';
import { useLoadMoreObserver } from './useLoadMoreObserver';

type ChatConversationContextValue = {
  currentConversation?: string;
  setCurrentConversation: React.Dispatch<React.SetStateAction<string | undefined>>;
  conversationsService: any;
  lastConversationRef: (node: HTMLDivElement | null) => void;
  conversations: Conversation[];
  keyword: string;
  setKeyword: React.Dispatch<React.SetStateAction<string>>;
};

export const ChatConversationsContext = createContext<ChatConversationContextValue | null>(null);

export const useChatConversations = () => useContext(ChatConversationsContext);

export const ChatConversationsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const api = useAPIClient();
  const [currentConversation, setCurrentConversation] = useState<string>();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [keyword, setKeyword] = useState<string>('');

  const conversationsService = useRequest<Conversation[]>(
    (page = 1, keyword = '') =>
      api
        .resource('aiConversations')
        .list({
          sort: ['-updatedAt'],
          appends: ['aiEmployee'],
          page,
          pageSize: 15,
          filter: keyword ? { title: { $includes: keyword } } : {},
        })
        .then((res) => res?.data),
    {
      manual: true,
      onSuccess: (data, params) => {
        const page = params[0];
        if (!data?.data) {
          return;
        }
        if (!page || page === 1) {
          setConversations(data.data);
        } else {
          setConversations((prev) => [...prev, ...data.data]);
        }
      },
    },
  );
  const conversationsServiceRef = useRef<any>();
  conversationsServiceRef.current = conversationsService;
  const loadMoreConversations = useCallback(async () => {
    const conversationsService = conversationsServiceRef.current;
    const meta = conversationsService.data?.meta;
    if (conversationsService.loading || (meta && meta.page >= meta.totalPage)) {
      return;
    }
    await conversationsService.runAsync(meta.page + 1, keyword);
  }, [keyword]);
  const { ref: lastConversationRef } = useLoadMoreObserver({ loadMore: loadMoreConversations });

  const value = {
    currentConversation,
    setCurrentConversation,
    conversationsService,
    lastConversationRef,
    conversations,
    keyword,
    setKeyword,
  };

  return <ChatConversationsContext.Provider value={value}>{children}</ChatConversationsContext.Provider>;
};
