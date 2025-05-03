/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createContext, useCallback, useContext, useRef } from 'react';
import { AIEmployee, Message, ResendOptions, SendOptions } from '../types';
import React, { useState } from 'react';
import { uid } from '@formily/shared';
import { useT } from '../../locale';
import { useAPIClient, usePlugin, useRequest } from '@nocobase/client';
import { useChatConversations } from './ChatConversationsProvider';
import { useLoadMoreObserver } from './useLoadMoreObserver';
import { useAISelectionContext } from '../selector/AISelectorProvider';
import PluginAIClient from '../..';

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
  resendMessages: (options: ResendOptions) => void;
  cancelRequest: () => void;
  callTool: (options: { sessionId: string; messageId: string; aiEmployee: AIEmployee }) => void;
  messagesService: any;
  lastMessageRef: (node: HTMLElement | null) => void;
}

export const ChatMessagesContext = createContext<ChatMessagesContextValue | null>(null);

export const useChatMessages = () => useContext(ChatMessagesContext);

export const ChatMessagesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const t = useT();
  const api = useAPIClient();
  const { ctx } = useAISelectionContext();
  const plugin = usePlugin('ai') as PluginAIClient;
  const [messages, setMessages] = useState<Message[]>([]);
  const [responseLoading, setResponseLoading] = useState(false);
  const { currentConversation } = useChatConversations();
  const abortControllerRef = useRef<AbortController | null>(null);

  const messagesService = useRequest<{
    data: Message[];
    meta: {
      cursor?: string;
      hasMore?: boolean;
    };
  }>(
    (sessionId, cursor?: string) =>
      api
        .resource('aiConversations')
        .getMessages({
          sessionId,
          cursor,
        })
        .then((res) => res?.data),
    {
      manual: true,
      onSuccess: (data, params) => {
        const cursor = params[1];
        if (!data?.data) {
          return;
        }
        const newMessages = [...data.data].reverse();
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          const result = cursor ? [...newMessages, ...prev] : newMessages;
          if (last?.role === 'error') {
            result.push(last);
          }
          return result;
        });
      },
    },
  );
  const messagesServiceRef = useRef<any>();
  messagesServiceRef.current = messagesService;

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

  const processStreamResponse = async (stream: any, sessionId: string, aiEmployee: AIEmployee) => {
    const reader = stream.getReader();
    const decoder = new TextDecoder();
    let result = '';
    let error = false;
    let tool: {
      name: string;
      args: any;
    };

    try {
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
            if (data.body && typeof data.body === 'string') {
              content += data.body;
            }
            if (data.type === 'error') {
              error = true;
            }
            if (data.type === 'tool') {
              tool = data.body;
            }
          } catch (e) {
            console.error('Error parsing stream data:', e);
          }
        }

        result += content;
        if (result) {
          updateLastMessage((last) => ({
            ...last,
            content: {
              ...last.content,
              content: (last.content as any).content + content,
            },
            loading: false,
          }));
        }
      }
    } catch (err) {
      console.error(err);
      if (err.name !== 'AbortError') {
        error = true;
        result = err.message;
      }
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

    await messagesServiceRef.current.runAsync(sessionId);
    if (tool) {
      const t = plugin.aiManager.tools.get(tool.name);
      if (t) {
        await t.invoke(ctx, tool.args);
        await callTool({
          sessionId,
          aiEmployee,
        });
      }
    }
  };

  const sendMessages = async ({
    sessionId,
    aiEmployee,
    messages: sendMsgs,
    onConversationCreate,
  }: SendOptions & {
    onConversationCreate?: (sessionId: string) => void;
  }) => {
    const msgs: Message[] = [];
    if (!sendMsgs.length) return;

    const last = messages[messages.length - 1];
    if (last?.role === 'error') {
      setMessages((prev) => prev.slice(0, -1));
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

    abortControllerRef.current = new AbortController();
    try {
      const sendRes = await api.request({
        url: 'aiConversations:sendMessages',
        method: 'POST',
        headers: { Accept: 'text/event-stream' },
        data: { aiEmployee: aiEmployee.username, sessionId, messages: msgs },
        responseType: 'stream',
        adapter: 'fetch',
        signal: abortControllerRef.current?.signal,
        skipNotify: (err) => err.name === 'CanceledError',
      });

      if (!sendRes?.data) {
        setResponseLoading(false);
        return;
      }

      await processStreamResponse(sendRes.data, sessionId, aiEmployee);
    } catch (err) {
      if (err.name === 'CanceledError') {
        return;
      }
      setResponseLoading(false);
      throw err;
    } finally {
      abortControllerRef.current = null;
    }
  };

  const resendMessages = async ({ sessionId, messageId, aiEmployee }: ResendOptions) => {
    const index = messages.findIndex((msg) => msg.key === messageId);
    setResponseLoading(true);
    setMessages((prev) => [
      ...prev.slice(0, index),
      {
        key: uid(),
        role: aiEmployee.username,
        content: {
          type: 'text',
          content: '',
        },
        loading: true,
      },
    ]);

    abortControllerRef.current = new AbortController();
    try {
      const sendRes = await api.request({
        url: 'aiConversations:resendMessages',
        method: 'POST',
        headers: { Accept: 'text/event-stream' },
        data: { sessionId, messageId },
        responseType: 'stream',
        adapter: 'fetch',
        signal: abortControllerRef.current?.signal,
        skipNotify: (err) => err.name === 'CanceledError',
      });

      if (!sendRes?.data) {
        setResponseLoading(false);
        return;
      }

      await processStreamResponse(sendRes.data, sessionId, aiEmployee);
    } catch (err) {
      if (err.name === 'CanceledError') {
        return;
      }
      setResponseLoading(false);
      throw err;
    } finally {
      abortControllerRef.current = null;
    }
  };

  const cancelRequest = useCallback(async () => {
    if (!abortControllerRef.current) {
      return;
    }
    abortControllerRef.current.abort();
    abortControllerRef.current = null;
    await api.resource('aiConversations').abort({
      values: {
        sessionId: currentConversation,
      },
    });
    // sleep(500)
    await new Promise((resolve) => setTimeout(resolve, 500));
    messagesServiceRef.current.run(currentConversation);
    setResponseLoading(false);
  }, [currentConversation]);

  const callTool = useCallback(
    async ({ sessionId, messageId, aiEmployee }: { sessionId: string; messageId?: string; aiEmployee: AIEmployee }) => {
      setResponseLoading(true);
      addMessage({
        key: uid(),
        role: aiEmployee.username,
        content: { type: 'text', content: '' },
        loading: true,
      });

      try {
        const sendRes = await api.request({
          url: 'aiConversations:callTool',
          method: 'POST',
          headers: { Accept: 'text/event-stream' },
          data: { sessionId, messageId },
          responseType: 'stream',
          adapter: 'fetch',
        });

        if (!sendRes?.data) {
          setResponseLoading(false);
          return;
        }

        await processStreamResponse(sendRes.data, sessionId, aiEmployee);
      } catch (err) {
        setResponseLoading(false);
        throw err;
      }
    },
    [],
  );

  const loadMoreMessages = useCallback(async () => {
    const messagesService = messagesServiceRef.current;
    if (messagesService.loading || !messagesService.data?.meta?.hasMore) {
      return;
    }
    await messagesService.runAsync(currentConversation, messagesService.data?.meta?.cursor);
  }, [currentConversation]);
  const { ref: lastMessageRef } = useLoadMoreObserver({ loadMore: loadMoreMessages });

  return (
    <ChatMessagesContext.Provider
      value={{
        messages,
        responseLoading,
        addMessage,
        addMessages,
        setMessages,
        sendMessages,
        resendMessages,
        cancelRequest,
        callTool,
        messagesService,
        lastMessageRef,
      }}
    >
      {children}
    </ChatMessagesContext.Provider>
  );
};
