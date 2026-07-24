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
import type { AIEmployee, ContextItem, Task } from '../ai-employees/types';
import { AIEmployeeShortcut } from '../ai-employees/AIEmployeeShortcut';
import {
  ChatBoxRuntimeProvider,
  createChatBoxRuntime,
  getGlobalChatBoxRuntime,
  type ChatBoxRuntime,
} from '../ai-employees/chatbox/stores/runtime';
import { clearMountedChatBoxes, registerMountedChatBox } from '../ai-employees/chatbox/stores/mounted-chat-boxes';
import { AIEmployeeButtonModel } from '../models/ai-employees';

const triggerTask = vi.fn().mockResolvedValue(undefined);
const clear = vi.fn();
const addContextItems = vi.fn();
const addContextItemsForSession = vi.fn();
const syncContextAttachments = vi.fn();
const messageError = vi.fn();
const actionRuntimes: ChatBoxRuntime[] = [];

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

vi.mock('ahooks', async () => {
  const actual = await vi.importActual<typeof import('ahooks')>('ahooks');
  return {
    ...actual,
    useRequest: () => ({
      data: [employee],
      loading: false,
    }),
  };
});

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
      message: {
        error: messageError,
      },
    }),
  };
});

vi.mock('../locale', () => ({
  tExpr: (text: string) => text,
  useT: () => (text: string, params?: { uid?: string }) => (params?.uid ? `${text}:${params.uid}` : text),
}));

vi.mock('../ai-employees/chatbox/hooks/useChatBoxActions', () => ({
  useChatBoxActions: (runtime: ChatBoxRuntime) => {
    actionRuntimes.push(runtime);
    return {
      clear,
      triggerTask,
    };
  },
}));

vi.mock('../ai-employees/chatbox/hooks/useChatMessageActions', () => ({
  useChatMessageActions: () => ({
    syncContextAttachments,
  }),
}));

vi.mock('../ai-employees/chatbox/hooks/useChat', () => ({
  useChat: (sessionId: string | undefined, runtime: ChatBoxRuntime) => {
    const addItems = (targetSessionId: string | undefined, items: ContextItem | ContextItem[]) => {
      addContextItems(items);
      addContextItemsForSession(targetSessionId, items);
      runtime.chatMessageModel.addSessionContextItems(targetSessionId, items);
    };
    return {
      addContextItems: (items: ContextItem | ContextItem[]) => addItems(sessionId, items),
      for: (targetSessionId?: string) => ({
        addContextItems: (items: ContextItem | ContextItem[]) => addItems(targetSessionId, items),
      }),
    };
  },
}));

describe('AIEmployeeShortcut', () => {
  beforeEach(() => {
    triggerTask.mockClear();
    clear.mockClear();
    addContextItems.mockClear();
    addContextItemsForSession.mockClear();
    syncContextAttachments.mockClear();
    messageError.mockClear();
    actionRuntimes.length = 0;
    clearMountedChatBoxes();
    getGlobalChatBoxRuntime().chatConversationModel.setCurrentConversation(undefined);
  });

  it('syncs shortcut context to the new draft after replacing an existing conversation', async () => {
    const runtime = createChatBoxRuntime();
    const workContext = [{ type: 'flow-model' as const, uid: 'block-1' }];
    runtime.chatConversationModel.setCurrentConversation('session-1');
    triggerTask.mockImplementationOnce(async () => {
      runtime.chatConversationModel.setCurrentConversation(undefined);
    });

    const { container } = render(
      <AIEmployeeShortcut aiEmployee={employee} context={{ workContext }} runtime={runtime} />,
    );

    const shortcut = container.querySelector('.ant-avatar');
    expect(shortcut).toBeTruthy();
    fireEvent.click(shortcut);

    await waitFor(() => {
      expect(addContextItemsForSession).toHaveBeenCalledWith(undefined, workContext);
    });
    expect(runtime.chatMessageModel.getSessionState(undefined).contextItems).toEqual(workContext);
    expect(runtime.chatMessageModel.getSessionState('session-1').contextItems).toEqual([]);
  });

  it('triggers a popover task like v1 without inheriting shortcut auto=false', async () => {
    const task: Task = { title: 'Analyze record' };
    const workContext = [{ type: 'flow-model' as const, uid: 'block-1' }];

    render(
      <AIEmployeeShortcut
        aiEmployee={employee}
        tasks={[task]}
        context={{ workContext }}
        auto={false}
        runtime={getGlobalChatBoxRuntime()}
      />,
    );

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

    const { container } = render(
      <AIEmployeeShortcut
        aiEmployee={employee}
        tasks={[task]}
        context={{ workContext }}
        runtime={getGlobalChatBoxRuntime()}
      />,
    );

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

  it('routes a task to the mounted AI chat box selected by chatBoxUid', async () => {
    const task: Task = { title: 'Analyze in block', chatBoxUid: 'chat-box-1' };
    const workContext = [{ type: 'flow-model' as const, uid: 'block-1' }];
    const targetTriggerTask = vi.fn().mockResolvedValue(undefined);
    const targetClear = vi.fn();
    const targetSyncContextItems = vi.fn();
    registerMountedChatBox({
      uid: 'chat-box-1',
      runtime: getGlobalChatBoxRuntime(),
      triggerTask: targetTriggerTask,
      clear: targetClear,
      syncContextItems: targetSyncContextItems,
    });

    render(
      <AIEmployeeShortcut
        aiEmployee={employee}
        tasks={[task]}
        context={{ workContext }}
        runtime={getGlobalChatBoxRuntime()}
      />,
    );

    fireEvent.click(screen.getByText('Analyze in block'));

    await waitFor(() => {
      expect(targetTriggerTask).toHaveBeenCalledWith({
        aiEmployee: employee,
        tasks: [task],
      });
    });
    expect(triggerTask).not.toHaveBeenCalled();
    expect(targetSyncContextItems).toHaveBeenCalledWith(workContext);
    expect(addContextItems).not.toHaveBeenCalled();
  });

  it('routes direct avatar clicks to the mounted AI chat box when its default task has chatBoxUid', async () => {
    const task: Task = { chatBoxUid: 'chat-box-1' };
    const targetTriggerTask = vi.fn().mockResolvedValue(undefined);
    const targetClear = vi.fn();
    const targetSyncContextItems = vi.fn();
    registerMountedChatBox({
      uid: 'chat-box-1',
      runtime: getGlobalChatBoxRuntime(),
      triggerTask: targetTriggerTask,
      clear: targetClear,
      syncContextItems: targetSyncContextItems,
    });

    const { container } = render(
      <AIEmployeeShortcut aiEmployee={employee} tasks={[task]} runtime={getGlobalChatBoxRuntime()} />,
    );

    const shortcut = container.querySelector('.ant-avatar');
    expect(shortcut).toBeTruthy();
    fireEvent.click(shortcut);

    await waitFor(() => {
      expect(targetTriggerTask).toHaveBeenCalledWith({
        aiEmployee: employee,
        tasks: [task],
        auto: undefined,
      });
    });
    expect(triggerTask).not.toHaveBeenCalled();
  });

  it('uses the surrounding block runtime for AI employee buttons inside an AI chat box', async () => {
    const blockRuntime = createChatBoxRuntime({ mode: 'block', getScope: async () => 'chat-box-1' });
    const model = Object.create(AIEmployeeButtonModel.prototype) as AIEmployeeButtonModel;
    model.props = {
      aiEmployee: {
        username: 'atlas',
      },
      context: {
        workContext: [{ type: 'flow-model', uid: 'chat-box-1' }],
      },
    };
    model.parent = {
      uid: 'chat-box-1',
      use: 'AIChatBoxBlockModel',
    } as AIEmployeeButtonModel['parent'];

    const { container } = render(
      <ChatBoxRuntimeProvider runtime={blockRuntime}>{model.render()}</ChatBoxRuntimeProvider>,
    );

    const shortcut = container.querySelector('.ant-avatar');
    expect(shortcut).toBeTruthy();
    fireEvent.click(shortcut);

    await waitFor(() => {
      expect(triggerTask).toHaveBeenCalledWith({
        aiEmployee: employee,
        tasks: undefined,
        auto: undefined,
      });
    });
    expect(actionRuntimes).toContain(blockRuntime);
    expect(actionRuntimes).not.toContain(getGlobalChatBoxRuntime());
    expect(addContextItems).not.toHaveBeenCalled();
    expect(syncContextAttachments).not.toHaveBeenCalled();
  });

  it('reports a missing target AI chat box without falling back to the global chatbox', async () => {
    const task: Task = { title: 'Analyze in missing block', chatBoxUid: 'missing-chat-box' };

    render(<AIEmployeeShortcut aiEmployee={employee} tasks={[task]} runtime={getGlobalChatBoxRuntime()} />);

    fireEvent.click(screen.getByText('Analyze in missing block'));

    await waitFor(() => {
      expect(messageError).toHaveBeenCalledWith('AI chat box not found:missing-chat-box');
    });
    expect(triggerTask).not.toHaveBeenCalled();
  });
});
