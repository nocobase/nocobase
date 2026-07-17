/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Conversation } from '../../../ai-employees/types';
import type { ChatBoxRuntime } from '../../../ai-employees/chatbox/stores/runtime';
import {
  Conversations,
  getConversationItems,
  getConversationModel,
} from '../../../ai-employees/chatbox/components/Conversations';

const mocks = vi.hoisted(() => ({
  refresh: vi.fn(),
  runSearch: vi.fn(),
  lastConversationRef: vi.fn(),
  useChatConversationActions: vi.fn(),
  runtime: {
    mode: 'block',
    scope: undefined as string | undefined,
    chatBoxModel: {
      expanded: false,
      setReadonly: vi.fn(),
      setCurrentEmployee: vi.fn(),
      setModel: vi.fn(),
      setShowConversations: vi.fn(),
    },
    chatConversationModel: {
      conversations: [] as Conversation[],
      currentConversation: undefined as string | undefined,
      conversationSegmented: 'workflowTasks',
      keyword: '',
      setKeyword: vi.fn(),
      setCurrentConversation: vi.fn(),
      setConversationSegmented: vi.fn(),
    },
    workflowTaskModel: {
      setCurrentWorkflowTask: vi.fn(),
    },
  },
}));

vi.mock('@nocobase/client-v2', () => ({
  useApp: () => ({
    apiClient: {
      resource: () => ({
        destroy: vi.fn(),
        update: vi.fn(),
      }),
    },
  }),
}));

vi.mock('../../../locale', () => ({
  useT: () => (text: string) => text,
}));

vi.mock('../../../repositories/hooks/useAIConfigRepository', () => ({
  useAIConfigRepository: () => ({
    getAIEmployees: vi.fn().mockResolvedValue([]),
    getAIEmployeesMap: () => ({}),
  }),
}));

vi.mock('../../../ai-employees/chatbox/stores/runtime', () => ({
  useChatBoxRuntime: () => mocks.runtime,
}));

vi.mock('../../../ai-employees/chatbox/hooks/useChatConversationActions', () => ({
  useChatConversationActions: (runtime: ChatBoxRuntime, options?: { scope?: string }) =>
    mocks.useChatConversationActions(runtime, options),
}));

vi.mock('../../../ai-employees/chatbox/hooks/useWorkflowTasks', () => ({
  useWorkflowTasks: () => ({
    refresh: vi.fn(),
    runSearch: vi.fn(),
    runJobStatusFilter: vi.fn(),
    workflowTasks: [],
    loading: false,
    selectedJobStatus: undefined,
    hasMore: false,
    loadMoreWorkflowTasks: vi.fn(),
    lastWorkflowTaskRef: vi.fn(),
    unreadCount: 0,
    acceptWorkflowTask: vi.fn(),
    getWorkflowTaskBySession: vi.fn(),
  }),
}));

vi.mock('../../../ai-employees/chatbox/hooks/useChatMessageActions', () => ({
  useChatMessageActions: () => ({
    loadMessages: vi.fn(),
    getConversationLLMActiveState: vi.fn(),
    resumeStream: vi.fn(),
  }),
}));

vi.mock('../../../ai-employees/chatbox/hooks/useChatBoxActions', () => ({
  useChatBoxActions: () => ({
    clear: vi.fn(),
    startNewConversation: vi.fn(),
  }),
}));

vi.mock('../../../ai-employees/chatbox/hooks/useChat', () => ({
  useChat: () => ({
    for: () => ({
      getState: () => ({ responseLoading: false, abortController: null, messages: [] }),
      setMessages: vi.fn(),
    }),
  }),
}));

vi.mock('@ant-design/x', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@ant-design/x')>();
  return {
    ...actual,
    Conversations: ({
      items,
    }: {
      items?: {
        key: string;
        label?: React.ReactNode;
        icon?: React.ReactNode;
      }[];
    }) => (
      <div data-testid="conversation-list">
        {items?.map((item) => (
          <div key={item.key}>
            {item.label}
            {item.icon ? <span data-testid="unread-icon" /> : null}
          </div>
        ))}
      </div>
    ),
  };
});

describe('AI chat box Conversations', () => {
  beforeEach(() => {
    mocks.runtime.mode = 'block';
    mocks.runtime.scope = undefined;
    mocks.runtime.chatConversationModel.conversations = [];
    mocks.runtime.chatConversationModel.currentConversation = undefined;
    mocks.runtime.chatConversationModel.conversationSegmented = 'workflowTasks';
    mocks.useChatConversationActions.mockReset();
    mocks.useChatConversationActions.mockReturnValue({
      refresh: mocks.refresh,
      runSearch: mocks.runSearch,
      conversationsService: { loading: false },
      lastConversationRef: mocks.lastConversationRef,
    });
  });

  it('uses shared conversation items and resolves conversation model', () => {
    const conversation: Conversation = {
      sessionId: 'session-1',
      title: 'Sales summary',
      updatedAt: '2026-01-01T00:00:00.000Z',
      read: false,
      aiEmployee: { username: 'sales' },
      options: {
        modelSettings: {
          llmService: 'openai',
          model: 'gpt',
        },
      },
    };

    const items = getConversationItems([conversation], (key) => key);
    expect(items?.[0]).toMatchObject({
      key: 'session-1',
      title: 'Sales summary',
      label: 'Sales summary',
      timestamp: new Date('2026-01-01T00:00:00.000Z').getTime(),
    });
    expect(items?.[0]?.icon).toBeTruthy();
    expect(getConversationModel(conversation)).toEqual({
      llmService: 'openai',
      model: 'gpt',
    });
  });

  it('renders only conversations and lets conversation actions read scope from runtime', () => {
    mocks.runtime.scope = 'scope-a';
    mocks.runtime.chatConversationModel.conversations = [
      {
        sessionId: 'session-1',
        title: 'Scoped conversation',
        updatedAt: '2026-01-01T00:00:00.000Z',
        read: false,
        aiEmployee: { username: 'sales' },
      },
    ];
    mocks.useChatConversationActions.mockReturnValue({
      refresh: mocks.refresh,
      runSearch: mocks.runSearch,
      conversationsService: { loading: false },
      lastConversationRef: mocks.lastConversationRef,
    });

    render(<Conversations />);

    expect(mocks.useChatConversationActions).toHaveBeenCalledWith(mocks.runtime, undefined);
    expect(screen.getByTestId('conversation-list')).toHaveTextContent('Scoped conversation');
    expect(screen.queryByText('Workflow tasks')).toBeNull();
    expect(screen.getByTestId('unread-icon')).toBeInTheDocument();
  });

  it('shows the workflow task tab in global mode', () => {
    mocks.runtime.mode = 'global';
    mocks.runtime.chatConversationModel.conversationSegmented = 'conversations';

    render(<Conversations />);

    expect(screen.getByText('Workflow tasks')).toBeInTheDocument();
  });
});
