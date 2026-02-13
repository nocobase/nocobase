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
import { aiDebugLogger } from '../../../debug-logger'; // [AI_DEBUG]
import { useChatToolCallStore } from '../stores/chat-tool-call';
import { useLLMServicesRepository } from '../../../llm-services/hooks/useLLMServicesRepository';
import { ensureModel } from '../model';

export const useChatMessageActions = () => {
  const app = useApp();
  const t = useT();
  const api = useAPIClient();
  const plugin = usePlugin('ai') as PluginAIClient;
  const llmServicesRepository = useLLMServicesRepository();

  const setIsEditingMessage = useChatBoxStore.use.setIsEditingMessage();
  const setEditingMessageId = useChatBoxStore.use.setEditingMessageId();
  const setModel = useChatBoxStore.use.setModel();

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
  const currentWebSearch = useChatConversationsStore.use.webSearch();

  const updateToolCallInvokeStatus = useChatToolCallStore.use.updateToolCallInvokeStatus();

  const ensureModelFromStore = useCallback(
    async (username?: string) => {
      const state = useChatBoxStore.getState();
      const targetUsername = username || state.currentEmployee?.username;
      if (!targetUsername) {
        return state.model;
      }
      return ensureModel({
        api,
        llmServicesRepository,
        username: targetUsername,
        currentOverride: state.model,
        onResolved: setModel,
      });
    },
    [api, llmServicesRepository, setModel],
  );

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

          // [AI_DEBUG] backend tool results
          for (const msg of newMessages) {
            const toolCalls = msg.content?.tool_calls;
            if (toolCalls?.length) {
              for (const tc of toolCalls) {
                if (tc.willInterrupt) {
                  updateToolCallInvokeStatus(msg.content.messageId, tc.id, tc.invokeStatus);
                }
                if (tc.invokeStatus === 'done' || tc.invokeStatus === 'confirmed') {
                  const contentStr = typeof tc.content === 'string' ? tc.content : JSON.stringify(tc.content);
                  aiDebugLogger.log(sessionId, 'tool_result', {
                    toolCallId: tc.id,
                    toolName: tc.name,
                    args: tc.args,
                    status: tc.status,
                    invokeStatus: tc.invokeStatus,
                    auto: tc.auto,
                    execution: 'backend',
                    contentPreview: contentStr?.slice(0, 500),
                  });
                }
              }
            }
          }

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

  const processStreamResponse = async (stream: any, sessionId: string, aiEmployee: AIEmployee) => {
    const reader = stream.getReader();
    const decoder = new TextDecoder();
    let result = '';
    let error = false;

    try {
      // eslint-disable-next-line no-constant-condition
      while (true) {
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
            if (data.type === 'stream_start') {
              console.log('stream_start', sessionId);
            }
            if (data.type === 'stream_end') {
              console.log('stream_end', sessionId);
            }
            if (data.type === 'content' && data.body && typeof data.body === 'string') {
              // [AI_DEBUG] stream_text
              aiDebugLogger.log(sessionId, 'stream_text', {
                preview: data.body?.slice?.(0, 100) || '',
              });
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
              // [AI_DEBUG] stream_delta
              aiDebugLogger.log(sessionId, 'stream_delta', {
                chunk: (data.body.toolCalls ?? [])[0],
              });
              updateLastMessage((last) => {
                const toolCalls = last.content.tool_calls || [];
                const toolCallChunk = data.body[0];
                if (toolCallChunk.name) {
                  toolCalls.push(toolCallChunk);
                } else if (toolCalls.length > 0) {
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
            if (data.type === 'tool_calls' && data.body?.toolCalls?.length > 0) {
              updateLastMessage((last) => {
                return {
                  ...last,
                  content: {
                    ...last.content,
                    tool_calls: data.body.toolCalls,
                  },
                  loading: false,
                };
              });
            }
            if (data.type === 'tool_call_status') {
              if (data.body?.toolCall) {
                const { toolCall, invokeStatus } = data.body;
                if (toolCall.willInterrupt) {
                  updateToolCallInvokeStatus(toolCall.messageId, toolCall.id, invokeStatus);
                }
              }
              updateLastMessage((last) => {
                const toolCalls = last.content.tool_calls || [];
                const toolCallId = data.body?.toolCall?.id;
                const nextToolCalls = toolCalls.map((t) =>
                  t.id === toolCallId
                    ? {
                        ...t,
                        invokeStatus: data.body?.invokeStatus ?? t.invokeStatus,
                        status: data.body?.status ?? t.status,
                      }
                    : t,
                );
                return {
                  ...last,
                  content: {
                    ...last.content,
                    tool_calls: nextToolCalls,
                  },
                  loading: false,
                };
              });
            }
            if (data.type === 'web_search' && data.body?.length) {
              // [AI_DEBUG] stream_search
              aiDebugLogger.log(sessionId, 'stream_search', {
                actions: data.body,
              });
              for (const item of data.body) {
                setWebSearching(item);
              }
            }
            if (data.type === 'new_message') {
              // [AI_DEBUG] stream_start
              aiDebugLogger.log(sessionId, 'stream_start', {});
              addMessage({
                key: uid(),
                role: aiEmployee.username,
                content: { type: 'text', content: '' },
                loading: true,
              });
            }
            if (data.type === 'error') {
              // [AI_DEBUG] stream_error
              aiDebugLogger.log(sessionId, 'stream_error', {
                message: data.body,
              });
              error = true;
              result = data.errorName ? data.errorName : data.body;
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

        // [AI_DEBUG] error
        aiDebugLogger.log(sessionId, 'error', {
          message: err.message,
          stack: err.stack?.slice(0, 500),
          context: { phase: 'stream_processing' },
        });
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
    model: inputModel,
  }: SendOptions & {
    onConversationCreate?: (sessionId: string) => void;
  }) => {
    if (!sendMsgs.length) return;

    // Read model from store at call time to avoid stale closure
    const model = inputModel ?? useChatBoxStore.getState().model;

    // [AI_DEBUG] request
    aiDebugLogger.log(
      sessionId || 'pending',
      'request',
      {
        action: 'sendMessages',
        employeeId: aiEmployee?.username,
        model: model?.model,
        messagesCount: sendMsgs.length,
        hasAttachments: attachments?.length > 0,
        hasContext: workContext?.length > 0,
        editingMessageId,
      },
      { employeeId: aiEmployee?.username, employeeName: aiEmployee?.nickname },
    );

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
        values: { aiEmployee, systemMessage, skillSettings },
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
          model,
          webSearch,
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

  const resendMessages = async ({ sessionId, messageId, aiEmployee, important }: ResendOptions) => {
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

    // Read model from store at call time to avoid stale closure.
    // If not ready yet, resolve it through shared model rules.
    let model = useChatBoxStore.getState().model;
    if (!model) {
      model = await ensureModelFromStore(aiEmployee?.username);
    }

    const controller = new AbortController();
    setAbortController(controller);
    try {
      const sendRes = await api.request({
        url: 'aiConversations:resendMessages',
        method: 'POST',
        headers: { Accept: 'text/event-stream' },
        data: { sessionId, messageId, model, important, webSearch: currentWebSearch },
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

  const resumeToolCall = useCallback(
    async ({
      sessionId,
      messageId,
      aiEmployee,
      toolCallIds,
      toolCallResults,
    }: {
      sessionId: string;
      messageId: string;
      aiEmployee: AIEmployee;
      toolCallIds?: string[];
      toolCallResults?: { id: string; [key: string]: any }[];
    }) => {
      setResponseLoading(true);
      // Read model from store at call time to avoid stale closure.
      // If not ready yet, resolve it through shared model rules.
      let model = useChatBoxStore.getState().model;
      if (!model) {
        model = await ensureModelFromStore(aiEmployee?.username);
      }
      const controller = new AbortController();
      setAbortController(controller);
      try {
        const sendRes = await api.request({
          url: 'aiConversations:resumeToolCall',
          method: 'POST',
          headers: { Accept: 'text/event-stream' },
          data: { sessionId, messageId, toolCallIds, toolCallResults, model, webSearch: currentWebSearch },
          responseType: 'stream',
          adapter: 'fetch',
          signal: controller?.signal,
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
    },
    [currentWebSearch, ensureModelFromStore],
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
    resumeToolCall,
    updateToolArgs,
    lastMessageRef,
    startEditingMessage,
    finishEditingMessage,
  };
};
