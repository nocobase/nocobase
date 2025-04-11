/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useAPIClient, useRequest } from '@nocobase/client';
import React, { createContext, useContext, useState } from 'react';
import { Conversation } from '../types';

type ChatConversationContextValue = {
  currentConversation?: string;
  setCurrentConversation: (sessionId?: string) => void;
  conversationsService: any;
};

export const ChatConversationsContext = createContext<ChatConversationContextValue | null>(null);

export const useChatConversations = () => useContext(ChatConversationsContext);

export const ChatConversationsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const api = useAPIClient();
  const [currentConversation, setCurrentConversation] = useState<string>();

  const conversationsService = useRequest<Conversation[]>(
    () =>
      api
        .resource('aiConversations')
        .list({
          sort: ['-updatedAt'],
          appends: ['aiEmployee'],
        })
        .then((res) => res?.data?.data),
    {
      manual: true,
    },
  );

  const value = {
    currentConversation,
    setCurrentConversation,
    conversationsService,
  };

  return <ChatConversationsContext.Provider value={value}>{children}</ChatConversationsContext.Provider>;
};
