/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { App } from 'antd';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type {
  TaskTypeOptions,
  WorkflowTaskFlowContext,
  WorkflowTaskRegistry,
  WorkflowTaskResource,
} from '../../taskCenter';
import { useWorkflowTaskCounts, useWorkflowTaskRecord } from '../../taskCenter';

const holder = vi.hoisted(() => ({
  ctx: null as WorkflowTaskFlowContext | null,
  params: { taskType: 'demo', status: 'pending', popupId: undefined as string | undefined },
  location: { pathname: '/admin/workflow/tasks/demo/pending', search: '', hash: '' },
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

function createMultiTaskTypes(taskTypeMap: Record<string, TaskTypeOptions>) {
  const registry: WorkflowTaskRegistry = {
    getKeys: () => Object.keys(taskTypeMap),
    get: (key: string) => taskTypeMap[key],
    getEntities: () => new Map<string, TaskTypeOptions>(Object.entries(taskTypeMap)).entries(),
  };
  return registry;
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

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((_resolve, _reject) => {
    resolve = _resolve;
    reject = _reject;
  });
  return { promise, resolve, reject };
}

describe('WorkflowTasksPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.title = 'Loading...';
    holder.params = { taskType: 'demo', status: 'pending', popupId: undefined };
    holder.location = { pathname: '/admin/workflow/tasks/demo/pending', search: '', hash: '' };
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

  it('reloads popup records when the task type changes with the same popup id', async () => {
    holder.params = { taskType: 'demo', status: 'pending', popupId: '7' };
    const demoGetPopupRecord = vi.fn().mockResolvedValue({ data: { data: { id: 7, title: 'Demo popup' } } });
    const otherGetPopupRecord = vi.fn().mockResolvedValue({ data: { data: { id: 7, title: 'Other popup' } } });
    const demoTaskType: TaskTypeOptions = {
      ...createTaskTypes({ getPopupRecord: demoGetPopupRecord }).taskType,
      key: 'demo',
      collection: 'demoTasks',
      title: 'Demo tasks',
    };
    const otherTaskType: TaskTypeOptions = {
      ...createTaskTypes({ getPopupRecord: otherGetPopupRecord }).taskType,
      key: 'other',
      collection: 'otherTasks',
      title: 'Other tasks',
    };
    const registry = createMultiTaskTypes({ demo: demoTaskType, other: otherTaskType });
    const demoTasks = { listMine: vi.fn().mockResolvedValue({ data: { data: [], meta: { count: 0 } } }) };
    const otherTasks = { listMine: vi.fn().mockResolvedValue({ data: { data: [], meta: { count: 0 } } }) };
    const userWorkflowTasks = {
      listMine: vi.fn().mockResolvedValue({
        data: [
          { type: 'demo', stats: { pending: 1, all: 1 } },
          { type: 'other', stats: { pending: 1, all: 1 } },
        ],
      }),
    };
    holder.ctx = makeCtx(registry, { demoTasks, otherTasks, userWorkflowTasks });

    const { rerender } = renderWithApp(<WorkflowTasksPage />);

    await screen.findByText('detail:Demo popup');

    holder.params = { taskType: 'other', status: 'pending', popupId: '7' };
    holder.location = { pathname: '/admin/workflow/tasks/other/pending/7', search: '', hash: '' };
    rerender(
      <App>
        <WorkflowTasksPage />
      </App>,
    );

    await screen.findByText('detail:Other popup');
    expect(otherGetPopupRecord).toHaveBeenCalledWith(holder.ctx.api, { params: { filterByTk: '7' } });
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
    holder.location = { pathname: '/mobile/page/workflow-tasks/demo/pending', search: '', hash: '' };
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
    expect(document.body.querySelector('.ant-modal')).toBeInTheDocument();
    expect(document.body.querySelector('.ant-drawer')).not.toBeInTheDocument();
    expect(holder.navigate).toHaveBeenCalledWith('/admin/workflow/tasks/demo/pending/9');
  });

  it('lets a task type override the detail modal container', async () => {
    const customDetailModalProps = vi.fn();
    function CustomDetailModal(props: {
      children?: React.ReactNode;
      record: Record<string, unknown> | null;
      title?: React.ReactNode;
      onClose?: () => void;
    }) {
      customDetailModalProps(props);
      return props.record ? (
        <div data-testid="custom-detail-modal">
          <span>custom title:{props.title}</span>
          <div>{props.children}</div>
          <button type="button" onClick={props.onClose}>
            custom close
          </button>
        </div>
      ) : null;
    }
    const { registry } = createTaskTypes({
      DetailModal: CustomDetailModal,
    } as Partial<TaskTypeOptions>);
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

    await screen.findByTestId('custom-detail-modal');
    expect(screen.getByText('custom title:Open me')).toBeInTheDocument();
    expect(screen.getByText('detail:Open me')).toBeInTheDocument();
    expect(document.body.querySelector('.ant-modal')).not.toBeInTheDocument();
    expect(customDetailModalProps).toHaveBeenLastCalledWith(
      expect.objectContaining({
        mobile: false,
        record: expect.objectContaining({ id: 9, title: 'Open me' }),
        title: 'Open me',
        type: expect.objectContaining({ key: 'demo' }),
      }),
    );

    fireEvent.click(screen.getByRole('button', { name: 'custom close' }));
    expect(holder.navigate).toHaveBeenCalledWith('/admin/workflow/tasks/demo/pending', { replace: true });
  });

  it('preserves the current search query when switching status and opening or closing a task detail', async () => {
    const { registry } = createTaskTypes();
    const demoTasks = {
      listMine: vi.fn().mockResolvedValue({
        data: { data: [{ id: 9, title: 'Open me' }], meta: { count: 1 } },
      }),
    };
    const userWorkflowTasks = {
      listMine: vi.fn().mockResolvedValue({ data: [{ type: 'demo', stats: { pending: 1, all: 1 } }] }),
    };
    holder.location = {
      pathname: '/admin/workflow/tasks/demo/pending',
      search: '?workflowCcTasksFilter=%7B%22title%22%3A%22cc%22%7D',
      hash: '',
    };
    holder.ctx = makeCtx(registry, { demoTasks, userWorkflowTasks });

    renderWithApp(<WorkflowTasksPage />);

    fireEvent.click(await screen.findByText('Completed'));
    fireEvent.click(await screen.findByText('Open me'));
    await screen.findByText('detail:Open me');
    fireEvent.click(screen.getByLabelText('Close'));

    expect(holder.navigate).toHaveBeenCalledWith(
      '/admin/workflow/tasks/demo/completed?workflowCcTasksFilter=%7B%22title%22%3A%22cc%22%7D',
    );
    expect(holder.navigate).toHaveBeenCalledWith(
      '/admin/workflow/tasks/demo/pending/9?workflowCcTasksFilter=%7B%22title%22%3A%22cc%22%7D',
    );
    expect(holder.navigate).toHaveBeenCalledWith(
      '/admin/workflow/tasks/demo/pending?workflowCcTasksFilter=%7B%22title%22%3A%22cc%22%7D',
      { replace: true },
    );
  });

  it('sets the v1-compatible workflow todos document title for the selected task type', async () => {
    const { registry } = createTaskTypes({ title: 'CC to me' });
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
    expect(document.title).toBe('Workflow todos: CC to me - NocoBase');
  });

  it('restores the previous document title when the selected task type becomes invalid', async () => {
    const { registry } = createTaskTypes({ title: 'CC to me' });
    const demoTasks = {
      listMine: vi.fn().mockResolvedValue({
        data: { data: [{ id: 1, title: 'Task A' }], meta: { count: 1 } },
      }),
    };
    const userWorkflowTasks = {
      listMine: vi.fn().mockResolvedValue({ data: [{ type: 'demo', stats: { pending: 1, all: 1 } }] }),
    };
    holder.ctx = makeCtx(registry, { demoTasks, userWorkflowTasks });

    const { rerender } = renderWithApp(<WorkflowTasksPage />);

    await screen.findByText('Task A');
    expect(document.title).toBe('Workflow todos: CC to me - NocoBase');

    holder.params = { taskType: 'missing', status: 'pending', popupId: undefined };
    rerender(
      <App>
        <WorkflowTasksPage />
      </App>,
    );

    await screen.findByText('Task type {{type}} is invalid');
    expect(document.title).toBe('Loading...');
  });

  it('keeps desktop pagination visible on a single page and shows the page size selector', async () => {
    const { registry } = createTaskTypes();
    const demoTasks = {
      listMine: vi.fn().mockResolvedValue({
        data: { data: [{ id: 1, title: 'Task A' }], meta: { count: 1 } },
      }),
    };
    const userWorkflowTasks = {
      listMine: vi.fn().mockResolvedValue({ data: [{ type: 'demo', stats: { pending: 1, all: 1 } }] }),
    };
    holder.ctx = makeCtx(registry, { demoTasks, userWorkflowTasks });

    const { container } = renderWithApp(<WorkflowTasksPage />);

    await screen.findByText('Task A');
    await waitFor(() => expect(container.querySelector('.ant-pagination')).toBeInTheDocument());
    expect(container.querySelector('.ant-pagination-simple')).toBeInTheDocument();
    expect(container.querySelector('.ant-pagination-item-active')).not.toBeInTheDocument();
    expect(container.querySelector('.ant-pagination-options')).toBeInTheDocument();
    expect(screen.getByTestId('workflow-task-list-region')).toHaveStyle({
      background: '#f5f5f5',
      display: 'flex',
      flex: '1 1 0%',
      minHeight: '0',
    });
  });

  it('wraps task item content at full list width for nested flow renderers', async () => {
    const { registry } = createTaskTypes();
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
    expect(screen.getByTestId('workflow-task-list-item-content')).toHaveStyle({ width: '100%' });
  });

  it('hides desktop pagination when there are no task records', async () => {
    const { registry } = createTaskTypes();
    const demoTasks = {
      listMine: vi.fn().mockResolvedValue({
        data: { data: [], meta: { count: 0 } },
      }),
    };
    const userWorkflowTasks = {
      listMine: vi.fn().mockResolvedValue({ data: [{ type: 'demo', stats: { pending: 0, all: 0 } }] }),
    };
    holder.ctx = makeCtx(registry, { demoTasks, userWorkflowTasks });

    const { container } = renderWithApp(<WorkflowTasksPage />);

    await screen.findByText('No data yet');
    await waitFor(() => expect(container.querySelector('.ant-pagination')).not.toBeInTheDocument());
  });

  it('enables the next page when a simple-paginated response reports hasNext without count', async () => {
    const { registry } = createTaskTypes();
    const demoTasks = {
      listMine: vi.fn().mockResolvedValue({
        data: {
          data: Array.from({ length: 20 }, (_, index) => ({ id: index + 1, title: `Task ${index + 1}` })),
          meta: { hasNext: true },
        },
      }),
    };
    const userWorkflowTasks = {
      listMine: vi.fn().mockResolvedValue({ data: [{ type: 'demo', stats: { pending: 20, all: 21 } }] }),
    };
    holder.ctx = makeCtx(registry, { demoTasks, userWorkflowTasks });

    const { container } = renderWithApp(<WorkflowTasksPage />);

    await screen.findByText('Task 1');
    await waitFor(() => expect(container.querySelector('.ant-pagination-next')).toBeInTheDocument());
    expect(container.querySelector('.ant-pagination-next')).not.toHaveClass('ant-pagination-disabled');
  });

  it('resets the list request to the first page after the URL search changes', async () => {
    const { registry } = createTaskTypes();
    const demoTasks = {
      listMine: vi.fn().mockResolvedValue({
        data: {
          data: Array.from({ length: 20 }, (_, index) => ({ id: index + 1, title: `Task ${index + 1}` })),
          meta: { count: 40 },
        },
      }),
    };
    const userWorkflowTasks = {
      listMine: vi.fn().mockResolvedValue({ data: [{ type: 'demo', stats: { pending: 40, all: 40 } }] }),
    };
    holder.ctx = makeCtx(registry, { demoTasks, userWorkflowTasks });

    const { container, rerender } = renderWithApp(<WorkflowTasksPage />);

    await screen.findByText('Task 1');
    const next = container.querySelector('.ant-pagination-next') as HTMLElement;
    fireEvent.click(next);
    await waitFor(() => expect(demoTasks.listMine).toHaveBeenLastCalledWith(expect.objectContaining({ page: 2 })));

    holder.location = {
      pathname: '/admin/workflow/tasks/demo/pending',
      search: '?workflowCcTasksFilter=%7B%22title%22%3A%22Task%22%7D',
      hash: '',
    };
    rerender(
      <App>
        <WorkflowTasksPage />
      </App>,
    );

    await waitFor(() => expect(demoTasks.listMine).toHaveBeenLastCalledWith(expect.objectContaining({ page: 1 })));
  });

  it('uses the compact mobile task layout without an extra Workflow tasks title', async () => {
    const Actions = vi.fn((props: { onlyIcon?: boolean }) => (
      <button type="button" aria-label="Refresh">
        actions:{String(props.onlyIcon)}
      </button>
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
    holder.location = { pathname: '/mobile/page/workflow-tasks/demo/pending', search: '', hash: '' };
    holder.isMobileLayout = true;
    holder.ctx = makeCtx(registry, { demoTasks, userWorkflowTasks });

    const { container } = renderWithApp(<WorkflowTasksPage />);

    await screen.findByTestId('workflow-tasks-mobile');
    await screen.findByText('Task A');
    expect(screen.getByTestId('workflow-tasks-mobile')).toHaveStyle({
      height: '100%',
      minHeight: '0',
    });
    expect(screen.queryByText('Workflow tasks')).not.toBeInTheDocument();
    expect(screen.getByTestId('workflow-task-type-menu')).toHaveStyle({ height: '42px', minHeight: '42px' });
    expect(screen.getByTestId('workflow-task-list-region')).toHaveStyle({
      background: '#f5f5f5',
      display: 'flex',
      flex: '1 1 0%',
      minHeight: '0',
    });
    expect(container.querySelector('.ant-pagination')).toBeInTheDocument();
    expect(container.querySelector('.ant-pagination-simple')).toBeInTheDocument();
    expect(container.querySelector('.ant-pagination-item-active')).not.toBeInTheDocument();
    expect(container.querySelector('.ant-pagination-options')).not.toBeInTheDocument();
    expect(container.querySelector('.ant-list-item')).toHaveStyle({ padding: '0.5em 0.5em 1px' });
    expect(Actions.mock.calls.some(([props]) => props.onlyIcon === true)).toBe(true);
    expect(screen.getByTestId('workflow-task-status-controls')).toHaveStyle({ flexWrap: 'wrap' });
  });

  it('shares workflow task counts between the page and task actions without duplicate initial count requests', async () => {
    const { registry } = createTaskTypes({
      Actions: () => {
        useWorkflowTaskCounts(holder.ctx ?? undefined, registry);
        return <button type="button">actions</button>;
      },
    });
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
    await waitFor(() => expect(userWorkflowTasks.listMine).toHaveBeenCalledTimes(1));
  });

  it('runs a fresh count request when an explicit refresh happens during an in-flight count request', async () => {
    const firstCounts = createDeferred<unknown>();
    const refreshAction = vi.fn();
    const { registry } = createTaskTypes({
      Actions: (props: { reload?: () => Promise<void> }) => (
        <button
          type="button"
          onClick={() => {
            refreshAction();
            props.reload?.();
          }}
        >
          refresh counts
        </button>
      ),
    });
    const demoTasks = {
      listMine: vi.fn().mockResolvedValue({
        data: { data: [{ id: 1, title: 'Task A' }], meta: { count: 1 } },
      }),
    };
    const userWorkflowTasks = {
      listMine: vi
        .fn()
        .mockReturnValueOnce(firstCounts.promise)
        .mockResolvedValue({ data: [{ type: 'demo', stats: { pending: 0, all: 0 } }] }),
    };
    holder.ctx = makeCtx(registry, { demoTasks, userWorkflowTasks });

    renderWithApp(<WorkflowTasksPage />);

    await screen.findByText('Task A');
    expect(userWorkflowTasks.listMine).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: 'refresh counts' }));
    expect(refreshAction).toHaveBeenCalledTimes(1);
    expect(userWorkflowTasks.listMine).toHaveBeenCalledTimes(1);

    firstCounts.resolve({ data: [{ type: 'demo', stats: { pending: 1, all: 1 } }] });

    await waitFor(() => expect(userWorkflowTasks.listMine).toHaveBeenCalledTimes(2));
  });

  it('runs a fresh count request when the in-flight count request rejects before an explicit refresh', async () => {
    const firstCounts = createDeferred<unknown>();
    const refreshResult = vi.fn();
    const { registry } = createTaskTypes({
      Actions: (props: { reload?: () => Promise<void> }) => (
        <button
          type="button"
          onClick={() => {
            props.reload?.().then(refreshResult).catch(refreshResult);
          }}
        >
          refresh counts
        </button>
      ),
    });
    const demoTasks = {
      listMine: vi.fn().mockResolvedValue({
        data: { data: [{ id: 1, title: 'Task A' }], meta: { count: 1 } },
      }),
    };
    const userWorkflowTasks = {
      listMine: vi
        .fn()
        .mockReturnValueOnce(firstCounts.promise)
        .mockResolvedValue({ data: [{ type: 'demo', stats: { pending: 0, all: 0 } }] }),
    };
    holder.ctx = makeCtx(registry, { demoTasks, userWorkflowTasks });

    renderWithApp(<WorkflowTasksPage />);

    await screen.findByText('Task A');
    expect(userWorkflowTasks.listMine).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: 'refresh counts' }));
    firstCounts.reject(new Error('initial counts failed'));

    await waitFor(() => expect(userWorkflowTasks.listMine).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(refreshResult).toHaveBeenCalledWith(undefined));
  });

  it('keeps newer websocket task counts when an older count request resolves later', async () => {
    const firstCounts = createDeferred<unknown>();
    const { registry } = createTaskTypes();
    const eventBus = new EventTarget();
    const demoTasks = {
      listMine: vi.fn().mockResolvedValue({
        data: { data: [{ id: 1, title: 'Task A' }], meta: { count: 1 } },
      }),
    };
    const userWorkflowTasks = {
      listMine: vi.fn().mockReturnValueOnce(firstCounts.promise),
    };
    holder.ctx = makeCtx(registry, { demoTasks, userWorkflowTasks });
    holder.ctx.app.eventBus = eventBus;

    const { container } = renderWithApp(<WorkflowTasksPage />);

    await screen.findByText('Task A');

    act(() => {
      eventBus.dispatchEvent(
        new CustomEvent('ws:message:workflow:tasks:updated', {
          detail: { type: 'demo', stats: { pending: 5, all: 5 } },
        }),
      );
    });

    await waitFor(() => expect(container.querySelector('.ant-badge-count')?.getAttribute('title')).toBe('5'));

    await act(async () => {
      firstCounts.resolve({ data: [{ type: 'demo', stats: { pending: 1, all: 1 } }] });
      await firstCounts.promise;
    });

    expect(container.querySelector('.ant-badge-count')?.getAttribute('title')).toBe('5');
  });

  it('removes the workflow task count event listener after the last subscriber unmounts', async () => {
    const { registry } = createTaskTypes();
    const eventBus = new EventTarget();
    const removeEventListener = vi.spyOn(eventBus, 'removeEventListener');
    const demoTasks = {
      listMine: vi.fn().mockResolvedValue({
        data: { data: [{ id: 1, title: 'Task A' }], meta: { count: 1 } },
      }),
    };
    const userWorkflowTasks = {
      listMine: vi.fn().mockResolvedValue({ data: [{ type: 'demo', stats: { pending: 1, all: 1 } }] }),
    };
    holder.ctx = makeCtx(registry, { demoTasks, userWorkflowTasks });
    holder.ctx.app.eventBus = eventBus;

    const { unmount } = renderWithApp(<WorkflowTasksPage />);

    await screen.findByText('Task A');
    unmount();

    await waitFor(() =>
      expect(removeEventListener).toHaveBeenCalledWith('ws:message:workflow:tasks:updated', expect.any(Function)),
    );
  });

  it('ignores stale list responses after the task list route changes', async () => {
    const routeRequests: Array<ReturnType<typeof createDeferred<unknown>>> = [];
    const { registry } = createTaskTypes();
    const demoTasks = {
      listMine: vi.fn().mockResolvedValue({ data: { data: [{ id: 1, title: 'Initial task' }], meta: { count: 1 } } }),
    };
    const userWorkflowTasks = {
      listMine: vi.fn().mockResolvedValue({ data: [{ type: 'demo', stats: { pending: 1, all: 1 } }] }),
    };
    holder.ctx = makeCtx(registry, { demoTasks, userWorkflowTasks });

    const { rerender } = renderWithApp(<WorkflowTasksPage />);

    await screen.findByText('Initial task');
    demoTasks.listMine.mockReset();
    demoTasks.listMine.mockImplementation(() => {
      const request = createDeferred<unknown>();
      routeRequests.push(request);
      return request.promise;
    });

    holder.location = {
      pathname: '/admin/workflow/tasks/demo/pending',
      search: '?workflowCcTasksFilter=%7B%22title%22%3A%22Old%22%7D',
      hash: '',
    };
    rerender(
      <App>
        <WorkflowTasksPage />
      </App>,
    );

    await waitFor(() => expect(routeRequests.length).toBeGreaterThan(0));
    const staleRequestCount = routeRequests.length;

    holder.location = {
      pathname: '/admin/workflow/tasks/demo/pending',
      search: '?workflowCcTasksFilter=%7B%22title%22%3A%22New%22%7D',
      hash: '',
    };
    rerender(
      <App>
        <WorkflowTasksPage />
      </App>,
    );

    await waitFor(() => expect(routeRequests.length).toBeGreaterThan(staleRequestCount));
    const latestRequest = routeRequests[routeRequests.length - 1];

    await act(async () => {
      latestRequest.resolve({ data: { data: [{ id: 3, title: 'New task' }], meta: { count: 1 } } });
      await latestRequest.promise;
    });
    await screen.findByText('New task');

    for (const request of routeRequests.slice(0, staleRequestCount)) {
      await act(async () => {
        request.resolve({ data: { data: [{ id: 2, title: 'Old task' }], meta: { count: 1 } } });
        await request.promise;
      });
    }

    expect(screen.getByText('New task')).toBeInTheDocument();
    expect(screen.queryByText('Old task')).not.toBeInTheDocument();
  });

  it('ignores stale list request failures after the task list route changes', async () => {
    const routeRequests: Array<ReturnType<typeof createDeferred<unknown>>> = [];
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const { registry } = createTaskTypes();
    const demoTasks = {
      listMine: vi.fn().mockResolvedValue({ data: { data: [{ id: 1, title: 'Initial task' }], meta: { count: 1 } } }),
    };
    const userWorkflowTasks = {
      listMine: vi.fn().mockResolvedValue({ data: [{ type: 'demo', stats: { pending: 1, all: 1 } }] }),
    };
    holder.ctx = makeCtx(registry, { demoTasks, userWorkflowTasks });

    try {
      const { rerender } = renderWithApp(<WorkflowTasksPage />);

      await screen.findByText('Initial task');
      demoTasks.listMine.mockReset();
      demoTasks.listMine.mockImplementation(() => {
        const request = createDeferred<unknown>();
        routeRequests.push(request);
        return request.promise;
      });

      holder.location = {
        pathname: '/admin/workflow/tasks/demo/pending',
        search: '?workflowCcTasksFilter=%7B%22title%22%3A%22Old%22%7D',
        hash: '',
      };
      rerender(
        <App>
          <WorkflowTasksPage />
        </App>,
      );

      await waitFor(() => expect(routeRequests.length).toBeGreaterThan(0));
      const staleRequestCount = routeRequests.length;

      holder.location = {
        pathname: '/admin/workflow/tasks/demo/pending',
        search: '?workflowCcTasksFilter=%7B%22title%22%3A%22New%22%7D',
        hash: '',
      };
      rerender(
        <App>
          <WorkflowTasksPage />
        </App>,
      );

      await waitFor(() => expect(routeRequests.length).toBeGreaterThan(staleRequestCount));
      const latestRequest = routeRequests[routeRequests.length - 1];

      await act(async () => {
        latestRequest.resolve({ data: { data: [{ id: 3, title: 'New task' }], meta: { count: 1 } } });
        await latestRequest.promise;
      });
      await screen.findByText('New task');

      const staleError = new Error('stale list failed');
      for (const request of routeRequests.slice(0, staleRequestCount)) {
        await act(async () => {
          request.reject(staleError);
          await request.promise.catch(() => undefined);
        });
      }

      expect(consoleError).not.toHaveBeenCalledWith('Failed to load workflow tasks', staleError);
      expect(screen.getByText('New task')).toBeInTheDocument();
    } finally {
      consoleError.mockRestore();
    }
  });

  it('ignores list request failures after the task list unmounts', async () => {
    const request = createDeferred<unknown>();
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const { registry } = createTaskTypes();
    const demoTasks = {
      listMine: vi.fn().mockReturnValue(request.promise),
    };
    const userWorkflowTasks = {
      listMine: vi.fn().mockResolvedValue({ data: [{ type: 'demo', stats: { pending: 1, all: 1 } }] }),
    };
    holder.ctx = makeCtx(registry, { demoTasks, userWorkflowTasks });

    try {
      const { unmount } = renderWithApp(<WorkflowTasksPage />);

      await waitFor(() => expect(demoTasks.listMine).toHaveBeenCalledTimes(1));
      unmount();

      const staleError = new Error('unmounted list failed');
      await act(async () => {
        request.reject(staleError);
        await request.promise.catch(() => undefined);
      });

      expect(consoleError).not.toHaveBeenCalledWith('Failed to load workflow tasks', staleError);
    } finally {
      consoleError.mockRestore();
    }
  });

  it('clears old records when the current list request fails', async () => {
    const latestError = new Error('latest list failed');
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const { registry } = createTaskTypes();
    const demoTasks = {
      listMine: vi.fn().mockResolvedValue({ data: { data: [{ id: 1, title: 'Initial task' }], meta: { count: 1 } } }),
    };
    const userWorkflowTasks = {
      listMine: vi.fn().mockResolvedValue({ data: [{ type: 'demo', stats: { pending: 1, all: 1 } }] }),
    };
    holder.ctx = makeCtx(registry, { demoTasks, userWorkflowTasks });

    try {
      const { rerender } = renderWithApp(<WorkflowTasksPage />);

      await screen.findByText('Initial task');
      demoTasks.listMine.mockReset();
      demoTasks.listMine.mockRejectedValue(latestError);

      holder.location = {
        pathname: '/admin/workflow/tasks/demo/pending',
        search: '?workflowCcTasksFilter=%7B%22title%22%3A%22Missing%22%7D',
        hash: '',
      };
      rerender(
        <App>
          <WorkflowTasksPage />
        </App>,
      );

      await waitFor(() => expect(consoleError).toHaveBeenCalledWith('Failed to load workflow tasks', latestError));
      expect(screen.queryByText('Initial task')).not.toBeInTheDocument();
      expect(screen.getByText('No data yet')).toBeInTheDocument();
    } finally {
      consoleError.mockRestore();
    }
  });

  it('ignores stale popup responses after the popup route changes', async () => {
    holder.params = { taskType: 'demo', status: 'pending', popupId: '7' };
    const firstPopup = createDeferred<unknown>();
    const secondPopup = createDeferred<unknown>();
    const getPopupRecord = vi.fn().mockReturnValueOnce(firstPopup.promise).mockReturnValueOnce(secondPopup.promise);
    const { registry } = createTaskTypes({ getPopupRecord });
    const demoTasks = { listMine: vi.fn().mockResolvedValue({ data: { data: [], meta: { count: 0 } } }) };
    const userWorkflowTasks = {
      listMine: vi.fn().mockResolvedValue({ data: [{ type: 'demo', stats: { pending: 1, all: 1 } }] }),
    };
    holder.ctx = makeCtx(registry, { demoTasks, userWorkflowTasks });

    const { rerender } = renderWithApp(<WorkflowTasksPage />);

    await waitFor(() => expect(getPopupRecord).toHaveBeenCalledTimes(1));

    holder.params = { taskType: 'demo', status: 'pending', popupId: '8' };
    holder.location = { pathname: '/admin/workflow/tasks/demo/pending/8', search: '', hash: '' };
    rerender(
      <App>
        <WorkflowTasksPage />
      </App>,
    );

    await waitFor(() => expect(getPopupRecord).toHaveBeenCalledTimes(2));

    await act(async () => {
      secondPopup.resolve({ data: { data: { id: 8, title: 'New popup' } } });
      await secondPopup.promise;
    });
    await screen.findByText('detail:New popup');

    await act(async () => {
      firstPopup.resolve({ data: { data: { id: 7, title: 'Old popup' } } });
      await firstPopup.promise;
    });

    expect(screen.getByText('detail:New popup')).toBeInTheDocument();
    expect(screen.queryByText('detail:Old popup')).not.toBeInTheDocument();
  });

  it('ignores stale popup request failures after the popup route changes', async () => {
    holder.params = { taskType: 'demo', status: 'pending', popupId: '7' };
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const firstPopup = createDeferred<unknown>();
    const secondPopup = createDeferred<unknown>();
    const getPopupRecord = vi.fn().mockReturnValueOnce(firstPopup.promise).mockReturnValueOnce(secondPopup.promise);
    const { registry } = createTaskTypes({ getPopupRecord });
    const demoTasks = { listMine: vi.fn().mockResolvedValue({ data: { data: [], meta: { count: 0 } } }) };
    const userWorkflowTasks = {
      listMine: vi.fn().mockResolvedValue({ data: [{ type: 'demo', stats: { pending: 1, all: 1 } }] }),
    };
    holder.ctx = makeCtx(registry, { demoTasks, userWorkflowTasks });

    try {
      const { rerender } = renderWithApp(<WorkflowTasksPage />);

      await waitFor(() => expect(getPopupRecord).toHaveBeenCalledTimes(1));

      holder.params = { taskType: 'demo', status: 'pending', popupId: '8' };
      holder.location = { pathname: '/admin/workflow/tasks/demo/pending/8', search: '', hash: '' };
      rerender(
        <App>
          <WorkflowTasksPage />
        </App>,
      );

      await waitFor(() => expect(getPopupRecord).toHaveBeenCalledTimes(2));

      await act(async () => {
        secondPopup.resolve({ data: { data: { id: 8, title: 'New popup' } } });
        await secondPopup.promise;
      });
      await screen.findByText('detail:New popup');

      const staleError = new Error('stale popup failed');
      await act(async () => {
        firstPopup.reject(staleError);
        await firstPopup.promise.catch(() => undefined);
      });

      expect(consoleError).not.toHaveBeenCalledWith('Failed to load workflow task detail', staleError);
      expect(screen.getByText('detail:New popup')).toBeInTheDocument();
    } finally {
      consoleError.mockRestore();
    }
  });

  it('ignores popup request failures after the task detail unmounts', async () => {
    holder.params = { taskType: 'demo', status: 'pending', popupId: '7' };
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const popup = createDeferred<unknown>();
    const getPopupRecord = vi.fn().mockReturnValue(popup.promise);
    const { registry } = createTaskTypes({ getPopupRecord });
    const demoTasks = { listMine: vi.fn().mockResolvedValue({ data: { data: [], meta: { count: 0 } } }) };
    const userWorkflowTasks = {
      listMine: vi.fn().mockResolvedValue({ data: [{ type: 'demo', stats: { pending: 1, all: 1 } }] }),
    };
    holder.ctx = makeCtx(registry, { demoTasks, userWorkflowTasks });

    try {
      const { unmount } = renderWithApp(<WorkflowTasksPage />);

      await waitFor(() => expect(getPopupRecord).toHaveBeenCalledTimes(1));
      unmount();

      const staleError = new Error('unmounted popup failed');
      await act(async () => {
        popup.reject(staleError);
        await popup.promise.catch(() => undefined);
      });

      expect(consoleError).not.toHaveBeenCalledWith('Failed to load workflow task detail', staleError);
    } finally {
      consoleError.mockRestore();
    }
  });
});
