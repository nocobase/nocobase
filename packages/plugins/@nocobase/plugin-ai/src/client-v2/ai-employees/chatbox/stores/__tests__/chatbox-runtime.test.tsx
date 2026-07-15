/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { act, render, renderHook, screen } from '@testing-library/react';
import { observer } from '@nocobase/flow-engine';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ChatBoxLayout } from '../../components/ChatBoxLayout';
import { ChatBoxRuntimeProvider, createChatBoxRuntime, getGlobalChatBoxRuntime, useChatBoxRuntime } from '../runtime';

const mocks = vi.hoisted(() => ({
  eventBus: {
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  },
}));

vi.mock('@nocobase/client-v2', () => ({
  useApp: () => ({
    eventBus: mocks.eventBus,
    apiClient: {
      resource: () => ({
        unreadCounts: async () => ({
          data: {
            data: {
              conversationUnreadCount: 0,
              workflowTaskUnreadCount: 0,
            },
          },
        }),
      }),
    },
  }),
}));

vi.mock('../../components/ChatButton', () => ({
  ChatButton: () => <div data-testid="chat-button" />,
}));

vi.mock('../../components/ChatBox', () => ({
  ChatBox: () => <div data-testid="chat-box" />,
}));

vi.mock('../../components/DebugPanel', () => ({
  DebugPanel: () => <div data-testid="debug-panel" />,
}));

vi.mock('../../components/ToolModal', () => ({
  ToolModal: () => <div data-testid="tool-modal" />,
}));

vi.mock('../../../AISelection', () => ({
  AISelection: () => <div data-testid="ai-selection" />,
}));

vi.mock('../../../AISelectionControl', () => ({
  AISelectionControl: () => <div data-testid="ai-selection-control" />,
}));

afterEach(() => {
  mocks.eventBus.addEventListener.mockClear();
  mocks.eventBus.removeEventListener.mockClear();
  getGlobalChatBoxRuntime().chatBoxModel.setSenderValue('');
});

const RuntimeReader: React.FC = () => {
  const runtime = useChatBoxRuntime();
  return <div data-testid="runtime-reader">{runtime.chatBoxModel.senderValue || 'empty'}</div>;
};

const ObservedRuntimeReader: React.FC = observer(() => {
  const { chatBoxModel, chatMessageModel, chatToolModel } = useChatBoxRuntime();
  const sessionState = chatMessageModel.getSessionState('session-a');
  return (
    <div data-testid="observed-runtime-reader">
      {[
        chatBoxModel.senderValue || 'empty',
        chatBoxModel.currentEmployee?.username || 'no-employee',
        chatBoxModel.model?.model || 'no-model',
        sessionState.messages.length,
        chatToolModel.openToolModal ? 'tool-open' : 'tool-closed',
      ].join('|')}
    </div>
  );
});

describe('chatbox runtime context', () => {
  it('returns the provided runtime from ChatBoxRuntimeProvider', () => {
    const runtime = createChatBoxRuntime();
    runtime.chatBoxModel.setSenderValue('provided');
    const wrapper: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
      <ChatBoxRuntimeProvider runtime={runtime}>{children}</ChatBoxRuntimeProvider>
    );

    const { result } = renderHook(() => useChatBoxRuntime(), { wrapper });

    expect(result.current).toBe(runtime);
    expect(result.current.chatBoxModel.senderValue).toBe('provided');
  });

  it('throws a clear error when used without a provider', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      expect(() => renderHook(() => useChatBoxRuntime())).toThrow(
        'ChatBox runtime is missing. Wrap chatbox UI with ChatBoxRuntimeProvider.',
      );
    } finally {
      consoleError.mockRestore();
    }
  });

  it('keeps the global runtime stable across repeated access', () => {
    const firstRuntime = getGlobalChatBoxRuntime();
    const secondRuntime = getGlobalChatBoxRuntime();

    expect(secondRuntime).toBe(firstRuntime);
    expect(secondRuntime.chatBoxModel).toBe(firstRuntime.chatBoxModel);
    expect(secondRuntime.chatMessageModel).toBe(firstRuntime.chatMessageModel);
  });

  it('provides the global runtime from ChatBoxLayout', () => {
    getGlobalChatBoxRuntime().chatBoxModel.setSenderValue('layout-runtime');

    render(
      <ChatBoxLayout>
        <RuntimeReader />
      </ChatBoxLayout>,
    );

    expect(screen.getByTestId('runtime-reader').textContent).toBe('layout-runtime');
    expect(screen.getByTestId('chat-button')).toBeTruthy();
  });

  it('tracks runtime model reads through observer rendering', () => {
    const runtime = createChatBoxRuntime();

    render(
      <ChatBoxRuntimeProvider runtime={runtime}>
        <ObservedRuntimeReader />
      </ChatBoxRuntimeProvider>,
    );

    expect(screen.getByTestId('observed-runtime-reader').textContent).toBe('empty|no-employee|no-model|0|tool-closed');

    act(() => {
      runtime.chatBoxModel.setSenderValue('draft');
      runtime.chatBoxModel.setCurrentEmployee({ username: 'atlas', nickname: 'Atlas' });
      runtime.chatBoxModel.setModel({ llmService: 'openai', model: 'gpt-4.1' });
      runtime.chatMessageModel.addSessionMessage('session-a', {
        key: 'message-a',
        role: 'user',
        content: { type: 'text', content: 'hello' },
      });
      runtime.chatToolModel.setOpenToolModal(true);
    });

    expect(screen.getByTestId('observed-runtime-reader').textContent).toBe('draft|atlas|gpt-4.1|1|tool-open');
  });
});
