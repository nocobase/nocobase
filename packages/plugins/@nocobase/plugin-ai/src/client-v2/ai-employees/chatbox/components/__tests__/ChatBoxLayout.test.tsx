/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { cleanup, render, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AI_EMPLOYEE_TRIGGER_TASK_EVENT } from '../../../../manager/ai-manager';
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
  const app = {
    eventBus,
    apiClient: {
      resource: vi.fn(),
    },
    pm: {
      get: vi.fn(() => ({
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

vi.mock('@nocobase/client-v2', () => ({
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
  }),
}));

vi.mock('../ChatBox', () => ({
  ChatBox: () => null,
}));

vi.mock('../ChatButton', () => ({
  ChatButton: () => null,
}));

vi.mock('../DebugPanel', () => ({
  DebugPanel: () => null,
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
    runtime.triggerTask.mockClear();
    runtime.loadUnreadCounts.mockClear();
    runtime.onChatBoxMounted.mockClear();
    runtime.onChatBoxUnmounted.mockClear();
    runtime.getAIEmployees.mockClear();
    runtime.app.pm.get.mockClear();
    runtime.app.apiClient.resource.mockClear();
    clearMountedChatBoxes();
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
