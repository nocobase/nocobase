/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { AIEmployee, Attachment, ContextItem, Message } from '../../../types';
import { createChatBoxRuntime } from '../../stores/runtime';
import { useChatBoxActions } from '../useChatBoxActions';
import { useChatMessageActions } from '../useChatMessageActions';

const mocks = vi.hoisted(() => ({
  resource: vi.fn(),
  request: vi.fn(),
  refreshConversations: vi.fn(),
  getLLMServices: vi.fn(),
}));

vi.mock('@nocobase/client-v2', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@nocobase/client-v2')>()),
  useApp: () => ({
    apiClient: {
      resource: mocks.resource,
      request: mocks.request,
    },
    flowEngine: {
      getModel: vi.fn(),
    },
    pm: {
      get: vi.fn(() => ({
        aiManager: {
          getWorkContext: vi.fn(),
        },
      })),
    },
  }),
}));

vi.mock('../../../../locale', () => ({
  useT: () => (text: string, params?: { nickname?: string }) =>
    params?.nickname ? text.replace('{{nickname}}', params.nickname) : text,
}));

vi.mock('../../../../repositories/hooks/useAIConfigRepository', () => ({
  useAIConfigRepository: () => ({
    getLLMServices: mocks.getLLMServices,
  }),
}));

vi.mock('../useChatConversationActions', () => ({
  useChatConversationActions: () => ({
    refresh: mocks.refreshConversations,
  }),
}));

const employee: AIEmployee = {
  username: 'sales',
  nickname: 'Sales assistant',
  greeting: 'Hello from sales',
};

const textMessage = (key: string, content: string): Message => ({
  key,
  role: 'user',
  content: {
    type: 'text',
    content,
    messageId: key,
  },
});

describe('chatbox action integration', () => {
  beforeEach(() => {
    mocks.resource.mockReset();
    mocks.request.mockReset();
    mocks.refreshConversations.mockReset();
    mocks.getLLMServices.mockReset();
    mocks.getLLMServices.mockResolvedValue([]);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('starts a new conversation in the provided block runtime only', () => {
    const runtime = createChatBoxRuntime({ mode: 'block' });
    const otherRuntime = createChatBoxRuntime({ mode: 'block' });
    runtime.chatBoxModel.setCurrentEmployee(employee);
    runtime.chatConversationModel.setCurrentConversation('old-session');
    runtime.workflowTaskModel.setCurrentWorkflowTask('task-1');
    runtime.chatSenderModel.setSenderValue('draft');
    runtime.chatMessageModel.setSessionAttachments(undefined, [{ filename: 'draft.txt' }]);
    otherRuntime.chatConversationModel.setCurrentConversation('other-session');
    otherRuntime.chatSenderModel.setSenderValue('other draft');

    const { result } = renderHook(() => useChatBoxActions(runtime));

    act(() => {
      result.current.startNewConversation();
    });

    expect(runtime.chatConversationModel.currentConversation).toBeUndefined();
    expect(runtime.workflowTaskModel.currentWorkflowTask).toBeUndefined();
    expect(runtime.chatSenderModel.senderValue).toBe('');
    expect(runtime.chatMessageModel.getSessionState(undefined).attachments).toEqual([]);
    expect(runtime.chatMessageModel.getSessionState(undefined).messages).toMatchObject([
      {
        role: 'sales',
        content: {
          type: 'greeting',
          content: 'Hello from sales',
        },
      },
    ]);
    expect(otherRuntime.chatConversationModel.currentConversation).toBe('other-session');
    expect(otherRuntime.chatSenderModel.senderValue).toBe('other draft');
  });

  it('creates a scoped conversation and switches the current session in the provided runtime', async () => {
    const runtime = createChatBoxRuntime({ mode: 'block' });
    const otherRuntime = createChatBoxRuntime({ mode: 'block' });
    const createConversation = vi.fn().mockResolvedValue({
      data: {
        data: {
          sessionId: 'created-session',
        },
      },
    });
    mocks.resource.mockImplementation((name: string) => {
      if (name === 'aiConversations') {
        return {
          create: createConversation,
        };
      }
      throw new Error(`Unexpected resource: ${name}`);
    });
    mocks.request.mockResolvedValue({});

    const { result } = renderHook(() => useChatBoxActions(runtime));

    act(() => {
      result.current.send({
        aiEmployee: employee,
        messages: [{ type: 'text', content: 'Summarize this block' }],
        workContext: [],
        scope: 'chat-box-1',
        model: {
          llmService: 'openai',
          model: 'gpt-5',
        },
      });
    });

    await waitFor(() => expect(createConversation).toHaveBeenCalled());

    expect(createConversation).toHaveBeenCalledWith({
      values: {
        aiEmployee: employee,
        systemMessage: undefined,
        skillSettings: undefined,
        scope: 'chat-box-1',
        modelSettings: {
          llmService: 'openai',
          model: 'gpt-5',
        },
      },
    });
    await waitFor(() => expect(runtime.chatConversationModel.currentConversation).toBe('created-session'));
    expect(otherRuntime.chatConversationModel.currentConversation).toBeUndefined();
    expect(mocks.refreshConversations).toHaveBeenCalledTimes(1);
    expect(mocks.request).toHaveBeenCalledWith(
      expect.objectContaining({
        url: 'aiConversations:sendMessages',
        data: expect.objectContaining({
          sessionId: 'created-session',
          aiEmployee: 'sales',
        }),
      }),
    );
  });

  it('uses the block runtime scope when auto-sending a routed task', async () => {
    const runtime = createChatBoxRuntime({ mode: 'block' });
    const createConversation = vi.fn().mockResolvedValue({
      data: {
        data: {
          sessionId: 'task-session',
        },
      },
    });
    mocks.resource.mockImplementation((name: string) => {
      if (name === 'aiConversations') {
        return {
          create: createConversation,
        };
      }
      throw new Error(`Unexpected resource: ${name}`);
    });
    mocks.request.mockResolvedValue({});

    const { result } = renderHook(() => useChatBoxActions(runtime));

    await act(async () => {
      await result.current.triggerTask({
        aiEmployee: employee,
        scope: 'chat-box-1',
        tasks: [
          {
            title: 'Analyze in block',
            message: {
              user: 'Summarize this block',
            },
            autoSend: true,
          },
        ],
      });
    });

    await waitFor(() => expect(createConversation).toHaveBeenCalled());
    expect(createConversation).toHaveBeenCalledWith({
      values: {
        aiEmployee: employee,
        systemMessage: undefined,
        skillSettings: undefined,
        scope: 'chat-box-1',
        modelSettings: undefined,
      },
    });
  });

  it('runs edit, cancel, and resume actions against the provided runtime session', async () => {
    vi.useFakeTimers();
    const runtime = createChatBoxRuntime({ mode: 'block' });
    runtime.chatBoxModel.setCurrentEmployee(employee);
    runtime.chatConversationModel.setCurrentConversation('session-1');
    runtime.chatMessageModel.setSessionMessages('session-1', [
      textMessage('message-1', 'First'),
      textMessage('message-2', 'Second'),
    ]);
    const controller = new AbortController();
    const abortSpy = vi.spyOn(controller, 'abort');
    runtime.chatMessageModel.setSessionAbortController('session-1', controller);
    const attachment: Attachment = { filename: 'draft.txt' };
    const contextItem: ContextItem = { type: 'flow-model', uid: 'block-1' };
    const abort = vi.fn().mockResolvedValue(undefined);
    const getMessages = vi.fn().mockResolvedValue({
      data: {
        data: [],
        meta: {},
      },
    });
    mocks.resource.mockImplementation((name: string) => {
      if (name === 'aiConversations') {
        return {
          abort,
          getMessages,
        };
      }
      throw new Error(`Unexpected resource: ${name}`);
    });
    mocks.request.mockResolvedValue({});

    const { result } = renderHook(() => useChatMessageActions(runtime));

    act(() => {
      result.current.startEditingMessage({
        messageId: 'message-2',
        attachments: [attachment],
        workContext: [contextItem],
      });
    });

    expect(runtime.chatSenderModel.isEditingMessage).toBe(true);
    expect(runtime.chatSenderModel.editingMessageId).toBe('message-2');
    expect(runtime.chatMessageModel.getSessionState('session-1').messages).toMatchObject([
      {
        key: 'message-1',
      },
    ]);
    expect(runtime.chatMessageModel.getSessionState('session-1').attachments).toEqual([attachment]);
    expect(runtime.chatMessageModel.getSessionState('session-1').contextItems).toEqual([contextItem]);

    act(() => {
      result.current.finishEditingMessage();
    });

    expect(runtime.chatSenderModel.isEditingMessage).toBe(false);
    expect(runtime.chatSenderModel.editingMessageId).toBeUndefined();
    expect(runtime.chatMessageModel.getSessionState('session-1').attachments).toEqual([]);
    expect(runtime.chatMessageModel.getSessionState('session-1').contextItems).toEqual([]);

    const cancelPromise = result.current.cancelRequest();
    expect(abort).toHaveBeenCalledWith({ values: { sessionId: 'session-1' } });
    expect(abortSpy).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(500);
    await cancelPromise;
    expect(getMessages).toHaveBeenCalledWith({
      sessionId: 'session-1',
      cursor: undefined,
      paginate: false,
      updateRead: true,
    });

    await result.current.resumeStream({
      sessionId: 'session-1',
      aiEmployee: employee,
    });

    expect(mocks.request).toHaveBeenCalledWith(
      expect.objectContaining({
        url: 'aiConversations:resumeStream',
        data: {
          sessionId: 'session-1',
        },
      }),
    );
  });

  it('marks unread conversations as read when loading the current block conversation', async () => {
    const runtime = createChatBoxRuntime({ mode: 'block' });
    runtime.chatConversationModel.setCurrentConversation('session-1');
    runtime.chatConversationModel.setConversations([
      {
        sessionId: 'session-1',
        title: 'Unread conversation',
        updatedAt: '2026-01-01T00:00:00.000Z',
        aiEmployee: employee,
        read: false,
      },
    ]);
    runtime.chatConversationModel.setUnreadCount(1);
    const getMessages = vi.fn().mockResolvedValue({
      data: {
        data: [],
        meta: {},
      },
    });
    mocks.resource.mockImplementation((name: string) => {
      if (name === 'aiConversations') {
        return {
          getMessages,
        };
      }
      throw new Error(`Unexpected resource: ${name}`);
    });

    const { result } = renderHook(() => useChatMessageActions(runtime));

    await act(async () => {
      await result.current.loadMessages('session-1');
    });

    expect(getMessages).toHaveBeenCalledWith({
      sessionId: 'session-1',
      cursor: undefined,
      paginate: false,
      updateRead: true,
    });
    expect(runtime.chatConversationModel.conversations[0].read).toBe(true);
    expect(runtime.chatConversationModel.unreadCount).toBe(0);
  });
});
