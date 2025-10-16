/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useChatMessagesStore } from '../stores/chat-messages';
import { useCallback, useEffect, useRef } from 'react';
import { useAPIClient, useApp, usePlugin, useRequest } from '@nocobase/client';
import { AIEmployee, Message, ResendOptions, SendOptions } from '../../types';
import PluginAIClient from '../../..';
import { uid } from '@formily/shared';
import { useLoadMoreObserver } from './useLoadMoreObserver';
import { useT } from '../../../locale';
import { useChatConversationsStore } from '../stores/chat-conversations';
import { useChatBoxStore } from '../stores/chat-box';
import { parseWorkContext } from '../utils';

export const useChatMessageActions = () => {
  const app = useApp();
  const t = useT();
  const api = useAPIClient();
  const plugin = usePlugin('ai') as PluginAIClient;

  const setIsEditingMessage = useChatBoxStore.use.setIsEditingMessage();
  const setEditingMessageId = useChatBoxStore.use.setEditingMessageId();

  const messages = useChatMessagesStore.use.messages();
  const setMessages = useChatMessagesStore.use.setMessages();
  const addMessage = useChatMessagesStore.use.addMessage();
  const addMessages = useChatMessagesStore.use.addMessages();
  const updateLastMessage = useChatMessagesStore.use.updateLastMessage();
  const setResponseLoading = useChatMessagesStore.use.setResponseLoading();
  const setAbortController = useChatMessagesStore.use.setAbortController();
  const setAttachments = useChatMessagesStore.use.setAttachments();
  const setContextItems = useChatMessagesStore.use.setContextItems();
  const setWebSearching = useChatMessagesStore.use.setWebSearching();

  const currentConversation = useChatConversationsStore.use.currentConversation();

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
          paginate: false,
        })
        .then((res) => {
          const data = res?.data;
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
        }),
    {
      manual: true,
    },
  );
  const messagesServiceRef = useRef<any>();
  messagesServiceRef.current = messagesService;

  const employeeTools = plugin.aiManager.useTools();

  const processStreamResponse = async (stream: any, sessionId: string, aiEmployee: AIEmployee) => {
    const reader = stream.getReader();
    const decoder = new TextDecoder();
    let result = '';
    let error = false;
    let tools: {
      id: string;
      name: string;
      args: unknown;
    }[];

    try {
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const content = '';
        const { done, value } = await reader.read();
        if (done || error) {
          setResponseLoading(false);
          setWebSearching(null);
          break;
        }

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter(Boolean);

        for (const line of lines) {
          try {
            const data = JSON.parse(line.replace(/^data: /, ''));
            if (data.type === 'content' && data.body && typeof data.body === 'string') {
              updateLastMessage((last) => ({
                ...last,
                content: {
                  ...last.content,
                  content: (last.content as any).content + data.body,
                },
                loading: false,
              }));
            }
            if (data.type === 'tool_call_chunks' && data.body?.length > 0) {
              updateLastMessage((last) => {
                const toolCalls = last.content.tool_calls || [];
                const toolCallChunk = data.body[0];
                if (toolCallChunk.name) {
                  toolCalls.push(toolCallChunk);
                } else {
                  toolCalls[toolCalls.length - 1].args += data.body[0].args;
                }
                return {
                  ...last,
                  content: {
                    ...last.content,
                    tool_calls: toolCalls,
                  },
                  loading: false,
                };
              });
            }
            if (data.type === 'web_search' && data.body?.length) {
              for (const item of data.body) {
                setWebSearching(item);
              }
            }
            if (data.type === 'new_message') {
              addMessage({
                key: uid(),
                role: aiEmployee.username,
                content: { type: 'text', content: '' },
                loading: true,
              });
            }
            if (data.type === 'error') {
              error = true;
              result = data.body;
            }
            if (data.type === 'tool_calls') {
              tools = data.body;
            }
          } catch (e) {
            console.error('Error parsing stream data:', e);
          }
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
    if (!error && tools && tools.length > 0) {
      const toolCallIds: string[] = [];
      const toolCallResults = [];
      for (const tool of tools) {
        toolCallIds.push(tool.id);
        const t = employeeTools.get(tool.name);
        if (t && t.invoke) {
          const result = await t.invoke(app, tool.args);
          if (result) {
            toolCallResults.push({
              id: tool.id,
              result,
            });
          }
        }
      }
      await confirmToolCall({
        sessionId,
        aiEmployee,
        toolCallIds,
        toolCallResults,
      });
    }
  };

  const sendMessages = async ({
    sessionId,
    aiEmployee,
    systemMessage,
    messages: sendMsgs,
    attachments,
    workContext,
    editingMessageId,
    onConversationCreate,
    skillSettings,
    webSearch,
  }: SendOptions & {
    onConversationCreate?: (sessionId: string) => void;
  }) => {
    if (!sendMsgs.length) return;

    const last = messages[messages.length - 1];
    if (last?.role === 'error') {
      setMessages((prev) => prev.slice(0, -1));
    }

    const parsedWorkContext = await parseWorkContext(app, workContext);
    const msgs = sendMsgs.map((msg, index) => ({
      key: uid(),
      role: 'user',
      content: msg,
      attachments: index === 0 ? attachments : undefined,
      workContext: index === 0 ? parsedWorkContext : undefined,
    }));
    addMessages(
      sendMsgs.map((msg, index) => ({
        key: uid(),
        role: 'user',
        content: {
          ...msg,
          attachments: index === 0 ? attachments : undefined,
          workContext: index === 0 ? workContext : undefined,
        },
      })),
    );

    if (!sessionId) {
      const createRes = await api.resource('aiConversations').create({
        values: { aiEmployee, systemMessage, skillSettings, conversationSettings: { webSearch } },
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

    const controller = new AbortController();
    setAbortController(controller);
    try {
      const sendRes = await api.request({
        url: 'aiConversations:sendMessages',
        method: 'POST',
        headers: { Accept: 'text/event-stream' },
        data: {
          aiEmployee: aiEmployee.username,
          sessionId,
          messages: msgs,
          systemMessage,
          editingMessageId,
        },
        responseType: 'stream',
        adapter: 'fetch',
        signal: controller?.signal,
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
      setAbortController(null);
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

    const controller = new AbortController();
    setAbortController(controller);
    try {
      const sendRes = await api.request({
        url: 'aiConversations:resendMessages',
        method: 'POST',
        headers: { Accept: 'text/event-stream' },
        data: { sessionId, messageId },
        responseType: 'stream',
        adapter: 'fetch',
        signal: controller?.signal,
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
      setAbortController(null);
    }
  };

  const cancelRequest = useCallback(async () => {
    const controller = useChatMessagesStore.getState().abortController;
    if (!controller) {
      return;
    }
    controller.abort();
    setAbortController(null);
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
    async ({
      sessionId,
      messageId,
      aiEmployee,
      args,
    }: {
      sessionId: string;
      messageId?: string;
      aiEmployee: AIEmployee;
      args?: Record<string, any>;
    }) => {
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
          data: { sessionId, messageId, args },
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

  const confirmToolCall = useCallback(
    async ({
      sessionId,
      messageId,
      aiEmployee,
      toolCallIds,
      toolCallResults,
    }: {
      sessionId: string;
      messageId?: string;
      aiEmployee: AIEmployee;
      toolCallIds?: string[];
      toolCallResults?: { id: string; [key: string]: any }[];
    }) => {
      setResponseLoading(true);
      addMessage({
        key: uid(),
        role: aiEmployee.username,
        content: { type: 'text', content: '' },
        loading: true,
      });

      try {
        const sendRes = await api.request({
          url: 'aiConversations:confirmToolCall',
          method: 'POST',
          headers: { Accept: 'text/event-stream' },
          data: { sessionId, messageId, toolCallIds, toolCallResults },
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

  const updateToolArgs = useCallback(async ({ sessionId, messageId, tool }) => {
    const messagesService = messagesServiceRef.current;
    await api.resource('aiConversations').updateToolArgs({
      values: {
        sessionId,
        messageId,
        tool,
      },
    });
    messagesService.run(sessionId);
  }, []);

  const startEditingMessage = useCallback((msg: any) => {
    const index = messages.findIndex((m) => m.key === msg.messageId);
    setIsEditingMessage(true);
    setEditingMessageId(msg.messageId);
    setMessages(messages.slice(0, index));
    if (msg.attachments) {
      setAttachments(msg.attachments);
    }
    if (msg.workContext) {
      setContextItems(msg.workContext);
    }
  }, []);

  const finishEditingMessage = useCallback(() => {
    setIsEditingMessage(false);
    setEditingMessageId(undefined);
    setAttachments([]);
    setContextItems([]);
  }, []);

  return {
    messagesService,
    sendMessages,
    resendMessages,
    cancelRequest,
    callTool,
    updateToolArgs,
    lastMessageRef,
    startEditingMessage,
    finishEditingMessage,
  };
};
