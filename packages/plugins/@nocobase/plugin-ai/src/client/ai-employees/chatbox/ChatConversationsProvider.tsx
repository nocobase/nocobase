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
  setCurrentConversation: (sessionId?: string) => void;
  conversationsService: any;
  lastConversationRef: (node: HTMLDivElement | null) => void;
  conversations: Conversation[];
};

export const ChatConversationsContext = createContext<ChatConversationContextValue | null>(null);

export const useChatConversations = () => useContext(ChatConversationsContext);

export const ChatConversationsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const api = useAPIClient();
  const [currentConversation, setCurrentConversation] = useState<string>();
  const [conversations, setConversations] = useState<Conversation[]>([]);

  const conversationsService = useRequest<Conversation[]>(
    (page = 1) =>
      api
        .resource('aiConversations')
        .list({
          sort: ['-updatedAt'],
          appends: ['aiEmployee'],
          page,
          pageSize: 15,
        })
        .then((res) => res?.data),
    {
      manual: true,
      onSuccess: (data, params) => {
        const page = params[0];
        if (!data?.data?.length) {
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
    await conversationsService.runAsync(meta.page + 1);
  }, []);
  const { ref: lastConversationRef } = useLoadMoreObserver({ loadMore: loadMoreConversations });

  const value = {
    currentConversation,
    setCurrentConversation,
    conversationsService,
    lastConversationRef,
    conversations,
  };

  return <ChatConversationsContext.Provider value={value}>{children}</ChatConversationsContext.Provider>;
};
