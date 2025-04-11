/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createContext, useCallback, useContext, useEffect, useRef } from 'react';
import { Message, SendOptions } from '../types'; // 假设有这些类型定义
import React, { useState } from 'react';
import { uid } from '@formily/shared';
import { useT } from '../../locale';
import { useAPIClient, useRequest } from '@nocobase/client';
import { useChatConversations } from './ChatConversationsProvider';
import { useLoadMoreObserver } from './useLoadMoreObserver';

interface ChatMessagesContextValue {
  messages: Message[];
  responseLoading: boolean;
  addMessage: (message: Message) => void;
  addMessages: (messages: Message[]) => void;
  setMessages: (messages: Message[]) => void;
  sendMessages: (
    options: SendOptions & {
      onConversationCreate?: (sessionId: string) => void;
    },
  ) => Promise<void>;
  messagesService: any;
  lastMessageRef: React.RefObject<any>;
}

export const ChatMessagesContext = createContext<ChatMessagesContextValue | null>(null);

export const useChatMessages = () => useContext(ChatMessagesContext);

export const ChatMessagesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const t = useT();
  const api = useAPIClient();
  const [messages, setMessages] = useState<Message[]>([]);
  const [responseLoading, setResponseLoading] = useState(false);
  const { currentConversation } = useChatConversations();

  const addMessage = (message: Message) => {
    setMessages((prev) => [...prev, message]);
  };

  const addMessages = (newMessages: Message[]) => {
    setMessages((prev) => [...prev, ...newMessages]);
  };

  const updateLastMessage = (updater: (message: Message) => Message) => {
    setMessages((prev) => {
      const lastIndex = prev.length - 1;
      if (lastIndex < 0) return prev;
      const updated = [...prev];
      updated[lastIndex] = updater(updated[lastIndex]);
      return updated;
    });
  };

  const processStreamResponse = async (stream: any) => {
    const reader = stream.getReader();
    const decoder = new TextDecoder();
    let result = '';
    let error = false;

    // eslint-disable-next-line no-constant-condition
    while (true) {
      let content = '';
      const { done, value } = await reader.read();
      if (done || error) {
        setResponseLoading(false);
        break;
      }

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n').filter(Boolean);

      for (const line of lines) {
        try {
          const data = JSON.parse(line.replace(/^data: /, ''));
          if (data.body) content += data.body;
          if (data.type === 'error') error = true;
        } catch (e) {
          console.error('Error parsing stream data:', e);
        }
      }

      result += content;
      updateLastMessage((last) => ({
        ...last,
        content: {
          ...last.content,
          content: (last.content as any).content + content,
        },
        loading: false,
      }));
    }

    if (error) {
      updateLastMessage((last) => ({
        ...last,
        role: 'error',
        loading: false,
        content: {
          ...last.content,
          content: t(result),
        },
      }));
    }

    return { result, error };
  };

  const sendMessages = async ({
    sessionId,
    aiEmployee,
    messages: sendMsgs,
    infoFormValues,
    onConversationCreate,
  }: SendOptions & {
    onConversationCreate?: (sessionId: string) => void;
  }) => {
    const msgs: Message[] = [];
    if (!sendMsgs.length) return;

    if (infoFormValues) {
      msgs.push({
        key: uid(),
        role: aiEmployee.username,
        content: {
          type: 'info',
          content: infoFormValues,
        },
      });
    }

    msgs.push(
      ...sendMsgs.map((msg) => ({
        key: uid(),
        role: 'user',
        content: msg,
      })),
    );

    addMessages(msgs);

    if (!sessionId) {
      const createRes = await api.resource('aiConversations').create({
        values: { aiEmployee },
      });
      const conversation = createRes?.data?.data;
      if (!conversation) return;
      sessionId = conversation.sessionId;
      onConversationCreate?.(sessionId);
    }

    setResponseLoading(true);
    addMessage({
      key: uid(),
      role: aiEmployee.username,
      content: { type: 'text', content: '' },
      loading: true,
    });

    const sendRes = await api.request({
      url: 'aiConversations:sendMessages',
      method: 'POST',
      headers: { Accept: 'text/event-stream' },
      data: { aiEmployee: aiEmployee.username, sessionId, messages: msgs },
      responseType: 'stream',
      adapter: 'fetch',
    });

    if (!sendRes?.data) {
      setResponseLoading(false);
      return;
    }

    await processStreamResponse(sendRes.data);
  };

  const messagesService = useRequest<{
    data: Message[];
    meta: {
      cursor?: string;
      hasMore?: boolean;
    };
  }>(
    (cursor?: string) =>
      api
        .resource('aiConversations')
        .getMessages({
          sessionId: currentConversation,
          cursor,
        })
        .then((res) => res?.data),
    {
      manual: true,
      onSuccess: (data, params) => {
        const cursor = params[0];
        if (!data?.data?.length) {
          return;
        }
        const newMessages = [...data.data].reverse();

        setMessages((prev) => {
          return cursor ? [...newMessages, ...prev] : newMessages;
        });
      },
    },
  );
  const messagesServiceRef = useRef<any>();
  messagesServiceRef.current = messagesService;
  const loadMoreMessages = useCallback(async () => {
    const messagesService = messagesServiceRef.current;
    if (messagesService.loading || !messagesService.data?.meta?.hasMore) {
      return;
    }
    await messagesService.runAsync(messagesService.data?.meta?.cursor);
  }, []);
  const { ref: lastMessageRef } = useLoadMoreObserver({ loadMore: loadMoreMessages });
  useEffect(() => {
    if (!currentConversation) {
      return;
    }
    messagesServiceRef.current.run();
  }, [currentConversation]);

  return (
    <ChatMessagesContext.Provider
      value={{
        messages,
        responseLoading,
        addMessage,
        addMessages,
        setMessages,
        sendMessages,
        messagesService,
        lastMessageRef,
      }}
    >
      {children}
    </ChatMessagesContext.Provider>
  );
};
