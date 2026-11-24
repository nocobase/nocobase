/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { CurrentUserContext } from '@nocobase/client-v2';
import { act, cleanup, render, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AIManager, AI_EMPLOYEE_TRIGGER_TASK_EVENT } from '../../../../manager/ai-manager';
import { clearMountedChatBoxes, registerMountedChatBox } from '../../stores/mounted-chat-boxes';
import { getGlobalChatBoxRuntime } from '../../stores/runtime';
import type { RunJSAIEmployeeTriggerTaskOptions } from '../../utils';
import { ChatBoxLayout } from '../ChatBoxLayout';

const runtime = vi.hoisted(() => {
  const eventBus = new EventTarget();
  const triggerTask = vi.fn().mockResolvedValue(undefined);
  const loadUnreadCounts = vi.fn().mockResolvedValue(undefined);
  const onChatBoxMounted = vi.fn();
  const onChatBoxUnmounted = vi.fn();
  const getAIEmployees = vi.fn().mockResolvedValue([{ username: 'nathan', nickname: 'Nathan' }]);
  const refreshAIEmployees = vi.fn().mockResolvedValue([]);
  const app = {
    eventBus,
    apiClient: {
      auth: { token: 'test-token' },
      resource: vi.fn(),
      request: vi.fn(),
    },
    flowEngine: { getModel: vi.fn() },
    pm: {
      get: vi.fn((): { aiManager: Pick<AIManager, 'onChatBoxMounted' | 'onChatBoxUnmounted'> } => ({
        aiManager: {
          onChatBoxMounted,
          onChatBoxUnmounted,
        },
      })),
    },
  };

  return {
    app,
    eventBus,
    triggerTask,
    loadUnreadCounts,
    onChatBoxMounted,
    onChatBoxUnmounted,
    getAIEmployees,
    refreshAIEmployees,
  };
});

vi.mock('antd', async (importOriginal) => {
  const actual = await importOriginal<typeof import('antd')>();
  const ReactModule = await import('react');
  return {
    ...actual,
    Card: ({ children }: { children?: React.ReactNode }) => ReactModule.createElement('div', null, children),
    Grid: {
      ...actual.Grid,
      useBreakpoint: () => ({ md: true }),
    },
    theme: {
      ...actual.theme,
      useToken: () => ({
        token: {
          colorBgContainer: '#fff',
        },
      }),
    },
  };
});

vi.mock('@nocobase/client-v2', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@nocobase/client-v2')>()),
  useApp: () => runtime.app,
  useMobileLayout: () => ({ isMobileLayout: false }),
}));

vi.mock('../../hooks/useChatConversationActions', () => ({
  useChatConversationActions: () => ({
    loadUnreadCounts: runtime.loadUnreadCounts,
  }),
}));

vi.mock('../../hooks/useChatBoxActions', () => ({
  useChatBoxActions: () => ({
    triggerTask: runtime.triggerTask,
  }),
}));

vi.mock('../../../../repositories/hooks/useAIConfigRepository', () => ({
  useAIConfigRepository: () => ({
    getAIEmployees: runtime.getAIEmployees,
    refreshAIEmployees: runtime.refreshAIEmployees,
  }),
}));

vi.mock('../ChatBox', () => ({
  ChatBox: () => null,
}));

vi.mock('../ChatButton', () => ({
  ChatButton: () => null,
}));

vi.mock('../ToolModal', () => ({
  ToolModal: () => null,
}));

vi.mock('../../../AISelection', () => ({
  AISelection: () => null,
}));

vi.mock('../../../AISelectionControl', () => ({
  AISelectionControl: () => null,
}));

describe('ChatBoxLayout AI employee task bridge', () => {
  afterEach(() => {
    cleanup();
    runtime.app.apiClient.auth.token = 'test-token';
    runtime.triggerTask.mockClear();
    runtime.loadUnreadCounts.mockClear();
    runtime.onChatBoxMounted.mockClear();
    runtime.onChatBoxUnmounted.mockClear();
    runtime.getAIEmployees.mockClear();
    runtime.refreshAIEmployees.mockClear();
    runtime.app.pm.get.mockClear();
    runtime.app.apiClient.resource.mockClear();
    clearMountedChatBoxes();
  });

  it('loads employee data and subscribes to unread refreshes only for a signed-in user', () => {
    const layout = (id?: number) => (
      <CurrentUserContext.Provider value={{ loading: false, data: { data: id == null ? undefined : { id } } }}>
        <ChatBoxLayout>
          <input aria-label="page" />
        </ChatBoxLayout>
      </CurrentUserContext.Provider>
    );
    const refresh = () => {
      runtime.eventBus.dispatchEvent(new Event('ws:message:ai-employee-tasks:status'));
      runtime.eventBus.dispatchEvent(new Event('ws:message:ai-conversations:read'));
    };
    const { getByRole, rerender } = render(layout());
    const pageInput = getByRole('textbox');
    refresh();
    expect(runtime.refreshAIEmployees).not.toHaveBeenCalled();
    expect(runtime.loadUnreadCounts).not.toHaveBeenCalled();

    rerender(layout(1));
    expect(runtime.refreshAIEmployees).toHaveBeenCalledTimes(1);
    expect(runtime.loadUnreadCounts).toHaveBeenCalledTimes(1);
    refresh();
    expect(runtime.loadUnreadCounts).toHaveBeenCalledTimes(3);

    act(() => {
      runtime.app.apiClient.auth.token = '';
      runtime.eventBus.dispatchEvent(new Event('auth:tokenChanged'));
    });
    refresh();
    expect(runtime.refreshAIEmployees).toHaveBeenCalledTimes(1);
    expect(runtime.loadUnreadCounts).toHaveBeenCalledTimes(3);

    rerender(layout(2));
    expect(runtime.refreshAIEmployees).toHaveBeenCalledTimes(1);
    expect(runtime.loadUnreadCounts).toHaveBeenCalledTimes(3);
    act(() => {
      runtime.app.apiClient.auth.token = 'new-token';
      runtime.eventBus.dispatchEvent(new Event('auth:tokenChanged'));
    });
    refresh();
    expect(runtime.refreshAIEmployees).toHaveBeenCalledTimes(2);
    expect(runtime.loadUnreadCounts).toHaveBeenCalledTimes(6);
    expect(getByRole('textbox')).toBe(pageInput);
    expect(runtime.onChatBoxMounted).toHaveBeenCalledTimes(1);
    expect(runtime.onChatBoxUnmounted).not.toHaveBeenCalled();
  });

  it('delivers a RunJS task to a V2 embedded chat block with a page-scoped current user', async () => {
    const manager = new AIManager(runtime.app);
    runtime.app.pm.get.mockReturnValueOnce({ aiManager: manager });
    const target = vi.fn().mockResolvedValue(undefined);
    registerMountedChatBox({
      uid: 'embedded-chat',
      runtime: getGlobalChatBoxRuntime(),
      triggerTask: target,
      clear: vi.fn(),
      syncContextItems: vi.fn(),
    });
    const task = { title: 'Write in embedded chat' };
    // V2 EmbedAccessGuard provides the authenticated user inside the page, below the global chat layout.
    const { getByRole } = render(
      <ChatBoxLayout>
        <CurrentUserContext.Provider value={{ loading: false, data: { data: { id: 7 } } }}>
          <button
            onClick={() => manager.triggerTask({ aiEmployee: 'nathan', tasks: [task], chatBoxUid: 'embedded-chat' })}
          >
            Run embedded task
          </button>
        </CurrentUserContext.Provider>
      </ChatBoxLayout>,
    );
    expect(runtime.refreshAIEmployees).not.toHaveBeenCalled();
    expect(runtime.loadUnreadCounts).not.toHaveBeenCalled();
    getByRole('button', { name: 'Run embedded task' }).click();
    await waitFor(() =>
      expect(target).toHaveBeenCalledWith({
        aiEmployee: { username: 'nathan', nickname: 'Nathan' },
        tasks: [task],
        chatBoxUid: 'embedded-chat',
      }),
    );
    expect(runtime.triggerTask).not.toHaveBeenCalled();
  });

  it('calls hook triggerTask after receiving an AI employee task event', async () => {
    render(<ChatBoxLayout />);

    await waitFor(() => {
      expect(runtime.onChatBoxMounted).toHaveBeenCalledTimes(1);
    });

    const options: RunJSAIEmployeeTriggerTaskOptions = {
      aiEmployee: 'nathan',
      tasks: [{ title: 'Write report' }],
      open: true,
    };
    runtime.eventBus.dispatchEvent(new CustomEvent(AI_EMPLOYEE_TRIGGER_TASK_EVENT, { detail: options }));

    await waitFor(() => {
      expect(runtime.triggerTask).toHaveBeenCalledWith({
        aiEmployee: { username: 'nathan', nickname: 'Nathan' },
        tasks: [{ title: 'Write report' }],
        open: true,
      });
    });
  });

  it('routes event tasks to the mounted AI chat box selected by chatBoxUid', async () => {
    const targetTriggerTask = vi.fn().mockResolvedValue(undefined);
    registerMountedChatBox({
      uid: 'chat-box-1',
      runtime: getGlobalChatBoxRuntime(),
      triggerTask: targetTriggerTask,
      clear: vi.fn(),
      syncContextItems: vi.fn(),
    });

    render(<ChatBoxLayout />);

    await waitFor(() => {
      expect(runtime.onChatBoxMounted).toHaveBeenCalledTimes(1);
    });

    const options: RunJSAIEmployeeTriggerTaskOptions = {
      aiEmployee: 'nathan',
      tasks: [{ title: 'Write in block' }],
      chatBoxUid: 'chat-box-1',
      open: true,
    };
    runtime.eventBus.dispatchEvent(new CustomEvent(AI_EMPLOYEE_TRIGGER_TASK_EVENT, { detail: options }));

    await waitFor(() => {
      expect(targetTriggerTask).toHaveBeenCalledWith({
        aiEmployee: { username: 'nathan', nickname: 'Nathan' },
        tasks: [{ title: 'Write in block' }],
        chatBoxUid: 'chat-box-1',
        open: true,
      });
    });
    expect(runtime.triggerTask).not.toHaveBeenCalled();
  });

  it('does not route ctx.ai event tasks by tasks[].chatBoxUid', async () => {
    const targetTriggerTask = vi.fn().mockResolvedValue(undefined);
    registerMountedChatBox({
      uid: 'chat-box-1',
      runtime: getGlobalChatBoxRuntime(),
      triggerTask: targetTriggerTask,
      clear: vi.fn(),
      syncContextItems: vi.fn(),
    });

    render(<ChatBoxLayout />);

    await waitFor(() => {
      expect(runtime.onChatBoxMounted).toHaveBeenCalledTimes(1);
    });

    const options: RunJSAIEmployeeTriggerTaskOptions = {
      aiEmployee: 'nathan',
      tasks: [{ title: 'Write globally', chatBoxUid: 'chat-box-1' }],
      open: true,
    };
    runtime.eventBus.dispatchEvent(new CustomEvent(AI_EMPLOYEE_TRIGGER_TASK_EVENT, { detail: options }));

    await waitFor(() => {
      expect(runtime.triggerTask).toHaveBeenCalledWith({
        aiEmployee: { username: 'nathan', nickname: 'Nathan' },
        tasks: [{ title: 'Write globally', chatBoxUid: 'chat-box-1' }],
        open: true,
      });
    });
    expect(targetTriggerTask).not.toHaveBeenCalled();
  });

  it('marks the ChatBox unmounted before removing the bridge listener', async () => {
    const { unmount } = render(<ChatBoxLayout />);

    await waitFor(() => {
      expect(runtime.onChatBoxMounted).toHaveBeenCalledTimes(1);
    });

    unmount();

    expect(runtime.onChatBoxUnmounted).toHaveBeenCalledTimes(1);
    runtime.eventBus.dispatchEvent(
      new CustomEvent(AI_EMPLOYEE_TRIGGER_TASK_EVENT, {
        detail: {
          aiEmployee: 'nathan',
          tasks: [{ title: 'Ignored after unmount' }],
        } satisfies RunJSAIEmployeeTriggerTaskOptions,
      }),
    );
    expect(runtime.triggerTask).not.toHaveBeenCalled();
  });
});
