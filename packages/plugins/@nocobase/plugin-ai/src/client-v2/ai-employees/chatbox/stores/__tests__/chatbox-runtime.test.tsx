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
import {
  ChatBoxRuntimeProvider,
  createChatBoxRuntime,
  getGlobalChatBoxRuntime,
  useChatBoxRuntime,
  useResolvedChatBoxRuntime,
} from '../runtime';

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
  const runtime = getGlobalChatBoxRuntime();
  runtime.chatBoxModel.setOpen(false);
  runtime.chatBoxModel.setExpanded(false);
  runtime.chatBoxModel.setShowDebugPanel(false);
  runtime.chatBoxModel.setSenderValue('');
  runtime.chatToolModel.setActiveTool(null);
  runtime.chatToolModel.setOpenToolModal(false);
  runtime.chatConversationModel.setCurrentConversation(undefined);
  runtime.chatConversationModel.setConversations([]);
  runtime.chatConversationModel.setUnreadCount(0);
  runtime.workflowTaskModel.setWorkflowTasks([]);
  runtime.workflowTaskModel.setUnreadCount(0);
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

  it('resolves an explicit runtime without a provider', () => {
    const runtime = createChatBoxRuntime();

    const { result } = renderHook(() => useResolvedChatBoxRuntime(runtime));

    expect(result.current).toBe(runtime);
  });

  it('resolves the context runtime when no runtime is passed', () => {
    const runtime = createChatBoxRuntime();
    const wrapper: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
      <ChatBoxRuntimeProvider runtime={runtime}>{children}</ChatBoxRuntimeProvider>
    );

    const { result } = renderHook(() => useResolvedChatBoxRuntime(), { wrapper });

    expect(result.current).toBe(runtime);
  });

  it('keeps the global runtime stable across repeated access', () => {
    const firstRuntime = getGlobalChatBoxRuntime();
    const secondRuntime = getGlobalChatBoxRuntime();

    expect(secondRuntime).toBe(firstRuntime);
    expect(secondRuntime.chatBoxModel).toBe(firstRuntime.chatBoxModel);
    expect(secondRuntime.chatConversationModel).toBe(firstRuntime.chatConversationModel);
    expect(secondRuntime.chatMessageModel).toBe(firstRuntime.chatMessageModel);
    expect(secondRuntime.workflowTaskModel).toBe(firstRuntime.workflowTaskModel);
  });

  it('creates isolated conversation and workflow models per runtime', () => {
    const firstRuntime = createChatBoxRuntime();
    const secondRuntime = createChatBoxRuntime();

    firstRuntime.chatConversationModel.setCurrentConversation('session-a');
    firstRuntime.chatConversationModel.setUnreadCount(1);
    firstRuntime.workflowTaskModel.setWorkflowTasks([
      {
        id: 'task-a',
        sessionId: 'task-session-a',
        workflowTitle: 'Workflow',
        nodeTitle: 'Node',
        status: 'approved',
      },
    ]);

    expect(secondRuntime.chatConversationModel.currentConversation).toBeUndefined();
    expect(secondRuntime.chatConversationModel.unreadCount).toBe(0);
    expect(secondRuntime.workflowTaskModel.workflowTasks).toEqual([]);
    expect(firstRuntime.workflowTaskModel.workflowTasks[0].jobStatus).toBe(1);
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

  it('renders global floating surfaces from runtime state', () => {
    const runtime = getGlobalChatBoxRuntime();

    render(<ChatBoxLayout />);

    expect(screen.queryByTestId('chat-box')).toBeNull();
    expect(screen.queryByTestId('tool-modal')).toBeNull();
    expect(screen.queryByTestId('debug-panel')).toBeNull();

    act(() => {
      runtime.chatBoxModel.setOpen(true);
    });

    expect(screen.getByTestId('chat-box')).toBeTruthy();

    act(() => {
      runtime.chatBoxModel.setShowDebugPanel(true);
      runtime.chatToolModel.setActiveTool({
        id: 'tool-a',
        type: 'function',
        name: 'getSkill',
        invokeStatus: 'done',
        auto: false,
        args: {},
      });
    });

    expect(screen.getByTestId('debug-panel')).toBeTruthy();
    expect(screen.getByTestId('tool-modal')).toBeTruthy();

    act(() => {
      runtime.chatBoxModel.setExpanded(true);
    });

    expect(screen.getByTestId('chat-box')).toBeTruthy();
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
