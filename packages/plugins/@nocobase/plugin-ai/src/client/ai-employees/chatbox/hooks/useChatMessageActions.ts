/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useChatMessagesStore } from '../stores/chat-messages';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useAPIClient, useApp, usePlugin, useRequest } from '@nocobase/client';
import { AIEmployee, Message, ResendOptions, SendOptions } from '../../types';
import PluginAIClient from '../../..';
import { uid } from '@formily/shared';
import { useLoadMoreObserver } from './useLoadMoreObserver';
import { useT } from '../../../locale';
import { useChatConversationsStore } from '../stores/chat-conversations';
import { useChatBoxStore } from '../stores/chat-box';
import { flattenMessages, parseWorkContext } from '../utils';
import { aiDebugLogger } from '../../../debug-logger'; // [AI_DEBUG]
import { useChatToolCallStore } from '../stores/chat-tool-call';
import { useAIConfigRepository } from '../../../repositories/hooks/useAIConfigRepository';
import { ensureModel } from '../model';

export const useChatMessageActions = () => {
  const app = useApp();
  const t = useT();
  const api = useAPIClient();
  const plugin = usePlugin('ai') as PluginAIClient;
  const aiConfigRepository = useAIConfigRepository();

  const isEditingMessage = useChatBoxStore.use.isEditingMessage();
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
  const addSubAgentMessage = useChatMessagesStore.use.addSubAgentMessage();
  const addSubAgentMessages = useChatMessagesStore.use.addSubAgentMessages();
  const updateLastSubAgentMessage = useChatMessagesStore.use.updateLastSubAgentMessage();
  const updateSubAgentConversationStatus = useChatMessagesStore.use.updateSubAgentConversationStatus();

  const currentConversation = useChatConversationsStore.use.currentConversation();
  const currentWebSearch = useChatConversationsStore.use.webSearch();

  const updateToolCallInvokeStatus = useChatToolCallStore.use.updateToolCallInvokeStatus();

  const renderedMessages = useMemo(() => flattenMessages(messages), [messages]);

  const ensureModelFromStore = useCallback(
    async (username?: string) => {
      const state = useChatBoxStore.getState();
      const targetUsername = username || state.currentEmployee?.username;
      if (!targetUsername) {
        return state.model;
      }
      return ensureModel({
        api,
        aiConfigRepository,
        username: targetUsername,
        currentOverride: state.model,
        onResolved: setModel,
      });
    },
    [api, aiConfigRepository, setModel],
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

    type MessagesStore = {
      addMessage: (msg: Message) => void;
      updateLast: (updater: (msg: Message) => Message) => void;
    };

    const processStreamStart = (data: any) => {
      if (data.type === 'stream_start') {
        console.debug('stream_start', data.from, data.sessionId);
      }
    };

    const processStreamEnd = (data: any) => {
      if (data.type === 'stream_end') {
        console.debug('stream_end', data.from, data.sessionId);
      }
    };

    const processReasoning = (data: any, store: MessagesStore) => {
      if (data.type === 'reasoning' && data.body?.content && typeof data.body.content === 'string') {
        // [AI_DEBUG] stream_reasoning
        aiDebugLogger.log(data.sessionId, 'stream_reasoning', {
          phase: 'delta',
          preview: data.body.content?.slice?.(0, 120) || '',
        });
        store.updateLast((last) => ({
          ...last,
          content: {
            ...last.content,
            reasoning: {
              status: data.body.status,
              content: `${last.content.reasoning?.content ?? ''}${data.body.content}`,
            },
          },
          loading: false,
        }));
      }
    };

    const processContent = (data: any, store: MessagesStore) => {
      if (data.type === 'content' && data.body && typeof data.body === 'string') {
        // [AI_DEBUG] stream_text
        aiDebugLogger.log(data.sessionId, 'stream_text', {
          preview: data.body?.slice?.(0, 100) || '',
        });
        store.updateLast((last) => ({
          ...last,
          createdAt: new Date().toISOString(),
          content: {
            ...last.content,
            from: data.from,
            content: (last.content as any).content + data.body,
          },
          loading: false,
        }));
      }
    };

    const processToolCallChunks = (data: any, store: MessagesStore) => {
      if (data.type === 'tool_call_chunks' && data.body?.length > 0) {
        // [AI_DEBUG] stream_delta
        aiDebugLogger.log(data.sessionId, 'stream_delta', {
          chunk: (data.body.toolCalls ?? [])[0],
        });
        store.updateLast((last) => {
          const toolCalls = last.content.tool_calls || [];
          const toolCallChunk = data.body[0];
          if (toolCallChunk.name) {
            toolCalls.push(toolCallChunk);
          } else if (toolCalls.length > 0) {
            toolCalls[toolCalls.length - 1].args += data.body[0].args;
          }
          return {
            ...last,
            createdAt: new Date().toISOString(),
            content: {
              ...last.content,
              from: data.from,
              tool_calls: toolCalls,
            },
            loading: false,
          };
        });
      }
    };

    const processToolCall = (data: any, store: MessagesStore) => {
      if (data.type === 'tool_calls' && data.body?.toolCalls?.length > 0) {
        store.updateLast((last) => {
          return {
            ...last,
            createdAt: new Date().toISOString(),
            content: {
              ...last.content,
              from: data.from,
              tool_calls: data.body.toolCalls,
            },
            loading: false,
          };
        });
      }
    };

    const processToolCallStatus = (data: any, store: MessagesStore) => {
      if (data.type === 'tool_call_status') {
        if (data.body?.toolCall) {
          const { toolCall, invokeStatus } = data.body;
          if (toolCall.willInterrupt) {
            updateToolCallInvokeStatus(toolCall.messageId, toolCall.id, invokeStatus);
          }
        }
        store.updateLast((last) => {
          const toolCalls = last.content.tool_calls || [];
          const toolCallId = data.body?.toolCall?.id;
          const nextToolCalls = toolCalls.map((t) =>
            t.id === toolCallId
              ? {
                  ...t,
                  invokeStatus: data.body?.invokeStatus ?? t.invokeStatus,
                  status: data.body?.status ?? t.status,
                  invokeStartTime: data.body?.invokeStartTime ?? t.invokeStartTime,
                  invokeEndTime: data.body?.invokeEndTime ?? t.invokeEndTime,
                  content: data.body?.content ?? t.content,
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
    };

    const processWebSearch = (data: any) => {
      if (data.type === 'web_search' && data.body?.length) {
        // [AI_DEBUG] stream_search
        aiDebugLogger.log(data.sessionId, 'stream_search', {
          actions: data.body,
        });
        for (const item of data.body) {
          setWebSearching(item);
        }
      }
    };

    const processNewMessage = (data: any, store: MessagesStore) => {
      if (data.type === 'new_message') {
        // [AI_DEBUG] stream_start
        aiDebugLogger.log(data.sessionId, 'stream_start', {});
        store.addMessage({
          key: uid(),
          role: aiEmployee.username,
          createdAt: new Date().toISOString(),
          content: { from: data.from, type: 'text', content: '' },
          loading: true,
        });
      }
    };

    const processError = (data: any) => {
      if (data.type === 'error') {
        // [AI_DEBUG] stream_error
        aiDebugLogger.log(data.sessionId, 'stream_error', {
          message: data.body,
        });
        error = true;
        result = data.errorName ? data.errorName : data.body;
      }
    };

    const mainAgentMessageStore = {
      addMessage,
      updateLast: updateLastMessage,
    };

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
            if (data.from === 'main-agent') {
              if (sessionId !== data.sessionId) {
                console.warn('invalid session id, ignore chunks', data);
                continue;
              }
              processStreamStart(data);
              processStreamEnd(data);
              processNewMessage(data, mainAgentMessageStore);
              processReasoning(data, mainAgentMessageStore);
              processContent(data, mainAgentMessageStore);
              processToolCallChunks(data, mainAgentMessageStore);
              processToolCall(data, mainAgentMessageStore);
              processToolCallStatus(data, mainAgentMessageStore);
              processWebSearch(data);
              processError(data);
            } else if (data.from === 'sub-agent') {
              const subAgentMessageStore = {
                addMessage: (msg: Message) => {
                  msg.role = data.username;
                  addSubAgentMessage(data.sessionId, msg);
                },
                updateLast: (updater: (msg: Message) => Message) => {
                  updateLastSubAgentMessage(data.sessionId, data.username, updater);
                },
              };

              if (data.type === 'sub_agent_completed') {
                updateSubAgentConversationStatus(data.sessionId, 'completed');
              }

              processNewMessage(data, subAgentMessageStore);
              processReasoning(data, subAgentMessageStore);
              processContent(data, subAgentMessageStore);
              processToolCallChunks(data, subAgentMessageStore);
              processToolCall(data, subAgentMessageStore);
              processToolCallStatus(data, subAgentMessageStore);
              processWebSearch(data);
              processError(data);
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
    const lastRenderedMessage = renderedMessages.at(-1);

    const parsedWorkContext = await parseWorkContext(app, workContext);
    const msgs = sendMsgs.map((msg, index) => ({
      key: uid(),
      role: 'user',
      content: msg,
      attachments: index === 0 ? attachments : undefined,
      workContext: index === 0 ? parsedWorkContext : undefined,
    }));
    if (lastRenderedMessage?.type === 'conversation-group' && !isEditingMessage) {
      addSubAgentMessages(
        lastRenderedMessage.key,
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
    } else {
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
    }

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

    if (lastRenderedMessage?.type === 'conversation-group' && !isEditingMessage) {
      addSubAgentMessage(lastRenderedMessage.key, {
        key: uid(),
        role: lastRenderedMessage.roleName,
        content: { type: 'text', content: '' },
        loading: true,
      });
    } else {
      addMessage({
        key: uid(),
        role: aiEmployee.username,
        content: { type: 'text', content: '' },
        loading: true,
      });
    }

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
