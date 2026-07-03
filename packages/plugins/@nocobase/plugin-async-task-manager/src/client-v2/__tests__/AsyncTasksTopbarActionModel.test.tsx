/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Modal } from 'antd';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TASK_STATUS } from '../../common/constants';
import type { AsyncTaskRecord, PluginAsyncTaskManagerClientV2 } from '../plugin';
import { AsyncTasksTopbarActionModel } from '../models/AsyncTasksTopbarActionModel';

const mocks = vi.hoisted(() => ({
  app: undefined as unknown,
  isMobileLayout: false,
  requestState: {
    data: { data: [] },
    refresh: vi.fn(),
    loading: false,
  },
  lastService: undefined as undefined | (() => Promise<unknown>),
}));

vi.mock('@nocobase/client-v2', () => ({
  Icon: ({ type }: { type: string }) => <span data-testid={`icon-${type}`} />,
  TopbarActionModel: class TopbarActionModel {},
  useApp: () => mocks.app,
  useMobileLayout: () => ({ isMobileLayout: mocks.isMobileLayout }),
}));

vi.mock('@nocobase/flow-engine', () => ({
  observer: (Component: React.ComponentType) => Component,
  tExpr: (key: string) => `expr:${key}`,
  useFlowEngine: () => ({
    context: {
      t: (key: string) => key,
    },
  }),
}));

vi.mock('ahooks', () => ({
  useRequest: (service: () => Promise<unknown>) => {
    mocks.lastService = service;
    return mocks.requestState;
  },
}));

function createApp(options: { taskOrigin?: unknown } = {}) {
  const taskResource = {
    list: vi.fn().mockResolvedValue({ data: { data: [] } }),
    stop: vi.fn().mockResolvedValue({}),
  };
  const eventBus = new EventTarget();
  const plugin = {
    taskOrigins: {
      get: vi.fn(() => options.taskOrigin),
    },
  } as unknown as PluginAsyncTaskManagerClientV2;
  const app = {
    apiClient: {
      resource: vi.fn(() => taskResource),
    },
    eventBus,
    pm: {
      get: vi.fn((name: string) =>
        name === 'async-task-manager' || name === '@nocobase/plugin-async-task-manager' ? plugin : undefined,
      ),
    },
  };

  return { app, eventBus, plugin, taskResource };
}

function renderModel(tasks: AsyncTaskRecord[], options: { isMobileLayout?: boolean; taskOrigin?: unknown } = {}) {
  const refresh = vi.fn();
  const { app, eventBus, plugin, taskResource } = createApp({ taskOrigin: options.taskOrigin });
  mocks.app = app;
  mocks.isMobileLayout = options.isMobileLayout ?? false;
  mocks.requestState = {
    data: { data: tasks },
    refresh,
    loading: false,
  };

  const model = new AsyncTasksTopbarActionModel();
  const result = render(<>{model.render()}</>);

  return { ...result, app, eventBus, plugin, refresh, taskResource };
}

describe('AsyncTasksTopbarActionModel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
    mocks.app = undefined;
    mocks.isMobileLayout = false;
    mocks.requestState = {
      data: { data: [] },
      refresh: vi.fn(),
      loading: false,
    };
    mocks.lastService = undefined;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('exposes topbar action metadata', () => {
    const model = new AsyncTasksTopbarActionModel();

    expect(model.sort).toBe(300);
    expect(model.actionId).toBe('async-tasks');
    expect(model.testId).toBe('async-tasks-button');
    expect(model.tooltip).toBe('expr:Async tasks');
  });

  it('does not render when there are no tasks or when the layout is mobile', () => {
    renderModel([]);
    expect(screen.queryByTestId('async-tasks-button')).not.toBeInTheDocument();

    renderModel([{ id: 'task-1', title: 'Import users', status: TASK_STATUS.RUNNING }], { isMobileLayout: true });
    expect(screen.queryByTestId('async-tasks-button')).not.toBeInTheDocument();
  });

  it('renders the topbar button for desktop tasks and refreshes when opened', () => {
    const { refresh } = renderModel([
      { id: 'task-1', title: 'Import users', status: TASK_STATUS.RUNNING, createdAt: '2026-07-03T00:00:00.000Z' },
    ]);

    const button = screen.getByTestId('async-tasks-button');
    expect(button).toBeInTheDocument();

    fireEvent.click(button);

    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it('requests tasks sorted by creation time', async () => {
    const { taskResource } = renderModel([{ id: 'task-1', title: 'Import users', status: TASK_STATUS.RUNNING }]);

    await expect(mocks.lastService?.()).resolves.toEqual({ data: [] });

    expect(taskResource.list).toHaveBeenCalledWith({ sort: '-createdAt' });
  });

  it('opens the task list when a task is created', () => {
    const { eventBus, refresh } = renderModel([{ id: 'task-1', title: 'Import users', status: TASK_STATUS.RUNNING }]);

    act(() => {
      eventBus.dispatchEvent(new CustomEvent('ws:message:async-tasks:created'));
    });

    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it('refreshes when a task status changes or a task is deleted', () => {
    const { eventBus, refresh } = renderModel([{ id: 'task-1', title: 'Import users', status: TASK_STATUS.RUNNING }]);

    act(() => {
      eventBus.dispatchEvent(new CustomEvent('ws:message:async-tasks:status'));
      eventBus.dispatchEvent(new CustomEvent('ws:message:async-tasks:deleted'));
    });

    expect(refresh).toHaveBeenCalledTimes(2);
  });

  it('merges task progress updates into the current list', async () => {
    const { eventBus } = renderModel([{ id: 'task-1', title: 'Old title', status: TASK_STATUS.RUNNING }]);

    act(() => {
      eventBus.dispatchEvent(
        new CustomEvent('ws:message:async-tasks:progress', {
          detail: {
            id: 'task-1',
            title: 'Updated title',
            status: TASK_STATUS.RUNNING,
            progressCurrent: 3,
            progressTotal: 10,
          },
        }),
      );
    });
    fireEvent.click(screen.getByTestId('async-tasks-button'));

    await waitFor(() => expect(screen.getByText('Updated title')).toBeInTheDocument());
  });

  it('adds unknown task progress updates to the top of the list', async () => {
    const { eventBus } = renderModel([{ id: 'task-1', title: 'Old title', status: TASK_STATUS.RUNNING }]);

    act(() => {
      eventBus.dispatchEvent(
        new CustomEvent('ws:message:async-tasks:progress', {
          detail: {
            id: 'task-2',
            title: 'New task',
            status: TASK_STATUS.PENDING,
          },
        }),
      );
    });
    fireEvent.click(screen.getByTestId('async-tasks-button'));

    await waitFor(() => expect(screen.getByText('New task')).toBeInTheDocument());
  });

  it('ignores task progress events without task ids', () => {
    const { eventBus } = renderModel([{ id: 'task-1', title: 'Old title', status: TASK_STATUS.RUNNING }]);

    act(() => {
      eventBus.dispatchEvent(
        new CustomEvent('ws:message:async-tasks:progress', {
          detail: {
            title: 'Ignored task',
            status: TASK_STATUS.RUNNING,
          },
        }),
      );
    });
    fireEvent.click(screen.getByTestId('async-tasks-button'));

    expect(screen.queryByText('Ignored task')).not.toBeInTheDocument();
  });

  it('renders canceled and unknown task statuses without action controls', async () => {
    renderModel([
      { id: 'task-1', title: 'Canceled task', status: TASK_STATUS.CANCELED },
      { id: 'task-2', title: 'Unknown status task', status: 999 },
    ]);

    fireEvent.click(screen.getByTestId('async-tasks-button'));

    expect(await screen.findByText('Canceled task')).toBeInTheDocument();
    expect(screen.getByText('Unknown status task')).toBeInTheDocument();
  });

  it('stops cancelable pending tasks and refreshes the list', async () => {
    const { refresh, taskResource } = renderModel([
      { id: 'task-1', title: 'Import users', status: TASK_STATUS.PENDING, cancelable: true },
    ]);

    fireEvent.click(screen.getByTestId('async-tasks-button'));
    fireEvent.click(await screen.findByText('Stop'));
    fireEvent.click(await screen.findByText('Confirm'));

    await waitFor(() => expect(taskResource.stop).toHaveBeenCalledWith({ filterByTk: 'task-1' }));
    expect(refresh).toHaveBeenCalledTimes(2);
  });

  it('renders custom result buttons for successful tasks', async () => {
    renderModel(
      [
        {
          id: 'task-1',
          origin: 'export',
          title: 'Export users',
          status: TASK_STATUS.SUCCEEDED,
          result: { url: '/file.csv' },
        },
      ],
      {
        taskOrigin: {
          ResultButton: ({ task }: { task: AsyncTaskRecord }) => <button type="button">Download {task.id}</button>,
        },
      },
    );

    fireEvent.click(screen.getByTestId('async-tasks-button'));

    expect(await screen.findByText('Download task-1')).toBeInTheDocument();
  });

  it('opens the default result modal for successful tasks without custom result buttons', async () => {
    const modalInfo = vi.spyOn(Modal, 'info').mockReturnValue({
      destroy: vi.fn(),
      update: vi.fn(),
    });
    renderModel([{ id: 'task-1', title: 'Export users', status: TASK_STATUS.SUCCEEDED, result: 'done' }]);

    fireEvent.click(screen.getByTestId('async-tasks-button'));
    fireEvent.click(await screen.findByText('View result'));

    expect(modalInfo).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Task result',
      }),
    );
  });

  it('opens the error details modal for failed tasks', async () => {
    const modalInfo = vi.spyOn(Modal, 'info').mockReturnValue({
      destroy: vi.fn(),
      update: vi.fn(),
    });
    renderModel(
      [
        {
          id: 'task-1',
          origin: 'import',
          title: 'Import users',
          status: TASK_STATUS.FAILED,
          result: { message: 'Import failed', params: { filename: 'users.csv' } },
        },
      ],
      {
        taskOrigin: {
          namespace: '@nocobase/plugin-import',
        },
      },
    );

    fireEvent.click(screen.getByTestId('async-tasks-button'));
    fireEvent.click(await screen.findByText('Error details'));

    expect(modalInfo).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Error Details',
        closable: true,
      }),
    );

    const modalOptions = modalInfo.mock.calls[0][0] as { content?: React.ReactNode };
    render(<>{modalOptions.content}</>);
    expect(screen.getByText('Import failed')).toBeInTheDocument();
  });
});
