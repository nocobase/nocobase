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
import { ConversationsProps } from '@ant-design/x';

type ChatConversationContextValue = {
  currentConversation?: string;
  setCurrentConversation: (sessionId?: string) => void;
  conversationsService: any;
  lastConversationRef: (node: HTMLDivElement | null) => void;
  conversations: ConversationsProps['items'];
};

export const ChatConversationsContext = createContext<ChatConversationContextValue | null>(null);

export const useChatConversations = () => useContext(ChatConversationsContext);

export const ChatConversationsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const api = useAPIClient();
  const [currentConversation, setCurrentConversation] = useState<string>();
  const [conversations, setConversations] = useState<ConversationsProps['items']>([]);

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
        const conversations: ConversationsProps['items'] = data.data.map((conversation) => ({
          key: conversation.sessionId,
          label: conversation.title,
          timestamp: new Date(conversation.updatedAt).getTime(),
        }));
        if (!page || page === 1) {
          setConversations(conversations);
        } else {
          setConversations((prev) => [...prev, ...conversations]);
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
