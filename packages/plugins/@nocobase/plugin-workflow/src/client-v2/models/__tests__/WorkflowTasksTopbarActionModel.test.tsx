/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { TaskTypeOptions, WorkflowTaskRegistry } from '../../taskCenter';

const holder = vi.hoisted(() => ({
  navigate: vi.fn(),
  reload: vi.fn(),
  isMobileLayout: false,
  taskTypes: {
    getKeys: () => [],
    get: (_key: string) => undefined,
  } as WorkflowTaskRegistry,
}));

vi.mock('@ant-design/icons', async () => {
  const React = await import('react');
  return {
    CheckCircleOutlined: () => React.createElement('span', { 'data-testid': 'workflow-tasks-icon' }),
  };
});

vi.mock('ahooks', () => ({
  useMemoizedFn: (fn: unknown) => fn,
}));

vi.mock('antd', async () => {
  const React = await import('react');
  return {
    Badge: ({ children }: { children?: React.ReactNode }) => React.createElement(React.Fragment, null, children),
    Button: ({
      children,
      onClick,
      'data-testid': testId,
    }: {
      children?: React.ReactNode;
      onClick?: () => void;
      'data-testid'?: string;
    }) => React.createElement('button', { 'data-testid': testId, onClick, type: 'button' }, children),
    Tooltip: ({ children }: { children?: React.ReactNode }) => React.createElement(React.Fragment, null, children),
  };
});

vi.mock('@nocobase/client-v2', () => ({
  TopbarActionModel: class {
    context = {
      router: {
        navigate: holder.navigate,
      },
      t: (key: string) => key,
    };

    actionId?: string;
    testId?: string;
    tooltip?: string;

    getTestId() {
      return this.testId || `topbar-action-${this.actionId || 'unknown'}`;
    }
  },
  useMobileLayout: () => ({ isMobileLayout: holder.isMobileLayout }),
}));

vi.mock('@nocobase/flow-engine', () => ({
  observer: (component: unknown) => component,
  tExpr: (key: string) => key,
  useFlowEngine: () => ({
    context: {
      api: {
        resource: () => ({}),
      },
      app: {
        eventBus: new EventTarget(),
        pm: {
          get: () => ({
            taskTypes: holder.taskTypes,
          }),
        },
      },
    },
  }),
}));

vi.mock('../../locale', () => ({
  tExpr: (key: string) => key,
}));

vi.mock('../../taskCenter', () => ({
  getAvailableWorkflowTaskTypeKeys: (taskTypes: WorkflowTaskRegistry | undefined, counts: Record<string, any>) =>
    taskTypes
      ? Array.from(taskTypes.getKeys()).filter((key) => {
          const type = taskTypes.get(key);
          return Boolean(type?.alwaysShow || counts[key]?.all);
        })
      : [],
  getWorkflowTaskRegistry: (ctx: any) => ctx?.app?.pm?.get('workflow')?.taskTypes,
  useWorkflowTaskCounts: () => ({
    counts: {},
    total: 0,
    reload: holder.reload,
  }),
}));

import { WorkflowTasksTopbarActionModel } from '../WorkflowTasksTopbarActionModel';

describe('WorkflowTasksTopbarActionModel', () => {
  beforeEach(() => {
    holder.navigate.mockClear();
    holder.reload.mockReset();
    holder.reload.mockResolvedValue(undefined);
    holder.isMobileLayout = false;
    holder.taskTypes = {
      getKeys: () => [],
      get: (_key: string) => undefined,
    };
  });

  it('does not render the workflow todos entry before task types are registered', () => {
    const ModelClass = WorkflowTasksTopbarActionModel as unknown as { new (): WorkflowTasksTopbarActionModel };
    const model = new ModelClass();

    render(<>{model.render()}</>);

    expect(model.sort).toBe(250);
    expect(screen.queryByTestId('workflow-tasks-button')).toBeNull();
  });

  it('renders the workflow todos entry after a task type is registered', () => {
    const taskType = {
      key: 'demo',
      title: 'Demo',
      collection: 'demoTasks',
      Item: () => null,
      Detail: () => null,
      alwaysShow: true,
    } satisfies TaskTypeOptions;
    holder.taskTypes = {
      getKeys: () => ['demo'],
      get: (key: string) => (key === 'demo' ? taskType : undefined),
    };
    const ModelClass = WorkflowTasksTopbarActionModel as unknown as { new (): WorkflowTasksTopbarActionModel };
    const model = new ModelClass();

    render(<>{model.render()}</>);

    const button = screen.getByTestId('workflow-tasks-button');
    fireEvent.click(button);

    expect(holder.navigate).toHaveBeenCalledWith('/admin/workflow/tasks');
  });
});
