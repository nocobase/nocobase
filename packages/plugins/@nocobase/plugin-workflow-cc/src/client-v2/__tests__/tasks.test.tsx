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
import { afterEach, describe, expect, it, vi } from 'vitest';

const holder = vi.hoisted(() => ({
  collectionFilterProps: [] as Array<Record<string, unknown>>,
  counts: { cc: { pending: 1 } },
  isMobileLayout: false,
  location: { pathname: '/v/admin/workflow/tasks/cc/pending', search: '', hash: '' },
  navigate: vi.fn(),
  openRecord: vi.fn(),
  read: vi.fn(),
  record: null as Record<string, unknown> | null,
  refresh: vi.fn(),
  reloadCounts: vi.fn(),
  remoteRendererProps: [] as Array<Record<string, unknown>>,
  workflowCcTasksCollection: { name: 'workflowCcTasks' },
}));

vi.mock('@nocobase/client-v2', async () => {
  const ReactModule = await import('react');

  return {
    CollectionFilter: (props: Record<string, unknown>) => {
      const [initialValue] = ReactModule.useState(props.initialValue);

      holder.collectionFilterProps.push(props);
      return (
        <button
          data-initial-value={JSON.stringify(initialValue)}
          type="button"
          aria-label={String((props.buttonProps as Record<string, unknown> | undefined)?.['aria-label'] ?? 'Filter')}
          onClick={() =>
            (props.onChange as (filter: Record<string, unknown>) => void)?.({ title: { $includes: 'cc' } })
          }
        >
          {String(props.buttonText ?? 'Filter')}
        </button>
      );
    },
    useMobileLayout: () => ({
      isMobileLayout: holder.isMobileLayout,
    }),
  };
});

vi.mock('@nocobase/flow-engine', () => ({
  useFlowContext: () => ({
    api: {
      resource: (name: string) => (name === 'workflowCcTasks' ? { read: holder.read } : {}),
    },
  }),
  useFlowEngine: () => ({
    context: {
      t: (key: string) => key,
    },
    dataSourceManager: {
      getDataSource: () => ({
        addCollection: vi.fn(),
        getCollection: (name: string) => (name === 'workflowCcTasks' ? holder.workflowCcTasksCollection : undefined),
      }),
    },
  }),
}));

vi.mock('@nocobase/plugin-workflow/client-v2', () => ({
  PluginWorkflowClientV2: class PluginWorkflowClientV2 {},
  TASK_STATUS: {
    ALL: 'all',
    COMPLETED: 'completed',
    PENDING: 'pending',
  },
  getWorkflowTaskRegistry: () => undefined,
  useWorkflowTaskCounts: () => ({
    counts: holder.counts,
    reload: holder.reloadCounts,
    total: holder.counts.cc.pending,
  }),
  useWorkflowTaskRecord: () => ({
    openRecord: holder.openRecord,
    record: holder.record,
    refresh: holder.refresh,
  }),
}));

vi.mock('react-router-dom', () => ({
  useLocation: () => holder.location,
  useNavigate: () => holder.navigate,
}));

vi.mock('../flow/RemoteFlowModelRenderer', () => ({
  RemoteFlowModelRenderer: (props: Record<string, unknown>) => {
    holder.remoteRendererProps.push(props);
    return <div data-testid="remote-flow-model">{String(props.uid)}</div>;
  },
}));

vi.mock('../locale', () => ({
  NAMESPACE: '@nocobase/plugin-workflow-cc',
  useT: () => (key: string) => key,
}));

vi.mock('../utils/registerWorkflowCcCollections', () => ({
  registerWorkflowCcCollections: vi.fn(),
}));

vi.mock('../workflowPluginCompat', () => ({
  useWorkflowPluginCompat: () => ({
    getInstruction: () => ({}),
    getTrigger: () => ({}),
  }),
}));

import { TASK_STATUS, TASK_TYPE_CC } from '../../common/constants';
import { ccTaskType, useCcTaskActionParams } from '../tasks';

function renderWithApp(node: React.ReactNode) {
  return render(<App>{node}</App>);
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

afterEach(() => {
  vi.clearAllMocks();
  holder.collectionFilterProps = [];
  holder.counts = { cc: { pending: 1 } };
  holder.isMobileLayout = false;
  holder.location = { pathname: '/v/admin/workflow/tasks/cc/pending', search: '', hash: '' };
  holder.openRecord = vi.fn();
  holder.record = null;
  holder.reloadCounts = vi.fn();
  holder.remoteRendererProps = [];
  window.history.replaceState(null, '', '/v/admin/workflow/tasks/cc/pending');
});

describe('workflow-cc v2 task type', () => {
  it('keeps the CC task type render contract complete', () => {
    expect(ccTaskType).toEqual(
      expect.objectContaining({
        key: TASK_TYPE_CC,
        collection: 'workflowCcTasks',
        action: 'listMine',
        Actions: expect.any(Function),
        Detail: expect.any(Function),
        Item: expect.any(Function),
        getPopupRecord: expect.any(Function),
        useActionParams: expect.any(Function),
      }),
    );
  });

  it('renders Refresh, Filter and Mark all as read actions', async () => {
    const reload = vi.fn().mockResolvedValue(undefined);
    holder.read.mockResolvedValue({});
    const Actions = ccTaskType.Actions as React.ComponentType<{ reload?: () => Promise<void> }>;

    renderWithApp(<Actions reload={reload} />);

    fireEvent.click(screen.getByRole('button', { name: /Refresh/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Filter' }));
    fireEvent.click(screen.getByRole('button', { name: /Mark all as read/ }));

    await waitFor(() => expect(reload).toHaveBeenCalledTimes(2));
    expect(holder.read).toHaveBeenCalledTimes(1);
  });

  it('disables Mark all as read when the pending CC count is zero', () => {
    holder.counts = { cc: { pending: 0 } };
    const Actions = ccTaskType.Actions as React.ComponentType<{ reload?: () => Promise<void> }>;

    renderWithApp(<Actions reload={vi.fn()} />);

    expect(screen.getByRole('button', { name: /Mark all as read/ })).toBeDisabled();
  });

  it('passes v1-aligned default filter fields to CollectionFilter', () => {
    const Actions = ccTaskType.Actions as React.ComponentType<{ reload?: () => Promise<void> }>;

    renderWithApp(<Actions reload={vi.fn()} />);

    expect(holder.collectionFilterProps[0]).toEqual(
      expect.objectContaining({
        collection: holder.workflowCcTasksCollection,
        filterableFieldNames: ['title', 'workflow'],
        initialValue: {
          $and: [{ title: { $includes: '' } }, { 'workflow.title': { $includes: '' } }],
        },
      }),
    );
  });

  it('keeps the mobile filter popover inside the compact task toolbar', () => {
    const Actions = ccTaskType.Actions as React.ComponentType<{ onlyIcon?: boolean; reload?: () => Promise<void> }>;

    renderWithApp(<Actions onlyIcon reload={vi.fn()} />);

    expect(holder.collectionFilterProps[0]).toEqual(
      expect.objectContaining({
        buttonText: '',
        popoverMinWidth: 288,
        popoverProps: {
          styles: {
            body: {
              maxWidth: 'calc(100vw - 32px)',
              overflowX: 'auto',
              width: 312,
            },
          },
          placement: 'bottomRight',
        },
        buttonProps: expect.objectContaining({
          'aria-label': 'Filter',
          style: expect.objectContaining({
            height: 28,
            minWidth: 44,
          }),
        }),
      }),
    );
    const style = holder.collectionFilterProps[0].buttonProps as { style: { height: number; minWidth: number } };
    expect(holder.collectionFilterProps[0].buttonProps).not.toHaveProperty('size');
    expect(style.style.height).toBeGreaterThanOrEqual(28);
    expect(style.style.minWidth).toBeGreaterThanOrEqual(44);
  });

  it('refreshes the filter initial value when the URL search changes', () => {
    const Actions = ccTaskType.Actions as React.ComponentType<{ reload?: () => Promise<void> }>;
    const { rerender } = renderWithApp(<Actions reload={vi.fn()} />);

    holder.location = {
      pathname: '/v/admin/workflow/tasks/cc/pending',
      search: `?workflowCcTasksFilter=${encodeURIComponent(JSON.stringify({ title: { $includes: 'after' } }))}`,
      hash: '',
    };
    window.history.replaceState(null, '', `/v/admin/workflow/tasks/cc/pending${holder.location.search}`);
    rerender(
      <App>
        <Actions reload={vi.fn()} />
      </App>,
    );

    expect(screen.getByRole('button', { name: 'Filter' })).toHaveAttribute(
      'data-initial-value',
      JSON.stringify({ title: { $includes: 'after' } }),
    );
  });

  it('writes the filter to the current task route search with replace navigation', async () => {
    const Actions = ccTaskType.Actions as React.ComponentType<{ reload?: () => Promise<void> }>;

    renderWithApp(<Actions reload={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: 'Filter' }));

    await waitFor(() =>
      expect(holder.navigate).toHaveBeenCalledWith(
        `/v/admin/workflow/tasks/cc/pending?workflowCcTasksFilter=${encodeURIComponent(
          JSON.stringify({ title: { $includes: 'cc' } }),
        )}`,
        { replace: true },
      ),
    );
  });

  it('disables Mark all as read locally after the action succeeds', async () => {
    holder.counts = { cc: { pending: 1 } };
    holder.read.mockResolvedValue({});
    const Actions = ccTaskType.Actions as React.ComponentType<{ reload?: () => Promise<void> }>;

    renderWithApp(<Actions reload={vi.fn().mockResolvedValue(undefined)} />);

    const button = screen.getByRole('button', { name: /Mark all as read/ });
    fireEvent.click(button);

    await waitFor(() => expect(holder.read).toHaveBeenCalledTimes(1));
    expect(button).toBeDisabled();
  });

  it('does not run a duplicate count reload after Mark all as read when task-center reload is provided', async () => {
    const reload = vi.fn().mockResolvedValue(undefined);
    holder.read.mockResolvedValue({});
    const Actions = ccTaskType.Actions as React.ComponentType<{ reload?: () => Promise<void> }>;

    renderWithApp(<Actions reload={reload} />);

    fireEvent.click(screen.getByRole('button', { name: /Mark all as read/ }));

    await waitFor(() => expect(holder.read).toHaveBeenCalledTimes(1));
    expect(reload).toHaveBeenCalledTimes(1);
    expect(holder.reloadCounts).not.toHaveBeenCalled();
  });

  it('prevents duplicate Mark all as read submissions while the request is in flight', async () => {
    const readRequest = createDeferred<unknown>();
    const reload = vi.fn().mockResolvedValue(undefined);
    holder.read.mockReturnValue(readRequest.promise);
    const Actions = ccTaskType.Actions as React.ComponentType<{ reload?: () => Promise<void> }>;

    renderWithApp(<Actions reload={reload} />);

    const button = screen.getByRole('button', { name: /Mark all as read/ });
    fireEvent.click(button);

    await waitFor(() => expect(button).toBeDisabled());
    fireEvent.click(button);

    expect(holder.read).toHaveBeenCalledTimes(1);

    readRequest.resolve({});
    await waitFor(() => expect(reload).toHaveBeenCalledTimes(1));
  });

  it('merges pending status filter with the URL filter', () => {
    window.history.replaceState(
      null,
      '',
      `/v/admin/workflow/tasks/cc/pending?workflowCcTasksFilter=${encodeURIComponent(
        JSON.stringify({ title: { $includes: 'contract' } }),
      )}`,
    );

    expect(useCcTaskActionParams('pending')).toMatchObject({
      filter: {
        $and: [
          {
            status: TASK_STATUS.UNREAD,
          },
          {
            title: {
              $includes: 'contract',
            },
          },
        ],
      },
      appends: expect.arrayContaining(['node.config', 'workflow.nodes', 'execution.status']),
      except: ['workflow.options', 'execution.context', 'execution.output'],
    });
  });

  it('renders the fallback card with formatted date, workflow extra and status color', () => {
    holder.record = {
      createdAt: '2026-06-29T09:08:07.000',
      id: 1,
      status: TASK_STATUS.UNREAD,
      title: 'CC',
      workflow: {
        title: '审批',
      },
    };
    const Item = ccTaskType.Item;

    const { container } = renderWithApp(<Item />);

    expect(screen.getByText('CC')).toBeInTheDocument();
    expect(screen.getByText('审批')).toBeInTheDocument();
    expect(screen.getByText('2026-06-29 09:08:07')).toBeInTheDocument();
    expect(screen.queryByText(/2026-06-29T09:08:07/)).not.toBeInTheDocument();
    expect(screen.getByText('Unread').closest('.ant-tag')).toHaveClass('ant-tag-gold');
    expect(container.querySelector('.ant-descriptions-small')).not.toBeInTheDocument();
    expect(container.querySelector('.ant-descriptions-item-label')).toHaveStyle({ width: '6em' });
  });

  it('keeps the v1 mobile description density in the fallback card', () => {
    holder.isMobileLayout = true;
    holder.record = {
      createdAt: '2026-06-29T09:08:07.000',
      id: 1,
      status: TASK_STATUS.UNREAD,
      title: 'CC',
      workflow: {
        title: '审批',
      },
    };
    const Item = ccTaskType.Item;

    const { container } = renderWithApp(<Item />);

    expect(container.querySelector('.ant-descriptions-small')).not.toBeInTheDocument();
  });

  it('updates the current detail record after marking a CC task as read', async () => {
    holder.record = {
      id: 1,
      status: TASK_STATUS.UNREAD,
      title: 'CC',
      workflow: {
        title: '审批',
      },
    };
    holder.read.mockResolvedValue({});
    const Detail = ccTaskType.Detail;

    renderWithApp(<Detail />);

    fireEvent.click(screen.getByRole('button', { name: 'Mark as read' }));

    await waitFor(() =>
      expect(holder.openRecord).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 1,
          status: TASK_STATUS.READ,
        }),
      ),
    );
    expect(holder.refresh).toHaveBeenCalledTimes(1);
  });

  it('renders the detail read action after the remote flow model content', () => {
    holder.record = {
      id: 1,
      node: {
        config: {
          ccUid: 'cc-detail-uid',
        },
      },
      status: TASK_STATUS.UNREAD,
      workflow: {
        nodes: [],
      },
    };
    const Detail = ccTaskType.Detail;

    renderWithApp(<Detail />);

    const remoteFlowModel = screen.getByTestId('remote-flow-model');
    const markButton = screen.getByRole('button', { name: 'Mark as read' });

    expect(remoteFlowModel.compareDocumentPosition(markButton)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    expect(screen.getByTestId('workflow-cc-detail-content')).toHaveStyle({ gap: '0' });
  });
});
