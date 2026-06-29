/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { App } from 'antd';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type {
  TaskTypeOptions,
  WorkflowTaskFlowContext,
  WorkflowTaskRegistry,
  WorkflowTaskResource,
} from '../../taskCenter';
import { useWorkflowTaskRecord } from '../../taskCenter';

const holder = vi.hoisted(() => ({
  ctx: null as WorkflowTaskFlowContext | null,
  params: { taskType: 'demo', status: 'pending', popupId: undefined as string | undefined },
  location: { pathname: '/admin/workflow/tasks/demo/pending' },
  navigate: vi.fn(),
  isMobileLayout: false,
}));

vi.mock('@nocobase/flow-engine', async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>;
  return { ...actual, useFlowContext: () => holder.ctx };
});

vi.mock('@nocobase/client-v2', async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>;
  return {
    ...actual,
    useMobileLayout: () => ({ isMobileLayout: holder.isMobileLayout }),
  };
});

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>;
  return {
    ...actual,
    useParams: () => holder.params,
    useLocation: () => holder.location,
    useNavigate: () => holder.navigate,
  };
});

vi.mock('../../locale', () => ({
  NAMESPACE: 'workflow',
  useT: () => (key: string) => key,
  useWorkflowTranslation: () => ({ t: (key: string) => key }),
  tExpr: (key: string) => key,
}));

import WorkflowTasksPage from '../WorkflowTasksPage';

function renderWithApp(node: React.ReactNode) {
  return render(<App>{node}</App>);
}

function DemoItem() {
  const { record } = useWorkflowTaskRecord();
  return <div>{String(record.title)}</div>;
}

function DemoDetail() {
  const { record } = useWorkflowTaskRecord();
  return <div>detail:{String(record.title)}</div>;
}

function createTaskTypes(options: Partial<TaskTypeOptions> = {}) {
  const taskType: TaskTypeOptions = {
    key: 'demo',
    title: 'Demo tasks',
    collection: 'demoTasks',
    action: 'listMine',
    useActionParams: vi.fn((status: string) => ({ filter: { status }, sort: ['-id'] })),
    Item: DemoItem,
    Detail: DemoDetail,
    alwaysShow: true,
    ...options,
  };
  const registry: WorkflowTaskRegistry = {
    getKeys: () => ['demo'],
    get: (key: string) => (key === 'demo' ? taskType : undefined),
    getEntities: () => new Map<string, TaskTypeOptions>([['demo', taskType]]).entries(),
  };
  return {
    taskType,
    registry,
  };
}

function makeCtx(taskTypes: WorkflowTaskRegistry, resourceMap: Record<string, WorkflowTaskResource>) {
  return {
    api: {
      resource: (name: string) => {
        const resource = resourceMap[name];
        if (!resource) {
          throw new Error(`Missing resource mock: ${name}`);
        }
        return resource;
      },
    },
    app: { eventBus: new EventTarget(), pm: { get: (_name: string) => ({ taskTypes }) } },
  };
}

describe('WorkflowTasksPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    holder.params = { taskType: 'demo', status: 'pending', popupId: undefined };
    holder.location = { pathname: '/admin/workflow/tasks/demo/pending' };
    holder.isMobileLayout = false;
  });

  it('loads the selected task type with v1-compatible action params', async () => {
    const { taskType, registry } = createTaskTypes();
    const demoTasks = {
      listMine: vi.fn().mockResolvedValue({
        data: { data: [{ id: 1, title: 'Task A' }], meta: { count: 1 } },
      }),
    };
    const userWorkflowTasks = {
      listMine: vi.fn().mockResolvedValue({ data: [{ type: 'demo', stats: { pending: 1, all: 1 } }] }),
    };
    holder.ctx = makeCtx(registry, { demoTasks, userWorkflowTasks });

    renderWithApp(<WorkflowTasksPage />);

    await screen.findByText('Task A');

    expect(taskType.useActionParams).toHaveBeenCalledWith('pending');
    expect(demoTasks.listMine).toHaveBeenCalledWith({
      page: 1,
      pageSize: 20,
      sort: ['-id'],
      filter: { status: 'pending' },
    });
  });

  it('loads popup records through getPopupRecord for direct detail routes', async () => {
    holder.params = { taskType: 'demo', status: 'pending', popupId: '7' };
    const getPopupRecord = vi.fn().mockResolvedValue({ data: { data: { id: 7, title: 'Popup task' } } });
    const { registry } = createTaskTypes({ getPopupRecord });
    const demoTasks = { listMine: vi.fn().mockResolvedValue({ data: { data: [], meta: { count: 0 } } }) };
    const userWorkflowTasks = {
      listMine: vi.fn().mockResolvedValue({ data: [{ type: 'demo', stats: { pending: 1, all: 1 } }] }),
    };
    holder.ctx = makeCtx(registry, { demoTasks, userWorkflowTasks });

    renderWithApp(<WorkflowTasksPage />);

    await screen.findByText('detail:Popup task');

    expect(getPopupRecord).toHaveBeenCalledWith(holder.ctx.api, { params: { filterByTk: '7' } });
  });

  it('uses the mobile route layout and passes onlyIcon to task actions', async () => {
    const Actions = vi.fn((props: { onlyIcon?: boolean }) => (
      <button type="button">actions:{String(props.onlyIcon)}</button>
    ));
    const { registry } = createTaskTypes({ Actions });
    const demoTasks = {
      listMine: vi.fn().mockResolvedValue({
        data: { data: [{ id: 1, title: 'Task A' }], meta: { count: 1 } },
      }),
    };
    const userWorkflowTasks = {
      listMine: vi.fn().mockResolvedValue({ data: [{ type: 'demo', stats: { pending: 1, all: 1 } }] }),
    };
    holder.location = { pathname: '/mobile/page/workflow-tasks/demo/pending' };
    holder.isMobileLayout = true;
    holder.ctx = makeCtx(registry, { demoTasks, userWorkflowTasks });

    renderWithApp(<WorkflowTasksPage />);

    await screen.findByTestId('workflow-tasks-mobile');
    fireEvent.click(await screen.findByText('Task A'));

    expect(Actions.mock.calls.some(([props]) => props.onlyIcon === true)).toBe(true);
    expect(holder.navigate).toHaveBeenCalledWith('/mobile/page/workflow-tasks/demo/pending/1');
  });

  it('opens a clicked item by updating the workflow tasks route', async () => {
    const { registry } = createTaskTypes();
    const demoTasks = {
      listMine: vi.fn().mockResolvedValue({
        data: { data: [{ id: 9, title: 'Open me' }], meta: { count: 1 } },
      }),
    };
    const userWorkflowTasks = {
      listMine: vi.fn().mockResolvedValue({ data: [{ type: 'demo', stats: { pending: 1, all: 1 } }] }),
    };
    holder.ctx = makeCtx(registry, { demoTasks, userWorkflowTasks });

    renderWithApp(<WorkflowTasksPage />);

    fireEvent.click(await screen.findByText('Open me'));

    await screen.findByText('detail:Open me');
    expect(holder.navigate).toHaveBeenCalledWith('/admin/workflow/tasks/demo/pending/9');
  });
});
