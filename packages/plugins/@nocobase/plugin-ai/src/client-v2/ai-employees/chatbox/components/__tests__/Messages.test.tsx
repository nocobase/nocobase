/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { render, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ChatBoxRuntimeProvider, createChatBoxRuntime, type ChatBoxRuntime } from '../../stores/runtime';
import { Messages } from '../Messages';

const mocks = vi.hoisted(() => ({
  listeners: new Map<string, EventListener>(),
  loadMessages: vi.fn(),
  setResponseLoading: vi.fn(),
  updateReadonly: vi.fn(),
}));

vi.mock('@nocobase/client-v2', () => ({
  useApp: () => ({
    eventBus: {
      addEventListener: (eventName: string, listener: EventListener) => {
        mocks.listeners.set(eventName, listener);
      },
      removeEventListener: (eventName: string) => {
        mocks.listeners.delete(eventName);
      },
    },
  }),
}));

vi.mock('../../../../locale', () => ({
  useT: () => (text: string) => text,
}));

vi.mock('../../hooks/useChat', () => ({
  useChat: () => ({
    use: {
      messages: () => [],
      messagesLoading: () => false,
    },
    setResponseLoading: mocks.setResponseLoading,
  }),
}));

vi.mock('../../hooks/useChatMessageActions', () => ({
  useChatMessageActions: () => ({
    loadMessages: mocks.loadMessages,
    lastMessageRef: { current: null },
  }),
}));

vi.mock('../../hooks/useWorkflowTasks', () => ({
  useWorkflowTasks: () => ({
    updateReadonly: mocks.updateReadonly,
  }),
}));

const renderMessages = (runtime: ChatBoxRuntime) => {
  runtime.chatConversationModel.setCurrentConversation('session-a');
  return render(
    <ChatBoxRuntimeProvider runtime={runtime}>
      <Messages />
    </ChatBoxRuntimeProvider>,
  );
};

const dispatchTaskStatusUpdate = () => {
  const listener = mocks.listeners.get('ws:message:ai-employee-tasks:status');
  listener?.(
    new CustomEvent('ws:message:ai-employee-tasks:status', {
      detail: {
        sessionId: 'session-a',
        status: 'approved',
      },
    }),
  );
};

describe('Messages runtime mode', () => {
  afterEach(() => {
    mocks.listeners.clear();
    mocks.loadMessages.mockReset();
    mocks.setResponseLoading.mockReset();
    mocks.updateReadonly.mockReset();
  });

  it('refreshes workflow task readonly state in global mode', async () => {
    mocks.updateReadonly.mockResolvedValue(undefined);
    renderMessages(createChatBoxRuntime({ mode: 'global' }));

    dispatchTaskStatusUpdate();

    expect(mocks.loadMessages).toHaveBeenCalledWith('session-a');
    expect(mocks.setResponseLoading).toHaveBeenCalledWith(false);
    await waitFor(() => expect(mocks.updateReadonly).toHaveBeenCalledWith('session-a'));
  });

  it('does not refresh workflow task readonly state in block mode', () => {
    renderMessages(createChatBoxRuntime({ mode: 'block' }));

    dispatchTaskStatusUpdate();

    expect(mocks.loadMessages).toHaveBeenCalledWith('session-a');
    expect(mocks.setResponseLoading).toHaveBeenCalledWith(false);
    expect(mocks.updateReadonly).not.toHaveBeenCalled();
  });
});
