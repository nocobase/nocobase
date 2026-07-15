/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ChatButton } from '../../components/ChatButton';
import { ChatBoxRuntimeProvider, createChatBoxRuntime, type ChatBoxRuntime } from '../runtime';

const mocks = vi.hoisted(() => ({
  getAIEmployees: vi.fn(),
  setResponseLoading: vi.fn(),
  switchAIEmployee: vi.fn(),
}));

vi.mock('@nocobase/flow-engine', async () => {
  const actual = await vi.importActual<typeof import('@nocobase/flow-engine')>('@nocobase/flow-engine');
  return {
    ...actual,
    useFlowContext: () => ({
      pageInfo: {
        version: 'v2',
      },
    }),
  };
});

vi.mock('react-router-dom', () => ({
  useLocation: () => ({
    pathname: '/admin',
  }),
}));

vi.mock('../../../../locale', () => ({
  useT: () => (text: string) => text,
}));

vi.mock('../../../../repositories/hooks/useAIConfigRepository', () => ({
  useAIConfigRepository: () => ({
    aiEmployees: [
      {
        username: 'atlas',
        nickname: 'Atlas',
        builtIn: true,
      },
    ],
    getAIEmployees: mocks.getAIEmployees,
  }),
}));

vi.mock('../../hooks/useChat', () => ({
  useChat: () => ({
    setResponseLoading: mocks.setResponseLoading,
  }),
}));

vi.mock('../../hooks/useChatBoxActions', () => ({
  useChatBoxActions: () => ({
    switchAIEmployee: mocks.switchAIEmployee,
  }),
}));

vi.mock('../../hooks/useChatConversationActions', () => ({
  useChatConversationActions: () => ({
    unreadCount: 0,
  }),
}));

vi.mock('../../hooks/useWorkflowTasks', () => ({
  useWorkflowTasks: () => ({
    unreadCount: 0,
  }),
}));

const renderWithRuntime = (runtime: ChatBoxRuntime) => {
  return render(
    <ChatBoxRuntimeProvider runtime={runtime}>
      <ChatButton />
    </ChatBoxRuntimeProvider>,
  );
};

describe('global chatbox behavior', () => {
  beforeEach(() => {
    mocks.getAIEmployees.mockResolvedValue(undefined);
    mocks.setResponseLoading.mockClear();
    mocks.switchAIEmployee.mockClear();
  });

  afterEach(() => {
    mocks.getAIEmployees.mockReset();
  });

  it('opens the global runtime and selects the leader employee from ChatButton', () => {
    const runtime = createChatBoxRuntime();

    renderWithRuntime(runtime);

    fireEvent.click(screen.getByRole('button', { name: 'Open AI chat' }));

    expect(runtime.chatBoxModel.open).toBe(true);
    expect(runtime.chatBoxModel.readonly).toBe(false);
    expect(mocks.setResponseLoading).toHaveBeenCalledWith(false);
    expect(mocks.switchAIEmployee).toHaveBeenCalledWith({
      username: 'atlas',
      nickname: 'Atlas',
      builtIn: true,
    });
  });
});
