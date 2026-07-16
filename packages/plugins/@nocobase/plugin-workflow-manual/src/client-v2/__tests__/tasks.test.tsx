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
  basename: '/v',
  collectionFilterProps: [] as Array<Record<string, unknown>>,
  filterCollection: { name: 'workflowManualTasks' },
  location: { pathname: '/v/admin/workflow/tasks/manual/pending', search: '', hash: '' },
  navigate: vi.fn(),
  record: null as Record<string, unknown> | null,
}));

vi.mock('@nocobase/client-v2', async () => {
  const { stripModernClientPrefix } = await import('../../../../../../core/client-v2/src/authRedirect');

  return {
    CollectionFilter: (props: Record<string, unknown>) => {
      holder.collectionFilterProps.push(props);
      return (
        <button
          type="button"
          aria-label={String((props.buttonProps as Record<string, unknown> | undefined)?.['aria-label'] ?? 'Filter')}
          onClick={() =>
            (props.onChange as ((filter: Record<string, unknown>) => void) | undefined)?.({
              title: { $includes: 'demo' },
            })
          }
        >
          {String(props.buttonText ?? 'Filter')}
        </button>
      );
    },
    ExtendCollectionsProvider: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
    stripModernClientPrefix,
  };
});

function translate(key: string) {
  if (key.includes('{{t("Pending"')) {
    return 'Pending';
  }
  if (key.includes('{{t("Resolved"')) {
    return 'Resolved';
  }
  if (key.includes('{{t("Aborted"')) {
    return 'Aborted';
  }
  if (key.includes('{{t("Rejected"')) {
    return 'Rejected';
  }
  return key;
}

vi.mock('@nocobase/flow-engine', () => ({
  useFlowContext: () => ({
    router: {
      getBasename: () => holder.basename,
    },
  }),
  useFlowEngine: () => ({
    context: {
      dataSourceManager: {
        getDataSource: () => ({
          getCollection: (name: string) => (name === 'workflowManualTasks' ? holder.filterCollection : undefined),
        }),
      },
      t: translate,
    },
  }),
}));

vi.mock('@nocobase/plugin-workflow/client-v2', () => ({
  TASK_STATUS: {
    ALL: 'all',
    COMPLETED: 'completed',
    PENDING: 'pending',
  },
  getWorkflowTaskRecordKey: (record: Record<string, unknown>) => record.id ?? record.uid ?? record.key,
  useWorkflowTaskRecord: () => ({
    record: holder.record,
  }),
}));

vi.mock('react-router-dom', () => ({
  useLocation: () => holder.location,
  useNavigate: () => holder.navigate,
}));

import { TASK_STATUS, TASK_TYPE_MANUAL } from '../../common/constants';
import { manualTaskType, useManualTaskActionParams } from '../tasks';

function renderWithApp(node: React.ReactNode) {
  return render(<App>{node}</App>);
}

afterEach(() => {
  vi.clearAllMocks();
  holder.basename = '/v';
  holder.collectionFilterProps = [];
  holder.location = { pathname: '/v/admin/workflow/tasks/manual/pending', search: '', hash: '' };
  holder.navigate = vi.fn();
  holder.record = null;
  delete (window as Window & { __nocobase_public_path__?: string }).__nocobase_public_path__;
  delete (window as Window & { __nocobase_modern_client_prefix__?: string }).__nocobase_modern_client_prefix__;
  window.history.replaceState(null, '', '/v/admin/workflow/tasks/manual/pending');
});

describe('workflow-manual v2 task type', () => {
  it('keeps the task type render contract complete', () => {
    expect(manualTaskType).toEqual(
      expect.objectContaining({
        action: 'listMine',
        collection: 'workflowManualTasks',
        key: TASK_TYPE_MANUAL,
        Actions: expect.any(Function),
        Detail: expect.any(Function),
        Item: expect.any(Function),
        useActionParams: expect.any(Function),
      }),
    );
  });

  it('merges user filters with the mandatory task status filter', () => {
    const taskFilter = { title: { $includes: 'demo' } };
    const search = new URLSearchParams({ workflowManualTasksFilter: JSON.stringify(taskFilter) }).toString();
    window.history.replaceState(null, '', `/v/admin/workflow/tasks/manual/pending?${search}`);

    expect(useManualTaskActionParams('pending')).toEqual(
      expect.objectContaining({
        filter: {
          $and: [
            {
              status: TASK_STATUS.PENDING,
              'execution.status': 0,
            },
            taskFilter,
          ],
        },
      }),
    );
    expect(useManualTaskActionParams('completed')).toEqual(
      expect.objectContaining({
        filter: {
          $and: [
            {
              status: [TASK_STATUS.RESOLVED, TASK_STATUS.ABORTED, TASK_STATUS.REJECTED],
            },
            taskFilter,
          ],
        },
      }),
    );
    expect(useManualTaskActionParams('all')).toEqual(expect.objectContaining({ filter: taskFilter }));
  });

  it('renders refresh and collection filter actions', async () => {
    const reload = vi.fn().mockResolvedValue(undefined);
    const Actions = manualTaskType.Actions as React.ComponentType<{
      onlyIcon?: boolean;
      reload?: () => Promise<void>;
    }>;

    renderWithApp(<Actions reload={reload} />);

    fireEvent.click(screen.getByRole('button', { name: 'Refresh' }));
    fireEvent.click(screen.getByRole('button', { name: 'Filter' }));

    await waitFor(() => expect(reload).toHaveBeenCalledTimes(1));
    expect(holder.collectionFilterProps[0]).toEqual(
      expect.objectContaining({
        collection: holder.filterCollection,
        filterableFieldNames: ['title', 'workflow'],
      }),
    );
    expect(holder.navigate).toHaveBeenCalledWith(expect.stringContaining('workflowManualTasksFilter='), {
      replace: true,
    });
  });

  it('renders the v1-aligned manual task card fields', () => {
    holder.record = {
      id: 9,
      title: 'Manual review',
      workflow: { title: 'Purchase workflow' },
      createdAt: '2026-07-13T22:51:43',
      status: TASK_STATUS.PENDING,
    };
    const Item = manualTaskType.Item;

    render(<Item />);

    expect(screen.getByText('Manual review')).toBeInTheDocument();
    expect(screen.getByText('Purchase workflow')).toBeInTheDocument();
    expect(screen.getByText('Created at')).toBeInTheDocument();
    expect(screen.getByText(/2026-07-13/)).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Pending')).toBeInTheDocument();
  });

  it.each([
    {
      basename: '/v',
      publicPath: '/v/',
      currentPath: '/v/admin/workflow/tasks/manual/pending/9?foo=bar#manual-detail',
      expectedPath: '/admin/workflow/tasks/manual/pending/9?foo=bar#manual-detail',
    },
    {
      basename: '/v/apps/demo',
      publicPath: '/v/',
      currentPath: '/v/apps/demo/admin/workflow/tasks/manual/pending/9?foo=bar#manual-detail',
      expectedPath: '/apps/demo/admin/workflow/tasks/manual/pending/9?foo=bar#manual-detail',
    },
    {
      basename: '/nocobase/v/apps/demo',
      publicPath: '/nocobase/v/',
      currentPath: '/nocobase/v/apps/demo/admin/workflow/tasks/manual/completed/9',
      expectedPath: '/nocobase/apps/demo/admin/workflow/tasks/manual/completed/9',
    },
    {
      basename: '/v',
      publicPath: '/v/',
      currentPath: '/v/admin/custom-page?foo=bar#host-page',
      expectedPath: '/admin/workflow/tasks/manual/pending/9',
    },
    {
      basename: '/v',
      publicPath: '/v/',
      currentPath: '/v/admin/workflow/tasks/manual/pending/99?foo=bar#other-task',
      expectedPath: '/admin/workflow/tasks/manual/pending/9',
    },
  ])(
    'shows the legacy-page notice and links to $expectedPath',
    ({ basename, publicPath, currentPath, expectedPath }) => {
      holder.basename = basename;
      (window as Window & { __nocobase_public_path__?: string }).__nocobase_public_path__ = publicPath;
      (window as Window & { __nocobase_modern_client_prefix__?: string }).__nocobase_modern_client_prefix__ = 'v';
      window.history.replaceState(null, '', currentPath);
      holder.record = { id: 9, title: 'Manual review' };
      const Detail = manualTaskType.Detail;

      render(<Detail />);

      expect(screen.getByText('Manual task cannot be processed on the new page')).toBeInTheDocument();
      expect(
        screen.getByText(
          'Manual tasks are not yet supported on the new page. Return to the legacy page to process this task.',
        ),
      ).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Return to legacy page' })).toHaveAttribute('href', expectedPath);
    },
  );
});
