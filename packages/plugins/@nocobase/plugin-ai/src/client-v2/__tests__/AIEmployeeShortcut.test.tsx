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
const addContextItems = vi.fn();
const syncContextAttachments = vi.fn();

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
    triggerTask,
  }),
}));

vi.mock('../ai-employees/chatbox/hooks/useChatMessageActions', () => ({
  useChatMessageActions: () => ({
    syncContextAttachments,
  }),
}));

vi.mock('../ai-employees/chatbox/hooks/useChat', () => ({
  useChat: () => ({
    addContextItems,
  }),
}));

vi.mock('../ai-employees/chatbox/stores/chat-conversations', () => ({
  useChatConversationsStore: {
    use: {
      currentConversation: () => undefined,
    },
  },
}));

describe('AIEmployeeShortcut', () => {
  beforeEach(() => {
    triggerTask.mockClear();
    addContextItems.mockClear();
    syncContextAttachments.mockClear();
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
});
