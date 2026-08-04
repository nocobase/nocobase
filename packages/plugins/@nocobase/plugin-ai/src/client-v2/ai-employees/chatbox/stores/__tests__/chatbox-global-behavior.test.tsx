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
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ChatButton } from '../../components/ChatButton';
import { ChatBoxRuntimeProvider, createChatBoxRuntime, type ChatBoxRuntime } from '../runtime';

const mocks = vi.hoisted(() => ({
  getAIEmployees: vi.fn(),
  setResponseLoading: vi.fn(),
  switchAIEmployee: vi.fn(),
  publicPath: '/',
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

vi.mock('@nocobase/client-v2', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@nocobase/client-v2')>()),
  useApp: () => ({ getPublicPath: () => mocks.publicPath }),
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

const renderWithRuntime = (runtime: ChatBoxRuntime, initialEntry = '/customer1') => {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <ChatBoxRuntimeProvider runtime={runtime}>
        <ChatButton />
      </ChatBoxRuntimeProvider>
    </MemoryRouter>,
  );
};

describe('global chatbox behavior', () => {
  beforeEach(() => {
    mocks.publicPath = '/';
    window.history.replaceState({}, '', '/v/customer1');
    mocks.getAIEmployees.mockResolvedValue(undefined);
    mocks.setResponseLoading.mockClear();
    mocks.switchAIEmployee.mockClear();
  });

  afterEach(() => {
    window.history.replaceState({}, '', '/');
    mocks.getAIEmployees.mockReset();
  });

  it('opens the global runtime from a non-default portal and selects the leader employee', () => {
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

  it('renders the entry on /admin routes', () => {
    window.history.replaceState({}, '', '/admin');
    const runtime = createChatBoxRuntime();

    renderWithRuntime(runtime, '/admin');

    expect(screen.getByRole('button', { name: 'Open AI chat' })).toBeTruthy();
  });

  it('renders the entry on a Portal route under a public path prefix', () => {
    mocks.publicPath = '/nocobase/';
    window.history.replaceState({}, '', '/nocobase/v/custom');
    const runtime = createChatBoxRuntime();

    renderWithRuntime(runtime, '/custom');

    expect(screen.getByRole('button', { name: 'Open AI chat' })).toBeTruthy();
  });

  it('hides the entry for a non-V2 route under the public path', () => {
    mocks.publicPath = '/nocobase/';
    window.history.replaceState({}, '', '/nocobase/custom');
    const runtime = createChatBoxRuntime();

    renderWithRuntime(runtime, '/custom');

    expect(screen.queryByRole('button', { name: 'Open AI chat' })).toBeNull();
  });
});
