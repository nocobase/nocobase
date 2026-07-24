/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React, { type MouseEvent, type ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Conversations } from '../Conversations';
import { useChatConversationsStore } from '../../stores/chat-conversations';
import { CHAT_DEFAULT_SESSION_KEY, useChatMessagesStore } from '../../stores/chat-messages';

const mocks = vi.hoisted(() => ({
  destroy: vi.fn(async () => undefined),
  refresh: vi.fn(),
  startNewConversation: vi.fn(),
}));

vi.mock('antd', async (importOriginal) => {
  const actual = await importOriginal<typeof import('antd')>();
  const MockApp = Object.assign(({ children }: { children?: ReactNode }) => children, {
    useApp: () => ({
      message: { success: vi.fn() },
      modal: {
        confirm: ({ onOk }: { onOk?: () => void | Promise<void> }) => onOk?.(),
      },
    }),
  });
  return { ...actual, App: MockApp };
});

vi.mock('@ant-design/x', async () => {
  const React = await import('react');
  type MockConversationItem = { key: string };
  type MockConversationMenu = (item: MockConversationItem) => {
    onClick: (info: { key: string; domEvent: MouseEvent<HTMLButtonElement> }) => void;
  };
  return {
    Conversations: ({ items = [], menu }: { items?: MockConversationItem[]; menu: MockConversationMenu }) =>
      React.createElement(
        React.Fragment,
        null,
        ...items.map((item) => {
          const menuOptions = menu(item);
          return React.createElement(
            'button',
            {
              key: item.key,
              type: 'button',
              onClick: (event: MouseEvent<HTMLButtonElement>) =>
                menuOptions.onClick({ key: 'delete', domEvent: event }),
            },
            `Delete ${item.key}`,
          );
        }),
      ),
  };
});

vi.mock('@nocobase/client-v2', () => ({
  useApp: () => ({
    apiClient: {
      resource: () => ({ destroy: mocks.destroy, update: vi.fn() }),
    },
  }),
}));

vi.mock('../../../../locale', () => ({
  useT: () => (key: string) => key,
}));

vi.mock('../../hooks/useChatBoxActions', () => ({
  useChatBoxActions: () => ({
    clear: vi.fn(),
    startNewConversation: mocks.startNewConversation,
  }),
}));

vi.mock('../../hooks/useChatConversationActions', () => ({
  useChatConversationActions: () => ({
    refresh: mocks.refresh,
    runSearch: vi.fn(),
    conversationsService: { loading: false },
    lastConversationRef: { current: null },
    unreadCount: 0,
  }),
}));

vi.mock('../../hooks/useChatMessageActions', () => ({
  useChatMessageActions: () => ({
    loadMessages: vi.fn(),
    getConversationLLMActiveState: vi.fn(),
    resumeStream: vi.fn(),
  }),
}));

vi.mock('../../hooks/useWorkflowTasks', () => ({
  useWorkflowTasks: () => ({
    refresh: vi.fn(),
    runSearch: vi.fn(),
    runJobStatusFilter: vi.fn(),
    workflowTasks: [],
    loading: false,
    selectedJobStatus: undefined,
    hasMore: false,
    loadMoreWorkflowTasks: vi.fn(),
    lastWorkflowTaskRef: { current: null },
    unreadCount: 0,
    acceptWorkflowTask: vi.fn(),
    getWorkflowTaskBySession: vi.fn(),
  }),
}));

vi.mock('../../../../repositories/hooks/useAIConfigRepository', () => ({
  useAIConfigRepository: () => ({
    getAIEmployees: vi.fn(async () => []),
    getAIEmployeesMap: () => ({}),
  }),
}));

describe('Conversations workspace lifecycle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useChatConversationsStore.setState({
      currentConversation: 'session-a',
      conversations: [
        {
          sessionId: 'session-a',
          title: 'Workspace conversation',
          aiEmployee: { username: 'nathan', nickname: 'Nathan' },
          read: true,
          updatedAt: '2026-07-24T00:00:00.000Z',
        } as never,
      ],
      keyword: '',
      conversationSegmented: 'conversations',
    });
    useChatMessagesStore.setState({
      sessions: {
        [CHAT_DEFAULT_SESSION_KEY]: useChatMessagesStore.getState().getSessionState('__missing__'),
        'session-a': useChatMessagesStore.getState().getSessionState('__missing__'),
      },
      editorRef: {},
    });
    const store = useChatMessagesStore.getState();
    store.bindSessionCodingTarget('session-a', {
      type: 'workspace',
      applicationKey: 'app-a',
      surfaceId: 'workspace-a',
      kind: 'runjs-studio',
      title: 'Workspace A',
    });
    store.bindSessionCodingTarget('session-a', {
      type: 'workspace',
      applicationKey: 'app-a',
      surfaceId: 'workspace-b',
      kind: 'runjs-studio',
      title: 'Workspace B',
    });
    store.setSessionContextItems('session-a', [
      { type: 'code-workspace', uid: 'workspace-a', content: { surfaceId: 'workspace-a' } },
    ]);
  });

  it('clears the deleted conversation target, mismatch, and context before starting a new conversation', async () => {
    render(<Conversations />);
    await waitFor(() => expect(mocks.refresh).toHaveBeenCalledTimes(1));
    mocks.refresh.mockClear();

    fireEvent.click(screen.getByRole('button', { name: 'Delete session-a' }));

    await waitFor(() => expect(mocks.destroy).toHaveBeenCalledWith({ filterByTk: 'session-a' }));
    expect(useChatMessagesStore.getState().getSessionState('session-a')).toMatchObject({
      codingTarget: undefined,
      codingTargetMismatch: undefined,
      contextItems: [],
    });
    expect(mocks.refresh).toHaveBeenCalledTimes(1);
    expect(mocks.startNewConversation).toHaveBeenCalledTimes(1);
  });
});
