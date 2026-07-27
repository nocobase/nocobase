/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AIEmployee, Task } from '../ai-employees/types';
import { AIEmployeeShortcut } from '../ai-employees/AIEmployeeShortcut';

const triggerTask = vi.fn().mockResolvedValue(undefined);
const clear = vi.fn();
const addContextItems = vi.fn();
const addExistingConversationContextItems = vi.fn();
const syncContextAttachments = vi.fn();
let currentConversation: string | undefined;
const chatFor = vi.fn((sessionId?: string) => ({
  addContextItems: sessionId ? addExistingConversationContextItems : addContextItems,
}));

const employee: AIEmployee = {
  username: 'atlas',
  nickname: 'Atlas',
  avatar: 'baseBlue',
};

vi.mock('antd', async () => {
  const actual = await vi.importActual<typeof import('antd')>('antd');
  return {
    ...actual,
    Popover: ({ children, content }: { children: React.ReactNode; content: React.ReactNode }) => (
      <div>
        {children}
        {content}
      </div>
    ),
  };
});

vi.mock('ahooks', () => ({
  useRequest: () => ({
    data: [employee],
    loading: false,
  }),
}));

vi.mock('@nocobase/flow-engine', async () => {
  const actual = await vi.importActual<typeof import('@nocobase/flow-engine')>('@nocobase/flow-engine');
  return {
    ...actual,
    useFlowContext: () => ({
      app: {
        apiClient: {
          resource: () => ({
            listByUser: vi.fn(),
          }),
        },
      },
      engine: {
        getModel: () => true,
      },
      model: {
        parent: undefined,
      },
    }),
  };
});

vi.mock('../ai-employees/chatbox/hooks/useChatBoxActions', () => ({
  useChatBoxActions: () => ({
    clear,
    triggerTask,
  }),
}));

vi.mock('../ai-employees/chatbox/hooks/useChatMessageActions', () => ({
  useChatMessageActions: () => ({
    syncContextAttachments,
  }),
}));

vi.mock('../ai-employees/chatbox/hooks/useChat', () => ({
  useChat: (sessionId?: string) => ({
    addContextItems: sessionId ? addExistingConversationContextItems : addContextItems,
    for: chatFor,
  }),
}));

vi.mock('../ai-employees/chatbox/stores/chat-conversations', () => ({
  useChatConversationsStore: {
    use: {
      currentConversation: () => currentConversation,
    },
    getState: () => ({ currentConversation }),
  },
}));

describe('AIEmployeeShortcut', () => {
  beforeEach(() => {
    triggerTask.mockReset().mockResolvedValue(undefined);
    clear.mockClear();
    addContextItems.mockClear();
    addExistingConversationContextItems.mockClear();
    syncContextAttachments.mockClear();
    chatFor.mockClear();
    currentConversation = undefined;
  });

  it('triggers a popover task like v1 without inheriting shortcut auto=false', async () => {
    const task: Task = { title: 'Analyze record' };
    const workContext = [{ type: 'flow-model' as const, uid: 'block-1' }];

    render(<AIEmployeeShortcut aiEmployee={employee} tasks={[task]} context={{ workContext }} auto={false} />);

    fireEvent.click(screen.getByText('Analyze record'));

    await waitFor(() => {
      expect(triggerTask).toHaveBeenCalledWith({
        aiEmployee: employee,
        tasks: [task],
      });
    });
    expect(triggerTask).not.toHaveBeenCalledWith(expect.objectContaining({ auto: false }));
    expect(addContextItems).toHaveBeenCalledWith(workContext);
    expect(syncContextAttachments).toHaveBeenCalledWith(workContext);
    expect(addContextItems.mock.invocationCallOrder[0]).toBeLessThan(triggerTask.mock.invocationCallOrder[0]);
  });

  it('syncs attachments but clears the draft composer after auto-sending the default task', async () => {
    const task: Task = { title: 'Analyze record', autoSend: true };
    const workContext = [{ type: 'flow-model' as const, uid: 'block-1' }];

    const { container } = render(<AIEmployeeShortcut aiEmployee={employee} tasks={[task]} context={{ workContext }} />);

    const shortcut = container.querySelector('.ant-avatar');
    expect(shortcut).toBeTruthy();
    fireEvent.click(shortcut);

    await waitFor(() => {
      expect(triggerTask).toHaveBeenCalledWith({
        aiEmployee: employee,
        tasks: [task],
        auto: undefined,
      });
    });
    expect(addContextItems).toHaveBeenCalledWith(workContext);
    expect(syncContextAttachments).toHaveBeenCalledWith(workContext);
    expect(clear).toHaveBeenCalledWith(undefined, undefined);
    expect(addContextItems.mock.invocationCallOrder[0]).toBeLessThan(clear.mock.invocationCallOrder[0]);
  });

  it('syncs shortcut context to the new draft when replacing an existing conversation', async () => {
    const task: Task = { title: 'Analyze record' };
    const workContext = [{ type: 'flow-model' as const, uid: 'block-1' }];
    currentConversation = 'session-1';
    triggerTask.mockImplementation(async () => {
      currentConversation = undefined;
    });

    const { container } = render(<AIEmployeeShortcut aiEmployee={employee} tasks={[task]} context={{ workContext }} />);

    const shortcut = container.querySelector('.ant-avatar');
    expect(shortcut).toBeTruthy();
    fireEvent.click(shortcut);

    await waitFor(() => {
      expect(chatFor).toHaveBeenCalledWith(undefined);
    });
    expect(addContextItems).toHaveBeenCalledWith(workContext);
    expect(addExistingConversationContextItems).not.toHaveBeenCalled();
    expect(syncContextAttachments).toHaveBeenCalledWith(workContext);
  });
});
