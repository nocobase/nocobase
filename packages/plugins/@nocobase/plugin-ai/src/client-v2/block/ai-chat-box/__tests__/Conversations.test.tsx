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
import type { FlowModel } from '@nocobase/flow-engine';
import { describe, expect, it, vi } from 'vitest';
import type { Conversation } from '../../../ai-employees/types';
import type { ChatBoxRuntime } from '../../../ai-employees/chatbox/stores/runtime';
import type { AIChatBoxBlockModel } from '../AIChatBoxBlockModel';
import {
  Conversations,
  getAIChatBoxConversationItems,
  getAIChatBoxConversationModel,
} from '../components/Conversations';

const mocks = vi.hoisted(() => ({
  refresh: vi.fn(),
  runSearch: vi.fn(),
  lastConversationRef: vi.fn(),
  useChatConversationActions: vi.fn(),
  runtime: {
    chatBoxModel: {
      setReadonly: vi.fn(),
      setCurrentEmployee: vi.fn(),
      setModel: vi.fn(),
    },
    chatConversationModel: {
      conversations: [] as Conversation[],
      currentConversation: undefined as string | undefined,
      keyword: '',
      setKeyword: vi.fn(),
      setCurrentConversation: vi.fn(),
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

const makeModel = (scope?: string): AIChatBoxBlockModel => {
  return {
    uid: 'chat-box-1',
    props: { scope },
    mapSubModels: (_subKey: string, _callback: (model: FlowModel, index: number) => unknown) => [],
  } as AIChatBoxBlockModel;
};

describe('AI chat box Conversations', () => {
  it('builds conversation items without unread dot and resolves conversation model', () => {
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

    expect(getAIChatBoxConversationItems([conversation], (key) => key)).toEqual([
      {
        key: 'session-1',
        title: 'Sales summary',
        label: 'Sales summary',
        timestamp: new Date('2026-01-01T00:00:00.000Z').getTime(),
      },
    ]);
    expect(getAIChatBoxConversationModel(conversation)).toEqual({
      llmService: 'openai',
      model: 'gpt',
    });
  });

  it('renders only conversations and passes scope to conversation actions', () => {
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

    render(<Conversations model={makeModel('scope-a')} />);

    expect(mocks.useChatConversationActions).toHaveBeenCalledWith(mocks.runtime, { scope: 'scope-a' });
    expect(screen.getByTestId('conversation-list')).toHaveTextContent('Scoped conversation');
    expect(screen.queryByText('Workflow tasks')).toBeNull();
    expect(screen.queryByTestId('unread-icon')).toBeNull();
  });
});
