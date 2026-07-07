/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { TaskTypeOptions, WorkflowTaskRegistry } from '../../taskCenter';

const holder = vi.hoisted(() => ({
  navigate: vi.fn(),
  isMobileLayout: false,
  taskTypes: {
    getKeys: () => [],
    get: (_key: string) => undefined,
  } as WorkflowTaskRegistry,
  eventBus: new EventTarget(),
  resources: {
    userWorkflowTasks: {
      listMine: vi.fn(),
    },
  },
}));

const flowContext = vi.hoisted(() => ({
  api: {
    resource: (name: string) =>
      (holder.resources as Record<string, { listMine?: ReturnType<typeof vi.fn> } | undefined>)[name] || {},
  },
  app: {
    eventBus: holder.eventBus,
    pm: {
      get: () => ({
        taskTypes: holder.taskTypes,
      }),
    },
  },
}));

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
    context: flowContext,
  }),
}));

vi.mock('../../locale', () => ({
  tExpr: (key: string) => key,
}));

import { WorkflowTasksTopbarActionModel } from '../WorkflowTasksTopbarActionModel';

describe('WorkflowTasksTopbarActionModel', () => {
  beforeEach(() => {
    holder.navigate.mockClear();
    holder.isMobileLayout = false;
    holder.taskTypes = {
      getKeys: () => [],
      get: (_key: string) => undefined,
    };
    holder.resources.userWorkflowTasks.listMine.mockReset();
    holder.resources.userWorkflowTasks.listMine.mockResolvedValue({ data: [] });
  });

  it('does not render the workflow todos entry before task types are registered', () => {
    const ModelClass = WorkflowTasksTopbarActionModel as unknown as { new (): WorkflowTasksTopbarActionModel };
    const model = new ModelClass();

    render(<>{model.render()}</>);

    expect(model.sort).toBe(250);
    expect(screen.queryByTestId('workflow-tasks-button')).toBeNull();
  });

  it('renders the workflow todos entry after a task type is registered', async () => {
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
    await waitFor(() => expect(holder.resources.userWorkflowTasks.listMine).toHaveBeenCalledTimes(1));
    fireEvent.click(button);

    expect(holder.navigate).toHaveBeenCalledWith('/admin/workflow/tasks');
  });
});
